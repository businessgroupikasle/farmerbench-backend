import { Router } from 'express';
import { expertController } from '../controllers/expert.controller';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';
import { CreateExpertSchema } from '../validators/admin.schemas';

const router = Router();
router.use(requireAuth, requireAdmin);
router.get('/', expertController.list);
router.post('/', validateBody(CreateExpertSchema), expertController.create);
export default router;
