import { prisma } from '../config/database';
import { AppError } from '../utils/response';

const DEFAULT_SETTINGS = { standardShippingFee: 80, freeShippingThreshold: 5000 };

export const storeSettingsService = {
  async get() {
    return prisma.storeSettings.upsert({
      where: { id: 'store' },
      update: {},
      create: { id: 'store', ...DEFAULT_SETTINGS },
    });
  },

  async update(input: { standardShippingFee: number; freeShippingThreshold: number }) {
    const standardShippingFee = Number(input.standardShippingFee);
    const freeShippingThreshold = Number(input.freeShippingThreshold);
    if (!Number.isFinite(standardShippingFee) || standardShippingFee < 0 || !Number.isFinite(freeShippingThreshold) || freeShippingThreshold < 0) {
      throw new AppError('Shipping fee and free shipping threshold must be valid non-negative numbers', 400);
    }
    return prisma.storeSettings.upsert({
      where: { id: 'store' },
      update: { standardShippingFee, freeShippingThreshold },
      create: { id: 'store', standardShippingFee, freeShippingThreshold },
    });
  },
};