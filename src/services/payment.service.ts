import crypto from 'crypto';
import Razorpay from 'razorpay';
import { prisma } from '../config/database';
import { env } from '../config/env';
import { AppError } from '../utils/response';

type VerifiedPayment = {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

const safeHmacMatch = (payload: Buffer | string, signature: string, secret: string) => {
  if (!signature || !secret) return false;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest();
  let received: Buffer;
  try {
    received = Buffer.from(signature, 'hex');
  } catch {
    return false;
  }
  return received.length === expected.length && crypto.timingSafeEqual(expected, received);
};

export class PaymentService {
  private razorpay: Razorpay | null = null;
  private isConfigured = false;

  constructor() {
    const validKey = Boolean(env.RAZORPAY_KEY_ID) && !env.RAZORPAY_KEY_ID.includes('demo') && !env.RAZORPAY_KEY_ID.includes('*');
    const validSecret = Boolean(env.RAZORPAY_KEY_SECRET) && !env.RAZORPAY_KEY_SECRET.includes('demo') && !env.RAZORPAY_KEY_SECRET.includes('*');
    if (validKey && validSecret) {
      this.razorpay = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET });
      this.isConfigured = true;
    }
  }

  async createRazorpayOrder(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true, payment: true } });
    if (!order) throw new AppError('Order not found', 404);
    if (order.userId !== userId) throw new AppError("You cannot pay for another customer's order", 403);
    if (order.paymentMethod !== 'RAZORPAY') throw new AppError('This order is not a Razorpay order', 400);
    if (order.paymentStatus === 'PAID') throw new AppError('This order is already paid', 400);
    if (!this.isConfigured || !this.razorpay) throw new AppError('Razorpay Payment Gateway is not configured.', 500);

    const amount = Math.round(order.totalPrice * 100);
    let providerOrder: any;
    try {
      providerOrder = await this.razorpay.orders.create({
        amount,
        currency: 'INR',
        receipt: `order_${order.id.slice(0, 8)}`,
        notes: { orderId: order.id, userId: order.userId },
      });
    } catch (error: any) {
      throw new AppError(`Razorpay payment error: ${error?.error?.description || error?.message || 'order creation failed'}`, 502);
    }

    await prisma.payment.upsert({
      where: { orderId: order.id },
      create: { orderId: order.id, amount: order.totalPrice, method: 'RAZORPAY', status: 'PENDING', transactionId: providerOrder.id, razorpayOrderId: providerOrder.id },
      update: { amount: order.totalPrice, method: 'RAZORPAY', status: 'PENDING', transactionId: providerOrder.id, razorpayOrderId: providerOrder.id, razorpayPaymentId: null },
    });

    return { orderId: order.id, razorpayOrderId: providerOrder.id, amount, currency: 'INR', keyId: env.RAZORPAY_KEY_ID, customerName: order.user.name, customerEmail: order.user.email };
  }

  async verifyRazorpayPayment(data: VerifiedPayment, userId: string) {
    const order = await prisma.order.findUnique({ where: { id: data.orderId }, include: { payment: true } });
    if (!order) throw new AppError('Order not found', 404);
    if (order.userId !== userId) throw new AppError("You cannot verify another customer's payment", 403);
    if ((order.payment?.razorpayOrderId || order.payment?.transactionId) !== data.razorpayOrderId) throw new AppError('Razorpay order ID does not match this transaction', 400);

    const signedPayload = `${data.razorpayOrderId}|${data.razorpayPaymentId}`;
    if (!safeHmacMatch(signedPayload, data.razorpaySignature, env.RAZORPAY_KEY_SECRET)) {
      await this.markFailed(order.id);
      throw new AppError('Payment signature verification failed. The transaction could not be authenticated.', 400);
    }
    return this.finalizePayment(data);
  }

  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!safeHmacMatch(rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET)) {
      throw new AppError('Invalid Razorpay webhook signature', 400);
    }

    let event: any;
    try { event = JSON.parse(rawBody.toString('utf8')); } catch { throw new AppError('Invalid webhook payload', 400); }
    const entity = event?.payload?.payment?.entity;
    if (!entity?.order_id) return { processed: false };
    const payment = await prisma.payment.findFirst({ where: { razorpayOrderId: entity.order_id } });
    if (!payment) return { processed: false };

    if (event.event === 'payment.captured') {
      await this.finalizePayment({ orderId: payment.orderId, razorpayOrderId: entity.order_id, razorpayPaymentId: entity.id });
      return { processed: true };
    }
    if (event.event === 'payment.failed') {
      await this.markFailed(payment.orderId);
      return { processed: true };
    }
    return { processed: false };
  }

  async cancelAttempt(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new AppError('Order not found', 404);
    if (order.userId !== userId) throw new AppError("You cannot cancel another customer's payment", 403);
    if (order.paymentMethod !== 'RAZORPAY') throw new AppError('Only Razorpay attempts can be cancelled here', 400);
    await this.markFailed(order.id);
    const updated = await prisma.order.findUnique({ where: { id: order.id }, select: { paymentStatus: true } });
    return { cancelled: updated?.paymentStatus !== 'PAID' };
  }

  private async markFailed(orderId: string) {
    await prisma.$transaction([
      prisma.order.updateMany({ where: { id: orderId, paymentStatus: { not: 'PAID' } }, data: { paymentStatus: 'FAILED', orderStatus: 'CANCELLED' } }),
      prisma.payment.updateMany({ where: { orderId, status: { not: 'PAID' } }, data: { status: 'FAILED' } }),
    ]);
  }

  private async finalizePayment(data: Omit<VerifiedPayment, 'razorpaySignature'>) {
    return prisma.$transaction(async (tx) => {
      const claimed = await tx.order.updateMany({
        where: { id: data.orderId, paymentMethod: 'RAZORPAY', paymentStatus: { not: 'PAID' } },
        data: { paymentStatus: 'PAID', orderStatus: 'PROCESSING' },
      });
      if (claimed.count === 0) {
        const existing = await tx.order.findUnique({ where: { id: data.orderId }, include: { payment: true } });
        if (!existing || existing.paymentStatus !== 'PAID') throw new AppError('Order is not eligible for payment finalization', 409);
        return { success: true, message: 'Payment already verified', order: existing, payment: existing.payment };
      }

      const order = await tx.order.findUnique({ where: { id: data.orderId }, include: { items: true } });
      if (!order) throw new AppError('Order not found', 404);
      for (const item of order.items) {
        await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${item.productId} FOR UPDATE`;
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new AppError(`Product not found for "${item.title}"`, 409);
        if (item.variantId) {
          const attrs = (product.attributes as Record<string, any>) || {};
          const variants = Array.isArray(attrs.variants) ? attrs.variants : [];
          let matched = false;
          const nextVariants = variants.map((variant: any) => {
            if (![variant.id, variant.variantId, variant.sku].includes(item.variantId)) return variant;
            matched = true;
            const stock = Number(variant.stock);
            if (!Number.isFinite(stock) || stock < item.quantity) throw new AppError(`Insufficient stock for "${item.title}"`, 409);
            return { ...variant, stock: stock - item.quantity };
          });
          if (!matched) throw new AppError(`Variant no longer exists for "${item.title}"`, 409);
          await tx.product.update({ where: { id: product.id }, data: { attributes: { ...attrs, variants: nextVariants } } });
        } else {
          const updated = await tx.product.updateMany({ where: { id: product.id, stock: { gte: item.quantity } }, data: { stock: { decrement: item.quantity } } });
          if (updated.count !== 1) throw new AppError(`Insufficient stock for "${item.title}"`, 409);
        }
      }

      const paidPayment = await tx.payment.update({
        where: { orderId: order.id },
        data: { status: 'PAID', transactionId: data.razorpayPaymentId, razorpayOrderId: data.razorpayOrderId, razorpayPaymentId: data.razorpayPaymentId },
      });
      if (order.couponCode && !order.couponRedeemed) {
        await tx.coupon.update({ where: { code: order.couponCode }, data: { usageCount: { increment: 1 } } });
        await tx.order.update({ where: { id: order.id }, data: { couponRedeemed: true } });
      }
      const cart = await tx.cart.findUnique({ where: { userId: order.userId } });
      if (cart) await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      const paidOrder = await tx.order.findUnique({ where: { id: order.id } });
      return { success: true, message: 'Payment verified successfully and order confirmed', order: paidOrder, payment: paidPayment };
    });
  }
}

export const paymentService = new PaymentService();
