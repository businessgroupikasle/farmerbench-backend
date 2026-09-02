import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// Public: Get reviews for a specific product
router.get('/product/:productId', productController.getProductReviews);

// Protected: Update or Delete user's own review (or admin)
router.put('/:reviewId', requireAuth, productController.updateReview);
router.delete('/:reviewId', requireAuth, productController.deleteReview);

// Admin: Get all reviews across catalog
router.get('/', requireAuth, requireAdmin, productController.getAllReviews);

export default router;
