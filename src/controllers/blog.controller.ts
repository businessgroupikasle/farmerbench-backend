import { Request, Response, NextFunction } from 'express';
import { blogService } from '../services/blog.service';
import { sendSuccess } from '../utils/response';

export class BlogController {
  async getBlogs(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await blogService.getBlogs(req.query as any);
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
      const blog = await blogService.getBlogByIdOrSlug(req.params.idOrSlug, true);
      return sendSuccess(res, blog);
    } catch (error) {
      next(error);
    }
  }

  async getRelatedBlogs(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 3;
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
