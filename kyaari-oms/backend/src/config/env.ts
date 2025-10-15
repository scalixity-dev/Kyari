import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.string().transform(Number).default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL: z.string().default('7d'),
  
  INIT_ADMIN_NAME: z.string().min(1),
  INIT_ADMIN_PASSWORD: z.string().min(1),
  INIT_ADMIN_EMAIL: z.string().email().optional(),
  
  CORS_ORIGINS: z.string().transform((val: string) => val.split(',')).default('http://localhost:3000'),
  
  // Email (SMTP)
  SMTP_USER: z.string().email().optional(),
  SMTP_PASS: z.string().optional(),
  FRONTEND_URL: z.string().url().optional().default('http://localhost:5173'),
  
  // Firebase Configuration
  FIREBASE_SERVICE_ACCOUNT_KEY_PATH: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  NOTIFICATION_ENABLED: z.string().transform((val) => val === 'true').default('true'),
  NOTIFICATION_BATCH_SIZE: z.string().transform(Number).default('500'),
  NOTIFICATION_RETRY_ATTEMPTS: z.string().transform(Number).default('3'),
  NOTIFICATION_TOKEN_EXPIRY_DAYS: z.string().transform(Number).default('30'),
  
  // Redis Configuration
  REDIS_HOST: z.string().optional().default('localhost'),
  REDIS_PORT: z.string().optional().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().optional().default('0'),
  REDIS_ENABLED: z.string().transform((val) => val === 'true').default('false'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;