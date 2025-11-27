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
exports.brief = brief;
exports.getTrendsByPlatform = getTrendsByPlatform;
exports.searchTrends = searchTrends;
var socialApiClient_js_1 = require("../lib/socialApiClient.js");
var logger_js_1 = require("../lib/logger.js");
function pickTopTrends(trends, limit) {
    if (limit === void 0) { limit = 5; }
    return trends
        .sort(function (a, b) { return b.volume - a.volume; })
        .slice(0, limit)
        .map(function (trend) { return ({
        keyword: trend.keyword,
        platform: trend.platform,
        volume: trend.volume,
        sentiment: trend.sentiment,
        timestamp: trend.timestamp.toISOString(),
    }); });
}
function computePlatformMetrics(trends) {
    var metrics = {
        twitter: { volume: 0, count: 0, avgSentiment: 0 },
        reddit: { volume: 0, count: 0, avgSentiment: 0 },
    };
    for (var _i = 0, trends_1 = trends; _i < trends_1.length; _i++) {
        var trend = trends_1[_i];
        var bucket = metrics[trend.platform];
        bucket.volume += trend.volume;
        bucket.count += 1;
        bucket.avgSentiment += trend.sentiment;
    }
    for (var _a = 0, _b = Object.keys(metrics); _a < _b.length; _a++) {
        var platform = _b[_a];
        var bucket = metrics[platform];
        bucket.avgSentiment = bucket.count === 0 ? 0 : bucket.avgSentiment / bucket.count;
    }
    return metrics;
}
function buildRecommendations(topTrends) {
    return topTrends.map(function (trend) {
        if (trend.platform === "twitter") {
            return {
                action: "Publish a Twitter thread expanding on \"".concat(trend.keyword, "\""),
                priority: trend.volume > 10000 ? "high" : "medium",
                rationale: "High conversation volume detected on Twitter. Amplify momentum with timely thought leadership content.",
            };
        }
        return {
            action: "Launch a Reddit AMA focused on \"".concat(trend.keyword, "\""),
            priority: trend.volume > 6000 ? "high" : "medium",
            rationale: "Reddit communities are actively discussing this topic. Engage directly to capture insights and signal expertise.",
        };
    });
}
function brief(input) {
    return __awaiter(this, void 0, void 0, function () {
        var notes, platforms, timeframe, allowedPlatforms, trends, aggregated, error_1, topTrends, platformMetrics;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    notes = input.notes, platforms = input.platforms, timeframe = input.timeframe;
                    allowedPlatforms = platforms && platforms.length > 0 ? platforms : ["twitter", "reddit"];
                    trends = [];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, socialApiClient_js_1.socialApiClient.aggregateTrends()];
                case 2:
                    aggregated = _a.sent();
                    trends = aggregated.filter(function (trend) { return allowedPlatforms.includes(trend.platform); });
                    return [3 /*break*/, 4];
                case 3:
                    error_1 = _a.sent();
                    logger_js_1.logger.error({ error: error_1 }, "Failed to aggregate trends; falling back to mock data");
                    trends = [];
                    return [3 /*break*/, 4];
                case 4:
                    topTrends = pickTopTrends(trends);
                    platformMetrics = computePlatformMetrics(trends);
                    return [2 /*return*/, {
                            timeframe: timeframe !== null && timeframe !== void 0 ? timeframe : "last 24 hours",
                            generatedAt: new Date().toISOString(),
                            topTrends: topTrends,
                            summary: {
                                totalSignals: trends.length,
                                platforms: platformMetrics,
                            },
                            recommendations: buildRecommendations(topTrends),
                            notes: notes !== null && notes !== void 0 ? notes : null,
                        }];
            }
        });
    });
}
function getTrendsByPlatform(platform, options) {
    return __awaiter(this, void 0, void 0, function () {
        var limit, trends_2, trends;
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    limit = (_a = options === null || options === void 0 ? void 0 : options.limit) !== null && _a !== void 0 ? _a : 25;
                    if (!(platform === "twitter")) return [3 /*break*/, 2];
                    return [4 /*yield*/, socialApiClient_js_1.socialApiClient.fetchTwitterTrends()];
                case 1:
                    trends_2 = _b.sent();
                    return [2 /*return*/, trends_2.slice(0, limit)];
                case 2: return [4 /*yield*/, socialApiClient_js_1.socialApiClient.fetchRedditTrends()];
                case 3:
                    trends = _b.sent();
                    return [2 /*return*/, trends.slice(0, limit)];
            }
        });
    });
}
function searchTrends(query) {
    return __awaiter(this, void 0, void 0, function () {
        var lowerQuery, aggregated;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    lowerQuery = query.toLowerCase();
                    return [4 /*yield*/, socialApiClient_js_1.socialApiClient.aggregateTrends()];
                case 1:
                    aggregated = _a.sent();
                    return [2 /*return*/, aggregated.filter(function (trend) { return trend.keyword.toLowerCase().includes(lowerQuery); })];
            }
        });
    });
}
