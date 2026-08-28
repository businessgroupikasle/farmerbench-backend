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
        if (product.stock < item.quantity) {
          throw new AppError(`Insufficient stock for "${product.title}". Only ${product.stock} available.`, 400);
        }
        const unitPrice = product.discountPrice ?? product.price;
        orderItemsToCreate.push({
          productId: product.id,
          title: product.title,
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
        if (item.product.stock < item.quantity) {
          throw new AppError(`Insufficient stock for "${item.product.title}". Only ${item.product.stock} available.`, 400);
        }
        const unitPrice = item.product.discountPrice ?? item.product.price;
        orderItemsToCreate.push({
          productId: item.productId,
          title: item.product.title,
          price: unitPrice,
          quantity: item.quantity,
          imageUrl: item.product.images[0] || null,
        });
      }
    }

    // Calculate Prices
    const itemsPrice = Number(
      orderItemsToCreate.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)
    );
    const shippingPrice = itemsPrice >= 100 ? 0 : 15; // Free shipping over $100
    const taxPrice = Number((itemsPrice * 0.08).toFixed(2)); // 8% sales tax
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

    // Clear cart after successful checkout
    await cartRepository.clearCart(userId);

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
