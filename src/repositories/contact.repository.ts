import { prisma } from '../config/database';

interface CreateContactInput {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

export class ContactRepository {
  async create(data: CreateContactInput) {
    return prisma.contact.create({
      data,
    });
  }

  async findAll(skip = 0, take = 20) {
    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contact.count(),
    ]);

    return {
      contacts,
      total,
      page: Math.floor(skip / take) + 1,
      limit: take,
      totalPages: Math.ceil(total / take) || 1,
    };
  }

  async findById(id: string) {
    return prisma.contact.findUnique({
      where: { id },
    });
  }

  async updateStatus(id: string, isRead: boolean) {
    return prisma.contact.update({
      where: { id },
      data: { isRead },
    });
  }

  async delete(id: string) {
    return prisma.contact.delete({
      where: { id },
    });
  }

  async getUnreadCount() {
    return prisma.contact.count({
      where: { isRead: false },
    });
  }
}

export const contactRepository = new ContactRepository();
