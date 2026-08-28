import { categoryRepository } from '../repositories/category.repository';
import { CreateCategoryInput, UpdateCategoryInput } from '@formerbench/shared';
import { AppError } from '../utils/response';

export class CategoryService {
  async getCategories() {
    return categoryRepository.findAll();
  }

  async getCategoryBySlugOrId(slugOrId: string) {
    let category;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
    if (isUuid) {
      category = await categoryRepository.findById(slugOrId);
    } else {
      category = await categoryRepository.findBySlug(slugOrId);
    }

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    return category;
  }

  async createCategory(input: CreateCategoryInput) {
    const existing = await categoryRepository.findBySlug(input.slug);
    if (existing) {
      throw new AppError('A category with this slug already exists', 400);
    }

    return categoryRepository.create(input);
  }

  async updateCategory(id: string, input: UpdateCategoryInput) {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw new AppError('Category not found', 404);
    }

    if (input.slug && input.slug !== existing.slug) {
      const existingSlug = await categoryRepository.findBySlug(input.slug);
      if (existingSlug) {
        throw new AppError('A category with this slug already exists', 400);
      }
    }

    return categoryRepository.update(id, input);
  }

  async deleteCategory(id: string) {
    const existing = await categoryRepository.findById(id);
    if (!existing) {
      throw new AppError('Category not found', 404);
    }

    return categoryRepository.delete(id);
  }
}

export const categoryService = new CategoryService();
