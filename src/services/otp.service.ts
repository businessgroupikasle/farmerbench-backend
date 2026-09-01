import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { otpRepository } from '../repositories/otp.repository';
import { userRepository } from '../repositories/user.repository';
import { passwordResetTokenRepository } from '../repositories/passwordResetToken.repository';
import { emailService } from './email.service';
import { emitCustomerCreated } from '../socket';
import { generateToken } from '../utils/jwt';
import { hashPassword } from '../utils/password';
import { AppError } from '../utils/response';
import { CompleteRegistrationInput, RegisterOtpInput, OtpPurpose } from '@formerbench/shared';

export class OtpService {
  private hashOtp(otp: string): string {
    return crypto
      .createHash('sha256')
      .update(`${otp}:${env.JWT_SECRET}`)
      .digest('hex');
  }

  private hashResetToken(token: string): string {
    return crypto
      .createHash('sha256')
      .update(`${token}:${env.JWT_SECRET}`)
      .digest('hex');
  }

  private generateNumericOtp(length: number = 6): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return crypto.randomInt(min, max + 1).toString();
  }

  async sendRegistrationOtp(input: RegisterOtpInput) {
    const email = input.email.toLowerCase().trim();

    // Check if verified account already exists
    const existing = await userRepository.findByEmail(email);
    if (existing && existing.emailVerified) {
      throw new AppError('An account with this email address is already verified. Please sign in.', 400);
    }

    // Cooldown check
    const latestOtp = await otpRepository.findLatest(email, 'REGISTRATION');
    if (latestOtp) {
      const elapsedSeconds = (Date.now() - new Date(latestOtp.createdAt).getTime()) / 1000;
      if (elapsedSeconds < env.OTP_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(env.OTP_COOLDOWN_SECONDS - elapsedSeconds);
        throw new AppError(`Please wait ${remaining} seconds before requesting a new OTP code.`, 429);
      }
    }

    // Invalidate prior pending OTPs
    await otpRepository.invalidatePending(email, 'REGISTRATION');

    // Generate and hash OTP
    const rawOtp = this.generateNumericOtp(6);
    const otpHash = this.hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store only display metadata. Account details are accepted after OTP verification.
    await otpRepository.create({
      identifier: email,
      otpHash,
      purpose: 'REGISTRATION',
      expiresAt,
      metadata: {
        name: input.name,
      },
    });

    console.log(`\n======================================================`);
    console.log(`🔐 [REGISTRATION OTP GENERATED] for ${email}`);
    console.log(`👉 OTP CODE: ${rawOtp}`);
    console.log(`⏰ Expires at: ${expiresAt.toLocaleTimeString()}`);
    console.log(`======================================================\n`);

    // Dispatch email asynchronously
    emailService.sendRegistrationOtpEmail(email, rawOtp, input.name || email.split('@')[0]).catch((err) => {
      console.error('Failed to send registration OTP email:', err);
    });

    return {
      success: true,
      message: `A 6-digit verification code has been sent to ${email}`,
      email,
      expiresInSeconds: env.OTP_EXPIRY_MINUTES * 60,
      cooldownSeconds: env.OTP_COOLDOWN_SECONDS,
    };
  }

  async verifyRegistrationOtp(email: string, otp: string) {
    const cleanEmail = email.toLowerCase().trim();
    const cleanOtp = otp.trim();

    const activeOtp = await otpRepository.findLatestActive(cleanEmail, 'REGISTRATION');
    if (!activeOtp) {
      throw new AppError('Invalid or expired verification code. Please request a new OTP.', 400);
    }

    if (activeOtp.attempts >= env.OTP_MAX_ATTEMPTS) {
      await otpRepository.markConsumed(activeOtp.id);
      throw new AppError('Too many failed verification attempts. Please request a new OTP.', 400);
    }

    const computedHash = this.hashOtp(cleanOtp);
    if (computedHash !== activeOtp.otpHash) {
      await otpRepository.incrementAttempts(activeOtp.id);
      const remainingAttempts = env.OTP_MAX_ATTEMPTS - (activeOtp.attempts + 1);
      throw new AppError(`Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`, 400);
    }

    // Mark OTP consumed
    await otpRepository.markConsumed(activeOtp.id);

    const registrationToken = jwt.sign(
      { email: cleanEmail, purpose: 'REGISTRATION_COMPLETION' },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    return {
      email: cleanEmail,
      emailVerified: true,
      registrationToken,
      expiresInSeconds: 15 * 60,
    };
  }

  async completeRegistration(input: CompleteRegistrationInput) {
    let tokenPayload: jwt.JwtPayload;
    try {
      tokenPayload = jwt.verify(input.registrationToken, env.JWT_SECRET) as jwt.JwtPayload;
    } catch {
      throw new AppError('Registration session has expired. Please verify your email again.', 400);
    }

    if (tokenPayload.purpose !== 'REGISTRATION_COMPLETION' || typeof tokenPayload.email !== 'string') {
      throw new AppError('Invalid registration session. Please verify your email again.', 400);
    }

    const email = tokenPayload.email.toLowerCase().trim();
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('An account with this email already exists. Please sign in.', 400);
    }

    const passwordHash = await hashPassword(input.password);
    const finalUser = await userRepository.create({
      email,
      name: input.name.trim(),
      password: passwordHash,
      phone: input.phone.trim(),
      location: input.location.trim(),
      crops: input.crops?.trim() || null,
      emailVerified: true,
      status: 'Active',
      role: 'CUSTOMER',
    });

    // Emit real-time Socket.IO event for admin dashboard
    emitCustomerCreated({
      id: finalUser.id,
      name: finalUser.name,
      email: finalUser.email,
      phone: finalUser.phone,
      location: finalUser.location,
      crops: finalUser.crops,
      status: finalUser.status,
      createdAt: finalUser.createdAt,
    });

    // Send welcome email in background
    emailService.sendWelcomeEmail(finalUser.email, finalUser.name).catch((err) => {
      console.error('Failed to send welcome email:', err);
    });

    // Generate JWT Auth token
    const token = generateToken({
      userId: finalUser.id,
      email: finalUser.email,
      role: finalUser.role,
    });

    return {
      user: {
        id: finalUser.id,
        email: finalUser.email,
        name: finalUser.name,
        role: finalUser.role,
        phone: finalUser.phone,
        emailVerified: finalUser.emailVerified,
        location: finalUser.location,
        crops: finalUser.crops,
        status: finalUser.status,
        avatarUrl: finalUser.avatarUrl,
        createdAt: finalUser.createdAt,
        updatedAt: finalUser.updatedAt,
      },
      token,
    };
  }

  async sendLoginOtp(emailInput: string) {
    const email = emailInput.toLowerCase().trim();

    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new AppError('No account found with this email address. Please register first.', 404);
    }

    // Cooldown check
    const latestOtp = await otpRepository.findLatest(email, 'LOGIN');
    if (latestOtp) {
      const elapsedSeconds = (Date.now() - new Date(latestOtp.createdAt).getTime()) / 1000;
      if (elapsedSeconds < env.OTP_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(env.OTP_COOLDOWN_SECONDS - elapsedSeconds);
        throw new AppError(`Please wait ${remaining} seconds before requesting a new login code.`, 429);
      }
    }

    // Invalidate pending
    await otpRepository.invalidatePending(email, 'LOGIN');

    const rawOtp = this.generateNumericOtp(6);
    const otpHash = this.hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    await otpRepository.create({
      identifier: email,
      otpHash,
      purpose: 'LOGIN',
      expiresAt,
      metadata: { userId: user.id, name: user.name },
    });

    console.log(`\n======================================================`);
    console.log(`🔐 [LOGIN OTP GENERATED] for ${email}`);
    console.log(`👉 OTP CODE: ${rawOtp}`);
    console.log(`⏰ Expires at: ${expiresAt.toLocaleTimeString()}`);
    console.log(`======================================================\n`);

    emailService.sendLoginOtpEmail(email, rawOtp, user.name).catch((err) => {
      console.error('Failed to send login OTP email:', err);
    });

    return {
      success: true,
      message: `A login verification code has been sent to ${email}`,
      email,
      expiresInSeconds: env.OTP_EXPIRY_MINUTES * 60,
      cooldownSeconds: env.OTP_COOLDOWN_SECONDS,
    };
  }

  async verifyLoginOtp(emailInput: string, otp: string) {
    const cleanEmail = emailInput.toLowerCase().trim();
    const cleanOtp = otp.trim();

    const activeOtp = await otpRepository.findLatestActive(cleanEmail, 'LOGIN');
    if (!activeOtp) {
      throw new AppError('Invalid or expired login code. Please request a new OTP.', 400);
    }

    if (activeOtp.attempts >= env.OTP_MAX_ATTEMPTS) {
      await otpRepository.markConsumed(activeOtp.id);
      throw new AppError('Too many failed verification attempts. Please request a new login code.', 400);
    }

    const computedHash = this.hashOtp(cleanOtp);
    if (computedHash !== activeOtp.otpHash) {
      await otpRepository.incrementAttempts(activeOtp.id);
      const remainingAttempts = env.OTP_MAX_ATTEMPTS - (activeOtp.attempts + 1);
      throw new AppError(`Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`, 400);
    }

    await otpRepository.markConsumed(activeOtp.id);

    const user = await userRepository.findByEmail(cleanEmail);
    if (!user) {
      throw new AppError('User account not found', 404);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        emailVerified: user.emailVerified,
        location: user.location,
        crops: user.crops,
        status: user.status,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    };
  }

  async sendPasswordResetOtp(emailInput: string) {
    const cleanEmail = emailInput.toLowerCase().trim();

    const genericResponse = {
      success: true,
      message: 'If an account exists for this email, a verification code has been sent.',
      email: cleanEmail,
      expiresInSeconds: env.OTP_EXPIRY_MINUTES * 60,
      cooldownSeconds: env.OTP_COOLDOWN_SECONDS,
    };

    const user = await userRepository.findByEmail(cleanEmail);
    if (!user) {
      if (env.NODE_ENV !== 'production') {
        throw new AppError(
          'No completed account exists for this email. Please finish sign up before resetting the password.',
          404
        );
      }
      // Preserve account-existence privacy in production.
      return genericResponse;
    }

    // Cooldown check
    const latestOtp = await otpRepository.findLatest(cleanEmail, 'PASSWORD_RESET');
    if (latestOtp) {
      const elapsedSeconds = (Date.now() - new Date(latestOtp.createdAt).getTime()) / 1000;
      if (elapsedSeconds < env.OTP_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(env.OTP_COOLDOWN_SECONDS - elapsedSeconds);
        throw new AppError(`Please wait ${remaining} seconds before requesting a new password reset code.`, 429);
      }
    }

    // Invalidate any pending password reset OTPs
    await otpRepository.invalidatePending(cleanEmail, 'PASSWORD_RESET');

    const rawOtp = this.generateNumericOtp(6);
    const otpHash = this.hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    await otpRepository.create({
      identifier: cleanEmail,
      otpHash,
      purpose: 'PASSWORD_RESET',
      expiresAt,
      metadata: { userId: user.id, name: user.name },
    });

    // Await delivery so the API never reports success when SMTP actually failed.
    await emailService.sendPasswordResetOtpEmail(cleanEmail, rawOtp, user.name);

    return env.NODE_ENV === 'production'
      ? genericResponse
      : { ...genericResponse, message: `Password reset code sent successfully to ${cleanEmail}.` };
  }

  async resendPasswordResetOtp(emailInput: string) {
    const cleanEmail = emailInput.toLowerCase().trim();

    const genericResponse = {
      success: true,
      message: 'If an account exists for this email, a verification code has been sent.',
      email: cleanEmail,
      expiresInSeconds: env.OTP_EXPIRY_MINUTES * 60,
      cooldownSeconds: env.OTP_COOLDOWN_SECONDS,
    };

    const user = await userRepository.findByEmail(cleanEmail);
    if (!user) {
      if (env.NODE_ENV !== 'production') {
        throw new AppError(
          'No completed account exists for this email. Please finish sign up before requesting another code.',
          404
        );
      }
      return genericResponse;
    }

    const latestOtp = await otpRepository.findLatest(cleanEmail, 'PASSWORD_RESET');
    if (latestOtp) {
      const elapsedSeconds = (Date.now() - new Date(latestOtp.createdAt).getTime()) / 1000;
      if (elapsedSeconds < env.OTP_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(env.OTP_COOLDOWN_SECONDS - elapsedSeconds);
        throw new AppError(`Please wait ${remaining} seconds before requesting a new password reset code.`, 429);
      }
    }

    await otpRepository.invalidatePending(cleanEmail, 'PASSWORD_RESET');

    const rawOtp = this.generateNumericOtp(6);
    const otpHash = this.hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

    await otpRepository.create({
      identifier: cleanEmail,
      otpHash,
      purpose: 'PASSWORD_RESET',
      expiresAt,
      metadata: { userId: user.id, name: user.name },
    });

    await emailService.sendPasswordResetOtpEmail(cleanEmail, rawOtp, user.name);

    return env.NODE_ENV === 'production'
      ? genericResponse
      : { ...genericResponse, message: `A new password reset code was sent successfully to ${cleanEmail}.` };
  }

  async verifyResetOtp(emailInput: string, otpInput: string) {
    const cleanEmail = emailInput.toLowerCase().trim();
    const cleanOtp = otpInput.trim();

    const activeOtp = await otpRepository.findLatestActive(cleanEmail, 'PASSWORD_RESET');
    if (!activeOtp) {
      throw new AppError('This verification code has expired. Please request a new code.', 400, {
        code: 'OTP_EXPIRED',
      });
    }

    if (activeOtp.attempts >= env.OTP_MAX_ATTEMPTS) {
      await otpRepository.markConsumed(activeOtp.id);
      throw new AppError('Too many incorrect attempts. Please request a new code.', 400, {
        code: 'OTP_MAX_ATTEMPTS',
      });
    }

    const computedHash = this.hashOtp(cleanOtp);
    if (computedHash !== activeOtp.otpHash) {
      await otpRepository.incrementAttempts(activeOtp.id);
      const currentAttempts = activeOtp.attempts + 1;
      if (currentAttempts >= env.OTP_MAX_ATTEMPTS) {
        await otpRepository.markConsumed(activeOtp.id);
        throw new AppError('Too many incorrect attempts. Please request a new code.', 400, {
          code: 'OTP_MAX_ATTEMPTS',
        });
      }
      const remaining = env.OTP_MAX_ATTEMPTS - currentAttempts;
      throw new AppError(`Incorrect verification code. ${remaining} attempt(s) remaining.`, 400, {
        code: 'OTP_INVALID',
        remainingAttempts: remaining,
      });
    }

    // Mark OTP consumed
    await otpRepository.markConsumed(activeOtp.id);

    const user = await userRepository.findByEmail(cleanEmail);
    if (!user) {
      throw new AppError('User account not found', 404);
    }

    // Invalidate any previous active reset tokens for this user
    await passwordResetTokenRepository.invalidateAllForUser(user.id);

    // Generate single-use, cryptographically secure reset authorization
    const rawResetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashResetToken(rawResetToken);
    const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes validity

    // Store token hash in dedicated PasswordResetToken table
    await passwordResetTokenRepository.create({
      userId: user.id,
      tokenHash,
      expiresAt: tokenExpiresAt,
    });

    return {
      success: true,
      message: 'Verification code verified successfully. You may now reset your password.',
      resetToken: rawResetToken,
      email: cleanEmail,
    };
  }

  async resetPasswordWithToken(resetTokenInput: string, newPasswordInput: string) {
    const rawToken = resetTokenInput.trim();
    const cleanPassword = newPasswordInput;

    if (!cleanPassword || cleanPassword.length < 6) {
      throw new AppError('Password must be at least 6 characters long.', 400);
    }

    const tokenHash = this.hashResetToken(rawToken);
    const tokenRecord = await passwordResetTokenRepository.findActiveByTokenHash(tokenHash);

    if (!tokenRecord || !tokenRecord.user) {
      throw new AppError('Invalid, expired, or already used reset authorization. Please start over.', 400, {
        code: 'RESET_TOKEN_INVALID',
      });
    }

    // Hash new password using bcrypt
    const newHash = await hashPassword(cleanPassword);
    await userRepository.updatePassword(tokenRecord.userId, newHash);

    // Invalidate reset token immediately (single-use enforcement)
    await passwordResetTokenRepository.markUsed(tokenRecord.id);
    await passwordResetTokenRepository.invalidateAllForUser(tokenRecord.userId);

    // Invalidate any pending password reset OTPs
    await otpRepository.invalidatePending(tokenRecord.user.email, 'PASSWORD_RESET');

    // Dispatch security confirmation email
    emailService.sendPasswordChangedNotificationEmail(tokenRecord.user.email, tokenRecord.user.name).catch((err) => {
      console.error('Failed to send password changed notification email:', err);
    });

    return {
      success: true,
      message: 'Password reset successfully. Please login with your new password.',
    };
  }

  // Backwards-compatible alias for existing direct test endpoint
  async verifyAndResetPassword(emailInput: string, otp: string, newPassword: string) {
    const verified = await this.verifyResetOtp(emailInput, otp);
    return this.resetPasswordWithToken(verified.resetToken, newPassword);
  }
}

export const otpService = new OtpService();
