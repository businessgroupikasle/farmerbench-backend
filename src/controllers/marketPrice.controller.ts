import { Request, Response, NextFunction } from 'express';
import { marketPriceService } from '../services/marketPrice.service';
import { sendSuccess } from '../utils/response';

export class MarketPriceController {
  async getLatestPrices(req: Request, res: Response, next: NextFunction) {
    try {
      const requestedLimit = Number(req.query.limit);
      const limit = Number.isInteger(requestedLimit)
        ? Math.min(Math.max(requestedLimit, 1), 20)
        : 6;
      const prices = await marketPriceService.getLatestPrices(limit);
      return sendSuccess(res, prices);
    } catch (error) {
      next(error);
    }
  }
}

export const marketPriceController = new MarketPriceController();
