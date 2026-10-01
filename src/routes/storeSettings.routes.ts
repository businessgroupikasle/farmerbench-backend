import { Router } from 'express';
import { storeSettingsService } from '../services/storeSettings.service';
import { sendSuccess } from '../utils/response';

const router = Router();

router.get('/', async (_req, res, next) => {
  try { return sendSuccess(res, await storeSettingsService.get()); } catch (error) { next(error); }
});

export default router;