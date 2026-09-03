import { prisma } from '../config/database';

export class AdminRepository {
  async getDashboardStats() {
    const finalizedOrders = {
      OR: [{ paymentMethod: 'CASH_ON_DELIVERY' as const }, { paymentStatus: 'PAID' as const }],
    };
    const [
      revenueAggregate,
      totalOrders,
      totalProducts,
      totalCustomers,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: finalizedOrders,
        _sum: { totalPrice: true },
      }),
      prisma.order.count({ where: finalizedOrders }),
      prisma.product.count(),
      prisma.user.count({
        where: { role: 'CUSTOMER' },
      }),
      prisma.order.findMany({
        where: finalizedOrders,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
          items: true,
          shippingAddress: true,
        },
      }),
      prisma.product.findMany({
        where: { stock: { lte: 5 } },
        take: 10,
        orderBy: { stock: 'asc' },
        include: { category: true },
      }),
    ]);

    // Compute monthly sales for the current year
    const pastOrders = await prisma.order.findMany({
      where: finalizedOrders,
      select: {
        totalPrice: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlySalesMap: Record<string, number> = {};

    // Initialize all months
    monthNames.forEach((m) => {
      monthlySalesMap[m] = 0;
    });

    pastOrders.forEach((o) => {
      const month = monthNames[new Date(o.createdAt).getMonth()];
      monthlySalesMap[month] = (monthlySalesMap[month] || 0) + o.totalPrice;
    });

    const monthlySales = monthNames.map((m) => ({
      month: m,
      sales: Number((monthlySalesMap[m] || 0).toFixed(2)),
    }));

    return {
      totalRevenue: Number((revenueAggregate._sum.totalPrice || 0).toFixed(2)),
      totalOrders,
      totalProducts,
      totalCustomers,
      recentOrders,
      monthlySales,
      lowStockProducts,
    };
  }
}

export const adminRepository = new AdminRepository();
