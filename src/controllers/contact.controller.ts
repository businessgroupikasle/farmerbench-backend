import { Request, Response, NextFunction } from 'express';
import { contactService } from '../services/contact.service';
import { sendSuccess, sendError } from '../utils/response';

export class ContactController {
  async submitContact(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, phone, subject, message } = req.body;

      if (!name || !email || !phone || !subject || !message) {
        return sendError(res, 'All fields are required', 400);
      }

      const contact = await contactService.submitContact({
        name,
        email,
        phone,
        subject,
        message,
      });

      return sendSuccess(res, contact, 'Message submitted successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getAllContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await contactService.getAllContacts(page, limit);
      return sendSuccess(res, result, 'Contacts retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getContactById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const contact = await contactService.getContactById(id);
      return sendSuccess(res, contact, 'Contact retrieved successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async markAsRead(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const contact = await contactService.markAsRead(id);
      return sendSuccess(res, contact, 'Contact marked as read', 200);
    } catch (error) {
      next(error);
    }
  }

  async deleteContact(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await contactService.deleteContact(id);
      return sendSuccess(res, null, 'Contact deleted successfully', 200);
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await contactService.getDashboardStats();
      return sendSuccess(res, stats, 'Dashboard stats retrieved', 200);
    } catch (error) {
      next(error);
    }
  }
}

export const contactController = new ContactController();

