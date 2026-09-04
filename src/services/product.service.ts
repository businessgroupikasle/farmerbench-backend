import { productRepository } from '../repositories/product.repository';
import { categoryRepository } from '../repositories/category.repository';
import { reviewRepository } from '../repositories/review.repository';
import { CreateProductInput, UpdateProductInput, ProductQueryInput, CreateReviewInput } from '@formerbench/shared';
import { AppError } from '../utils/response';
import { emitProductCreated, emitProductUpdated, emitProductDeleted } from '../socket';
import { prisma } from '../config/database';

export class ProductService {
  async getProducts(params: ProductQueryInput) {
    return productRepository.findAll(params);
  }

  async getProductByIdOrSlug(idOrSlug: string) {
    let product;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    if (isUuid) {
      product = await productRepository.findById(idOrSlug);
    } else {
      product = await productRepository.findBySlug(idOrSlug);
    }

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return {
      ...product,
      numReviews: product.reviews?.length || 0,
      rating: product.reviews?.length
        ? Number((product.reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / product.reviews.length).toFixed(1))
        : 0,
    };
  }

  async getFeaturedProducts(limit: number = 8) {
    return productRepository.findFeatured(limit);
  }

  async createProduct(input: CreateProductInput) {
    const category = await categoryRepository.findById(input.categoryId);
    if (!category) {
      throw new AppError('Category not found', 400);
    }
    await this.validateSubcategory(input.categoryId, input.subcategoryId);

    const existingSlug = await productRepository.findBySlug(input.slug);
    if (existingSlug) {
      throw new AppError('A product with this slug already exists', 400);
    }

    const created = await productRepository.create(input);
    emitProductCreated(created);
    return created;
  }

  async updateProduct(id: string, input: UpdateProductInput) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new AppError('Product not found', 404);
    }
    await this.validateSubcategory(
      input.categoryId || existing.categoryId,
      input.subcategoryId === undefined ? existing.subcategoryId : input.subcategoryId
    );

    if (input.categoryId) {
      const category = await categoryRepository.findById(input.categoryId);
      if (!category) {
        throw new AppError('Category not found', 400);
      }
    }

    if (input.slug && input.slug !== existing.slug) {
      const existingSlug = await productRepository.findBySlug(input.slug);
      if (existingSlug) {
        throw new AppError('A product with this slug already exists', 400);
      }
    }

    const updated = await productRepository.update(id, input);
    emitProductUpdated(updated);
    return updated;
  }

  private async validateSubcategory(categoryId: string, subcategoryId?: string | null) {
    if (!subcategoryId) return;
    const subcategory = await prisma.subcategory.findUnique({ where: { id: subcategoryId } });
    if (!subcategory || subcategory.categoryId !== categoryId) {
      throw new AppError('Subcategory must belong to the selected category', 400);
    }
    if (!subcategory.isActive) throw new AppError('Subcategory is inactive', 400);
  }

  async deleteProduct(id: string) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new AppError('Product not found', 404);
    }

    const result = await productRepository.delete(id);
    emitProductDeleted({ id });
    return result;
  }

  async getProductReviews(idOrSlug: string) {
    const product = await this.getProductByIdOrSlug(idOrSlug);
    const reviews = await reviewRepository.findByProductId(product.id);
    const summary = await reviewRepository.getReviewSummary(product.id);

    return {
      productId: product.id,
      productTitle: product.title,
      reviews,
      summary,
    };
  }

  async addReview(userId: string, input: CreateReviewInput) {
    const product = await productRepository.findById(input.productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const existingReview = await reviewRepository.findByUserAndProduct(userId, input.productId);
    if (existingReview) {
      throw new AppError('You have already submitted a review for this product', 409);
    }

    return reviewRepository.create(userId, input);
  }

  async updateReview(reviewId: string, userId: string, data: { rating?: number; comment?: string }, userRole: string) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    if (userRole !== 'ADMIN' && review.userId !== userId) {
      throw new AppError('You can only modify your own review', 403);
    }

    return reviewRepository.update(reviewId, data);
  }

  async deleteReview(reviewId: string, userId: string, userRole: string) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) {
      throw new AppError('Review not found', 404);
    }

    if (userRole !== 'ADMIN' && review.userId !== userId) {
      throw new AppError('You can only delete your own review', 403);
    }

    return reviewRepository.delete(reviewId);
  }

  async getAllReviews(params: { page?: number; limit?: number }) {
    return reviewRepository.findAll(params);
  }
}

export const productService = new ProductService();
