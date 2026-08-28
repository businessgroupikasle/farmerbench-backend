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
}

export const reviewRepository = new ReviewRepository();
