import { orderRepository } from '../repositories/order.repository';
import { cartRepository } from '../repositories/cart.repository';
import { productRepository } from '../repositories/product.repository';
import { CreateOrderInput, UpdateOrderStatusInput, OrderStatus } from '@formerbench/shared';
import { AppError } from '../utils/response';

export class OrderService {
  async createOrder(userId: string, input: CreateOrderInput) {
    let orderItemsToCreate: {
      productId: string;
      title: string;
      price: number;
      quantity: number;
      imageUrl?: string | null;
    }[] = [];

    if (input.items && input.items.length > 0) {
      for (const item of input.items) {
        const product = await productRepository.findById(item.productId);
        if (!product) {
          throw new AppError(`Product not found: ${item.productId}`, 404);
        }

        const selectedAttrs = (item as any).selectedAttributes || {};
        const packSize = selectedAttrs.packSize;
        const attrs = (product.attributes as Record<string, any>) || {};
        const variants: Array<{
          packSize: string;
          price: number;
          comparePrice?: number;
          stock?: number;
          sku?: string;
        }> = Array.isArray(attrs.variants) ? attrs.variants : [];

        const matchedVariant = packSize ? variants.find((v) => v.packSize === packSize) : null;

        // Authoritative price & stock strictly from PostgreSQL
        const unitPrice = matchedVariant
          ? Number(matchedVariant.price)
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
          packSize: string;
          price: number;
          comparePrice?: number;
          stock?: number;
          sku?: string;
        }> = Array.isArray(attrs.variants) ? attrs.variants : [];

        const matchedVariant = packSize ? variants.find((v) => v.packSize === packSize) : null;

        // Authoritative price & stock strictly from PostgreSQL
        const unitPrice = matchedVariant
          ? Number(matchedVariant.price)
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
    const totalPrice = Number((itemsPrice + shippingPrice + taxPrice).toFixed(2));

    const order = await orderRepository.create(userId, {
      shippingAddress: input.shippingAddress,
      paymentMethod: input.paymentMethod,
      items: orderItemsToCreate,
      itemsPrice,
      taxPrice,
      shippingPrice,
      totalPrice,
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

    return orderRepository.updateStatus(orderId, input.orderStatus, input.paymentStatus);
  }
}

export const orderService = new OrderService();
