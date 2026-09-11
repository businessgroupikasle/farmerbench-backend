import { Router } from 'express';
import { expertController } from '../controllers/expert.controller';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware';

const router = Router();
router.use(requireAuth, requireAdmin);
router.get('/', expertController.list);
router.post('/', expertController.create);
export default router;