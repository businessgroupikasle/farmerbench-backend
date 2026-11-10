import { blogRepository } from '../repositories/blog.repository';
import { CreateBlogInput, UpdateBlogInput, BlogQueryParams } from '@formerbench/shared';
import { AppError } from '../utils/response';

const VIEW_WINDOW_MS = 6 * 60 * 60 * 1000;
const MAX_TRACKED_VIEWS = 50_000;
const recentViews = new Map<string, number>();

setInterval(() => {
  const now = Date.now();
  for (const [key, seenAt] of recentViews.entries()) {
    if (now - seenAt > VIEW_WINDOW_MS) recentViews.delete(key);
  }
}, 30 * 60 * 1000).unref();

const shouldCountView = (blogId: string, viewerKey: string) => {
  const key = `${blogId}:${viewerKey}`;
  const now = Date.now();
  const seenAt = recentViews.get(key);
  if (seenAt && now - seenAt < VIEW_WINDOW_MS) return false;
  if (recentViews.size >= MAX_TRACKED_VIEWS) recentViews.clear();
  recentViews.set(key, now);
  return true;
};

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

  /**
   * Public article fetch: unpublished posts are hidden from non-admins, and a view is
   * counted at most once per visitor per 6 hours (prevents view-count inflation).
   */
  async getPublicBlog(idOrSlug: string, options: { isAdmin: boolean; viewerKey: string }) {
    const blog = await blogRepository.findByIdOrSlug(idOrSlug, false);
    if (!blog || (!options.isAdmin && blog.status !== 'PUBLISHED')) {
      throw new AppError('Blog article not found', 404);
    }
    if (options.isAdmin || !shouldCountView(blog.id, options.viewerKey)) {
      return blog;
    }
    return (await blogRepository.findByIdOrSlug(blog.id, true)) || blog;
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
