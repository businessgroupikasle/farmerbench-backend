import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { createRateLimiter, getClientIp } from '../middlewares/rateLimit.middleware';

const router = Router();

// Rate limiting: 25 chat requests per minute per IP
const chatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 25,
  message: 'You have sent too many messages in a short time.',
  keyGenerator: (req) => getClientIp(req),
});

router.post('/', chatRateLimiter, (req, res) => chatController.sendMessage(req, res));

export default router;
