const fs = require('fs');
const path = require('path');

const targetFile = path.resolve(__dirname, '../../farmer_frontend/src/services/auth.service.ts');

const content = `import { apiClient } from './api';
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  ChangePasswordInput,
  User,
  AuthResponse,
  ApiResponse,
  ForgotPasswordInput,
  VerifyResetOtpInput,
  ResetPasswordInput,
  ResendResetOtpInput,
  OtpResponse,
  VerifyResetOtpResponse,
} from '@formerbench/shared';

export const authService = {
  async register(data: RegisterInput): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post('/auth/register', data);
  },

  async login(data: LoginInput): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post('/auth/login', data);
  },

  async getMe(): Promise<ApiResponse<User>> {
    return apiClient.get('/auth/me');
  },

  async updateProfile(data: UpdateProfileInput): Promise<ApiResponse<User>> {
    return apiClient.put('/auth/profile', data);
  },

  async changePassword(data: ChangePasswordInput): Promise<ApiResponse<{ message: string }>> {
    return apiClient.put('/auth/change-password', data);
  },

  async refreshToken(): Promise<ApiResponse<AuthResponse>> {
    return apiClient.post('/auth/refresh-token');
  },

  // Password Reset Flow
  async forgotPassword(data: ForgotPasswordInput): Promise<ApiResponse<OtpResponse>> {
    return apiClient.post('/auth/forgot-password', data);
  },

  async verifyResetOtp(data: VerifyResetOtpInput): Promise<ApiResponse<VerifyResetOtpResponse>> {
    return apiClient.post('/auth/verify-reset-otp', data);
  },

  async resendResetOtp(data: ResendResetOtpInput): Promise<ApiResponse<OtpResponse>> {
    return apiClient.post('/auth/resend-reset-otp', data);
  },

  async resetPassword(data: ResetPasswordInput): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post('/auth/reset-password', data);
  },
};
`;

fs.writeFileSync(targetFile, content, 'utf8');
console.log('✅ Updated frontend auth.service.ts');
