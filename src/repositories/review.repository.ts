import { prisma } from '../config/database';
import { CreateReviewInput } from '@formerbench/shared';

export class ReviewRepository {
  async findByProductId(productId: string) {
    return prisma.review.findMany({
      where: { productId },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserAndProduct(userId: string, productId: string) {
    return prisma.review.findUnique({
      where: {
        userId_productId: { userId, productId },
      },
    });
  }

  async findById(id: string) {
    return prisma.review.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true },
        },
      },
    });
  }

  async getReviewSummary(productId: string) {
    const reviews = await prisma.review.findMany({
      where: { productId },
      select: { rating: true },
    });

    const totalReviews = reviews.length;
    const distribution: Record<string, number> = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };

    let sum = 0;
    for (const r of reviews) {
      sum += r.rating;
      const key = String(Math.min(5, Math.max(1, Math.round(r.rating))));
      distribution[key] = (distribution[key] || 0) + 1;
    }

    const averageRating = totalReviews > 0 ? Number((sum / totalReviews).toFixed(1)) : 0;

    return {
      averageRating,
      totalReviews,
      distribution,
    };
  }

  async create(userId: string, data: CreateReviewInput) {
    return prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          userId,
          productId: data.productId,
          rating: data.rating,
          comment: data.comment,
        },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });

      // Recalculate average rating & review count
      const aggregations = await tx.review.aggregate({
        where: { productId: data.productId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.product.update({
        where: { id: data.productId },
        data: {
          rating: aggregations._avg.rating ? Number(aggregations._avg.rating.toFixed(1)) : 0,
          numReviews: aggregations._count.rating || 0,
        },
      });

      return review;
    });
  }

  async update(id: string, data: { rating?: number; comment?: string }) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id },
        data: {
          rating: data.rating,
          comment: data.comment,
        },
        include: {
          user: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });

      // Recalculate average rating & review count
      const aggregations = await tx.review.aggregate({
        where: { productId: updated.productId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.product.update({
        where: { id: updated.productId },
        data: {
          rating: aggregations._avg.rating ? Number(aggregations._avg.rating.toFixed(1)) : 0,
          numReviews: aggregations._count.rating || 0,
        },
      });

      return updated;
    });
  }

  async delete(id: string) {
    return prisma.$transaction(async (tx) => {
      const deleted = await tx.review.delete({
        where: { id },
      });

      // Recalculate average rating & review count
      const aggregations = await tx.review.aggregate({
        where: { productId: deleted.productId },
        _avg: { rating: true },
        _count: { rating: true },
      });

      await tx.product.update({
        where: { id: deleted.productId },
        data: {
          rating: aggregations._avg.rating ? Number(aggregations._avg.rating.toFixed(1)) : 0,
          numReviews: aggregations._count.rating || 0,
        },
      });

      return deleted;
    });
  }

  async findAll(params: { page?: number; limit?: number }) {
    const page = Number(params.page) > 0 ? Number(params.page) : 1;
    const limit = Number(params.limit) > 0 ? Number(params.limit) : 20;
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true },
          },
          product: {
            select: { id: true, title: true, slug: true, images: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count(),
    ]);

    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }
}

export const reviewRepository = new ReviewRepository();
