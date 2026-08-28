import { userRepository } from '../repositories/user.repository';
import { RegisterInput, LoginInput, UpdateProfileInput, ChangePasswordInput } from '@formerbench/shared';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { AppError } from '../utils/response';

export class AuthService {
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
