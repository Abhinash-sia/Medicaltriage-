import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';
import { logger } from '../lib/logger.js';

// Load .env file from root directory if available
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

const envSchema = z.object({
  // Foundation required runtime environment variables
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/medical_triage'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  JWT_SECRET: z.string().default('dev_jwt_secret_change_in_production_min_32_chars'),

  // Future AI & External Service Integration Credentials (Optional in Phase 1)
  GEMINI_API_KEY: z.string().optional(),
  SARVAM_API_KEY: z.string().optional(),
  GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    logger.error({ err: result.error.format() }, 'Invalid environment configuration');
    throw new Error('Invalid environment configuration');
  }

  return result.data;
};

export const env = parseEnv();
