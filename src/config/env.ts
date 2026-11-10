import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  // Safe default: an unset NODE_ENV behaves as production (no debug output, generic errors).
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
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

  // Business-abuse limits (0 = unlimited)
  // How many times one customer may redeem the same coupon (default unlimited = previous behaviour).
  COUPON_MAX_USES_PER_USER: z.coerce.number().int().nonnegative().default(0),
  // Maximum simultaneously open (pending/processing) Cash-on-Delivery orders per customer.
  MAX_OPEN_COD_ORDERS: z.coerce.number().int().nonnegative().default(10),
  // Daily cap on paid AI chatbot calls; beyond it the built-in rule-based replies are used.
  AI_DAILY_REQUEST_LIMIT: z.coerce.number().int().nonnegative().default(2000),

  // Reverse-proxy trust for client IP resolution (Express "trust proxy").
  // Default trusts only proxies on loopback/private networks (Nginx on the same host,
  // Docker bridge, VPC load balancers), so an X-Forwarded-For header sent directly by
  // an internet client is ignored. Accepts "false", "true", a hop count, or a
  // comma-separated list of addresses/subnets/presets.
  TRUST_PROXY: z.string().default('loopback, linklocal, uniquelocal'),

  // Development-only: print OTP codes and simulated email contents to the console.
  // Has no effect unless NODE_ENV=development. Never enable in production.
  LOG_OTP_TO_CONSOLE: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
});

const parseTrustProxy = (value: string): boolean | number | string[] => {
  const normalized = value.trim().toLowerCase();
  if (normalized === '' || normalized === 'false') return false;
  if (normalized === 'true') return true;
  if (/^\d+$/.test(normalized)) return Number(normalized);
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

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
    trustProxy: parseTrustProxy(result.data.TRUST_PROXY),
    logOtpToConsole: result.data.NODE_ENV === 'development' && result.data.LOG_OTP_TO_CONSOLE,
  };
};

export const env = parseEnv();
