import { Request, Response, NextFunction } from 'express';
import { serviceBookingService } from '../services/serviceBooking.service';
import { sendSuccess } from '../utils/response';
import { saveBookingAttachments, removeBookingAttachments, BookingAttachment } from '../services/bookingAttachments.service';

export class ServiceBookingController {
  async createBooking(req: Request, res: Response, next: NextFunction) {
    let attachments: BookingAttachment[] = [];
    try {
      const userId = req.user?.userId;
      attachments = await saveBookingAttachments((req.files as Express.Multer.File[]) || []);
      const booking = await serviceBookingService.createBooking(req.body, userId, attachments.map(file => ({ ...file })));
      return sendSuccess(res, booking, 'Service request submitted successfully', 201);
    } catch (error) {
      await removeBookingAttachments(attachments);
      next(error);
    }
  }

  async getMyBookings(req: Request, res: Response, next: NextFunction) {
    try {
      const bookings = await serviceBookingService.getMyBookings(req.user!.userId);
      return sendSuccess(res, bookings);
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
