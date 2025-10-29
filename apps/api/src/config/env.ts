import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  
  // Authentication  
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  
  // CORS
  CORS_ORIGINS: z.string().min(1, 'CORS_ORIGINS must be provided').transform((val) => 
    val.split(',').map(origin => origin.trim()).filter(Boolean)
  ),
  
  // Infrastructure
  REDIS_URL: z.string().url().optional(),
  
  // Payment
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
  
  // External APIs
  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_MODEL: z.string().default('gpt-4'),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().positive().default(3001),
  
  // Beta Program
  BETA_ENABLED: z.coerce.boolean().default(false),
  
  // Optional - Monitoring
  SENTRY_DSN: z.string().url().optional(),
  
  // Optional - SMS
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(), 
  TWILIO_PHONE_NUMBER: z.string().optional(),
  
  // Social APIs (for trends service)
  TWITTER_BEARER_TOKEN: z.string().optional(),
  REDDIT_CLIENT_ID: z.string().optional(),
  REDDIT_CLIENT_SECRET: z.string().optional(),
  REDDIT_USER_AGENT: z.string().default('NeonHub/3.2'),
});

export type Env = z.infer<typeof envSchema>;

let hasWarnedNonProd = false;

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
      console.error('❌ Environment validation failed:\n' + missingVars);

      const nodeEnv = (process.env.NODE_ENV ?? 'development').toLowerCase();
      const isJestRuntime =
        Boolean(process.env.JEST_WORKER_ID) ||
        process.argv.some((arg) => arg.includes('jest'));

      if (nodeEnv !== 'production' || isJestRuntime) {
        if (!hasWarnedNonProd) {
          console.warn(
            '⚠️  Using relaxed environment defaults. Set required variables or run `npm run verify` before production deploys.'
          );
          hasWarnedNonProd = true;
        }
        return buildFallbackEnv(nodeEnv === 'test' || isJestRuntime ? 'test' : 'development');
      }

      throw new Error(`Environment validation failed:\n${missingVars}`);
    }
    throw error;
  }
}

// Singleton instance - skip strict validation in test mode
let _env: Env | null = null;

function parseOrigins(raw?: string | string[]): string[] {
  if (Array.isArray(raw)) {
    return raw;
  }
  if (!raw) {
    return ['http://localhost:3000'];
  }
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function buildFallbackEnv(target: 'test' | 'development'): Env {
  const defaults = {
    DATABASE_URL:
      process.env.DATABASE_URL ||
      (target === 'test'
        ? 'postgresql://test:test@localhost:5432/test'
        : 'postgresql://localhost:5432/neonhub'),
    NEXTAUTH_SECRET:
      process.env.NEXTAUTH_SECRET ||
      (target === 'test'
        ? 'test-secret-min-32-chars-long-12345'
        : 'dev-secret-min-32-chars-long-12345'),
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    CORS_ORIGINS: parseOrigins(process.env.CORS_ORIGINS),
    REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
    STRIPE_SECRET_KEY:
      process.env.STRIPE_SECRET_KEY ||
      (target === 'test' ? 'sk_test_fake' : 'sk_test_dev'),
    STRIPE_WEBHOOK_SECRET:
      process.env.STRIPE_WEBHOOK_SECRET ||
      (target === 'test' ? 'whsec_test_fake' : 'whsec_dev_fake'),
    RESEND_API_KEY: process.env.RESEND_API_KEY || 'test_fake',
    OPENAI_API_KEY:
      process.env.OPENAI_API_KEY ||
      (target === 'test'
        ? 'test-key-for-testing'
        : 'test-key-for-development'),
    OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4',
    NODE_ENV: target as 'test' | 'development' | 'production',
    PORT: Number(process.env.PORT ?? 3001),
    SENTRY_DSN: process.env.SENTRY_DSN,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_SID: process.env.TWILIO_SID || process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
  };

  return defaults;
}

export const env = (() => {
  if (_env) return _env;
  
  const nodeEnv = (process.env.NODE_ENV ?? 'development').toLowerCase();
  const isJestRuntime =
    Boolean(process.env.JEST_WORKER_ID) ||
    process.argv.some((arg) => arg.includes('jest'));
  const isTest = nodeEnv === 'test' || isJestRuntime;

  if (nodeEnv === 'production' && !isJestRuntime) {
    _env = validateEnv();
    return _env;
  }

  const parsed = envSchema.safeParse(process.env);
  if (parsed.success) {
    _env = {
      ...parsed.data,
      NODE_ENV: isTest ? 'test' : (parsed.data.NODE_ENV ?? 'development'),
      CORS_ORIGINS: parseOrigins(process.env.CORS_ORIGINS),
      PORT: Number(process.env.PORT ?? parsed.data.PORT ?? 3001),
    };
    return _env;
  }

  if (!hasWarnedNonProd) {
    console.warn(
      '⚠️  Using relaxed environment defaults. Set required variables or run `npm run verify` before production deploys.'
    );
    hasWarnedNonProd = true;
  }

  _env = buildFallbackEnv(isTest ? 'test' : 'development');
  return _env;
})();

// Getter function for compatibility
export const getEnv = () => env;
