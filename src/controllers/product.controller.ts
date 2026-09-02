import { Request, Response, NextFunction } from 'express';
import { productService } from '../services/product.service';
import { sendSuccess, sendPaginated } from '../utils/response';

export class ProductController {
  async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.getProducts(req.query as any);
      return sendPaginated(res, result.products, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFeaturedProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 8;
      const products = await productService.getFeaturedProducts(limit);
      return sendSuccess(res, products);
    } catch (error) {
      next(error);
    }
  }

  async getProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getProductByIdOrSlug(req.params.idOrSlug);
      return sendSuccess(res, product);
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.createProduct(req.body);
      return sendSuccess(res, product, 'Product created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.updateProduct(req.params.id, req.body);
      return sendSuccess(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      await productService.deleteProduct(req.params.id);
      return sendSuccess(res, null, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.getProductReviews(req.params.productId || req.params.idOrSlug);
      return sendSuccess(res, result, 'Product reviews retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async addReview(req: Request, res: Response, next: NextFunction) {
    try {
      const productId = req.params.productId || req.body.productId;
      const review = await productService.addReview(req.user!.userId, {
        ...req.body,
        productId,
      });
      return sendSuccess(res, review, 'Review submitted successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewId = req.params.reviewId || req.params.id;
      const updated = await productService.updateReview(
        reviewId,
        req.user!.userId,
        req.body,
        req.user!.role
      );
      return sendSuccess(res, updated, 'Review updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const reviewId = req.params.reviewId || req.params.id;
      await productService.deleteReview(reviewId, req.user!.userId, req.user!.role);
      return sendSuccess(res, null, 'Review deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAllReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.getAllReviews(req.query as any);
      return sendPaginated(res, result.reviews, {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();
