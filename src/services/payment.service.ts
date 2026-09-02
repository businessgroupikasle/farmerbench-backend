import crypto from 'crypto';
import Razorpay from 'razorpay';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../utils/response';

export class PaymentService {
  private razorpay: Razorpay | null = null;
  private isConfigured: boolean = false;

  constructor() {
    const hasValidKey =
      Boolean(env.RAZORPAY_KEY_ID) &&
      env.RAZORPAY_KEY_ID !== 'rzp_test_demo_key' &&
      !env.RAZORPAY_KEY_ID.includes('*');

    const hasValidSecret =
      Boolean(env.RAZORPAY_KEY_SECRET) &&
      env.RAZORPAY_KEY_SECRET !== 'rzp_test_demo_secret' &&
      !env.RAZORPAY_KEY_SECRET.includes('*') &&
      env.RAZORPAY_KEY_SECRET.trim().length > 5;

    if (hasValidKey && hasValidSecret) {
      try {
        this.razorpay = new Razorpay({
          key_id: env.RAZORPAY_KEY_ID,
          key_secret: env.RAZORPAY_KEY_SECRET,
        });
        this.isConfigured = true;
        console.log('? Razorpay Payment Gateway configured successfully with credentials');
      } catch (err) {
        console.error('? Razorpay initialization error:', err);
      }
    } else {
      console.warn('?? Razorpay credentials missing or incomplete in .env');
    }
  }

  async createRazorpayOrder(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, payment: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.userId !== userId) {
      throw new AppError("You cannot pay for another customer's order", 403);
    }

    if (order.paymentStatus === 'PAID') {
      throw new AppError('This order is already paid', 400);
    }

    if (!this.isConfigured || !this.razorpay) {
      throw new AppError(
        'Razorpay Payment Gateway is not configured. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server configuration.',
        500
      );
    }

    const amountInPaise = Math.round(order.totalPrice * 100);

    let razorpayOrderId: string;
    try {
      const rzpOrder = await this.razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `order_${order.id.slice(0, 8)}`,
        notes: {
          orderId: order.id,
          userId: order.userId,
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
        'Razorpay rejected the order creation request';

      throw new AppError(`Razorpay payment error: ${providerMessage}`, 502, {
        code: err?.error?.code || 'RAZORPAY_ORDER_ERROR',
      });
    }

    // Upsert payment record in database with the genuine Razorpay order ID
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

  async verifyRazorpayPayment(
    data: {
      orderId: string;
      razorpayOrderId: string;
      razorpayPaymentId: string;
      razorpaySignature: string;
    },
    userId: string
  ) {
    const order = await prisma.order.findUnique({
      where: { id: data.orderId },
      include: { payment: true, items: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.userId !== userId) {
      throw new AppError("You cannot verify another customer's payment", 403);
    }

    if (order.payment?.transactionId !== data.razorpayOrderId) {
      throw new AppError('Razorpay order ID does not match this transaction', 400);
    }

    if (!env.RAZORPAY_KEY_SECRET) {
      throw new AppError('Razorpay key secret is not configured on server', 500);
    }

    // Cryptographic HMAC-SHA256 Signature Verification
    const generatedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
      .digest('hex');

    const isMatch = crypto.timingSafeEqual(
      Buffer.from(generatedSignature, 'utf-8'),
      Buffer.from(data.razorpaySignature, 'utf-8')
    );

    if (!isMatch) {
      // Mark payment failed upon signature mismatch
      await prisma.payment.update({
        where: { orderId: order.id },
        data: { status: 'FAILED' },
      });
      throw new AppError('Payment signature verification failed. The transaction could not be authenticated.', 400);
    }

    // Atomic Transaction: Decrement stock, mark order & payment as PAID, and clear user's cart
    const { updatedOrder, updatedPayment } = await prisma.$transaction(async (tx) => {
      const currentOrder = await tx.order.findUnique({
        where: { id: order.id },
        include: { items: true, payment: true },
      });

      if (!currentOrder) {
        throw new AppError('Order not found', 404);
      }

      // If already paid, return safely (idempotent)
      if (currentOrder.paymentStatus === 'PAID') {
        return { updatedOrder: currentOrder, updatedPayment: currentOrder.payment! };
      }

      // Decrement stock for all items
      for (const item of currentOrder.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;

        const attrs = (product.attributes as Record<string, any>) || {};
        const variants: Array<{
          packSize: string;
          price: number;
          comparePrice?: number;
          stock?: number;
          sku?: string;
        }> = Array.isArray(attrs.variants) ? attrs.variants : [];

        let variantUpdated = false;
        const newVariants = variants.map((v) => {
          if (item.title.includes(`(${v.packSize})`) || item.title.endsWith(v.packSize)) {
            variantUpdated = true;
            const currentStock = typeof v.stock === 'number' ? v.stock : product.stock;
            return { ...v, stock: Math.max(0, currentStock - item.quantity) };
          }
          return v;
        });

        if (variantUpdated) {
          await tx.product.update({
            where: { id: product.id },
            data: {
              stock: Math.max(0, product.stock - item.quantity),
              attributes: {
                ...attrs,
                variants: newVariants,
              },
            },
          });
        } else {
          const stockUpdate = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity } },
            data: { stock: { decrement: item.quantity } },
          });
          if (stockUpdate.count !== 1) {
            throw new AppError(
              `Insufficient stock for "${item.title}". Payment could not be completed.`,
              409
            );
          }
        }
      }

      // Update Order Status to PAID / PROCESSING
      const paidOrder = await tx.order.update({
        where: { id: currentOrder.id },
        data: {
          paymentStatus: 'PAID',
          orderStatus: 'PROCESSING',
        },
      });

      // Update Payment Record with final payment ID
      const paidPayment = await tx.payment.upsert({
        where: { orderId: currentOrder.id },
        create: {
          orderId: currentOrder.id,
          amount: currentOrder.totalPrice,
          method: 'RAZORPAY',
          status: 'PAID',
          transactionId: data.razorpayPaymentId,
        },
        update: {
          status: 'PAID',
          transactionId: data.razorpayPaymentId,
        },
      });

      // Clear User Cart
      const cart = await tx.cart.findUnique({ where: { userId: currentOrder.userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return { updatedOrder: paidOrder, updatedPayment: paidPayment };
    });

    return {
      success: true,
      message: 'Payment verified successfully and order confirmed',
      order: updatedOrder,
      payment: updatedPayment,
    };
  }
}

export const paymentService = new PaymentService();
