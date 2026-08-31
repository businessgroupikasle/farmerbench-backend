import crypto from 'crypto';
import Razorpay from 'razorpay';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../utils/response';

export class PaymentService {
  private razorpay: Razorpay | null = null;
  private isConfigured: boolean = false;

  constructor() {
    if (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET && env.RAZORPAY_KEY_ID !== 'rzp_test_demo_key') {
      try {
        this.razorpay = new Razorpay({
          key_id: env.RAZORPAY_KEY_ID,
          key_secret: env.RAZORPAY_KEY_SECRET,
        });
        this.isConfigured = true;
        console.log('💳 Razorpay Payment Gateway configured');
      } catch (err) {
        console.warn('⚠️ Razorpay initialization warning:', err);
      }
    } else {
      console.log('ℹ️ Razorpay running in Test Sandbox / Simulation Mode');
    }
  }

  async createRazorpayOrder(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.paymentStatus === 'PAID') {
      throw new AppError('This order is already paid', 400);
    }

    const amountInPaise = Math.round(order.totalPrice * 100);
    let razorpayOrderId: string;

    if (this.isConfigured && this.razorpay) {
      try {
        const rzpOrder = await this.razorpay.orders.create({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `order_${order.id.slice(0, 8)}`,
          notes: {
            orderId: order.id,
            userEmail: order.user.email,
          },
        });
        razorpayOrderId = rzpOrder.id;
      } catch (err: any) {
        console.error('Razorpay order creation error:', err);
        throw new AppError(`Payment provider error: ${err.message}`, 502);
      }
    } else {
      // Test sandbox simulation mode
      razorpayOrderId = `order_sim_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    }

    // Upsert payment record
    await prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        amount: order.totalPrice,
        method: 'RAZORPAY',
        status: 'PENDING',
        transactionId: razorpayOrderId,
      },
      update: {
        amount: order.totalPrice,
        method: 'RAZORPAY',
        status: 'PENDING',
        transactionId: razorpayOrderId,
      },
    });

    return {
      orderId: order.id,
      razorpayOrderId,
      amount: amountInPaise,
      currency: 'INR',
      keyId: env.RAZORPAY_KEY_ID,
      customerName: order.user.name,
      customerEmail: order.user.email,
    };
  }

  async verifyRazorpayPayment(data: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // In live mode, verify cryptographic HMAC signature
    if (this.isConfigured && env.RAZORPAY_KEY_SECRET !== 'rzp_test_demo_secret') {
      const generatedSignature = crypto
        .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
        .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
        .digest('hex');

      if (generatedSignature !== data.razorpaySignature) {
        // Mark payment failed
        await prisma.payment.update({
          where: { orderId: order.id },
          data: { status: 'FAILED' },
        });
        throw new AppError('Payment signature verification failed. Possible tampering detected.', 400);
      }
    }

    // Update payment and order in database transaction
    const [updatedOrder, updatedPayment] = await prisma.$transaction([
      prisma.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'PROCESSING',
        },
      }),
      prisma.payment.upsert({
        where: { orderId: order.id },
        create: {
          orderId: order.id,
          amount: order.totalPrice,
          method: 'RAZORPAY',
          status: 'PAID',
          transactionId: data.razorpayPaymentId,
        },
        update: {
          status: 'PAID',
          transactionId: data.razorpayPaymentId,
        },
      }),
    ]);

    return {
      success: true,
      message: 'Payment verified and order marked as paid',
      order: updatedOrder,
      payment: updatedPayment,
    };
  }
}

export const paymentService = new PaymentService();
