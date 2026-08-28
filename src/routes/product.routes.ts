import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { validateBody, validateQuery } from '../middlewares/validate.middleware';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';
import {
  ProductQuerySchema,
  CreateProductSchema,
  UpdateProductSchema,
  CreateReviewSchema,
} from '@formerbench/shared';

const router = Router();

// Public routes
router.get('/', validateQuery(ProductQuerySchema), productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/:idOrSlug', productController.getProduct);

// Protected routes (Reviews)
router.post('/reviews', requireAuth, validateBody(CreateReviewSchema), productController.addReview);

// Admin-only routes
router.post('/', requireAuth, requireAdmin, validateBody(CreateProductSchema), productController.createProduct);
router.put('/:id', requireAuth, requireAdmin, validateBody(UpdateProductSchema), productController.updateProduct);
router.delete('/:id', requireAuth, requireAdmin, productController.deleteProduct);

export default router;
