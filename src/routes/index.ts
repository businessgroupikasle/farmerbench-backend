import { Router } from 'express';
import authRoutes from './auth.routes';
import productRoutes from './product.routes';
import categoryRoutes from './category.routes';
import subcategoryRoutes from './subcategory.routes';
import cartRoutes from './cart.routes';
import orderRoutes from './order.routes';
import adminRoutes from './admin.routes';
import uploadRoutes from './upload.routes';
import paymentRoutes from './payment.routes';
import serviceBookingRoutes from './serviceBooking.routes';
import reviewRoutes from './review.routes';
import couponRoutes from './coupon.routes';
import marketPriceRoutes from './marketPrice.routes';
import heroBannerRoutes from './heroBanner.routes';
import postalCodeRoutes from './postalCode.routes';
import chatRoutes from './chat.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/reviews', reviewRoutes);
router.use('/categories', categoryRoutes);
router.use('/subcategories', subcategoryRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/admin', adminRoutes);
router.use('/upload', uploadRoutes);
router.use('/payments', paymentRoutes);
router.use('/service-bookings', serviceBookingRoutes);
router.use('/coupons', couponRoutes);
router.use('/market-prices', marketPriceRoutes);
router.use('/hero-banners', heroBannerRoutes);
router.use('/postal-codes', postalCodeRoutes);
router.use('/chat', chatRoutes);

export default router;
