import { Router } from 'express';
import { categoryController } from '../controllers/category.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';
import { CreateCategorySchema, UpdateCategorySchema } from '@formerbench/shared';

const router = Router();

// Public routes
router.get('/', categoryController.getCategories);
router.get('/:slugOrId', categoryController.getCategory);

// Admin routes
router.post('/', requireAuth, requireAdmin, validateBody(CreateCategorySchema), categoryController.createCategory);
router.put('/:id', requireAuth, requireAdmin, validateBody(UpdateCategorySchema), categoryController.updateCategory);
router.delete('/:id', requireAuth, requireAdmin, categoryController.deleteCategory);

export default router;
