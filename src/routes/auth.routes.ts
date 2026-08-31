import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { requireAuth } from '../middlewares/auth.middleware';
import { authRateLimiter, otpVerifyRateLimiter } from '../middlewares/rateLimit.middleware';
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
  ForgotPasswordSchema,
  VerifyResetOtpSchema,
  ResetPasswordSchema,
  ResendResetOtpSchema,
} from '@formerbench/shared';

const router = Router();

// Standard Password Auth
router.post('/register', validateBody(RegisterSchema), authController.register);
router.post('/login', authRateLimiter, validateBody(LoginSchema), authController.login);

// OTP-Driven Auth
router.post('/register-otp', validateBody(RegisterOtpSchema), authController.registerOtp);
router.post('/verify-register-otp', validateBody(VerifyRegisterOtpSchema), authController.verifyRegisterOtp);
router.post('/resend-register-otp', validateBody(ResendOtpSchema), authController.resendOtp);
router.post('/login-otp', authRateLimiter, validateBody(LoginOtpSchema), authController.loginOtp);
router.post('/verify-login-otp', otpVerifyRateLimiter, validateBody(VerifyLoginOtpSchema), authController.verifyLoginOtp);

// User Profile & Session
router.get('/me', requireAuth, authController.me);
router.put('/profile', requireAuth, validateBody(UpdateProfileSchema), authController.updateProfile);
router.put('/change-password', requireAuth, validateBody(ChangePasswordSchema), authController.changePassword);
router.post('/refresh-token', requireAuth, authController.refreshToken);

// Forgot Password & Reset via Email OTP
router.post('/forgot-password', authRateLimiter, validateBody(ForgotPasswordSchema), authController.forgotPassword);
router.post('/resend-reset-otp', authRateLimiter, validateBody(ResendResetOtpSchema), authController.resendResetOtp);
router.post('/verify-reset-otp', otpVerifyRateLimiter, validateBody(VerifyResetOtpSchema), authController.verifyResetOtp);
router.post('/reset-password', authRateLimiter, validateBody(ResetPasswordSchema), authController.resetPassword);

// Legacy / Direct Aliases
router.post('/forgot-password-otp', authRateLimiter, authController.forgotPasswordOtp);
router.post('/verify-reset-password-otp', authRateLimiter, authController.verifyResetPasswordOtp);

export default router;

