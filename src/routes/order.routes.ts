import { Router } from 'express';
import { orderController } from '../controllers/order.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';
import { CreateOrderSchema, UpdateOrderStatusSchema } from '@formerbench/shared';

const router = Router();

router.post('/', requireAuth, validateBody(CreateOrderSchema), orderController.createOrder);
router.get('/my-orders', requireAuth, orderController.getMyOrders);
router.get('/:id', requireAuth, orderController.getOrder);

// Customer Order Actions
router.post('/:id/cancel', requireAuth, orderController.cancelOrder);
router.post('/:id/exchange', requireAuth, orderController.requestExchange);

// Admin-only order routes
router.get('/', requireAuth, requireAdmin, orderController.getAllOrders);
router.put('/:id/status', requireAuth, requireAdmin, validateBody(UpdateOrderStatusSchema), orderController.updateOrderStatus);
router.post('/:id/refund', requireAuth, requireAdmin, orderController.processRefund);

export default router;
