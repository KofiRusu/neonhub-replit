"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = exports.env = void 0;
exports.validateEnv = validateEnv;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    // Database
    DATABASE_URL: zod_1.z.string().url('DATABASE_URL must be a valid URL'),
    // Authentication  
    NEXTAUTH_SECRET: zod_1.z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
    NEXTAUTH_URL: zod_1.z.string().url('NEXTAUTH_URL must be a valid URL'),
    // CORS
    CORS_ORIGINS: zod_1.z.string().min(1, 'CORS_ORIGINS must be provided').transform((val) => val.split(',').map(origin => origin.trim()).filter(Boolean)),
    // Payment
    STRIPE_SECRET_KEY: zod_1.z.string().min(1, 'STRIPE_SECRET_KEY is required'),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
    // External APIs
    RESEND_API_KEY: zod_1.z.string().min(1, 'RESEND_API_KEY is required'),
    OPENAI_API_KEY: zod_1.z.string().min(1, 'OPENAI_API_KEY is required'),
    OPENAI_MODEL: zod_1.z.string().default('gpt-4'),
    // Environment
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().positive().default(3001),
    // Optional - Monitoring
    SENTRY_DSN: zod_1.z.string().url().optional(),
    // Optional - SMS
    TWILIO_ACCOUNT_SID: zod_1.z.string().optional(),
    TWILIO_AUTH_TOKEN: zod_1.z.string().optional(),
    TWILIO_PHONE_NUMBER: zod_1.z.string().optional(),
});
function validateEnv() {
    try {
        return envSchema.parse(process.env);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            const missingVars = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
            console.error('❌ Environment validation failed:\n' + missingVars);
            process.exit(1);
        }
        throw error;
    }
}
// Singleton instance
exports.env = validateEnv();
// Getter function for compatibility
const getEnv = () => exports.env;
exports.getEnv = getEnv;
//# sourceMappingURL=env.js.map