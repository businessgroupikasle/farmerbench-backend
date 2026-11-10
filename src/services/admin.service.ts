import { adminRepository } from '../repositories/admin.repository';
import { productRepository } from '../repositories/product.repository';
import { userRepository } from '../repositories/user.repository';
import { emailService } from './email.service';
import { emitCustomerCreated } from '../socket';
import { AppError } from '../utils/response';
import { CustomerQueryInput } from '@formerbench/shared';

export class AdminService {
  async getDashboardAnalytics() {
    return adminRepository.getDashboardStats();
  }

  async updateInventoryStock(productId: string, stock: number) {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (stock < 0) {
      throw new AppError('Stock quantity cannot be negative', 400);
    }

    return productRepository.update(productId, { stock });
  }

  async getCustomers(params: CustomerQueryInput) {
    return userRepository.findCustomers(params);
  }

  async createCustomer(data: {
    name: string;
    email: string;
    phone?: string | null;
    location?: string | null;
    crops?: string | null;
    status?: string;
  }) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new AppError('A customer with this email address already exists', 400);
    }

    const customer = await userRepository.create({
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      location: data.location || 'Tamil Nadu',
      crops: data.crops || 'General Crops',
      status: data.status || 'Active',
      emailVerified: true,
      role: 'CUSTOMER',
    });

    emitCustomerCreated(customer);

    return customer;
  }

  async updateCustomer(id: string, data: {
    name?: string;
    phone?: string | null;
    location?: string | null;
    crops?: string | null;
    status?: string;
  }) {
    const customer = await userRepository.findById(id);
    // This endpoint manages customers only; administrator accounts cannot be modified through it.
    if (!customer || customer.role !== 'CUSTOMER') {
      throw new AppError('Customer not found', 404);
    }

    // Explicit allow-list: role, password, email and verification status are never updatable here.
    const { name, phone, location, crops, status } = data;
    return userRepository.update(id, { name, phone, location, crops, status });
  }

  async testSmtp(recipientEmail: string) {
    return emailService.sendTestSmtpEmail(recipientEmail);
  }
}

export const adminService = new AdminService();
