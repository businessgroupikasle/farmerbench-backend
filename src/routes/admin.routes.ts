import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';
import { validateBody, validateQuery } from '../middlewares/validate.middleware';
import { CustomerQuerySchema, TestSmtpSchema } from '@formerbench/shared';
import { couponService } from '../services/coupon.service';
import { sendSuccess } from '../utils/response';
import { storeSettingsService } from '../services/storeSettings.service';
import {
  AdminCreateCustomerSchema,
  AdminUpdateCustomerSchema,
  CreateCouponSchema,
  InventoryUpdateSchema,
  StoreSettingsSchema,
  UpdateCouponSchema,
} from '../validators/admin.schemas';

const router = Router();

router.use(requireAuth, requireAdmin);

// Dashboard & Analytics
router.get('/analytics', adminController.getDashboardAnalytics);
router.patch('/inventory/:productId', validateBody(InventoryUpdateSchema), adminController.updateInventoryStock);

// Customer Management
router.get('/customers', validateQuery(CustomerQuerySchema), adminController.getCustomers);
router.post('/customers', validateBody(AdminCreateCustomerSchema), adminController.createCustomer);
router.patch('/customers/:id', validateBody(AdminUpdateCustomerSchema), adminController.updateCustomer);

router.get('/coupons', async (_req, res, next) => {
  try { return sendSuccess(res, await couponService.list()); } catch (error) { next(error); }
});
router.post('/coupons', validateBody(CreateCouponSchema), async (req, res, next) => {
  try { return sendSuccess(res, await couponService.create(req.body), 'Coupon created', 201); } catch (error) { next(error); }
});
router.patch('/coupons/:id', validateBody(UpdateCouponSchema), async (req, res, next) => {
  try { return sendSuccess(res, await couponService.update(req.params.id, req.body), 'Coupon updated'); } catch (error) { next(error); }
});
router.delete('/coupons/:id', async (req, res, next) => {
  try { await couponService.remove(req.params.id); return sendSuccess(res, null, 'Coupon removed'); } catch (error) { next(error); }
});

router.put('/store-settings', validateBody(StoreSettingsSchema), async (req, res, next) => {
  try { return sendSuccess(res, await storeSettingsService.update(req.body), 'Store settings updated'); } catch (error) { next(error); }
});

// System & Diagnostics
router.post('/test-smtp', validateBody(TestSmtpSchema), adminController.testSmtp);

export default router;
