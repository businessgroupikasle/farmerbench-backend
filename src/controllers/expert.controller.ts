import { NextFunction, Request, Response } from 'express';
import { expertService } from '../services/expert.service';
import { sendSuccess } from '../utils/response';

export const expertController = {
  async list(_req: Request, res: Response, next: NextFunction) {
    try { return sendSuccess(res, await expertService.list()); } catch (error) { next(error); }
  },
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const name = String(req.body.name || '').trim();
      const specialization = String(req.body.specialization || '').trim();
      const territory = String(req.body.territory || '').trim();
      if (!name || !specialization || !territory) {
        res.status(400).json({ success: false, message: 'Name, specialization and territory are required' });
        return;
      }
      const expert = await expertService.create({
        name, specialization, territory,
        avatar: req.body.avatar ? String(req.body.avatar) : undefined,
        phone: req.body.phone ? String(req.body.phone).trim() : undefined,
      });
      return sendSuccess(res, expert, 'Agronomist registered successfully', 201);
    } catch (error) { next(error); }
  },
};