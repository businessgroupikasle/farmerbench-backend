import { Prisma, HeroPage } from '@prisma/client';
import { prisma } from '../config/database';

export class HeroBannerRepository {
  findAll(page?: HeroPage, activeOnly = false) {
    const now = new Date();
    const where: Prisma.HeroBannerWhereInput = { ...(page ? { page } : {}) };
    if (activeOnly) Object.assign(where, {
      isActive: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    });
    return prisma.heroBanner.findMany({ where, orderBy: [{ page: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'asc' }] });
  }
  findById(id: string) { return prisma.heroBanner.findUnique({ where: { id } }); }
  create(data: Prisma.HeroBannerCreateInput) { return prisma.heroBanner.create({ data }); }
  update(id: string, data: Prisma.HeroBannerUpdateInput) { return prisma.heroBanner.update({ where: { id }, data }); }
  delete(id: string) { return prisma.heroBanner.delete({ where: { id } }); }
  reorder(ids: string[]) {
    return prisma.$transaction(ids.map((id, sortOrder) => prisma.heroBanner.update({ where: { id }, data: { sortOrder } })));
  }
}
export const heroBannerRepository = new HeroBannerRepository();
