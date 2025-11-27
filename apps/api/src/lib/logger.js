"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
var pino_1 = require("pino");
var env_js_1 = require("../config/env.js");
var env = (0, env_js_1.getEnv)();
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
            return "".concat(data.substring(0, 4), "...").concat(data.substring(data.length - 4));
        }
        return data;
    }
    if (Array.isArray(data)) {
        return data.map(sanitize);
    }
    if (typeof data === 'object') {
        var sanitized = {};
        var _loop_1 = function (key, value) {
            // Never log these fields
            var sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'accessToken',
                'refreshToken', 'authorization', 'cookie', 'sessionToken'];
            if (sensitiveKeys.some(function (sk) { return key.toLowerCase().includes(sk.toLowerCase()); })) {
                sanitized[key] = '[REDACTED]';
            }
            else {
                sanitized[key] = sanitize(value);
            }
        };
        for (var _i = 0, _a = Object.entries(data); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            _loop_1(key, value);
        }
        return sanitized;
    }
    return data;
}
var baseLogger = (0, pino_1.default)({
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
exports.logger = {
    info: function (obj, msg) {
        if (typeof obj === 'string') {
            baseLogger.info(obj);
        }
        else {
            baseLogger.info(sanitize(obj), msg);
        }
    },
    error: function (obj, msg) {
        if (typeof obj === 'string') {
            baseLogger.error(obj);
        }
        else {
            baseLogger.error(sanitize(obj), msg);
        }
    },
    warn: function (obj, msg) {
        if (typeof obj === 'string') {
            baseLogger.warn(obj);
        }
        else {
            baseLogger.warn(sanitize(obj), msg);
        }
    },
    debug: function (obj, msg) {
        if (typeof obj === 'string') {
            baseLogger.debug(obj);
        }
        else {
            baseLogger.debug(sanitize(obj), msg);
        }
    },
};
