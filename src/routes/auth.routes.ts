import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { requireAuth } from '../middlewares/auth.middleware';
import { RegisterSchema, LoginSchema, UpdateProfileSchema, ChangePasswordSchema } from '@formerbench/shared';

const router = Router();

router.post('/register', validateBody(RegisterSchema), authController.register);
router.post('/login', validateBody(LoginSchema), authController.login);
router.get('/me', requireAuth, authController.me);
router.put('/profile', requireAuth, validateBody(UpdateProfileSchema), authController.updateProfile);
router.put('/change-password', requireAuth, validateBody(ChangePasswordSchema), authController.changePassword);
router.post('/refresh-token', requireAuth, authController.refreshToken);

export default router;
