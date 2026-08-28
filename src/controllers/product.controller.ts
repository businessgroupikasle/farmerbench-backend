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

  async addReview(req: Request, res: Response, next: NextFunction) {
    try {
      const review = await productService.addReview(req.user!.userId, req.body);
      return sendSuccess(res, review, 'Review submitted successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();
