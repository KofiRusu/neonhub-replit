import pino from "pino";
import { getEnv } from "../config/env.js";
const env = getEnv();
/**
 * Sanitize sensitive data from logs
 * Redacts tokens, passwords, secrets, and masks long alphanumeric strings
 */
function sanitize(data) {
    if (!data)
        return data;
    if (typeof data === 'string') {
        // Mask potential tokens (long alphanumeric strings)
        if (data.length > 20 && /^[A-Za-z0-9_-]+$/.test(data)) {
            return `${data.substring(0, 4)}...${data.substring(data.length - 4)}`;
        }
        return data;
    }
    if (Array.isArray(data)) {
        return data.map(sanitize);
    }
    if (typeof data === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(data)) {
            // Never log these fields
            const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'accessToken',
                'refreshToken', 'authorization', 'cookie', 'sessionToken'];
            if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk.toLowerCase()))) {
                sanitized[key] = '[REDACTED]';
            }
            else {
                sanitized[key] = sanitize(value);
            }
        }
        return sanitized;
    }
    return data;
}
const baseLogger = pino({
    level: env.NODE_ENV === "production" ? "info" : "debug",
    transport: env.NODE_ENV !== "production"
        ? {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "HH:MM:ss Z",
                ignore: "pid,hostname",
            },
        }
        : undefined,
});
/**
 * Wrapped logger that automatically sanitizes sensitive data
 */
export const logger = {
    info: (obj, msg) => {
        if (typeof obj === 'string') {
            baseLogger.info(obj);
        }
        else {
            baseLogger.info(sanitize(obj), msg);
        }
    },
    error: (obj, msg) => {
        if (typeof obj === 'string') {
            baseLogger.error(obj);
        }
        else {
            baseLogger.error(sanitize(obj), msg);
        }
    },
    warn: (obj, msg) => {
        if (typeof obj === 'string') {
            baseLogger.warn(obj);
        }
        else {
            baseLogger.warn(sanitize(obj), msg);
        }
    },
    debug: (obj, msg) => {
        if (typeof obj === 'string') {
            baseLogger.debug(obj);
        }
        else {
            baseLogger.debug(sanitize(obj), msg);
        }
    },
};
//# sourceMappingURL=logger.js.map