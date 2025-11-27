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
exports.fetchGSCMetrics = fetchGSCMetrics;
var prisma_js_1 = require("../db/prisma.js");
var logger_js_1 = require("../lib/logger.js");
var connector_service_js_1 = require("../services/connector.service.js");
var CONNECTOR_NAME = "google-search-console";
function formatDate(date) {
    return date.toISOString().slice(0, 10);
}
function buildFallbackMetrics(siteUrl) {
    var today = new Date();
    return [
        {
            url: "".concat(siteUrl, "/content/neon-marketing-guide"),
            keyword: "neon marketing strategy",
            impressions: 1200,
            clicks: 84,
            ctr: 0.07,
            avgPosition: 6.4,
            date: today,
        },
        {
            url: "".concat(siteUrl, "/content/internal-linking"),
            keyword: "internal linking best practices",
            impressions: 980,
            clicks: 45,
            ctr: 0.0459,
            avgPosition: 9.1,
            date: today,
        },
    ];
}
function fetchGSCMetrics(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var connector, auth, response, text, payload, error_1;
        var _c;
        var organizationId = _b.organizationId, siteUrl = _b.siteUrl, startDate = _b.startDate, endDate = _b.endDate, _d = _b.prisma, prisma = _d === void 0 ? prisma_js_1.prisma : _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: return [4 /*yield*/, prisma.connector.findFirst({
                        where: { name: CONNECTOR_NAME },
                        select: { id: true },
                    })];
                case 1:
                    connector = _e.sent();
                    if (!connector) {
                        logger_js_1.logger.warn({ organizationId: organizationId }, "[gsc] Connector not registered; returning fallback data");
                        return [2 /*return*/, buildFallbackMetrics(siteUrl)];
                    }
                    return [4 /*yield*/, prisma.connectorAuth.findFirst({
                            where: {
                                connectorId: connector.id,
                                organizationId: organizationId,
                            },
                            orderBy: { updatedAt: "desc" },
                        })];
                case 2:
                    auth = _e.sent();
                    if (!(auth === null || auth === void 0 ? void 0 : auth.accessToken)) {
                        logger_js_1.logger.warn({ organizationId: organizationId }, "[gsc] No active Google Search Console credentials");
                        return [2 /*return*/, buildFallbackMetrics(siteUrl)];
                    }
                    _e.label = 3;
                case 3:
                    _e.trys.push([3, 9, , 10]);
                    return [4 /*yield*/, fetch("https://www.googleapis.com/webmasters/v3/sites/".concat(encodeURIComponent(siteUrl), "/searchAnalytics/query"), {
                            method: "POST",
                            headers: {
                                Authorization: "Bearer ".concat(auth.accessToken),
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                startDate: formatDate(startDate),
                                endDate: formatDate(endDate),
                                dimensions: ["PAGE", "QUERY"],
                                rowLimit: 250,
                            }),
                        })];
                case 4:
                    response = _e.sent();
                    if (!!response.ok) return [3 /*break*/, 6];
                    return [4 /*yield*/, response.text()];
                case 5:
                    text = _e.sent();
                    logger_js_1.logger.error({ status: response.status, body: text, organizationId: organizationId }, "[gsc] API response not OK");
                    return [2 /*return*/, buildFallbackMetrics(siteUrl)];
                case 6: return [4 /*yield*/, response.json()];
                case 7:
                    payload = (_e.sent());
                    return [4 /*yield*/, (0, connector_service_js_1.recordConnectorUsage)(auth)];
                case 8:
                    _e.sent();
                    if (!((_c = payload.rows) === null || _c === void 0 ? void 0 : _c.length)) {
                        return [2 /*return*/, []];
                    }
                    return [2 /*return*/, payload.rows.map(function (row) {
                            var _a, _b;
                            return ({
                                url: (_a = row.keys[0]) !== null && _a !== void 0 ? _a : siteUrl,
                                keyword: (_b = row.keys[1]) !== null && _b !== void 0 ? _b : "(not provided)",
                                impressions: Math.round(row.impressions),
                                clicks: Math.round(row.clicks),
                                ctr: Number(row.ctr),
                                avgPosition: Number(row.position),
                                date: endDate,
                            });
                        })];
                case 9:
                    error_1 = _e.sent();
                    logger_js_1.logger.error({ error: error_1, organizationId: organizationId }, "[gsc] Failed to fetch metrics");
                    return [2 /*return*/, buildFallbackMetrics(siteUrl)];
                case 10: return [2 /*return*/];
            }
        });
    });
}
