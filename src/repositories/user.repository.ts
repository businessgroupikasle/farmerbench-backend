import { prisma } from '../config/database';
import { RegisterInput, Role, CustomerQueryInput } from '@formerbench/shared';

export class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findByPhone(phone: string) {
    return prisma.user.findFirst({
      where: { phone },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        emailVerified: true,
        location: true,
        crops: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(data: {
    email: string;
    name: string;
    password?: string;
    phone?: string | null;
    emailVerified?: boolean;
    avatarUrl?: string | null;
    location?: string | null;
    crops?: string | null;
    status?: string;
    role?: Role;
  }) {
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        name: data.name,
        password: data.password || '',
        role: data.role || 'CUSTOMER',
        phone: data.phone || null,
        emailVerified: data.emailVerified || false,
        avatarUrl: data.avatarUrl || null,
        location: data.location || null,
        crops: data.crops || null,
        status: data.status || 'Active',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        emailVerified: true,
        location: true,
        crops: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, data: {
    name?: string;
    avatarUrl?: string | null;
    phone?: string | null;
    location?: string | null;
    crops?: string | null;
    status?: string;
    emailVerified?: boolean;
  }) {
    return prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        emailVerified: true,
        location: true,
        crops: true,
        status: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { password: passwordHash },
    });
  }

  async findCustomers(params: CustomerQueryInput) {
    const { page = 1, limit = 50, search, status, sortBy = 'newest' } = params;
    const skip = (page - 1) * limit;

    const where: any = {
      role: 'CUSTOMER',
    };

    if (status && status !== 'All') {
      where.status = status;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { crops: { contains: q, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sortBy === 'name_asc') {
      orderBy = { name: 'asc' };
    } else if (sortBy === 'name_desc') {
      orderBy = { name: 'desc' };
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          emailVerified: true,
          location: true,
          crops: true,
          status: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
          orders: {
            select: {
              id: true,
              totalPrice: true,
              orderStatus: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          _count: {
            select: {
              orders: true,
              reviews: true,
            },
          },
        },
      }),
    ]);

    return {
      customers: users.map((u) => {
        const totalSpentNum = u.orders.reduce((sum: number, o: any) => sum + (o.totalPrice || 0), 0);
        const lastOrderDate = u.orders[0]?.createdAt
          ? new Date(u.orders[0].createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : 'No orders yet';

        return {
          id: u.id,
          name: u.name,
          email: u.email,
          phone: u.phone || 'N/A',
          location: u.location || 'Tamil Nadu',
          crops: u.crops || 'General Agriculture',
          status: u.status || 'Active',
          avatarUrl: u.avatarUrl,
          totalOrders: u._count.orders,
          totalSpent: totalSpentNum > 0 ? `₹${totalSpentNum.toLocaleString('en-IN')}` : '₹0',
          lastOrder: lastOrderDate,
          registeredAt: new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
          ordersCount: u._count.orders,
          reviewsCount: u._count.reviews,
        };
      }),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async count() {
    return prisma.user.count();
  }
}

export const userRepository = new UserRepository();
