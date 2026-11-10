import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validateBody } from '../middlewares/validate.middleware';
import { requireAuth } from '../middlewares/auth.middleware';
import {
  authRateLimiter,
  authIpRateLimiter,
  emailSendRateLimiter,
  otpVerifyRateLimiter,
} from '../middlewares/rateLimit.middleware';
import {
  LoginSchema,
  UpdateProfileSchema,
  ChangePasswordSchema,
  RegisterOtpSchema,
  VerifyRegisterOtpSchema,
  CompleteRegistrationSchema,
  ResendOtpSchema,
  LoginOtpSchema,
  VerifyLoginOtpSchema,
  ForgotPasswordSchema,
  VerifyResetOtpSchema,
  ResetPasswordSchema,
  ResendResetOtpSchema,
} from '@formerbench/shared';

const router = Router();

// Legacy direct registration (no email verification) has been retired: it allowed
// account pre-hijacking. All sign-ups go through the email-OTP flow below.
router.post('/register', (_req, res) => {
  res.status(410).json({
    success: false,
    code: 'REGISTRATION_FLOW_CHANGED',
    message: 'Direct registration is no longer available. Please sign up with email verification.',
  });
});

// Standard Password Auth
router.post('/login', authIpRateLimiter, authRateLimiter, validateBody(LoginSchema), authController.login);
router.post('/google', authIpRateLimiter, authRateLimiter, authController.googleLogin);

// OTP-Driven Auth
router.post('/register-otp', emailSendRateLimiter, authRateLimiter, validateBody(RegisterOtpSchema), authController.registerOtp);
router.post('/verify-register-otp', authIpRateLimiter, otpVerifyRateLimiter, validateBody(VerifyRegisterOtpSchema), authController.verifyRegisterOtp);
router.post('/complete-registration', authIpRateLimiter, authRateLimiter, validateBody(CompleteRegistrationSchema), authController.completeRegistration);
router.post('/resend-register-otp', emailSendRateLimiter, authRateLimiter, validateBody(ResendOtpSchema), authController.resendOtp);
router.post('/login-otp', emailSendRateLimiter, authRateLimiter, validateBody(LoginOtpSchema), authController.loginOtp);
router.post('/verify-login-otp', authIpRateLimiter, otpVerifyRateLimiter, validateBody(VerifyLoginOtpSchema), authController.verifyLoginOtp);

// User Profile & Session
router.get('/me', requireAuth, authController.me);
router.put('/profile', requireAuth, validateBody(UpdateProfileSchema), authController.updateProfile);
router.put('/change-password', requireAuth, authRateLimiter, validateBody(ChangePasswordSchema), authController.changePassword);
router.post('/refresh-token', requireAuth, authController.refreshToken);

// Forgot Password & Reset via Email OTP
router.post('/forgot-password', emailSendRateLimiter, authRateLimiter, validateBody(ForgotPasswordSchema), authController.forgotPassword);
router.post('/resend-reset-otp', emailSendRateLimiter, authRateLimiter, validateBody(ResendResetOtpSchema), authController.resendResetOtp);
router.post('/verify-reset-otp', authIpRateLimiter, otpVerifyRateLimiter, validateBody(VerifyResetOtpSchema), authController.verifyResetOtp);
router.post('/reset-password', authIpRateLimiter, authRateLimiter, validateBody(ResetPasswordSchema), authController.resetPassword);

// Legacy / Direct Aliases
router.post('/forgot-password-otp', emailSendRateLimiter, authRateLimiter, authController.forgotPasswordOtp);
router.post('/verify-reset-password-otp', authIpRateLimiter, authRateLimiter, authController.verifyResetPasswordOtp);

export default router;
