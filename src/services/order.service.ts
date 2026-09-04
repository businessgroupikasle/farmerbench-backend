import { orderRepository } from '../repositories/order.repository';
import { cartRepository } from '../repositories/cart.repository';
import { productRepository } from '../repositories/product.repository';
import { CreateOrderInput, UpdateOrderStatusInput, OrderStatus } from '@formerbench/shared';
import { AppError } from '../utils/response';
import { couponService } from './coupon.service';

export class OrderService {
  async createOrder(userId: string, input: CreateOrderInput) {
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
          ? Number(matchedVariant.sellingPrice ?? matchedVariant.price)
          : (product.discountPrice ?? product.price);
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
          ? Number(matchedVariant.sellingPrice ?? matchedVariant.price)
          : (item.product.discountPrice ?? item.product.price);
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
    const shippingPrice = itemsPrice >= 999 ? 0 : 80;
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
    }

    return order;
  }

  async getUserOrders(userId: string) {
    return orderRepository.findByUserId(userId);
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
}

export const orderService = new OrderService();
