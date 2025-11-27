"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = exports.env = void 0;
exports.validateEnv = validateEnv;
var zod_1 = require("zod");
var envSchema = zod_1.z.object({
    // Database
    DATABASE_URL: zod_1.z.string().url('DATABASE_URL must be a valid URL'),
    // Authentication  
    NEXTAUTH_SECRET: zod_1.z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
    NEXTAUTH_URL: zod_1.z.string().url('NEXTAUTH_URL must be a valid URL'),
    // CORS
    CORS_ORIGINS: zod_1.z.string().min(1, 'CORS_ORIGINS must be provided').transform(function (val) {
        return val.split(',').map(function (origin) { return origin.trim(); }).filter(Boolean);
    }),
    // Infrastructure
    REDIS_URL: zod_1.z.string().url().optional(),
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
    USE_MOCK_CONNECTORS: zod_1.z.coerce.boolean().default(false),
    CONNECTORS_LIVE_MODE: zod_1.z.coerce.boolean().default(false),
    // Beta Program
    BETA_ENABLED: zod_1.z.coerce.boolean().default(false),
    // Optional - Monitoring
    SENTRY_DSN: zod_1.z.string().url().optional(),
    // Optional - SMS
    TWILIO_ACCOUNT_SID: zod_1.z.string().optional(),
    TWILIO_SID: zod_1.z.string().optional(),
    TWILIO_AUTH_TOKEN: zod_1.z.string().optional(),
    TWILIO_PHONE_NUMBER: zod_1.z.string().optional(),
    // Social APIs (for trends service)
    TWITTER_BEARER_TOKEN: zod_1.z.string().optional(),
    REDDIT_CLIENT_ID: zod_1.z.string().optional(),
    REDDIT_CLIENT_SECRET: zod_1.z.string().optional(),
    REDDIT_USER_AGENT: zod_1.z.string().default('NeonHub/3.2'),
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
    GOOGLE_REDIRECT_URI: zod_1.z.string().optional(),
    LINKEDIN_CLIENT_ID: zod_1.z.string().optional(),
    LINKEDIN_CLIENT_SECRET: zod_1.z.string().optional(),
    LINKEDIN_REDIRECT_URI: zod_1.z.string().optional(),
    META_APP_ID: zod_1.z.string().optional(),
    META_APP_SECRET: zod_1.z.string().optional(),
    API_URL: zod_1.z.string().optional(),
});
var hasWarnedNonProd = false;
function validateEnv() {
    var _a;
    try {
        return envSchema.parse(process.env);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            var missingVars = error.errors.map(function (err) { return "".concat(err.path.join('.'), ": ").concat(err.message); }).join('\n');
            console.error('❌ Environment validation failed:\n' + missingVars);
            var nodeEnv = ((_a = process.env.NODE_ENV) !== null && _a !== void 0 ? _a : 'development').toLowerCase();
            var isJestRuntime = Boolean(process.env.JEST_WORKER_ID) ||
                process.argv.some(function (arg) { return arg.includes('jest'); });
            if (nodeEnv !== 'production' || isJestRuntime) {
                if (!hasWarnedNonProd) {
                    console.warn('⚠️  Using relaxed environment defaults. Set required variables or run `npm run verify` before production deploys.');
                    hasWarnedNonProd = true;
                }
                return buildFallbackEnv(nodeEnv === 'test' || isJestRuntime ? 'test' : 'development');
            }
            throw new Error("Environment validation failed:\n".concat(missingVars));
        }
        throw error;
    }
}
// Singleton instance - skip strict validation in test mode
var _env = null;
function parseOrigins(raw) {
    if (Array.isArray(raw)) {
        return raw;
    }
    if (!raw) {
        return ['http://localhost:3000'];
    }
    return raw
        .split(',')
        .map(function (origin) { return origin.trim(); })
        .filter(Boolean);
}
function buildFallbackEnv(target) {
    var _a;
    var defaults = {
        DATABASE_URL: process.env.DATABASE_URL ||
            (target === 'test'
                ? 'postgresql://test:test@localhost:5432/test'
                : 'postgresql://localhost:5432/neonhub'),
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ||
            (target === 'test'
                ? 'test-secret-min-32-chars-long-12345'
                : 'dev-secret-min-32-chars-long-12345'),
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        CORS_ORIGINS: parseOrigins(process.env.CORS_ORIGINS),
        REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ||
            (target === 'test' ? 'sk_test_fake' : 'sk_test_dev'),
        STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ||
            (target === 'test' ? 'whsec_test_fake' : 'whsec_dev_fake'),
        RESEND_API_KEY: process.env.RESEND_API_KEY || 'test_fake',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY ||
            (target === 'test'
                ? 'test-key-for-testing'
                : 'test-key-for-development'),
        OPENAI_MODEL: process.env.OPENAI_MODEL || 'gpt-4',
        NODE_ENV: target,
        PORT: Number((_a = process.env.PORT) !== null && _a !== void 0 ? _a : 3001),
        USE_MOCK_CONNECTORS: process.env.USE_MOCK_CONNECTORS === "true" || target === 'test',
        CONNECTORS_LIVE_MODE: process.env.CONNECTORS_LIVE_MODE === "true",
        SENTRY_DSN: process.env.SENTRY_DSN,
        TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
        TWILIO_SID: process.env.TWILIO_SID || process.env.TWILIO_ACCOUNT_SID,
        TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
        TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    };
    return defaults;
}
exports.env = (function () {
    var _a, _b, _c, _d;
    if (_env)
        return _env;
    var nodeEnv = ((_a = process.env.NODE_ENV) !== null && _a !== void 0 ? _a : 'development').toLowerCase();
    var isJestRuntime = Boolean(process.env.JEST_WORKER_ID) ||
        process.argv.some(function (arg) { return arg.includes('jest'); });
    var isTest = nodeEnv === 'test' || isJestRuntime;
    if (nodeEnv === 'production' && !isJestRuntime) {
        _env = validateEnv();
        return _env;
    }
    var parsed = envSchema.safeParse(process.env);
    if (parsed.success) {
        _env = __assign(__assign({}, parsed.data), { NODE_ENV: isTest ? 'test' : ((_b = parsed.data.NODE_ENV) !== null && _b !== void 0 ? _b : 'development'), CORS_ORIGINS: parseOrigins(process.env.CORS_ORIGINS), PORT: Number((_d = (_c = process.env.PORT) !== null && _c !== void 0 ? _c : parsed.data.PORT) !== null && _d !== void 0 ? _d : 3001) });
        return _env;
    }
    if (!hasWarnedNonProd) {
        console.warn('⚠️  Using relaxed environment defaults. Set required variables or run `npm run verify` before production deploys.');
        hasWarnedNonProd = true;
    }
    _env = buildFallbackEnv(isTest ? 'test' : 'development');
    return _env;
})();
// Getter function for compatibility
var getEnv = function () { return exports.env; };
exports.getEnv = getEnv;
