import crypto from 'crypto';
import { env } from '../config/env';
import { otpRepository } from '../repositories/otp.repository';
import { userRepository } from '../repositories/user.repository';
import { emailService } from './email.service';
import { emitCustomerCreated } from '../socket';
import { generateToken } from '../utils/jwt';
import { hashPassword } from '../utils/password';
import { AppError } from '../utils/response';
import { RegisterOtpInput, OtpPurpose } from '@formerbench/shared';

export class OtpService {
  private hashOtp(otp: string): string {
    return crypto
      .createHash('sha256')
      .update(`${otp}:${env.JWT_SECRET}`)
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

    // Hash password if provided
    let passwordHash = '';
    if (input.password) {
      passwordHash = await hashPassword(input.password);
    }

    // Save OTP record with registration metadata
    await otpRepository.create({
      identifier: email,
      otpHash,
      purpose: 'REGISTRATION',
      expiresAt,
      metadata: {
        name: input.name,
        phone: input.phone || null,
        location: input.location || null,
        crops: input.crops || null,
        passwordHash,
      },
    });

    console.log(`\n======================================================`);
    console.log(`🔐 [REGISTRATION OTP GENERATED] for ${email}`);
    console.log(`👉 OTP CODE: ${rawOtp}`);
    console.log(`⏰ Expires at: ${expiresAt.toLocaleTimeString()}`);
    console.log(`======================================================\n`);

    // Dispatch email asynchronously
    emailService.sendRegistrationOtpEmail(email, rawOtp, input.name).catch((err) => {
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

  async verifyRegistrationOtp(
    email: string,
    otp: string,
    extraData?: {
      name?: string;
      phone?: string | null;
      location?: string | null;
      crops?: string | null;
      password?: string;
    }
  ) {
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

    // Extract metadata
    const meta = (activeOtp.metadata as any) || {};
    const effectiveName = extraData?.name || meta.name || cleanEmail.split('@')[0];
    const effectivePhone = extraData?.phone ?? meta.phone ?? null;
    const effectiveLocation = extraData?.location ?? meta.location ?? 'Tamil Nadu';
    const effectiveCrops = extraData?.crops ?? meta.crops ?? 'Paddy / General Crops';

    let finalPasswordHash = meta.passwordHash || '';
    if (extraData?.password && extraData.password.length >= 6) {
      finalPasswordHash = await hashPassword(extraData.password);
    }

    // Check if user already exists (unverified) or create new user
    const existingUser = await userRepository.findByEmail(cleanEmail);
    let finalUser;

    if (existingUser) {
      finalUser = await userRepository.update(existingUser.id, {
        name: effectiveName,
        phone: effectivePhone,
        location: effectiveLocation,
        crops: effectiveCrops,
        emailVerified: true,
        status: 'Active',
      });
      if (finalPasswordHash) {
        await userRepository.updatePassword(existingUser.id, finalPasswordHash);
      }
    } else {
      finalUser = await userRepository.create({
        email: cleanEmail,
        name: effectiveName,
        password: finalPasswordHash,
        phone: effectivePhone,
        location: effectiveLocation,
        crops: effectiveCrops,
        emailVerified: true,
        status: 'Active',
        role: 'CUSTOMER',
      });
    }

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
}

export const otpService = new OtpService();
