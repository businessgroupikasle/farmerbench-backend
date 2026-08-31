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

  async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.getCustomers(req.query as any);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await adminService.createCustomer(req.body);
      return sendSuccess(res, customer, 'Customer created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await adminService.updateCustomer(req.params.id, req.body);
      return sendSuccess(res, customer, 'Customer updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async testSmtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { recipientEmail } = req.body;
      const result = await adminService.testSmtp(recipientEmail);
      return sendSuccess(res, result, `Test email sent to ${recipientEmail}`);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
