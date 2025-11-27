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
Object.defineProperty(exports, "__esModule", { value: true });
exports.identifyUnderperformers = identifyUnderperformers;
exports.autoOptimizeContent = autoOptimizeContent;
var prisma_js_1 = require("../db/prisma.js");
var logger_js_1 = require("../lib/logger.js");
function groupByUrl(metrics) {
    var _a;
    var map = new Map();
    for (var _i = 0, metrics_1 = metrics; _i < metrics_1.length; _i++) {
        var metric = metrics_1[_i];
        var arr = (_a = map.get(metric.url)) !== null && _a !== void 0 ? _a : [];
        arr.push(metric);
        map.set(metric.url, arr);
    }
    return map;
}
function identifyUnderperformers(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var since, metrics, grouped, underperformers, _i, grouped_1, _c, rows, latest, first, totalImpressions, totalClicks, avgCtr, positionDelta;
        var organizationId = _b.organizationId, _d = _b.lookbackDays, lookbackDays = _d === void 0 ? 30 : _d, _e = _b.prisma, prisma = _e === void 0 ? prisma_js_1.prisma : _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    since = new Date();
                    since.setDate(since.getDate() - lookbackDays);
                    return [4 /*yield*/, prisma.sEOMetric.findMany({
                            where: {
                                organizationId: organizationId,
                                date: {
                                    gte: since,
                                },
                            },
                            orderBy: [
                                { url: "asc" },
                                { keyword: "asc" },
                                { date: "asc" },
                            ],
                        })];
                case 1:
                    metrics = _f.sent();
                    if (metrics.length === 0) {
                        return [2 /*return*/, []];
                    }
                    grouped = groupByUrl(metrics.map(function (metric) {
                        var _a;
                        return ({
                            url: metric.url,
                            keyword: metric.keyword,
                            date: metric.date,
                            ctr: metric.ctr,
                            avgPosition: metric.avgPosition,
                            impressions: metric.impressions,
                            clicks: metric.clicks,
                            contentId: (_a = metric.contentId) !== null && _a !== void 0 ? _a : null,
                        });
                    }));
                    underperformers = [];
                    for (_i = 0, grouped_1 = grouped; _i < grouped_1.length; _i++) {
                        _c = grouped_1[_i], rows = _c[1];
                        latest = rows[rows.length - 1];
                        first = rows[0];
                        totalImpressions = rows.reduce(function (acc, row) { return acc + row.impressions; }, 0);
                        totalClicks = rows.reduce(function (acc, row) { return acc + row.clicks; }, 0);
                        avgCtr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
                        if (totalImpressions >= 1000 && avgCtr < 0.02) {
                            underperformers.push({
                                contentId: latest.contentId,
                                url: latest.url,
                                keyword: latest.keyword,
                                impressions: totalImpressions,
                                clicks: totalClicks,
                                ctr: Number(avgCtr.toFixed(4)),
                                avgPosition: Number(latest.avgPosition.toFixed(2)),
                                issue: "low_ctr",
                                recommendation: "Refresh title & meta description to improve click-through rate.",
                            });
                            continue;
                        }
                        positionDelta = latest.avgPosition - first.avgPosition;
                        if (positionDelta > 3) {
                            underperformers.push({
                                contentId: latest.contentId,
                                url: latest.url,
                                keyword: latest.keyword,
                                impressions: totalImpressions,
                                clicks: totalClicks,
                                ctr: Number(avgCtr.toFixed(4)),
                                avgPosition: Number(latest.avgPosition.toFixed(2)),
                                issue: "declining_position",
                                recommendation: "Update content for relevancy and add internal links to recover rankings.",
                            });
                        }
                    }
                    return [2 /*return*/, underperformers];
            }
        });
    });
}
function mergeMetadata(existing, patch) {
    var base = typeof existing === "object" && existing !== null ? __assign({}, existing) : {};
    return __assign(__assign({}, base), patch);
}
function autoOptimizeContent(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var metrics, latest, totalImpressions, totalClicks, ctr, issue, content, optimizationRecord;
        var contentId = _b.contentId, _c = _b.prisma, prisma = _c === void 0 ? prisma_js_1.prisma : _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0: return [4 /*yield*/, prisma.sEOMetric.findMany({
                        where: { contentId: contentId },
                        orderBy: { date: "desc" },
                        take: 10,
                    })];
                case 1:
                    metrics = _d.sent();
                    if (metrics.length === 0) {
                        logger_js_1.logger.warn({ contentId: contentId }, "[seo-learning] No metrics available for auto-optimisation");
                        return [2 /*return*/];
                    }
                    latest = metrics[0];
                    totalImpressions = metrics.reduce(function (acc, row) { return acc + row.impressions; }, 0);
                    totalClicks = metrics.reduce(function (acc, row) { return acc + row.clicks; }, 0);
                    ctr = totalImpressions > 0 ? totalClicks / totalImpressions : 0;
                    issue = ctr < 0.02 ? "low_ctr" : latest.avgPosition > 10 ? "declining_position" : "stable";
                    return [4 /*yield*/, prisma.content.findUnique({
                            where: { id: contentId },
                            select: { metadata: true },
                        })];
                case 2:
                    content = _d.sent();
                    if (!content) {
                        logger_js_1.logger.error({ contentId: contentId }, "[seo-learning] Content not found for optimisation");
                        return [2 /*return*/];
                    }
                    optimizationRecord = {
                        lastRunAt: new Date().toISOString(),
                        issue: issue,
                        keyword: latest.keyword,
                        metrics: {
                            impressions: totalImpressions,
                            clicks: totalClicks,
                            ctr: ctr,
                            avgPosition: latest.avgPosition,
                        },
                        suggestedActions: issue === "low_ctr"
                            ? [
                                "Rewrite meta description with stronger value proposition.",
                                "Test alternative title tags focusing on primary keyword.",
                                "Add rich snippets (FAQ/HowTo) if applicable.",
                            ]
                            : issue === "declining_position"
                                ? [
                                    "Update content with fresh statistics and examples.",
                                    "Add 2-3 internal links from high authority pages.",
                                    "Review backlink profile for loss and address gaps.",
                                ]
                                : ["Monitor performance – no immediate optimisation required."],
                    };
                    return [4 /*yield*/, prisma.content.update({
                            where: { id: contentId },
                            data: {
                                metadata: mergeMetadata(content.metadata, {
                                    seoOptimization: optimizationRecord,
                                }),
                            },
                        })];
                case 3:
                    _d.sent();
                    logger_js_1.logger.info({ contentId: contentId, issue: issue }, "[seo-learning] Recorded optimisation recommendation for content");
                    return [2 /*return*/];
            }
        });
    });
}
