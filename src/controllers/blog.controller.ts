import { Request, Response, NextFunction } from 'express';
import { blogService } from '../services/blog.service';
import { sendSuccess } from '../utils/response';
import { getClientIp } from '../middlewares/rateLimit.middleware';

export class BlogController {
  async getBlogs(req: Request, res: Response, next: NextFunction) {
    try {
      const query: any = { ...req.query };
      // Draft/archived posts are only listed for administrators
      if (req.user?.role !== 'ADMIN') {
        query.status = 'PUBLISHED';
      }
      const result = await blogService.getBlogs(query);
      return sendSuccess(res, {
        blogs: result.blogs,
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const blog = await blogService.getPublicBlog(req.params.idOrSlug, {
        isAdmin: req.user?.role === 'ADMIN',
        viewerKey: getClientIp(req),
      });
      return sendSuccess(res, blog);
    } catch (error) {
      next(error);
    }
  }

  async getRelatedBlogs(req: Request, res: Response, next: NextFunction) {
    try {
      const requested = req.query.limit ? parseInt(req.query.limit as string, 10) : 3;
      const limit = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 20) : 3;
      const blogs = await blogService.getRelatedBlogs(
        req.params.idOrSlug,
        req.query.category as string,
        limit
      );
      return sendSuccess(res, blogs);
    } catch (error) {
      next(error);
    }
  }

  async getCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await blogService.getCategories();
      return sendSuccess(res, categories);
    } catch (error) {
      next(error);
    }
  }

  async createBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const blog = await blogService.createBlog(req.body);
      return sendSuccess(res, blog, 'Blog article created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateBlog(req: Request, res: Response, next: NextFunction) {
    try {
      const blog = await blogService.updateBlog(req.params.id, req.body);
      return sendSuccess(res, blog, 'Blog article updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteBlog(req: Request, res: Response, next: NextFunction) {
    try {
      await blogService.deleteBlog(req.params.id);
      return sendSuccess(res, null, 'Blog article deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const blogController = new BlogController();
