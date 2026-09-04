import { Router } from 'express';
import { CreateHeroBannerSchema, ReorderHeroBannersSchema, UpdateHeroBannerSchema } from '@formerbench/shared';
import { heroBannerController } from '../controllers/heroBanner.controller';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';

const router = Router();
router.get('/', heroBannerController.listPublic);
router.get('/admin', requireAuth, requireAdmin, heroBannerController.listAdmin);
router.put('/reorder', requireAuth, requireAdmin, validateBody(ReorderHeroBannersSchema), heroBannerController.reorder);
router.get('/:id', heroBannerController.get);
router.post('/', requireAuth, requireAdmin, validateBody(CreateHeroBannerSchema), heroBannerController.create);
router.put('/:id', requireAuth, requireAdmin, validateBody(UpdateHeroBannerSchema), heroBannerController.update);
router.delete('/:id', requireAuth, requireAdmin, heroBannerController.remove);
export default router;
