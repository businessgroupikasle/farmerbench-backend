import { prisma } from '../config/database';
import { CreateSubcategoryInput, UpdateSubcategoryInput } from '@formerbench/shared';

const include = { category: true, _count: { select: { products: true } } } as const;

export class SubcategoryRepository {
  findAll(categoryId?: string) {
    return prisma.subcategory.findMany({
      where: categoryId ? { categoryId } : undefined,
      include,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }
  findById(id: string) { return prisma.subcategory.findUnique({ where: { id }, include }); }
  findBySlug(slug: string) { return prisma.subcategory.findUnique({ where: { slug }, include }); }
  create(data: CreateSubcategoryInput) { return prisma.subcategory.create({ data, include }); }
  update(id: string, data: UpdateSubcategoryInput) {
    return prisma.subcategory.update({ where: { id }, data, include });
  }
  deactivate(id: string) {
    return prisma.subcategory.update({ where: { id }, data: { isActive: false }, include });
  }
}

export const subcategoryRepository = new SubcategoryRepository();
