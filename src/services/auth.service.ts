import { userRepository } from '../repositories/user.repository';
import { LoginInput, UpdateProfileInput, ChangePasswordInput } from '@formerbench/shared';
import { hashPassword, comparePassword } from '../utils/password';
import { issueSessionToken, MAX_SESSION_AGE_SECONDS, TokenPayload, signRegistrationToken } from '../utils/jwt';
import { AppError } from '../utils/response';
import { loginLockout } from '../utils/loginLockout';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../config/env';

export class AuthService {
  private readonly googleClient = new OAuth2Client();

  private ensureAccountIsActive(user: { status?: string | null }) {
    if (user.status === 'Deactivated') {
      throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }
  }

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
    if (!existingUser) {
      return {
        requiresRegistration: true as const,
        registrationToken: signRegistrationToken(email),
        email,
        name: payload.name?.trim() || '',
      };
    }
    let passwordHash = existingUser?.password || '';
    if (existingUser) {
      this.ensureAccountIsActive(existingUser);

      // Pre-hijack protection: an account whose email was never verified may have
      // been created by someone else with this address. Google has now proven
      // ownership, so discard any password set before verification (this also ends
      // any sessions issued for it). The owner can set a new one via "Forgot password".
      if (!existingUser.emailVerified && existingUser.password) {
        await userRepository.updatePassword(existingUser.id, '');
        passwordHash = '';
      }
    }
    const user = await userRepository.update(existingUser.id, {
      emailVerified: true,
      avatarUrl: existingUser.avatarUrl || payload.picture || null,
    });

    const token = issueSessionToken(user, passwordHash);
    return { user, token };
  }

  async login(input: LoginInput) {
    const email = input.email.toLowerCase().trim();
    loginLockout.assertNotLocked(email);

    const user = await userRepository.findByEmail(email);
    if (!user) {
      loginLockout.recordFailure(email);
      throw new AppError('No account found with this email. Create an account to continue.', 401);
    }

    const isMatch = await comparePassword(input.password, user.password);
    if (!isMatch) {
      loginLockout.recordFailure(email);
      throw new AppError('Invalid email or password', 401);
    }

    // Account status is only revealed to someone who knows the password.
    this.ensureAccountIsActive(user);

    loginLockout.reset(email);

    const token = issueSessionToken(user, user.password);

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
    this.ensureAccountIsActive(user);
    return user;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await userRepository.update(userId, input);
    return user;
  }

  /**
   * Changing the password ends every other session (their tokens are bound to the old
   * password). A fresh token is returned so the current device stays signed in.
   */
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

    const profile = await userRepository.findById(userId);
    const token = issueSessionToken(user, newHash);

    return { message: 'Password updated successfully', token, user: profile };
  }

  async refreshToken(session: TokenPayload) {
    const authState = await userRepository.findAuthStateById(session.userId);
    const user = await userRepository.findById(session.userId);
    if (!user || !authState) {
      throw new AppError('User not found', 404);
    }

    this.ensureAccountIsActive(user);

    // Refreshing keeps the original sign-in time, so a session cannot be extended forever.
    const originalAuthAt = session.oat ?? session.iat ?? Math.floor(Date.now() / 1000);
    if (Math.floor(Date.now() / 1000) - originalAuthAt > MAX_SESSION_AGE_SECONDS) {
      throw new AppError('Your session has expired. Please sign in again.', 401);
    }

    const token = issueSessionToken(user, authState.password, originalAuthAt);

    return { user, token };
  }
}

export const authService = new AuthService();
