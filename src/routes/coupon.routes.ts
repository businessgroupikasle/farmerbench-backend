import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { couponService } from '../services/coupon.service';
import { sendSuccess } from '../utils/response';

const router = Router();
router.use(requireAuth);

router.post('/validate', async (req, res, next) => {
  try {
    const subtotal = Number(req.body.subtotal);
    if (typeof req.body.code !== 'string' || !Number.isFinite(subtotal) || subtotal < 0) return res.status(400).json({ success: false, message: 'Valid code and subtotal are required' });
    const { coupon, discountAmount } = await couponService.calculate(req.body.code, subtotal);
    return sendSuccess(res, { code: coupon.code, discountType: coupon.discountType, discountValue: coupon.discountValue, discountAmount });
  } catch (error) { next(error); }
});

export default router;
