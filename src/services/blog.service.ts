import { blogRepository } from '../repositories/blog.repository';
import { CreateBlogInput, UpdateBlogInput, BlogQueryParams } from '@formerbench/shared';
import { AppError } from '../utils/response';

export class BlogService {
  async getBlogs(params: BlogQueryParams) {
    return blogRepository.findAll(params);
  }

  async getBlogByIdOrSlug(idOrSlug: string, incrementViews = false) {
    const blog = await blogRepository.findByIdOrSlug(idOrSlug, incrementViews);
    if (!blog) {
      throw new AppError('Blog article not found', 404);
    }
    return blog;
  }

  async getRelatedBlogs(idOrSlug: string, category?: string, limit: number = 3) {
    return blogRepository.findRelated(idOrSlug, category, limit);
  }

  async getCategories() {
    return blogRepository.getCategories();
  }

  async createBlog(data: CreateBlogInput) {
    const slug =
      data.slug?.trim() ||
      data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const existingSlug = await blogRepository.findByIdOrSlug(slug);
    if (existingSlug) {
      throw new AppError('A blog article with this title or slug already exists', 400);
    }

    const wordCount = data.content.replace(/<[^>]*>?/gm, '').trim().split(/\s+/).length;
    const autoReadingTime = `${Math.max(1, Math.ceil(wordCount / 180))} min read`;

    return blogRepository.create({
      ...data,
      slug,
      readingTime: data.readingTime || autoReadingTime,
    });
  }

  async updateBlog(id: string, data: UpdateBlogInput) {
    const existing = await blogRepository.findByIdOrSlug(id);
    if (!existing) {
      throw new AppError('Blog article not found', 404);
    }

    if (data.slug && data.slug !== existing.slug) {
      const duplicate = await blogRepository.findByIdOrSlug(data.slug);
      if (duplicate && duplicate.id !== existing.id) {
        throw new AppError('A blog article with this slug already exists', 400);
      }
    }

    if (data.content && !data.readingTime) {
      const wordCount = data.content.replace(/<[^>]*>?/gm, '').trim().split(/\s+/).length;
      data.readingTime = `${Math.max(1, Math.ceil(wordCount / 180))} min read`;
    }

    return blogRepository.update(existing.id, data);
  }

  async deleteBlog(id: string) {
    const existing = await blogRepository.findByIdOrSlug(id);
    if (!existing) {
      throw new AppError('Blog article not found', 404);
    }
    return blogRepository.delete(existing.id);
  }
}

export const blogService = new BlogService();
