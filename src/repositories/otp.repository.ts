import { prisma } from '../config/database';
import { OtpPurpose } from '@prisma/client';

export class OtpRepository {
  async create(data: {
    identifier: string;
    otpHash: string;
    purpose: OtpPurpose;
    expiresAt: Date;
    metadata?: any;
  }) {
    return prisma.otp.create({
      data: {
        identifier: data.identifier.toLowerCase(),
        otpHash: data.otpHash,
        purpose: data.purpose,
        expiresAt: data.expiresAt,
        metadata: data.metadata || undefined,
      },
    });
  }

  async findLatestActive(identifier: string, purpose: OtpPurpose) {
    return prisma.otp.findFirst({
      where: {
        identifier: identifier.toLowerCase(),
        purpose,
        consumedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findLatest(identifier: string, purpose: OtpPurpose) {
    return prisma.otp.findFirst({
      where: {
        identifier: identifier.toLowerCase(),
        purpose,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async incrementAttempts(id: string) {
    return prisma.otp.update({
      where: { id },
      data: {
        attempts: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Atomically reserves one verification attempt (UPDATE ... WHERE attempts < max).
   * Concurrent requests serialize on the row, so no more than maxAttempts can succeed.
   * Returns the attempt count after reserving, or null when no attempt is left.
   */
  async reserveAttempt(id: string, maxAttempts: number): Promise<number | null> {
    const reserved = await prisma.otp.updateMany({
      where: { id, consumedAt: null, attempts: { lt: maxAttempts } },
      data: { attempts: { increment: 1 } },
    });
    if (reserved.count === 0) return null;
    const row = await prisma.otp.findUnique({ where: { id }, select: { attempts: true } });
    return row?.attempts ?? maxAttempts;
  }

  /** Consumes the OTP only if still unconsumed; returns false if another request already used it. */
  async consumeIfActive(id: string): Promise<boolean> {
    const result = await prisma.otp.updateMany({
      where: { id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    return result.count === 1;
  }

  async markConsumed(id: string) {
    return prisma.otp.update({
      where: { id },
      data: {
        consumedAt: new Date(),
      },
    });
  }

  async invalidatePending(identifier: string, purpose: OtpPurpose) {
    return prisma.otp.updateMany({
      where: {
        identifier: identifier.toLowerCase(),
        purpose,
        consumedAt: null,
      },
      data: {
        consumedAt: new Date(),
      },
    });
  }
}

export const otpRepository = new OtpRepository();
