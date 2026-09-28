import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from root or backend directory
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config(); // fallback to current working directory .env

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  HOST: z.string().default(process.env.NODE_ENV === 'production' ? '0.0.0.0' : (process.env.HOST || '0.0.0.0')),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  CORS_ORIGINS: z.string().optional(),
  DATABASE_URL: z.string().default('file:./data/marketplace.sqlite'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters for security').default('development_only_secret_change_me_in_production_min_32_chars_long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  INITIAL_ADMIN_EMAIL: z.string().email().default('admin@nagpurmaterials.local'),
  INITIAL_ADMIN_PASSWORD: z.string().min(8).default('AdminSecurePass123!'),
  INITIAL_ADMIN_NAME: z.string().default('Operations Admin'),
  BUSINESS_NAME: z.string().default('Nagpur Building Materials'),
  BUSINESS_SERVICE_AREA: z.string().default('Nagpur and nearby serviceable areas'),
  BUSINESS_PHONE: z.string().default('+917120000000'),
  BUSINESS_WHATSAPP: z.string().default('+919876543210'),
  BUSINESS_SUPPORT_EMAIL: z.string().email().default('support@nagpurmaterials.local'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('debug'),
  RATE_LIMIT_WINDOW_MS: z.string().transform((val) => parseInt(val, 10)).default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform((val) => parseInt(val, 10)).default('100'),
  AUTH_RATE_LIMIT_MAX: z.string().transform((val) => parseInt(val, 10)).default('10'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const config = {
  env: parsed.data.NODE_ENV,
  isProduction: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
  isDevelopment: parsed.data.NODE_ENV === 'development',
  port: parsed.data.PORT,
  host: parsed.data.HOST,
  clientUrl: parsed.data.CLIENT_URL,
  corsOrigins: parsed.data.CORS_ORIGINS
    ? parsed.data.CORS_ORIGINS.split(',').map((s) => s.trim())
    : [parsed.data.CLIENT_URL, 'http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5173', 'http://127.0.0.1:5173'],
  databaseUrl: parsed.data.DATABASE_URL,
  jwt: {
    secret: parsed.data.JWT_SECRET,
    expiresIn: parsed.data.JWT_EXPIRES_IN,
  },
  initialAdmin: {
    email: parsed.data.INITIAL_ADMIN_EMAIL,
    password: parsed.data.INITIAL_ADMIN_PASSWORD,
    name: parsed.data.INITIAL_ADMIN_NAME,
  },
  business: {
    name: parsed.data.BUSINESS_NAME,
    serviceArea: parsed.data.BUSINESS_SERVICE_AREA,
    phone: parsed.data.BUSINESS_PHONE,
    whatsapp: parsed.data.BUSINESS_WHATSAPP,
    supportEmail: parsed.data.BUSINESS_SUPPORT_EMAIL,
  },
  logging: {
    level: parsed.data.LOG_LEVEL,
  },
  rateLimit: {
    windowMs: parsed.data.RATE_LIMIT_WINDOW_MS,
    maxRequests: parsed.data.RATE_LIMIT_MAX_REQUESTS,
    authMax: parsed.data.AUTH_RATE_LIMIT_MAX,
  },
};
