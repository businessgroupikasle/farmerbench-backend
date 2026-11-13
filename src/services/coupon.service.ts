import { prisma } from '../config/database';
import { AppError } from '../utils/response';

export class CouponService {
  async list() {
    return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getHomepageOffer() {
    return (prisma.coupon as any).findFirst({
      where: {
        active: true,
        showOnHomepage: true,
        OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }],
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async create(data: { code: string; discountType: 'PERCENTAGE' | 'FIXED'; discountValue: number; minimumSpend?: number; usageLimit?: number; validUntil?: string; showOnHomepage?: boolean }) {
    const code = data.code.trim().toUpperCase();
    if (!/^[A-Z0-9]+$/.test(code)) {
      throw new AppError('Coupon code must contain uppercase letters and numbers only (no spaces or special characters)', 400);
    }
    if (data.discountValue <= 0) {
      throw new AppError('Discount value must be greater than 0', 400);
    }
    if (data.discountType === 'PERCENTAGE' && data.discountValue > 100) {
      throw new AppError('Percentage discount cannot exceed 100%', 400);
    }
    if (!data.validUntil) {
      throw new AppError('Valid Until date is required', 400);
    }
    const expiryDate = new Date(data.validUntil);
    if (Number.isNaN(expiryDate.getTime())) {
      throw new AppError('Invalid expiry date', 400);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expiryDate < today) {
      throw new AppError('Valid Until date cannot be in the past', 400);
    }
    // Set to end of day so coupon is valid through the entire selected day
    expiryDate.setHours(23, 59, 59, 999);

    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) {
      throw new AppError(`Coupon code "${code}" already exists. Please choose a different code.`, 409);
    }

    if (data.showOnHomepage) {
      await (prisma.coupon as any).updateMany({ data: { showOnHomepage: false } });
    }
    return (prisma.coupon as any).create({
      data: {
        code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minimumSpend: Math.max(0, data.minimumSpend || 0),
        usageLimit: data.usageLimit && data.usageLimit > 0 ? Math.floor(data.usageLimit) : null,
        validUntil: expiryDate,
        showOnHomepage: Boolean(data.showOnHomepage),
      },
    });
  }

  async update(id: string, data: { active?: boolean; showOnHomepage?: boolean }) {
    const couponModel = prisma.coupon as any;
    if (data.showOnHomepage) {
      await couponModel.updateMany({ where: { id: { not: id } }, data: { showOnHomepage: false } });
    }
    return couponModel.update({
      where: { id },
      data: {
        ...(typeof data.active === 'boolean' ? { active: data.active } : {}),
        ...(typeof data.showOnHomepage === 'boolean' ? { showOnHomepage: data.showOnHomepage } : {}),
      },
    });
  }

  async remove(id: string) {
    await prisma.coupon.delete({ where: { id } });
  }

  async calculate(codeInput: string, subtotal: number) {
    const code = codeInput.trim().toUpperCase();
    const coupon = await prisma.coupon.findUnique({ where: { code } });
    if (!coupon || !coupon.active) throw new AppError('Invalid or inactive coupon code', 400);
    if (coupon.validUntil && coupon.validUntil < new Date()) throw new AppError('This coupon has expired', 400);
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) throw new AppError('This coupon usage limit has been reached', 400);
    if (subtotal < coupon.minimumSpend) throw new AppError(`Minimum order value is ₹${coupon.minimumSpend.toFixed(2)}`, 400);
    const raw = coupon.discountType === 'PERCENTAGE' ? subtotal * coupon.discountValue / 100 : coupon.discountValue;
    return { coupon, discountAmount: Number(Math.min(subtotal, raw).toFixed(2)) };
  }
}

export const couponService = new CouponService();
