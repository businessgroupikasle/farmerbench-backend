import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { contactController } from '../controllers/contact.controller';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware';
import { contactRateLimiter } from '../middlewares/rateLimit.middleware';
import { validateBody } from '../middlewares/validate.middleware';

const router = Router();
const clean = (value: string) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/<[^>]*>/g, '').trim();
const createContactSchema = z.object({
  name: z.string().transform(clean).pipe(z.string().min(2).max(100)),
  email: z.string().trim().max(255).email().transform((value) => value.toLowerCase()),
  phone: z.string().trim().min(7).max(20).regex(/^\+?[0-9][0-9\s()-]{5,18}[0-9]$/).transform((value) => value.replace(/[\s()-]/g, '')),
  subject: z.string().transform(clean).pipe(z.string().min(2).max(200)),
  message: z.string().transform(clean).pipe(z.string().min(5).max(5000)),
});
const payloadLimit = (req: Request, res: Response, next: NextFunction) => {
  if (Number(req.headers['content-length'] || 0) > 20 * 1024) return res.status(413).json({ success: false, message: 'Contact request payload is too large' });
  return next();
};

router.post('/', payloadLimit, contactRateLimiter, validateBody(createContactSchema), contactController.submitContact);
router.get('/dashboard/stats', requireAuth, requireAdmin, contactController.getDashboardStats);
router.get('/', requireAuth, requireAdmin, contactController.getAllContacts);
router.get('/:id', requireAuth, requireAdmin, contactController.getContactById);
router.put('/:id/mark-read', requireAuth, requireAdmin, contactController.markAsRead);
router.delete('/:id', requireAuth, requireAdmin, contactController.deleteContact);
export default router;
