import { Router } from 'express';
import { lookupPostalCode } from '../controllers/postalCode.controller';
import { postalCodeRateLimiter } from '../middlewares/rateLimit.middleware';
const router = Router();
router.get('/:postalCode', postalCodeRateLimiter, lookupPostalCode);
export default router;
