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
      variantId?: string;
      selectedAttributes?: { packSize?: string };
      imageUrl?: string | null;
    }[];
    itemsPrice: number;
    taxPrice: number;
    shippingPrice: number;
    totalPrice: number;
    discountPrice: number;
    couponCode?: string;
  }) {
    return prisma.$transaction(async (tx) => {
      const isRazorpay = data.paymentMethod === 'RAZORPAY';
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
          paymentStatus: 'PENDING',
          orderStatus: isRazorpay ? 'PENDING' : 'PROCESSING',
          itemsPrice: data.itemsPrice,
          taxPrice: data.taxPrice,
          shippingPrice: data.shippingPrice,
          totalPrice: data.totalPrice,
          discountPrice: data.discountPrice,
          couponCode: data.couponCode,
          items: {
            create: data.items.map((item) => ({
              productId: item.productId,
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              variantId: item.variantId,
              selectedAttributes: item.selectedAttributes,
              imageUrl: item.imageUrl,
            })),
          },
          payment: {
            create: {
              amount: data.totalPrice,
              method: data.paymentMethod,
              status: 'PENDING',
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

      // Razorpay stock is committed only after verified payment.
      if (!isRazorpay) {
        for (const item of data.items) {
          if (item.variantId) {
            await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${item.productId} FOR UPDATE`;
            const product = await tx.product.findUnique({ where: { id: item.productId } });
            if (!product) throw new Error(`Product not found: ${item.productId}`);
            const attrs = (product.attributes as Record<string, any>) || {};
            const variants = Array.isArray(attrs.variants) ? attrs.variants : [];
            let found = false;
            const updatedVariants = variants.map((variant: any) => {
              if (![variant.id, variant.variantId, variant.sku].includes(item.variantId)) return variant;
              found = true;
              const stock = Number(variant.stock);
              if (!Number.isFinite(stock) || stock < item.quantity) {
                throw new Error(`Insufficient stock for variant ${item.variantId}`);
              }
              return { ...variant, stock: stock - item.quantity };
            });
            if (!found) throw new Error(`Variant not found: ${item.variantId}`);
            await tx.product.update({
              where: { id: item.productId },
              data: { attributes: { ...attrs, variants: updatedVariants } },
            });
          } else {
            const result = await tx.product.updateMany({
              where: { id: item.productId, stock: { gte: item.quantity } },
              data: { stock: { decrement: item.quantity } },
            });
            if (result.count !== 1) throw new Error(`Insufficient stock for ${item.productId}`);
          }
        }
        if (data.couponCode) {
          await tx.coupon.update({ where: { code: data.couponCode }, data: { usageCount: { increment: 1 } } });
          await tx.order.update({ where: { id: order.id }, data: { couponRedeemed: true } });
        }
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
      where: {
        userId,
        OR: [
          { paymentMethod: 'CASH_ON_DELIVERY' },
          { paymentStatus: 'PAID' },
        ],
      },
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

  async findAll(params: { page?: number | string; limit?: number | string; status?: OrderStatus }) {
    const page = Number(params.page) > 0 ? Number(params.page) : 1;
    const limit = Number(params.limit) > 0 ? Number(params.limit) : 15;
    const skip = (page - 1) * limit;

    const where = {
      AND: [
        params.status ? { orderStatus: params.status } : {},
        { OR: [{ paymentMethod: 'CASH_ON_DELIVERY' as const }, { paymentStatus: 'PAID' as const }] },
      ],
    };

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
