import { productRepository } from '../repositories/product.repository';
import { categoryRepository } from '../repositories/category.repository';
import { reviewRepository } from '../repositories/review.repository';
import { CreateProductInput, UpdateProductInput, ProductQueryInput, CreateReviewInput } from '@formerbench/shared';
import { AppError } from '../utils/response';

export class ProductService {
  async getProducts(params: ProductQueryInput) {
    return productRepository.findAll(params);
  }

  async getProductByIdOrSlug(idOrSlug: string) {
    let product;
    // Check if it matches UUID format
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
    if (isUuid) {
      product = await productRepository.findById(idOrSlug);
    } else {
      product = await productRepository.findBySlug(idOrSlug);
    }

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  }

  async getFeaturedProducts(limit: number = 8) {
    return productRepository.findFeatured(limit);
  }

  async createProduct(input: CreateProductInput) {
    const category = await categoryRepository.findById(input.categoryId);
    if (!category) {
      throw new AppError('Category not found', 400);
    }

    const existingSlug = await productRepository.findBySlug(input.slug);
    if (existingSlug) {
      throw new AppError('A product with this slug already exists', 400);
    }

    return productRepository.create(input);
  }

  async updateProduct(id: string, input: UpdateProductInput) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new AppError('Product not found', 404);
    }

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

    return productRepository.update(id, input);
  }

  async deleteProduct(id: string) {
    const existing = await productRepository.findById(id);
    if (!existing) {
      throw new AppError('Product not found', 404);
    }

    return productRepository.delete(id);
  }

  async addReview(userId: string, input: CreateReviewInput) {
    const product = await productRepository.findById(input.productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const existingReview = await reviewRepository.findByUserAndProduct(userId, input.productId);
    if (existingReview) {
      throw new AppError('You have already submitted a review for this product', 400);
    }

    return reviewRepository.create(userId, input);
  }
}

export const productService = new ProductService();
