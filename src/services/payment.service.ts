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

  async createRazorpayOrder(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.userId !== userId) {
      throw new AppError('You cannot pay for another customer\'s order', 403);
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
        const providerMessage =
          err?.error?.description ||
          err?.error?.reason ||
          err?.message ||
          'Razorpay rejected the order request';
        throw new AppError(`Payment provider error: ${providerMessage}`, 502, {
          code: err?.error?.code || 'RAZORPAY_ORDER_ERROR',
        });
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
  }, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { payment: true, items: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.userId !== userId) {
      throw new AppError('You cannot verify another customer\'s payment', 403);
    }

    if (order.payment?.transactionId !== data.razorpayOrderId) {
      throw new AppError('Razorpay order does not match this checkout', 400);
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

    // Commit inventory, payment, order, and cart atomically after verification.
    const { updatedOrder, updatedPayment } = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: { items: true, payment: true },
      });

      if (!currentOrder) {
        throw new AppError('Order not found', 404);
      }

      if (currentOrder.paymentStatus === 'PAID') {
        return { updatedOrder: currentOrder, updatedPayment: currentOrder.payment! };
      }

      for (const item of currentOrder.items) {
        const stockUpdate = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (stockUpdate.count !== 1) {
          throw new AppError(`Insufficient stock for ${item.title}. Payment cannot be confirmed.`, 409);
        }
      }

      const paidOrder = await tx.order.update({
        where: { id: currentOrder.id },
        data: { paymentStatus: 'PAID', orderStatus: 'PROCESSING' },
      });
      const paidPayment = await tx.payment.upsert({
        where: { orderId: currentOrder.id },
        create: {
          orderId: currentOrder.id,
          amount: currentOrder.totalPrice,
          method: 'RAZORPAY',
          status: 'PAID',
          transactionId: data.razorpayPaymentId,
        },
        update: { status: 'PAID', transactionId: data.razorpayPaymentId },
      });

      const cart = await tx.cart.findUnique({ where: { userId: currentOrder.userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return { updatedOrder: paidOrder, updatedPayment: paidPayment };
    });

    return {
      success: true,
      message: 'Payment verified and order marked as paid',
      order: updatedOrder,
      payment: updatedPayment,
    };
  }
}

export const paymentService = new PaymentService();
