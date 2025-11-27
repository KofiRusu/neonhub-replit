"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strictCORS = strictCORS;
var env_js_1 = require("../config/env.js");
var escapeRegExp = function (value) {
    return value.replace(/[-/\\^$+?.()|[\]{}]/g, "\\$&");
};
var buildMatchers = function (origins) {
    if (!origins.length) {
        return [];
    }
    return origins.map(function (origin) {
        var trimmed = origin.trim();
        if (!trimmed) {
            return function () { return false; };
        }
        if (trimmed === "*" || trimmed.toLowerCase() === "all") {
            return function () { return true; };
        }
        if (trimmed.startsWith("regex:")) {
            var pattern = trimmed.slice(6);
            try {
                var regex_1 = new RegExp(pattern);
                return function (value) { return regex_1.test(value); };
            }
            catch (_a) {
                return function (value) { return value === trimmed; };
            }
        }
        if (trimmed.includes("*")) {
            var regex_2 = new RegExp("^".concat(escapeRegExp(trimmed).replace(/\\\*/g, ".*"), "$"));
            return function (value) { return regex_2.test(value); };
        }
        return function (value) { return value === trimmed; };
    });
};
var allowedOrigins = buildMatchers(env_js_1.env.CORS_ORIGINS);
var isOriginAllowed = function (origin) {
    if (!origin) {
        return false;
    }
    if (!allowedOrigins.length) {
        return false;
    }
    return allowedOrigins.some(function (match) { return match(origin); });
};
function strictCORS(req, res, next) {
    var _a;
    var origin = req.headers.origin;
    var allowed = isOriginAllowed(origin);
    if (allowed && origin) {
        res.setHeader("Vary", "Origin");
        res.setHeader("Access-Control-Allow-Origin", origin);
        res.setHeader("Access-Control-Allow-Credentials", "true");
        var requestHeaders = (_a = req.headers["access-control-request-headers"]) !== null && _a !== void 0 ? _a : "Content-Type, Authorization";
        res.setHeader("Access-Control-Allow-Headers", requestHeaders);
        res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
    }
    if (req.method === "OPTIONS") {
        return allowed ? res.status(204).end() : res.status(403).end();
    }
    if (origin && !allowed) {
        return res.status(403).json({ error: "CORS blocked" });
    }
    next();
}
