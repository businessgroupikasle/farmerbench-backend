import { prisma } from '../config/database';

export interface CreateExpertInput {
  name: string;
  specialization: string;
  territory: string;
  avatar?: string;
  phone?: string;
}

export const expertService = {
  list() {
    return prisma.agronomyExpert.findMany({ where: { isActive: true }, orderBy: { createdAt: 'desc' } });
  },
  create(input: CreateExpertInput) {
    return prisma.agronomyExpert.create({ data: input });
  },
};