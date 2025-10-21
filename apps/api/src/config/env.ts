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
  
  // Optional - Monitoring
  SENTRY_DSN: z.string().url().optional(),
  
  // Optional - SMS
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(), 
  TWILIO_PHONE_NUMBER: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
      console.error('❌ Environment validation failed:\n' + missingVars);

      const nodeEnv = process.env.NODE_ENV ?? 'development';
      if (nodeEnv === 'production') {
        process.exit(1);
      }

      throw new Error(`Environment validation failed:\n${missingVars}`);
    }
    throw error;
  }
}

// Singleton instance - skip strict validation in test mode
let _env: Env | null = null;

export const env = (() => {
  if (_env) return _env;
  
  // In test mode, provide relaxed defaults
  if (process.env.NODE_ENV === 'test') {
    _env = {
      DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'test-secret-min-32-chars-long-12345',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      CORS_ORIGINS: ['http://localhost:3000'],
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || 'sk_test_fake',
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_fake',
      RESEND_API_KEY: process.env.RESEND_API_KEY || 'test_fake',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'test-key-for-testing',
      OPENAI_MODEL: 'gpt-4',
      NODE_ENV: 'test' as const,
      PORT: 3001,
      SENTRY_DSN: undefined,
      TWILIO_ACCOUNT_SID: undefined,
      TWILIO_AUTH_TOKEN: undefined,
      TWILIO_PHONE_NUMBER: undefined,
    };
    return _env;
  }
  
  _env = validateEnv();
  return _env;
})();

// Getter function for compatibility
export const getEnv = () => env;
