import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service';
import { sendSuccess } from '../utils/response';

export class OrderController {
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.createOrder(req.user!.userId, req.body);
      return sendSuccess(res, order, 'Order placed successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await orderService.getUserOrders(req.user!.userId);
      return sendSuccess(res, orders);
    } catch (error) {
      next(error);
    }
  }

  async getOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.getOrderById(
        req.params.id,
        req.user!.userId,
        req.user!.role
      );
      return sendSuccess(res, order);
    } catch (error) {
      next(error);
    }
  }

  async getAllOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await orderService.getAllOrders(req.query as any);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const order = await orderService.updateOrderStatus(req.params.id, req.body);
      return sendSuccess(res, order, 'Order status updated');
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await orderService.cancelOrder(req.params.id, req.user!.userId, req.body?.reason);
      return sendSuccess(res, result.order, result.message);
    } catch (error) {
      next(error);
    }
  }

  async requestExchange(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await orderService.requestExchange(req.params.id, req.user!.userId, req.body);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async processRefund(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await orderService.processRefund(req.params.id);
      return sendSuccess(res, result.order, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();
