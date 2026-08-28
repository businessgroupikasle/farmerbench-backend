import { prisma } from '../config/database';
import { CreateOrderInput, OrderStatus, PaymentStatus } from '@formerbench/shared';

export class OrderRepository {
  async create(userId: string, data: {
    shippingAddress: CreateOrderInput['shippingAddress'];
    paymentMethod: CreateOrderInput['paymentMethod'];
    items: {
      productId: string;
      title: string;
      price: number;
      quantity: number;
      imageUrl?: string | null;
    }[];
    itemsPrice: number;
    taxPrice: number;
    shippingPrice: number;
    totalPrice: number;
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Create Shipping Address
      const shippingAddress = await tx.shippingAddress.create({
        data: {
          userId,
          fullName: data.shippingAddress.fullName,
          street: data.shippingAddress.street,
          city: data.shippingAddress.city,
          state: data.shippingAddress.state,
          postalCode: data.shippingAddress.postalCode,
          country: data.shippingAddress.country,
          phone: data.shippingAddress.phone,
        },
      });

      // 2. Create Order
      const order = await tx.order.create({
        data: {
          userId,
          shippingAddressId: shippingAddress.id,
          paymentMethod: data.paymentMethod,
          paymentStatus: 'PAID', // In mock/live checkout
          orderStatus: 'PROCESSING',
          itemsPrice: data.itemsPrice,
          taxPrice: data.taxPrice,
          shippingPrice: data.shippingPrice,
          totalPrice: data.totalPrice,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              imageUrl: item.imageUrl,
            })),
          },
          payment: {
            create: {
              amount: data.totalPrice,
              method: data.paymentMethod,
              status: 'PAID',
              transactionId: `TXN-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            },
          },
        },
        include: {
          items: {
            include: { product: true },
          },
          shippingAddress: true,
          payment: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });

      // 3. Update stock levels for each item
      for (const item of data.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      return order;
    });
  }

  async findById(id: string) {
    return prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: { product: true },
        },
        shippingAddress: true,
        payment: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async findByUserId(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { product: true },
        },
        shippingAddress: true,
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAll(params: { page?: number; limit?: number; status?: OrderStatus }) {
    const page = params.page || 1;
    const limit = params.limit || 15;
    const skip = (page - 1) * limit;

    const where = params.status ? { orderStatus: params.status } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: true,
          shippingAddress: true,
          payment: true,
          user: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      orders,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateStatus(orderId: string, orderStatus: OrderStatus, paymentStatus?: PaymentStatus) {
    return prisma.order.update({
      where: { id: orderId },
      data: {
        orderStatus,
        paymentStatus: paymentStatus || undefined,
        payment: paymentStatus
          ? {
              update: {
                status: paymentStatus,
              },
            }
          : undefined,
      },
      include: {
        items: true,
        shippingAddress: true,
        payment: true,
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async count() {
    return prisma.order.count();
  }
}

export const orderRepository = new OrderRepository();
