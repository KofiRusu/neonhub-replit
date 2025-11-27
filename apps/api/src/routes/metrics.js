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
exports.metricsRouter = void 0;
var express_1 = require("express");
var prisma_js_1 = require("../db/prisma.js");
var errors_js_1 = require("../lib/errors.js");
var index_js_1 = require("../ws/index.js");
var logger_js_1 = require("../lib/logger.js");
var metrics_schemas_js_1 = require("./metrics.schemas.js");
var requestUser_js_1 = require("../lib/requestUser.js");
exports.metricsRouter = (0, express_1.Router)();
// Track an event
exports.metricsRouter.post("/metrics/events", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, result, _a, type, meta, metaPayload, event_1, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                result = metrics_schemas_js_1.MetricEventInputSchema.safeParse(req.body);
                if (!result.success) {
                    throw new errors_js_1.ValidationError(result.error.errors[0].message);
                }
                _a = result.data, type = _a.type, meta = _a.meta;
                metaPayload = (meta && typeof meta === 'object' && !Array.isArray(meta)) ? __assign({}, meta) : {};
                return [4 /*yield*/, prisma_js_1.prisma.metricEvent.create({
                        data: {
                            type: type,
                            meta: __assign(__assign({}, metaPayload), { userId: userId }),
                        },
                    })];
            case 1:
                event_1 = _b.sent();
                logger_js_1.logger.debug({ eventId: event_1.id, type: type }, "Event tracked");
                // Broadcast event to connected clients
                (0, index_js_1.broadcast)("metric:event", {
                    id: event_1.id,
                    type: type,
                    timestamp: event_1.createdAt,
                    userId: userId,
                });
                // Also broadcast delta for live updates
                (0, index_js_1.broadcast)("metrics:delta", {
                    type: type,
                    increment: 1,
                    timestamp: new Date(),
                    userId: userId,
                });
                res.json({
                    success: true,
                    data: { id: event_1.id, type: type },
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                next(error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Get event summary/analytics
exports.metricsRouter.get("/metrics/summary", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, queryResult, range, now, hoursAgo, startDate, ownershipFilter, eventWhere, jobBaseWhere, events, totalEvents, _a, successfulJobs, erroredJobs, totalJobs, recentJobs, jobsWithDuration, avgJobLatencyMs, totalLatency, draftsCreated, eventCounts, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                userId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                queryResult = metrics_schemas_js_1.MetricsSummaryQuerySchema.safeParse(req.query);
                if (!queryResult.success) {
                    throw new errors_js_1.ValidationError(queryResult.error.errors[0].message);
                }
                range = queryResult.data.range;
                now = new Date();
                hoursAgo = range === "24h" ? 24 : range === "7d" ? 24 * 7 : 24 * 30;
                startDate = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
                logger_js_1.logger.debug({ range: range, startDate: startDate }, "Fetching metrics summary");
                ownershipFilter = {
                    OR: [
                        { meta: { path: ["userId"], equals: userId } },
                        { meta: { path: ["tenantId"], equals: userId } },
                    ],
                };
                eventWhere = {
                    AND: [{ createdAt: { gte: startDate } }, ownershipFilter],
                };
                jobBaseWhere = {
                    createdById: userId,
                    createdAt: {
                        gte: startDate,
                    },
                };
                return [4 /*yield*/, prisma_js_1.prisma.metricEvent.groupBy({
                        by: ["type"],
                        where: eventWhere,
                        _count: {
                            id: true,
                        },
                    })];
            case 1:
                events = _b.sent();
                return [4 /*yield*/, prisma_js_1.prisma.metricEvent.count({
                        where: eventWhere,
                    })];
            case 2:
                totalEvents = _b.sent();
                return [4 /*yield*/, Promise.all([
                        prisma_js_1.prisma.agentJob.count({
                            where: __assign(__assign({}, jobBaseWhere), { status: "success" }),
                        }),
                        prisma_js_1.prisma.agentJob.count({
                            where: __assign(__assign({}, jobBaseWhere), { status: "error" }),
                        }),
                        prisma_js_1.prisma.agentJob.count({
                            where: jobBaseWhere,
                        }),
                    ])];
            case 3:
                _a = _b.sent(), successfulJobs = _a[0], erroredJobs = _a[1], totalJobs = _a[2];
                return [4 /*yield*/, prisma_js_1.prisma.agentJob.findMany({
                        where: __assign(__assign({}, jobBaseWhere), { status: "success" }),
                        select: {
                            metrics: true,
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                        take: 100, // Last 100 for average
                    })];
            case 4:
                recentJobs = _b.sent();
                jobsWithDuration = recentJobs.filter(function (job) {
                    var metrics = job.metrics;
                    return metrics && typeof metrics.duration === "number";
                });
                avgJobLatencyMs = 0;
                if (jobsWithDuration.length > 0) {
                    totalLatency = jobsWithDuration.reduce(function (sum, job) {
                        var metrics = job.metrics;
                        return sum + ((metrics === null || metrics === void 0 ? void 0 : metrics.duration) || 0);
                    }, 0);
                    avgJobLatencyMs = Math.round(totalLatency / jobsWithDuration.length);
                }
                return [4 /*yield*/, prisma_js_1.prisma.contentDraft.count({
                        where: {
                            createdById: userId,
                            createdAt: {
                                gte: startDate,
                            },
                        },
                    })];
            case 5:
                draftsCreated = _b.sent();
                eventCounts = events.reduce(function (acc, e) {
                    acc[e.type] = e._count.id;
                    return acc;
                }, {});
                res.json({
                    success: true,
                    data: {
                        timeRange: range,
                        startDate: startDate.toISOString(),
                        totalEvents: totalEvents,
                        draftsCreated: draftsCreated,
                        jobs: {
                            total: totalJobs,
                            successful: successfulJobs,
                            errored: erroredJobs,
                            successRate: totalJobs > 0 ? Math.round((successfulJobs / totalJobs) * 100) : 0,
                            avgLatencyMs: avgJobLatencyMs,
                        },
                        events: {
                            opens: eventCounts.open || 0,
                            clicks: eventCounts.click || 0,
                            conversions: eventCounts.conversion || 0,
                            pageViews: eventCounts.page_view || 0,
                        },
                        eventsByType: events.map(function (e) { return ({
                            type: e.type,
                            count: e._count.id,
                        }); }),
                    },
                });
                return [3 /*break*/, 7];
            case 6:
                error_2 = _b.sent();
                next(error_2);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); });
