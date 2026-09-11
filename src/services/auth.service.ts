import { userRepository } from '../repositories/user.repository';
import { RegisterInput, LoginInput, UpdateProfileInput, ChangePasswordInput } from '@formerbench/shared';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AppError } from '../utils/response';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';

export class AuthService {
  private readonly googleClient = new OAuth2Client();

  async googleLogin(credential: string) {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new AppError('Google sign-in is not configured on the server', 503);
    }

    let payload;
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw new AppError('Invalid or expired Google sign-in credential', 401);
    }

    if (!payload?.sub || !payload.email || !payload.email_verified) {
      throw new AppError('A verified Google email address is required', 401);
    }

    const email = payload.email.toLowerCase();
    const existingUser = await userRepository.findByEmail(email);
    const user = existingUser
      ? await userRepository.update(existingUser.id, {
          emailVerified: true,
          avatarUrl: existingUser.avatarUrl || payload.picture || null,
        })
      : await userRepository.create({
          email,
          name: payload.name?.trim() || email.split('@')[0],
          emailVerified: true,
          avatarUrl: payload.picture || null,
        });

    const token = generateToken({ userId: user.id, email: user.email, role: user.role });
    return { user, token };
  }
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email.toLowerCase());
    if (existing) {
      throw new AppError('An account with this email already exists', 400);
    }

    const hashedPassword = await hashPassword(input.password);
    const user = await userRepository.create({
      ...input,
      email: input.email.toLowerCase(),
      password: hashedPassword,
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email.toLowerCase());
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await comparePassword(input.password, user.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const userProfile = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return { user: userProfile, token };
  }

  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await userRepository.update(userId, input);
    return user;
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await userRepository.findByEmail((await userRepository.findById(userId))?.email || '');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isMatch = await comparePassword(input.currentPassword, user.password);
    if (!isMatch) {
      throw new AppError('Current password is incorrect', 400);
    }

    const newHash = await hashPassword(input.newPassword);
    await userRepository.updatePassword(userId, newHash);

    return { message: 'Password updated successfully' };
  }

  async refreshToken(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, token };
  }
}

export const authService = new AuthService();
