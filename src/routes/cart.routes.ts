import { Router } from 'express';
import { cartController } from '../controllers/cart.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { requireAuth } from '../middlewares/auth.middleware';
import { AddToCartSchema, UpdateCartItemSchema, SyncCartSchema } from '@formerbench/shared';

const router = Router();

// All cart routes require authentication
router.use(requireAuth);

router.get('/', cartController.getCart);
router.post('/items', validateBody(AddToCartSchema), cartController.addToCart);
router.put('/items/:itemId', validateBody(UpdateCartItemSchema), cartController.updateCartItem);
router.delete('/items/:itemId', cartController.removeCartItem);
router.delete('/', cartController.clearCart);
router.post('/sync', validateBody(SyncCartSchema), cartController.syncCart);

export default router;
