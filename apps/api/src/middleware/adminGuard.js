"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminIPGuard = adminIPGuard;
var logger_js_1 = require("../lib/logger.js");
/**
 * Parse admin IP allowlist from environment variable
 */
var allowed = new Set((process.env.ADMIN_IP_ALLOWLIST || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean));
/**
 * Admin IP allowlist middleware
 * Only allows admin operations from pre-configured IP addresses
 */
function adminIPGuard(req, res, next) {
    var _a, _b;
    var ip = ((_b = (_a = req.headers['x-forwarded-for']) === null || _a === void 0 ? void 0 : _a.split(',')[0]) === null || _b === void 0 ? void 0 : _b.trim())
        || req.socket.remoteAddress
        || '';
    if (!allowed.size) {
        logger_js_1.logger.warn('ADMIN_IP_ALLOWLIST not configured - allowing all IPs');
        return next();
    }
    if (allowed.has(ip)) {
        return next();
    }
    logger_js_1.logger.warn({ ip: ip, allowed: Array.from(allowed) }, 'Admin access blocked');
    return res.status(403).json({ error: 'Admin IP not allowed' });
}
