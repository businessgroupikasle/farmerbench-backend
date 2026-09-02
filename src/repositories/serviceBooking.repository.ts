import { prisma } from '../config/database';
import { BookingStatus, Prisma } from '@prisma/client';
import { ServiceBookingQueryParams } from '@formerbench/shared';

export class ServiceBookingRepository {
  async create(data: {
    bookingReference: string;
    serviceSlug: string;
    serviceName: string;
    name: string;
    phone: string;
    email?: string | null;
    location: string;
    farmSize?: string | null;
    cropType?: string | null;
    preferredDate?: Date | null;
    message?: string | null;
    userId?: string | null;
  }) {
    return prisma.serviceBooking.create({
      data: {
        bookingReference: data.bookingReference,
        serviceSlug: data.serviceSlug,
        serviceName: data.serviceName,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        location: data.location,
        farmSize: data.farmSize || null,
        cropType: data.cropType || null,
        preferredDate: data.preferredDate || null,
        message: data.message || null,
        userId: data.userId || null,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async findAll(params: ServiceBookingQueryParams) {
    const page = Number(params.page) > 0 ? Number(params.page) : 1;
    const limit = Number(params.limit) > 0 ? Number(params.limit) : 15;
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceBookingWhereInput = {};

    if (params.serviceSlug && params.serviceSlug !== 'all') {
      where.serviceSlug = params.serviceSlug;
    }

    if (params.status && params.status !== 'ALL' && params.status !== 'all') {
      where.status = params.status as BookingStatus;
    }

    if (params.search && params.search.trim()) {
      const q = params.search.trim();
      where.OR = [
        { bookingReference: { contains: q, mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { serviceName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const orderBy: Prisma.ServiceBookingOrderByWithRelationInput = {
      createdAt: params.sortBy === 'oldest' ? 'asc' : 'desc',
    };

    const [bookings, total] = await Promise.all([
      prisma.serviceBooking.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.serviceBooking.count({ where }),
    ]);

    return {
      bookings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async findById(id: string) {
    return prisma.serviceBooking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async findByReference(bookingReference: string) {
    return prisma.serviceBooking.findUnique({
      where: { bookingReference },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async findByUserId(userId: string) {
    return prisma.serviceBooking.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, status: BookingStatus, adminNotes?: string | null) {
    return prisma.serviceBooking.update({
      where: { id },
      data: {
        status,
        adminNotes: adminNotes !== undefined ? adminNotes : undefined,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    return prisma.serviceBooking.delete({
      where: { id },
    });
  }

  async getStats() {
    const [
      totalBookings,
      newBookings,
      contactedBookings,
      inProgressBookings,
      completedBookings,
      cancelledBookings,
      recentBookings,
      allBookings,
    ] = await Promise.all([
      prisma.serviceBooking.count(),
      prisma.serviceBooking.count({ where: { status: 'NEW' } }),
      prisma.serviceBooking.count({ where: { status: 'CONTACTED' } }),
      prisma.serviceBooking.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.serviceBooking.count({ where: { status: 'COMPLETED' } }),
      prisma.serviceBooking.count({ where: { status: 'CANCELLED' } }),
      prisma.serviceBooking.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      }),
      prisma.serviceBooking.findMany({
        select: {
          serviceSlug: true,
          serviceName: true,
        },
      }),
    ]);

    // Service Breakdown aggregation
    const breakdownMap: Record<string, { serviceName: string; serviceSlug: string; count: number }> = {};
    for (const b of allBookings) {
      if (!breakdownMap[b.serviceSlug]) {
        breakdownMap[b.serviceSlug] = {
          serviceSlug: b.serviceSlug,
          serviceName: b.serviceName,
          count: 0,
        };
      }
      breakdownMap[b.serviceSlug].count += 1;
    }

    return {
      totalBookings,
      newBookings,
      contactedBookings,
      inProgressBookings,
      completedBookings,
      cancelledBookings,
      recentBookings,
      serviceBreakdown: Object.values(breakdownMap),
    };
  }
}

export const serviceBookingRepository = new ServiceBookingRepository();
