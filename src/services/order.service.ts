import { orderRepository } from '../repositories/order.repository';
import { cartRepository } from '../repositories/cart.repository';
import { productRepository } from '../repositories/product.repository';
import { CreateOrderInput, UpdateOrderStatusInput, OrderStatus } from '@formerbench/shared';
import { AppError } from '../utils/response';
import { couponService } from './coupon.service';
import { storeSettingsService } from './storeSettings.service';
import { orderEmailService } from './order-email.service';
import { getEffectivePrice } from '../utils/pricing';
import { prisma } from '../config/database';
import { env } from '../config/env';

export class OrderService {
  /** Business-abuse guards: open COD orders per customer and per-customer coupon reuse. */
  private async enforceOrderLimits(userId: string, input: CreateOrderInput) {
    if (input.paymentMethod === 'CASH_ON_DELIVERY' && env.MAX_OPEN_COD_ORDERS > 0) {
      const openCodOrders = await prisma.order.count({
        where: { userId, paymentMethod: 'CASH_ON_DELIVERY', orderStatus: { in: ['PENDING', 'PROCESSING'] } },
      });
      if (openCodOrders >= env.MAX_OPEN_COD_ORDERS) {
        throw new AppError(
          'You have too many open Cash on Delivery orders. Please wait for existing orders to be delivered, pay online, or contact support.',
          429
        );
      }
    }

    if (input.couponCode && env.COUPON_MAX_USES_PER_USER > 0) {
      const previousUses = await prisma.order.count({
        where: { userId, couponCode: input.couponCode.trim().toUpperCase(), couponRedeemed: true },
      });
      if (previousUses >= env.COUPON_MAX_USES_PER_USER) {
        throw new AppError('You have already used this coupon the maximum number of times.', 400);
      }
    }
  }

  async createOrder(userId: string, input: CreateOrderInput) {
    await this.enforceOrderLimits(userId, input);

    let orderItemsToCreate: {
      productId: string;
      title: string;
      price: number;
      quantity: number;
      variantId?: string;
      selectedAttributes?: { packSize?: string };
      imageUrl?: string | null;
    }[] = [];

    if (input.items && input.items.length > 0) {
      for (const item of input.items) {
        const product = await productRepository.findById(item.productId);
        if (!product) {
          throw new AppError(`Product not found: ${item.productId}`, 404);
        }

        const selectedAttrs = item.selectedAttributes || {};
        const packSize = selectedAttrs.packSize;
        const attrs = (product.attributes as Record<string, any>) || {};
        const variants: Array<{
          id?: string;
          variantId?: string;
          label?: string;
          packSize?: string;
          price?: number;
          sellingPrice?: number;
          mrp?: number;
          comparePrice?: number;
          stock?: number;
          sku?: string;
        }> = Array.isArray(attrs.variants) ? attrs.variants : [];

        const matchedVariant = variants.find((v) =>
          Boolean(item.variantId) && [v.id, v.variantId, v.sku].includes(item.variantId)
        ) || (packSize ? variants.find((v) => (v.label || v.packSize) === packSize) : null);

        // Products created before variant inventory was introduced may expose only
        // attributes.packSizes. They use the product's authoritative price/stock.
        // Reject a missing selection only when persisted variants actually exist.
        if (variants.length > 0 && (item.variantId || packSize) && !matchedVariant) {
          throw new AppError(`Selected variant is no longer available for "${product.title}".`, 400);
        }

        // Authoritative price & stock strictly from PostgreSQL
        const unitPrice = matchedVariant
          ? getEffectivePrice(
              matchedVariant.mrp ?? matchedVariant.comparePrice ?? matchedVariant.price,
              matchedVariant.sellingPrice ?? matchedVariant.price
            )
          : getEffectivePrice(product.price, product.discountPrice);
        const availableStock =
          matchedVariant && typeof matchedVariant.stock === 'number'
            ? matchedVariant.stock
            : product.stock;

        if (availableStock < item.quantity) {
          throw new AppError(
            `Insufficient stock for "${product.title}${packSize ? ` (${packSize})` : ''}". Only ${availableStock} available.`,
            400
          );
        }

        const itemTitle =
          packSize && !product.title.includes(packSize)
            ? `${product.title} (${packSize})`
            : product.title;

        orderItemsToCreate.push({
          productId: product.id,
          title: itemTitle,
          price: unitPrice,
          quantity: item.quantity,
          variantId: matchedVariant ? (matchedVariant.id || matchedVariant.variantId || matchedVariant.sku) : undefined,
          selectedAttributes: packSize ? { packSize } : undefined,
          imageUrl: product.images[0] || null,
        });
      }
    } else {
      // Pull from User's active Cart
      const cart = await cartRepository.findByUserId(userId);
      if (!cart || cart.items.length === 0) {
        throw new AppError('Your cart is empty. Please add items before checking out.', 400);
      }

      for (const item of cart.items) {
        const selectedAttrs = (item.selectedAttributes as Record<string, any>) || {};
        const packSize = selectedAttrs.packSize;
        const attrs = (item.product.attributes as Record<string, any>) || {};
        const variants: Array<{
          id?: string;
          variantId?: string;
          label?: string;
          packSize?: string;
          price?: number;
          sellingPrice?: number;
          mrp?: number;
          comparePrice?: number;
          stock?: number;
          sku?: string;
        }> = Array.isArray(attrs.variants) ? attrs.variants : [];

        const requestedVariantId = selectedAttrs.variantId || selectedAttrs.sku;
        const matchedVariant = variants.find((v) =>
          Boolean(requestedVariantId) && [v.id, v.variantId, v.sku].includes(requestedVariantId)
        ) || (packSize ? variants.find((v) => (v.label || v.packSize) === packSize) : null);

        if (variants.length > 0 && (requestedVariantId || packSize) && !matchedVariant) {
          throw new AppError(`Selected variant is no longer available for "${item.product.title}".`, 400);
        }

        // Authoritative price & stock strictly from PostgreSQL
        const unitPrice = matchedVariant
          ? getEffectivePrice(
              matchedVariant.mrp ?? matchedVariant.comparePrice ?? matchedVariant.price,
              matchedVariant.sellingPrice ?? matchedVariant.price
            )
          : getEffectivePrice(item.product.price, item.product.discountPrice);
        const availableStock =
          matchedVariant && typeof matchedVariant.stock === 'number'
            ? matchedVariant.stock
            : item.product.stock;

        if (availableStock < item.quantity) {
          throw new AppError(
            `Insufficient stock for "${item.product.title}${packSize ? ` (${packSize})` : ''}". Only ${availableStock} available.`,
            400
          );
        }

        const itemTitle =
          packSize && !item.product.title.includes(packSize)
            ? `${item.product.title} (${packSize})`
            : item.product.title;

        orderItemsToCreate.push({
          productId: item.productId,
          title: itemTitle,
          price: unitPrice,
          quantity: item.quantity,
          variantId: matchedVariant ? (matchedVariant.id || matchedVariant.variantId || matchedVariant.sku) : undefined,
          selectedAttributes: packSize ? { packSize } : undefined,
          imageUrl: item.product.images[0] || null,
        });
      }
    }

    // Calculate Prices Authoritatively on Backend
    const itemsPrice = Number(
      orderItemsToCreate.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
    );
    const shippingSettings = await storeSettingsService.get();
    const shippingPrice = itemsPrice >= shippingSettings.freeShippingThreshold ? 0 : shippingSettings.standardShippingFee;
    const taxPrice = 0; // Displayed product prices are GST-inclusive.
    const couponResult = input.couponCode
      ? await couponService.calculate(input.couponCode, itemsPrice)
      : null;
    const discountPrice = couponResult?.discountAmount || 0;
    const totalPrice = Number(Math.max(0, itemsPrice - discountPrice + shippingPrice + taxPrice).toFixed(2));

    const order = await orderRepository.create(userId, {
      shippingAddress: input.shippingAddress,
      paymentMethod: input.paymentMethod,
      items: orderItemsToCreate,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
      discountPrice,
      couponCode: couponResult?.coupon.code,
    });

    // Online-payment carts are cleared only after payment verification.
    if (input.paymentMethod !== 'RAZORPAY') {
      await cartRepository.clearCart(userId);
      void orderEmailService.notifyOrderConfirmed(order.id);
    }

    return order;
  }

  async getUserOrders(userId: string) {
    const orders = await orderRepository.findByUserId(userId);
    const exchangeBookings = await prisma.serviceBooking.findMany({
      where: {
        userId,
        serviceSlug: 'product-exchange',
      },
      orderBy: { createdAt: 'desc' },
    });

    const exchangeMap = new Map<string, any>();
    for (const b of exchangeBookings) {
      const details = (b.details as any) || {};
      if (details.orderId && !exchangeMap.has(details.orderId)) {
        exchangeMap.set(details.orderId, {
          id: b.id,
          bookingReference: b.bookingReference,
          status: b.status,
          reason: details.reason,
          details: details.details,
          createdAt: b.createdAt,
        });
      }
    }

    return orders.map((ord) => ({
      ...ord,
      exchangeRequest: exchangeMap.get(ord.id) || null,
    }));
  }

  async getOrderById(orderId: string, userId: string, userRole: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (userRole !== 'ADMIN' && order.userId !== userId) {
      throw new AppError('Unauthorized access to this order', 403);
    }

    return order;
  }

  async getAllOrders(params: { page?: number; limit?: number; status?: OrderStatus }) {
    return orderRepository.findAll(params);
  }

  async updateOrderStatus(orderId: string, input: UpdateOrderStatusInput) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (order.paymentMethod === 'RAZORPAY' && input.paymentStatus === 'PAID') {
      throw new AppError('Razorpay orders can only be marked paid by verified payment processing', 400);
    }

    return orderRepository.updateStatus(orderId, input.orderStatus, input.paymentStatus);
  }

  async cancelOrder(orderId: string, userId: string, reason?: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    if (order.userId !== userId) {
      throw new AppError('Unauthorized access to this order', 403);
    }
    if (order.orderStatus !== 'PENDING' && order.orderStatus !== 'PROCESSING') {
      throw new AppError(`Order cannot be cancelled in its current state (${order.orderStatus}). Only Pending or Processing orders can be cancelled.`, 400);
    }

    const isPrepaid = order.paymentMethod === 'RAZORPAY' && order.paymentStatus === 'PAID';

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: 'CANCELLED',
        paymentStatus: isPrepaid ? 'REFUNDED' : order.paymentStatus,
      },
      include: {
        items: true,
        shippingAddress: true,
        payment: true,
      },
    });

    if (order.payment) {
      await prisma.payment.update({
        where: { orderId },
        data: {
          status: isPrepaid ? 'REFUNDED' : order.payment.status,
        },
      });
    }

    // Restock inventory for items in cancelled order
    for (const item of order.items) {
      try {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      } catch (err) {
        console.error(`Failed to restock product ${item.productId}:`, err);
      }
    }

    return {
      order: updated,
      isPrepaid,
      refundAmount: isPrepaid ? order.totalPrice : 0,
      message: isPrepaid
        ? `Order cancelled successfully. A full refund of ₹${order.totalPrice.toFixed(2)} has been initiated to your original payment method.`
        : 'Order cancelled successfully.',
    };
  }

  async requestExchange(orderId: string, userId: string, data: { reason: string; details?: string; itemIds?: string[] }) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    if (order.userId !== userId) {
      throw new AppError('Unauthorized access to this order', 403);
    }
    if (order.orderStatus !== 'DELIVERED') {
      throw new AppError('Product exchange can only be requested for delivered orders', 400);
    }
    if (!data.reason || !data.reason.trim()) {
      throw new AppError('Please provide a reason for the exchange request (e.g. damaged, defective, or incorrect product)', 400);
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const bookingRef = `EXC-${order.id.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;

    const serviceBooking = await prisma.serviceBooking.create({
      data: {
        bookingReference: bookingRef,
        serviceSlug: 'product-exchange',
        serviceName: 'Product Exchange Request',
        name: user?.name || 'Customer',
        phone: user?.phone || order.shippingAddress?.phone || 'N/A',
        email: user?.email || null,
        location: `${order.shippingAddress?.city || ''}, ${order.shippingAddress?.state || ''}`.trim() || 'Tamil Nadu',
        message: `Order #GL-${order.id.slice(0, 8).toUpperCase()} Exchange Request: ${data.reason.trim()}${data.details ? ` - Details: ${data.details.trim()}` : ''}`,
        status: 'NEW',
        userId,
        details: {
          orderId: order.id,
          reason: data.reason.trim(),
          details: data.details?.trim() || null,
          itemIds: data.itemIds || [],
          orderTotal: order.totalPrice,
          items: order.items.map((it) => ({ id: it.id, title: it.title, quantity: it.quantity })),
        },
      },
    });

    return {
      success: true,
      bookingReference: bookingRef,
      message: 'Product exchange request submitted successfully. Our support team will verify and dispatch your replacement.',
      exchangeRequest: {
        id: serviceBooking.id,
        bookingReference: bookingRef,
        reason: data.reason.trim(),
        details: data.details?.trim() || null,
        createdAt: serviceBooking.createdAt,
      },
    };
  }

  async processRefund(orderId: string) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }
    if (order.paymentStatus === 'REFUNDED') {
      throw new AppError('This order has already been refunded', 400);
    }
    if (order.paymentMethod !== 'RAZORPAY') {
      throw new AppError('Refunds can only be processed for prepaid online orders', 400);
    }

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus: 'CANCELLED',
        paymentStatus: 'REFUNDED',
      },
      include: {
        items: true,
        shippingAddress: true,
        payment: true,
      },
    });

    if (order.payment) {
      await prisma.payment.update({
        where: { orderId },
        data: { status: 'REFUNDED' },
      });
    }

    return {
      order: updated,
      refundAmount: order.totalPrice,
      message: `Refund of ₹${order.totalPrice.toFixed(2)} processed successfully for order #GL-${order.id.slice(0, 8).toUpperCase()}`,
    };
  }
}

export const orderService = new OrderService();
