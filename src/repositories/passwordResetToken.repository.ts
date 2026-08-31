import { prisma } from '../config/database';

export class PasswordResetTokenRepository {
  async create(data: {
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }) {
    return prisma.passwordResetToken.create({
      data: {
        userId: data.userId,
        tokenHash: data.tokenHash,
        expiresAt: data.expiresAt,
      },
    });
  }

  async findActiveByTokenHash(tokenHash: string) {
    return prisma.passwordResetToken.findFirst({
      where: {
        tokenHash,
        usedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });
  }

  async markUsed(id: string) {
    return prisma.passwordResetToken.update({
      where: { id },
      data: {
        usedAt: new Date(),
      },
    });
  }

  async invalidateAllForUser(userId: string) {
    return prisma.passwordResetToken.updateMany({
      where: {
        userId,
        usedAt: null,
      },
      data: {
        usedAt: new Date(),
      },
    });
  }
}

export const passwordResetTokenRepository = new PasswordResetTokenRepository();
