"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.sitemapsRouter = void 0;
exports.invalidateSitemapCache = invalidateSitemapCache;
var express_1 = require("express");
var sitemap_generator_js_1 = require("../services/sitemap-generator.js");
var logger_js_1 = require("../lib/logger.js");
var CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
var sitemapCache = new Map();
function buildCacheKey(organizationId) {
    return "sitemap:".concat(organizationId);
}
function getCachedSitemap(organizationId) {
    var entry = sitemapCache.get(buildCacheKey(organizationId));
    if (!entry) {
        return null;
    }
    if (entry.expiresAt < Date.now()) {
        sitemapCache.delete(buildCacheKey(organizationId));
        return null;
    }
    return entry;
}
function setSitemapCache(organizationId, xml) {
    sitemapCache.set(buildCacheKey(organizationId), { xml: xml, expiresAt: Date.now() + CACHE_TTL_MS });
}
function invalidateSitemapCache(organizationId) {
    sitemapCache.delete(buildCacheKey(organizationId));
}
exports.sitemapsRouter = (0, express_1.Router)();
exports.sitemapsRouter.get("/sitemap.xml", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var organizationId, cached, xml, error_1, message;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                organizationId = (typeof req.query.orgId === "string" && req.query.orgId.trim()) ||
                    (typeof req.query.organizationId === "string" && req.query.organizationId.trim()) ||
                    "default";
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                cached = getCachedSitemap(organizationId);
                if (cached) {
                    res.setHeader("Content-Type", "application/xml");
                    res.setHeader("Cache-Control", "public, max-age=86400");
                    res.setHeader("X-Cache", "HIT");
                    return [2 /*return*/, res.send(cached.xml)];
                }
                return [4 /*yield*/, (0, sitemap_generator_js_1.generateSitemap)({ organizationId: organizationId })];
            case 2:
                xml = _a.sent();
                setSitemapCache(organizationId, xml);
                res.setHeader("Content-Type", "application/xml");
                res.setHeader("Cache-Control", "public, max-age=86400");
                res.setHeader("X-Cache", "MISS");
                res.send(xml);
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                message = error_1 instanceof Error ? error_1.message : "Failed to generate sitemap";
                logger_js_1.logger.error({ error: error_1, organizationId: organizationId }, "[sitemaps] Failed to generate sitemap");
                res
                    .status(500)
                    .send("<?xml version=\"1.0\" encoding=\"UTF-8\"?><error>".concat(message.replace(/"/g, ""), "</error>"));
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.sitemapsRouter.get("/robots.txt", function (req, res) {
    try {
        var robotsTxt = (0, sitemap_generator_js_1.generateRobotsTxt)();
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.send(robotsTxt);
    }
    catch (error) {
        var message = error instanceof Error ? error.message : "Failed to generate robots.txt";
        logger_js_1.logger.error({ error: error }, "[sitemaps] Failed to generate robots.txt");
        res.status(500).send("User-agent: *\nDisallow: /\n# ".concat(message));
    }
});
exports.sitemapsRouter.post("/sitemap/invalidate", function (req, res) {
    var _a;
    var organizationId = (typeof ((_a = req.body) === null || _a === void 0 ? void 0 : _a.organizationId) === "string" && req.body.organizationId.trim()) || "default";
    invalidateSitemapCache(organizationId);
    res.json({ success: true, message: "Sitemap cache invalidated" });
});
