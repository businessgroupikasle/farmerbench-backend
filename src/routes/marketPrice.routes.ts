import { Router } from 'express';
import { marketPriceController } from '../controllers/marketPrice.controller';

const router = Router();

router.get('/', marketPriceController.getLatestPrices.bind(marketPriceController));

export default router;
