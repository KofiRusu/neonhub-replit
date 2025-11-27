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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateSitemap = generateSitemap;
exports.countContentItems = countContentItems;
exports.generateSitemapIndex = generateSitemapIndex;
exports.generateRobotsTxt = generateRobotsTxt;
var prisma_js_1 = require("../db/prisma.js");
var logger_js_1 = require("../lib/logger.js");
var env_js_1 = require("../config/env.js");
var STATIC_ROUTES = [
    { path: "/", changefreq: "daily", priority: 1 },
    { path: "/dashboard", changefreq: "daily", priority: 0.9 },
    { path: "/dashboard/seo", changefreq: "daily", priority: 0.85 },
    { path: "/dashboard/seo/keywords", changefreq: "weekly", priority: 0.8 },
    { path: "/dashboard/seo/content", changefreq: "weekly", priority: 0.8 },
    { path: "/dashboard/seo/links", changefreq: "weekly", priority: 0.75 },
    { path: "/dashboard/seo/trends", changefreq: "weekly", priority: 0.75 },
];
function sanitiseBaseUrl(raw) {
    var _a, _b;
    var url = ((_b = (_a = raw !== null && raw !== void 0 ? raw : process.env.PUBLIC_URL) !== null && _a !== void 0 ? _a : env_js_1.env.NEXTAUTH_URL) !== null && _b !== void 0 ? _b : "https://neonhubecosystem.com").trim();
    return url.endsWith("/") ? url.slice(0, -1) : url;
}
function buildContentPath(metadata, id) {
    var slugCandidate = (metadata && typeof metadata === "object" && typeof metadata.slug === "string"
        ? metadata.slug
        : null) ||
        (metadata && typeof metadata === "object" && typeof metadata.path === "string"
            ? metadata.path
            : null);
    if (slugCandidate) {
        return slugCandidate.startsWith("/") ? slugCandidate : "/content/".concat(slugCandidate);
    }
    return "/content/".concat(id);
}
function generateSitemap(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var resolvedBaseUrl, content, nowIso, staticEntries, dynamicEntries, entries, urlsXml, xml;
        var organizationId = _b.organizationId, baseUrl = _b.baseUrl, _c = _b.prisma, prisma = _c === void 0 ? prisma_js_1.prisma : _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    resolvedBaseUrl = sanitiseBaseUrl(baseUrl);
                    logger_js_1.logger.info({ organizationId: organizationId }, "[sitemap-generator] Building sitemap");
                    return [4 /*yield*/, prisma.content.findMany({
                            where: {
                                organizationId: organizationId,
                                status: "published",
                            },
                            select: {
                                id: true,
                                metadata: true,
                                updatedAt: true,
                                publishedAt: true,
                                createdAt: true,
                            },
                            orderBy: { updatedAt: "desc" },
                        })];
                case 1:
                    content = _d.sent();
                    logger_js_1.logger.info({ organizationId: organizationId, contentCount: content.length }, "[sitemap-generator] Content collected");
                    nowIso = new Date().toISOString();
                    staticEntries = STATIC_ROUTES.map(function (route) { return ({
                        loc: "".concat(resolvedBaseUrl).concat(route.path),
                        lastmod: nowIso,
                        changefreq: route.changefreq,
                        priority: route.priority,
                    }); });
                    dynamicEntries = content.map(function (item) {
                        var _a, _b, _c;
                        var metadata = item.metadata;
                        var path = buildContentPath(metadata, item.id);
                        var lastUpdated = (_c = (_b = (_a = item.updatedAt) !== null && _a !== void 0 ? _a : item.publishedAt) !== null && _b !== void 0 ? _b : item.createdAt) !== null && _c !== void 0 ? _c : new Date();
                        return {
                            loc: "".concat(resolvedBaseUrl).concat(path.startsWith("/") ? "" : "/").concat(path),
                            lastmod: lastUpdated.toISOString(),
                            changefreq: "weekly",
                            priority: 0.8,
                        };
                    });
                    entries = __spreadArray(__spreadArray([], staticEntries, true), dynamicEntries, true);
                    urlsXml = entries
                        .map(function (entry) { return "  <url>\n    <loc>".concat(entry.loc, "</loc>\n    <lastmod>").concat(entry.lastmod, "</lastmod>\n    <changefreq>").concat(entry.changefreq, "</changefreq>\n    <priority>").concat(entry.priority.toFixed(1), "</priority>\n  </url>"); })
                        .join("\n");
                    xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n".concat(urlsXml, "\n</urlset>");
                    logger_js_1.logger.info({ organizationId: organizationId, entryCount: entries.length }, "[sitemap-generator] Sitemap generated");
                    return [2 /*return*/, xml];
            }
        });
    });
}
function countContentItems(organizationId_1) {
    return __awaiter(this, arguments, void 0, function (organizationId, prisma) {
        if (prisma === void 0) { prisma = prisma_js_1.prisma; }
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma.content.count({
                    where: {
                        organizationId: organizationId,
                        status: "published",
                    },
                })];
        });
    });
}
function generateSitemapIndex(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var resolvedBaseUrl, total, sitemapCount, nowIso, indexEntries;
        var organizationId = _b.organizationId, baseUrl = _b.baseUrl, _c = _b.prisma, prisma = _c === void 0 ? prisma_js_1.prisma : _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    resolvedBaseUrl = sanitiseBaseUrl(baseUrl);
                    return [4 /*yield*/, countContentItems(organizationId, prisma)];
                case 1:
                    total = _d.sent();
                    sitemapCount = Math.ceil(total / 50000);
                    if (sitemapCount <= 1) {
                        return [2 /*return*/, generateSitemap({ organizationId: organizationId, baseUrl: resolvedBaseUrl, prisma: prisma })];
                    }
                    nowIso = new Date().toISOString();
                    indexEntries = Array.from({ length: sitemapCount }, function (_, idx) { return "  <sitemap>\n    <loc>".concat(resolvedBaseUrl, "/api/sitemap-").concat(idx + 1, ".xml</loc>\n    <lastmod>").concat(nowIso, "</lastmod>\n  </sitemap>"); }).join("\n");
                    return [2 /*return*/, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<sitemapindex xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n".concat(indexEntries, "\n</sitemapindex>")];
            }
        });
    });
}
function generateRobotsTxt(baseUrl) {
    var resolvedBaseUrl = sanitiseBaseUrl(baseUrl);
    return "User-agent: *\nAllow: /\n\n# Sitemap reference\nSitemap: ".concat(resolvedBaseUrl, "/api/sitemap.xml\n\n# Restricted paths\nDisallow: /api/internal/\nDisallow: /admin/\n\n# Crawl etiquette\nCrawl-delay: 1");
}
