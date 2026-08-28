import { Request, Response, NextFunction } from 'express';
import { adminService } from '../services/admin.service';
import { sendSuccess } from '../utils/response';

export class AdminController {
  async getDashboardAnalytics(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await adminService.getDashboardAnalytics();
      return sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  async updateInventoryStock(req: Request, res: Response, next: NextFunction) {
    try {
      const stock = parseInt(req.body.stock, 10);
      const product = await adminService.updateInventoryStock(req.params.productId, stock);
      return sendSuccess(res, product, 'Inventory stock updated');
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
