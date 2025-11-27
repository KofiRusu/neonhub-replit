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
exports.runSeoAnalyticsSync = runSeoAnalyticsSync;
exports.startSeoAnalyticsJob = startSeoAnalyticsJob;
var prisma_js_1 = require("../db/prisma.js");
var logger_js_1 = require("../lib/logger.js");
var google_search_console_js_1 = require("../integrations/google-search-console.js");
var seo_learning_js_1 = require("../services/seo-learning.js");
var seo_metrics_js_1 = require("../services/seo-metrics.js");
var SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000;
function fetchActiveSearchConsoleAuths(prisma) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, prisma.connectorAuth.findMany({
                    where: {
                        status: "active",
                        connector: {
                            name: "google-search-console",
                        },
                    },
                    select: {
                        id: true,
                        organizationId: true,
                        metadata: true,
                    },
                })];
        });
    });
}
function runSeoAnalyticsSync() {
    return __awaiter(this, arguments, void 0, function (prisma) {
        var auths, startDate, endDate, _i, auths_1, auth, siteUrl, organizationId, metrics, underperformers, error_1;
        if (prisma === void 0) { prisma = prisma_js_1.prisma; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchActiveSearchConsoleAuths(prisma)];
                case 1:
                    auths = _a.sent();
                    if (auths.length === 0) {
                        logger_js_1.logger.debug("[seo-analytics] No active Google Search Console connectors detected");
                        return [2 /*return*/];
                    }
                    startDate = new Date();
                    startDate.setDate(startDate.getDate() - 7);
                    endDate = new Date();
                    _i = 0, auths_1 = auths;
                    _a.label = 2;
                case 2:
                    if (!(_i < auths_1.length)) return [3 /*break*/, 9];
                    auth = auths_1[_i];
                    siteUrl = (auth.metadata && typeof auth.metadata === "object" && auth.metadata.siteUrl) ||
                        (auth.metadata && typeof auth.metadata === "object" && auth.metadata.propertyUrl) ||
                        null;
                    if (!siteUrl || typeof siteUrl !== "string") {
                        logger_js_1.logger.warn({ connectorAuthId: auth.id }, "[seo-analytics] Missing siteUrl metadata; skipping sync");
                        return [3 /*break*/, 8];
                    }
                    organizationId = auth.organizationId;
                    if (!organizationId) {
                        logger_js_1.logger.warn({ connectorAuthId: auth.id }, "[seo-analytics] Connector auth missing organizationId");
                        return [3 /*break*/, 8];
                    }
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 7, , 8]);
                    return [4 /*yield*/, (0, google_search_console_js_1.fetchGSCMetrics)({
                            organizationId: organizationId,
                            siteUrl: siteUrl,
                            startDate: startDate,
                            endDate: endDate,
                            prisma: prisma,
                        })];
                case 4:
                    metrics = _a.sent();
                    return [4 /*yield*/, (0, seo_metrics_js_1.upsertSearchConsoleMetrics)(organizationId, metrics, prisma)];
                case 5:
                    _a.sent();
                    logger_js_1.logger.info({ organizationId: organizationId, metricsCount: metrics.length }, "[seo-analytics] Synced Google Search Console metrics");
                    return [4 /*yield*/, (0, seo_learning_js_1.identifyUnderperformers)({
                            organizationId: organizationId,
                            prisma: prisma,
                        })];
                case 6:
                    underperformers = _a.sent();
                    if (underperformers.length) {
                        logger_js_1.logger.info({ organizationId: auth.organizationId, underperformers: underperformers.slice(0, 5) }, "[seo-analytics] Underperforming content detected");
                    }
                    return [3 /*break*/, 8];
                case 7:
                    error_1 = _a.sent();
                    logger_js_1.logger.error({ error: error_1, connectorAuthId: auth.id }, "[seo-analytics] Failed to sync analytics");
                    return [3 /*break*/, 8];
                case 8:
                    _i++;
                    return [3 /*break*/, 2];
                case 9: return [2 /*return*/];
            }
        });
    });
}
function startSeoAnalyticsJob(prisma) {
    if (prisma === void 0) { prisma = prisma_js_1.prisma; }
    var execute = function () {
        runSeoAnalyticsSync(prisma).catch(function (error) {
            logger_js_1.logger.error({ error: error }, "[seo-analytics] Scheduled sync failed");
        });
    };
    // Run at startup
    setTimeout(execute, 5000);
    // Schedule daily
    setInterval(execute, SYNC_INTERVAL_MS);
}
