import { prisma } from '../config/database';
import { AppError } from '../utils/response';

export class CouponService {
  async list() {
    return prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(data: { code: string; discountType: 'PERCENTAGE' | 'FIXED'; discountValue: number; minimumSpend?: number; usageLimit?: number; validUntil?: string }) {
    const code = data.code.trim().toUpperCase();
    if (data.discountValue <= 0 || (data.discountType === 'PERCENTAGE' && data.discountValue > 100)) {
      throw new AppError('Enter a valid discount value', 400);
    }
    return prisma.coupon.create({
      data: {
        code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minimumSpend: Math.max(0, data.minimumSpend || 0),
        usageLimit: data.usageLimit && data.usageLimit > 0 ? data.usageLimit : null,
        validUntil: data.validUntil ? new Date(data.validUntil) : null,
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
