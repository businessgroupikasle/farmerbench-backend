import { CreateSubcategoryInput, UpdateSubcategoryInput } from '@formerbench/shared';
import { prisma } from '../config/database';
import { subcategoryRepository } from '../repositories/subcategory.repository';
import { AppError } from '../utils/response';

export class SubcategoryService {
  getSubcategories(categoryId?: string) { return subcategoryRepository.findAll(categoryId); }

  async getSubcategory(slugOrId: string) {
    const row = /^[0-9a-f-]{36}$/i.test(slugOrId)
      ? await subcategoryRepository.findById(slugOrId)
      : await subcategoryRepository.findBySlug(slugOrId);
    if (!row) throw new AppError('Subcategory not found', 404);
    return row;
  }

  async createSubcategory(input: CreateSubcategoryInput) {
    if (!await prisma.category.findUnique({ where: { id: input.categoryId } })) {
      throw new AppError('Parent category not found', 400);
    }
    if (await subcategoryRepository.findBySlug(input.slug)) {
      throw new AppError('A subcategory with this slug already exists', 400);
    }
    return subcategoryRepository.create(input);
  }

  async updateSubcategory(id: string, input: UpdateSubcategoryInput) {
    const existing = await subcategoryRepository.findById(id);
    if (!existing) throw new AppError('Subcategory not found', 404);
    if (input.categoryId && !await prisma.category.findUnique({ where: { id: input.categoryId } })) {
      throw new AppError('Parent category not found', 400);
    }
    const duplicate = input.slug ? await subcategoryRepository.findBySlug(input.slug) : null;
    if (duplicate && duplicate.id !== id) throw new AppError('A subcategory with this slug already exists', 400);
    return subcategoryRepository.update(id, input);
  }

  async deleteSubcategory(id: string) {
    if (!await subcategoryRepository.findById(id)) throw new AppError('Subcategory not found', 404);
    return subcategoryRepository.deactivate(id);
  }
}

export const subcategoryService = new SubcategoryService();
