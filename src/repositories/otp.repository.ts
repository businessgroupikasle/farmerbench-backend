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
