import { Router } from 'express';
import { chatController } from '../controllers/chat.controller';
import { createRateLimiter } from '../middlewares/rateLimit.middleware';

const router = Router();

// Rate limiting: 25 chat requests per minute per IP
const chatRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 25,
  message: 'You have sent too many messages in a short time.',
  keyGenerator: (req) => {
    return (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      req.ip ||
      'anonymous'
    );
  },
});

router.post('/', chatRateLimiter, (req, res) => chatController.sendMessage(req, res));

export default router;
