import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { requireAuth } from '../middlewares/auth.middleware';
import {
  RegisterSchema,
  LoginSchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
  RegisterOtpSchema,
  VerifyRegisterOtpSchema,
  ResendOtpSchema,
  LoginOtpSchema,
  VerifyLoginOtpSchema,
} from '@formerbench/shared';

const router = Router();

// Standard Password Auth
router.post('/register', validateBody(RegisterSchema), authController.register);
router.post('/login', validateBody(LoginSchema), authController.login);

// OTP-Driven Auth
router.post('/register-otp', validateBody(RegisterOtpSchema), authController.registerOtp);
router.post('/verify-register-otp', validateBody(VerifyRegisterOtpSchema), authController.verifyRegisterOtp);
router.post('/resend-register-otp', validateBody(ResendOtpSchema), authController.resendOtp);
router.post('/login-otp', validateBody(LoginOtpSchema), authController.loginOtp);
router.post('/verify-login-otp', validateBody(VerifyLoginOtpSchema), authController.verifyLoginOtp);

// User Profile & Session
router.get('/me', requireAuth, authController.me);
router.put('/profile', requireAuth, validateBody(UpdateProfileSchema), authController.updateProfile);
router.put('/change-password', requireAuth, validateBody(ChangePasswordSchema), authController.changePassword);
router.post('/refresh-token', requireAuth, authController.refreshToken);

export default router;
