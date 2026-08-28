import { adminRepository } from '../repositories/admin.repository';
import { productRepository } from '../repositories/product.repository';
import { AppError } from '../utils/response';

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
}

export const adminService = new AdminService();
