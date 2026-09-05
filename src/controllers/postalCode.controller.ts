import { Request, Response, NextFunction } from 'express';
import { postalCodeService } from '../services/postalCode.service';
import { sendSuccess } from '../utils/response';

export const lookupPostalCode = async (req: Request, res: Response, next: NextFunction) => {
  try { return sendSuccess(res, await postalCodeService.lookup(req.params.postalCode)); }
  catch (error) { next(error); }
};
