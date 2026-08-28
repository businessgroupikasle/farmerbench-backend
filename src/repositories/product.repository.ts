import { prisma } from '../config/database';
import { CreateProductInput, UpdateProductInput, ProductQueryInput } from '@formerbench/shared';
import { Prisma } from '@prisma/client';

export class ProductRepository {
  async findAll(params: ProductQueryInput) {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      minPrice,
      maxPrice,
      minRating,
      sortBy = 'newest',
      featured,
    } = params;

    const skip = (page - 1) * limit;

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = {
        OR: [
          { slug: category },
          { id: category },
          { name: { contains: category, mode: 'insensitive' } },
        ],
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    if (minRating !== undefined) {
      where.rating = { gte: minRating };
    }

    if (featured !== undefined) {
      where.featured = featured;
    }

    let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
    if (sortBy === 'price_asc') orderBy = { price: 'asc' };
    else if (sortBy === 'price_desc') orderBy = { price: 'desc' };
    else if (sortBy === 'rating') orderBy = { rating: 'desc' };
    else if (sortBy === 'popular') orderBy = { numReviews: 'desc' };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    };
  }

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        reviews: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findFeatured(limit: number = 8) {
    return prisma.product.findMany({
      where: { featured: true },
      include: {
        category: true,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(data: CreateProductInput) {
    return prisma.product.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        price: data.price,
        discountPrice: data.discountPrice,
        stock: data.stock,
        featured: data.featured,
        images: data.images,
        attributes: data.attributes || undefined,
        categoryId: data.categoryId,
      },
      include: {
        category: true,
      },
    });
  }

  async update(id: string, data: UpdateProductInput) {
    return prisma.product.update({
      where: { id },
      data: {
        ...data,
        attributes: data.attributes !== undefined ? data.attributes || undefined : undefined,
      },
      include: {
        category: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.product.delete({
      where: { id },
    });
  }

  async updateStock(id: string, quantityChange: number) {
    return prisma.product.update({
      where: { id },
      data: {
        stock: {
          increment: quantityChange,
        },
      },
    });
  }

  async count() {
    return prisma.product.count();
  }
}

export const productRepository = new ProductRepository();
