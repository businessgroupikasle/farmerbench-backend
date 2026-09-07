import { prisma } from '../config/database';
import { CreateBlogInput, UpdateBlogInput, BlogQueryParams } from '@formerbench/shared';
import { Prisma, BlogStatus } from '@prisma/client';

export class BlogRepository {
  async findAll(params: BlogQueryParams) {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      tag,
      status,
      sortBy = 'newest',
    } = params;

    const skip = (page - 1) * limit;
    const where: Prisma.BlogWhereInput = {};

    // Status filter
    if (status && status !== 'ALL') {
      where.status = status as BlogStatus;
    } else if (!status) {
      // Default to PUBLISHED for public queries
      where.status = BlogStatus.PUBLISHED;
    }

    // Category filter
    if (category && category.toLowerCase() !== 'all') {
      const normalizedCat = category.replace(/[-_]/g, ' ').trim();
      where.category = {
        contains: normalizedCat,
        mode: 'insensitive',
      };
    }

    // Tag filter
    if (tag) {
      where.tags = {
        has: tag,
      };
    }

    // Search query
    if (search && search.trim()) {
      const term = search.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { excerpt: { contains: term, mode: 'insensitive' } },
        { content: { contains: term, mode: 'insensitive' } },
        { author: { contains: term, mode: 'insensitive' } },
      ];
    }

    // Order by
    let orderBy: Prisma.BlogOrderByWithRelationInput[] = [{ publishedAt: 'desc' }, { createdAt: 'desc' }];
    if (sortBy === 'popular') {
      orderBy = [{ views: 'desc' }, { publishedAt: 'desc' }];
    } else if (sortBy === 'oldest') {
      orderBy = [{ publishedAt: 'asc' }, { createdAt: 'asc' }];
    }

    const [blogs, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      prisma.blog.count({ where }),
    ]);

    return {
      blogs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findByIdOrSlug(idOrSlug: string, incrementViews = false) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    const where: Prisma.BlogWhereUniqueInput = isUuid ? { id: idOrSlug } : { slug: idOrSlug };

    if (incrementViews) {
      return prisma.blog.update({
        where,
        data: { views: { increment: 1 } },
      });
    }

    return prisma.blog.findUnique({
      where,
    });
  }

  async findRelated(idOrSlug: string, category?: string, limit = 3) {
    const current = await this.findByIdOrSlug(idOrSlug);
    const excludeId = current?.id || idOrSlug;
    const cat = category || current?.category;

    const whereCategory: Prisma.BlogWhereInput = {
      id: { not: excludeId },
      status: BlogStatus.PUBLISHED,
      ...(cat ? { category: { equals: cat, mode: 'insensitive' } } : {}),
    };

    let related = await prisma.blog.findMany({
      where: whereCategory,
      orderBy: [{ views: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
    });

    if (related.length < limit) {
      const existingIds = [excludeId, ...related.map((r) => r.id)];
      const fallback = await prisma.blog.findMany({
        where: {
          id: { notIn: existingIds },
          status: BlogStatus.PUBLISHED,
        },
        orderBy: [{ views: 'desc' }, { publishedAt: 'desc' }],
        take: limit - related.length,
      });
      related = [...related, ...fallback];
    }

    return related;
  }

  async getCategories() {
    const publishedBlogs = await prisma.blog.findMany({
      where: { status: BlogStatus.PUBLISHED },
      select: { category: true },
    });

    const countMap: Record<string, { name: string; count: number }> = {};
    publishedBlogs.forEach((b) => {
      const catName = b.category || 'General';
      const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      if (!countMap[slug]) {
        countMap[slug] = { name: catName, count: 0 };
      }
      countMap[slug].count += 1;
    });

    const categories = [
      { slug: 'all', name: 'All Categories', count: publishedBlogs.length },
      ...Object.entries(countMap).map(([slug, data]) => ({
        slug,
        name: data.name,
        count: data.count,
      })),
    ];

    return categories;
  }

  async create(data: CreateBlogInput) {
    const { status, ...rest } = data;
    const blogStatus = (status as BlogStatus) || BlogStatus.PUBLISHED;
    const now = new Date();

    return prisma.blog.create({
      data: {
        ...rest,
        excerpt: rest.excerpt || rest.content.replace(/<[^>]*>?/gm, '').slice(0, 150) + '...',
        slug: rest.slug!,
        status: blogStatus,
        publishedAt: blogStatus === BlogStatus.PUBLISHED ? now : null,
      },
    });
  }

  async update(id: string, data: UpdateBlogInput) {
    const existing = await prisma.blog.findUnique({ where: { id } });
    const { status, ...rest } = data;
    const updateData: Prisma.BlogUpdateInput = { ...rest };

    if (status) {
      const blogStatus = status as BlogStatus;
      updateData.status = blogStatus;
      if (blogStatus === BlogStatus.PUBLISHED && !existing?.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    return prisma.blog.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return prisma.blog.delete({
      where: { id },
    });
  }
}

export const blogRepository = new BlogRepository();
