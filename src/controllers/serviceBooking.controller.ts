import { Request, Response, NextFunction } from 'express';
import { serviceBookingService } from '../services/serviceBooking.service';
import { sendSuccess } from '../utils/response';

export class ServiceBookingController {
  async createBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      const booking = await serviceBookingService.createBooking(req.body, userId);
      return sendSuccess(res, booking, 'Service request submitted successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getAllBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await serviceBookingService.getAllBookings(req.query as any);
      return sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getBookingStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await serviceBookingService.getBookingStats();
      return sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req: Request, res: Response, next: NextFunction) {
    try {
      const booking = await serviceBookingService.getBookingById(
        req.params.id,
        req.user?.role,
        req.user?.userId
      );
      return sendSuccess(res, booking);
    } catch (error) {
      next(error);
    }
  }

  async updateBookingStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await serviceBookingService.updateBookingStatus(req.params.id, req.body);
      return sendSuccess(res, updated, 'Booking status updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteBooking(req: Request, res: Response, next: NextFunction) {
    try {
      await serviceBookingService.deleteBooking(req.params.id);
      return sendSuccess(res, null, 'Service booking deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const serviceBookingController = new ServiceBookingController();
