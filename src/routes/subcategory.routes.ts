import { Router } from 'express';
import { CreateSubcategorySchema, UpdateSubcategorySchema } from '@formerbench/shared';
import { subcategoryController } from '../controllers/subcategory.controller';
import { requireAdmin, requireAuth } from '../middlewares/auth.middleware';
import { validateBody } from '../middlewares/validate.middleware';

const router = Router();
router.get('/', subcategoryController.getSubcategories);
router.get('/:slugOrId', subcategoryController.getSubcategory);
router.post('/', requireAuth, requireAdmin, validateBody(CreateSubcategorySchema), subcategoryController.createSubcategory);
router.put('/:id', requireAuth, requireAdmin, validateBody(UpdateSubcategorySchema), subcategoryController.updateSubcategory);
router.delete('/:id', requireAuth, requireAdmin, subcategoryController.deleteSubcategory);
export default router;
