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

  async update(input: {
    standardShippingFee: number;
    freeShippingThreshold: number;
    shippingPolicyEffectiveDate?: string | null;
    returnPolicyEffectiveDate?: string | null;
  }) {
    const standardShippingFee = Number(input.standardShippingFee);
    const freeShippingThreshold = Number(input.freeShippingThreshold);
    if (!Number.isFinite(standardShippingFee) || standardShippingFee < 0 || !Number.isFinite(freeShippingThreshold) || freeShippingThreshold < 0) {
      throw new AppError('Shipping fee and free shipping threshold must be valid non-negative numbers', 400);
    }
    // undefined = leave unchanged, null/'' = clear, otherwise a valid date
    const parseDate = (value: string | null | undefined, label: string) => {
      if (value === undefined) return undefined;
      if (value === null || value === '') return null;
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) throw new AppError(`${label} must be a valid date`, 400);
      return parsed;
    };
    const dates = {
      shippingPolicyEffectiveDate: parseDate(input.shippingPolicyEffectiveDate, 'Shipping policy effective date'),
      returnPolicyEffectiveDate: parseDate(input.returnPolicyEffectiveDate, 'Return policy effective date'),
    };
    return prisma.storeSettings.upsert({
      where: { id: 'store' },
      update: { standardShippingFee, freeShippingThreshold, ...dates },
      create: { id: 'store', standardShippingFee, freeShippingThreshold, ...dates },
    });
  },
};