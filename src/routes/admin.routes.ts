import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';
import { validateBody, validateQuery } from '../middlewares/validate.middleware';
import { CustomerQuerySchema, TestSmtpSchema } from '@formerbench/shared';
import { couponService } from '../services/coupon.service';
import { sendSuccess } from '../utils/response';

const router = Router();

router.use(requireAuth, requireAdmin);

// Dashboard & Analytics
router.get('/analytics', adminController.getDashboardAnalytics);
router.patch('/inventory/:productId', adminController.updateInventoryStock);

// Customer Management
router.get('/customers', validateQuery(CustomerQuerySchema), adminController.getCustomers);
router.post('/customers', adminController.createCustomer);
router.patch('/customers/:id', adminController.updateCustomer);

router.get('/coupons', async (_req, res, next) => {
  try { return sendSuccess(res, await couponService.list()); } catch (error) { next(error); }
});
router.post('/coupons', async (req, res, next) => {
  try { return sendSuccess(res, await couponService.create(req.body), 'Coupon created', 201); } catch (error) { next(error); }
});
router.delete('/coupons/:id', async (req, res, next) => {
  try { await couponService.remove(req.params.id); return sendSuccess(res, null, 'Coupon removed'); } catch (error) { next(error); }
});

// System & Diagnostics
router.post('/test-smtp', validateBody(TestSmtpSchema), adminController.testSmtp);

export default router;
