import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';
import { validateBody, validateQuery } from '../middlewares/validate.middleware';
import { CustomerQuerySchema, TestSmtpSchema } from '@formerbench/shared';

const router = Router();

router.use(requireAuth, requireAdmin);

// Dashboard & Analytics
router.get('/analytics', adminController.getDashboardAnalytics);
router.patch('/inventory/:productId', adminController.updateInventoryStock);

// Customer Management
router.get('/customers', validateQuery(CustomerQuerySchema), adminController.getCustomers);
router.post('/customers', adminController.createCustomer);
router.patch('/customers/:id', adminController.updateCustomer);

// System & Diagnostics
router.post('/test-smtp', validateBody(TestSmtpSchema), adminController.testSmtp);

export default router;
