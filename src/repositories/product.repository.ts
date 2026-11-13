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
      categoryId,
      subcategory,
      subcategoryId,
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
    if (categoryId) where.categoryId = categoryId;
    if (subcategory) {
      where.subcategory = {
        OR: [
          { slug: subcategory },
          { id: subcategory },
          { name: { contains: subcategory, mode: 'insensitive' } },
        ],
      };
    }
    if (subcategoryId) where.subcategoryId = subcategoryId;

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

    let rankedIds: string[] | undefined;
    if (sortBy === 'best_selling') {
      const [candidates, sales] = await Promise.all([
        prisma.product.findMany({ where, select: { id: true, featured: true, rating: true, createdAt: true } }),
        prisma.orderItem.groupBy({
          by: ['productId'],
          where: { order: { orderStatus: { not: 'CANCELLED' }, OR: [{ paymentStatus: 'PAID' }, { paymentMethod: 'CASH_ON_DELIVERY' }] } },
          _sum: { quantity: true },
        }),
      ]);
      const sold = new Map(sales.map(item => [item.productId, item._sum.quantity || 0]));
      rankedIds = candidates.sort((a, b) => (sold.get(b.id) || 0) - (sold.get(a.id) || 0)
        || Number(b.featured) - Number(a.featured) || b.rating - a.rating || b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id))
        .slice(skip, skip + limit).map(product => product.id);
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where: rankedIds ? { AND: [where, { id: { in: rankedIds } }] } : where,
        include: {
          category: true,
          subcategory: true,
          reviews: { select: { rating: true } },
        },
        orderBy,
        skip: rankedIds ? 0 : skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products: (rankedIds ? products.sort((a, b) => rankedIds!.indexOf(a.id) - rankedIds!.indexOf(b.id)) : products).map((product) => ({
        ...product,
        numReviews: product.reviews.length,
        rating: product.reviews.length
          ? Number((product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length).toFixed(1))
          : 0,
        reviews: undefined,
      })),
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
        subcategory: true,
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
        subcategory: true,
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
    const products = await prisma.product.findMany({
      where: { featured: true },
      include: {
        category: true,
        subcategory: true,
        reviews: { select: { rating: true } },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
    return products.map((product) => ({
      ...product,
      numReviews: product.reviews.length,
      rating: product.reviews.length ? Number((product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length).toFixed(1)) : 0,
      reviews: undefined,
    }));
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
        images: data.images ?? [],
        attributes: data.attributes || undefined,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
      },
      include: {
        category: true,
        subcategory: true,
      },
    });
  }

  async update(id: string, data: UpdateProductInput) {
    const updateData: Prisma.ProductUncheckedUpdateInput = {
      ...data,
      images: data.images === null ? [] : data.images,
      attributes: data.attributes !== undefined ? data.attributes || undefined : undefined,
    };

    return prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        subcategory: true,
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
