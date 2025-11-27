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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkLimit = checkLimit;
exports.rateLimitFor = rateLimitFor;
exports.resetInMemoryRateLimiter = resetInMemoryRateLimiter;
var redis_1 = require("redis");
var logger_js_1 = require("./logger.js");
var windowMs = 60000; // 1 minute
var maxPerIp = 60;
var maxPerUser = 120;
var _client = null;
/**
 * Get or create Redis client for rate limiting
 */
var hasLoggedFallback = false;
function getClient() {
    return __awaiter(this, void 0, void 0, function () {
        var nodeEnv, url, errMsg, error_1;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    nodeEnv = ((_a = process.env.NODE_ENV) !== null && _a !== void 0 ? _a : 'development').toLowerCase();
                    if (nodeEnv !== 'production') {
                        if (!hasLoggedFallback) {
                            logger_js_1.logger.info("Rate limiter using in-memory store (env: ".concat(nodeEnv, ")"));
                            hasLoggedFallback = true;
                        }
                        return [2 /*return*/, null];
                    }
                    if (!!_client) return [3 /*break*/, 4];
                    url = process.env.RATE_LIMIT_REDIS_URL;
                    if (!url) {
                        errMsg = 'RATE_LIMIT_REDIS_URL must be configured in production';
                        logger_js_1.logger.error(errMsg);
                        throw new Error(errMsg);
                    }
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, , 4]);
                    _client = (0, redis_1.createClient)({ url: url });
                    _client.on('error', function (e) { return logger_js_1.logger.error('Redis error', e); });
                    return [4 /*yield*/, _client.connect()];
                case 2:
                    _b.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _b.sent();
                    logger_js_1.logger.error('Failed to connect to Redis:', error_1);
                    // In production, throw error; strict behavior preserved
                    throw new Error('Redis connection failed in production');
                case 4: return [2 /*return*/, _client];
            }
        });
    });
}
/**
 * Check rate limit for a specific key
 */
function checkLimit(key_1) {
    return __awaiter(this, arguments, void 0, function (key, limit) {
        var client, now, windowKey, countResult, count, remaining, resetMs;
        if (limit === void 0) { limit = maxPerIp; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getClient()];
                case 1:
                    client = _a.sent();
                    // Fallback to in-memory if Redis unavailable
                    if (!client) {
                        return [2 /*return*/, inMemoryCheckLimit(key, limit)];
                    }
                    now = Date.now();
                    windowKey = "ratelimit:".concat(key, ":").concat(Math.floor(now / windowMs));
                    return [4 /*yield*/, client.incr(windowKey)];
                case 2:
                    countResult = _a.sent();
                    count = typeof countResult === 'string' ? parseInt(countResult, 10) : countResult;
                    if (!(count === 1)) return [3 /*break*/, 4];
                    return [4 /*yield*/, client.pExpire(windowKey, windowMs)];
                case 3:
                    _a.sent();
                    _a.label = 4;
                case 4:
                    remaining = Math.max(0, limit - count);
                    resetMs = windowMs - (now % windowMs);
                    return [2 /*return*/, {
                            allowed: count <= limit,
                            remaining: remaining,
                            resetMs: resetMs,
                        }];
            }
        });
    });
}
/**
 * Check rate limits for both IP and user
 */
function rateLimitFor(ip, userId) {
    return __awaiter(this, void 0, void 0, function () {
        var ipKey, userKey, ipRes, uRes;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ipKey = "ip:".concat(ip !== null && ip !== void 0 ? ip : 'unknown');
                    userKey = userId ? "user:".concat(userId) : null;
                    return [4 /*yield*/, checkLimit(ipKey, maxPerIp)];
                case 1:
                    ipRes = _a.sent();
                    if (!ipRes.allowed) {
                        return [2 /*return*/, __assign(__assign({}, ipRes), { scope: 'ip' })];
                    }
                    if (!userKey) return [3 /*break*/, 3];
                    return [4 /*yield*/, checkLimit(userKey, maxPerUser)];
                case 2:
                    uRes = _a.sent();
                    if (!uRes.allowed) {
                        return [2 /*return*/, __assign(__assign({}, uRes), { scope: 'user' })];
                    }
                    _a.label = 3;
                case 3: return [2 /*return*/, {
                        allowed: true,
                        remaining: Math.min(ipRes.remaining, maxPerUser),
                        resetMs: ipRes.resetMs,
                        scope: 'ok',
                    }];
            }
        });
    });
}
var MEMORY_STORE_KEY = '__neonhub_rateLimiterStore';
var globalObject = globalThis;
var inMemoryStore = (_a = globalObject[MEMORY_STORE_KEY]) !== null && _a !== void 0 ? _a : new Map();
if (!globalObject[MEMORY_STORE_KEY]) {
    globalObject[MEMORY_STORE_KEY] = inMemoryStore;
}
function inMemoryCheckLimit(key, limit) {
    var now = Date.now();
    var windowStart = Math.floor(now / windowMs) * windowMs;
    var resetAt = windowStart + windowMs;
    var existing = inMemoryStore.get(key);
    if (!existing || existing.resetAt <= now) {
        inMemoryStore.set(key, { count: 1, resetAt: resetAt });
        return { allowed: true, remaining: limit - 1, resetMs: windowMs };
    }
    existing.count += 1;
    var remaining = Math.max(0, limit - existing.count);
    return {
        allowed: existing.count <= limit,
        remaining: remaining,
        resetMs: resetAt - now,
    };
}
function resetInMemoryRateLimiter() {
    inMemoryStore.clear();
    hasLoggedFallback = false;
}
