import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().positive().default(5000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long for production security'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000'),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),

  // Google SMTP Email Settings
  GOOGLE_SMTP_EMAIL: z.string().email().optional().default(''),
  GOOGLE_SMTP_APP_PASSWORD: z.string().optional().default(''),
  GOOGLE_SMTP_HOST: z.string().default('smtp.gmail.com'),
  GOOGLE_SMTP_PORT: z.coerce.number().default(587),
  ORDER_NOTIFICATION_ADMIN_EMAIL: z.string().email().optional().or(z.literal('')).default(''),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),

  // OTP Configuration
  OTP_EXPIRY_MINUTES: z.coerce.number().positive().default(5),
  OTP_COOLDOWN_SECONDS: z.coerce.number().nonnegative().default(60),
  OTP_MAX_ATTEMPTS: z.coerce.number().positive().default(5),

  // Razorpay Payment Gateway
  RAZORPAY_KEY_ID: z.string().optional().default('rzp_test_demo_key'),
  RAZORPAY_KEY_SECRET: z.string().optional().default('rzp_test_demo_secret'),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional().default(''),

  // Daily Market Price API
  MARKET_PRICE_API_KEY: z.string().optional().default(''),

  // Postal Code API (server-side only)
  POSTAL_CODE_API_KEY: z.string().optional().default(''),
  POSTAL_CODE_API_RESOURCE_ID: z.string().default('04cbe4b1-2f2b-4c39-a1d5-1c2e28bc0e32'),

  // Upload Configuration
  UPLOAD_DIR: z.string().default('uploads'),

  // AI Chatbot Configuration
  AI_PROVIDER: z.enum(['gemini', 'openai', 'groq', 'mock']).default('gemini'),
  AI_API_KEY: z.string().optional().default(''),
  AI_MODEL: z.string().default('gemini-1.5-flash'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ FATAL: Invalid or missing backend environment variables:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  // Parse CORS_ORIGIN into string array for cors middleware
  const corsOrigins = result.data.CORS_ORIGIN.split(',').map((o) => o.trim());

  return {
    ...result.data,
    corsOrigins,
  };
};

export const env = parseEnv();
