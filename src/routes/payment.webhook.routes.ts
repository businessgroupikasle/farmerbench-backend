import { Router, Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!Buffer.isBuffer(req.body)) return res.status(400).json({ success: false, message: 'Raw webhook body required' });
    const signature = req.header('x-razorpay-signature') || '';
    const result = await paymentService.handleWebhook(req.body, signature);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
