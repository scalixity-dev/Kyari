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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;