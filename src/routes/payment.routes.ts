import { Router, Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/payment.service';
import { requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { sendSuccess } from '../utils/response';
import { CreateRazorpayOrderSchema, VerifyRazorpayPaymentSchema } from '@formerbench/shared';

const router = Router();

router.use(requireAuth);

router.post('/create-order', validateBody(CreateRazorpayOrderSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await paymentService.createRazorpayOrder(req.body.orderId);
    return sendSuccess(res, result, 'Razorpay order created');
  } catch (error) {
    next(error);
  }
});

router.post('/verify', validateBody(VerifyRazorpayPaymentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await paymentService.verifyRazorpayPayment(req.body);
    return sendSuccess(res, result, 'Payment verified successfully');
  } catch (error) {
    next(error);
  }
});

export default router;
