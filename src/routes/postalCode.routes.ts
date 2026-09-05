import { Router } from 'express';
import { lookupPostalCode } from '../controllers/postalCode.controller';
const router = Router();
router.get('/:postalCode', lookupPostalCode);
export default router;
