import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/analytics', adminController.getDashboardAnalytics);
router.patch('/inventory/:productId', adminController.updateInventoryStock);

export default router;
