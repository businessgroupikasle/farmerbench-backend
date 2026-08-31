import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { otpService } from '../services/otp.service';
import { sendSuccess } from '../utils/response';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.register(req.body);
      return sendSuccess(res, result, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      return sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async registerOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await otpService.sendRegistrationOtp(req.body);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async verifyRegisterOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp, name, phone, location, crops, password } = req.body;
      const result = await otpService.verifyRegistrationOtp(email, otp, {
        name,
        phone,
        location,
        crops,
        password,
      });
      return sendSuccess(res, result, 'Account verified and registration complete!', 201);
    } catch (error) {
      next(error);
    }
  }

  async resendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, purpose } = req.body;
      let result;
      if (purpose === 'LOGIN') {
        result = await otpService.sendLoginOtp(email);
      } else {
        result = await otpService.sendRegistrationOtp({
          email,
          name: email.split('@')[0],
        });
      }
      return sendSuccess(res, result, 'Verification code resent successfully');
    } catch (error) {
      next(error);
    }
  }

  async loginOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await otpService.sendLoginOtp(email);
      return sendSuccess(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  async verifyLoginOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp } = req.body;
      const result = await otpService.verifyLoginOtp(email, otp);
      return sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.user!.userId);
      return sendSuccess(res, user);
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await authService.updateProfile(req.user!.userId, req.body);
      return sendSuccess(res, updated, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.changePassword(req.user!.userId, req.body);
      return sendSuccess(res, result, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.refreshToken(req.user!.userId);
      return sendSuccess(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
