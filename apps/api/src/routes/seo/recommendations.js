"use strict";
/**
 * SEO Recommendations API Routes
 *
 * Endpoints for AI-powered SEO recommendations, competitive analysis, and trends
 *
 * @module routes/seo/recommendations
 */
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
var express_1 = require("express");
var zod_1 = require("zod");
var recommendations_service_1 = require("@/services/seo/recommendations.service");
var prisma_1 = require("@/lib/prisma");
var router = (0, express_1.Router)();
var recommendationsService = new recommendations_service_1.SEORecommendationsService(prisma_1.prisma);
// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================
var analyzeCompetitorsSchema = zod_1.z.object({
    competitorUrls: zod_1.z.array(zod_1.z.string().url()).min(1).max(5)
});
var recommendForPageSchema = zod_1.z.object({
    url: zod_1.z.string().url(),
    content: zod_1.z.string().min(100).max(50000),
    analysis: zod_1.z.object({
        wordCount: zod_1.z.number(),
        readability: zod_1.z.any(),
        keywordOptimization: zod_1.z.any(),
        headingStructure: zod_1.z.any(),
        internalLinks: zod_1.z.any(),
        images: zod_1.z.any(),
        eeat: zod_1.z.any(),
        score: zod_1.z.number(),
        recommendations: zod_1.z.array(zod_1.z.any())
    })
});
// ============================================================================
// ROUTES
// ============================================================================
/**
 * GET /api/seo/recommendations/weekly
 * Generate weekly SEO recommendations
 *
 * Includes:
 * - Trending keywords
 * - Content gaps
 * - Stale content
 * - Competitive opportunities
 * - Performance issues
 */
router.get('/weekly', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var recommendations, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, recommendationsService.generateWeeklyRecommendations()];
            case 1:
                recommendations = _a.sent();
                res.json({
                    success: true,
                    data: recommendations,
                    count: recommendations.length,
                    generatedAt: new Date().toISOString()
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Error generating weekly recommendations:', error_1);
                res.status(500).json({
                    success: false,
                    error: error_1 instanceof Error ? error_1.message : 'Failed to generate recommendations'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/recommendations/competitors
 * Analyze competitors and identify opportunities
 */
router.post('/competitors', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var competitorUrls, insights, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                competitorUrls = analyzeCompetitorsSchema.parse(req.body).competitorUrls;
                return [4 /*yield*/, recommendationsService.analyzeCompetitors(competitorUrls)];
            case 1:
                insights = _a.sent();
                res.json({
                    success: true,
                    data: insights,
                    count: insights.length
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Error analyzing competitors:', error_2);
                res.status(400).json({
                    success: false,
                    error: error_2 instanceof Error ? error_2.message : 'Failed to analyze competitors'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/seo/recommendations/content-gaps
 * Identify content gaps (keywords/topics where NeonHub has no content)
 */
router.get('/content-gaps', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var gaps, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, recommendationsService.identifyContentGaps()];
            case 1:
                gaps = _a.sent();
                res.json({
                    success: true,
                    data: gaps,
                    count: gaps.length
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Error identifying content gaps:', error_3);
                res.status(500).json({
                    success: false,
                    error: error_3 instanceof Error ? error_3.message : 'Failed to identify content gaps'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/seo/recommendations/trending
 * Find trending keywords in the industry
 */
router.get('/trending', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var trendingKeywords, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, recommendationsService.findTrendingKeywords()];
            case 1:
                trendingKeywords = _a.sent();
                res.json({
                    success: true,
                    data: trendingKeywords,
                    count: trendingKeywords.length
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error('Error finding trending keywords:', error_4);
                res.status(500).json({
                    success: false,
                    error: error_4 instanceof Error ? error_4.message : 'Failed to find trending keywords'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/seo/recommendations/stale-content
 * Find stale content that needs updating
 */
router.get('/stale-content', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var stalePages, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, recommendationsService.findStaleContent()];
            case 1:
                stalePages = _a.sent();
                res.json({
                    success: true,
                    data: stalePages,
                    count: stalePages.length
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                console.error('Error finding stale content:', error_5);
                res.status(500).json({
                    success: false,
                    error: error_5 instanceof Error ? error_5.message : 'Failed to find stale content'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/seo/recommendations/competitive-gaps
 * Find competitive keyword gaps
 */
router.get('/competitive-gaps', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var gaps, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, recommendationsService.findCompetitiveGaps()];
            case 1:
                gaps = _a.sent();
                res.json({
                    success: true,
                    data: gaps,
                    count: gaps.length
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                console.error('Error finding competitive gaps:', error_6);
                res.status(500).json({
                    success: false,
                    error: error_6 instanceof Error ? error_6.message : 'Failed to find competitive gaps'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/seo/recommendations/performance-issues
 * Detect performance issues (traffic drops, ranking drops, etc.)
 */
router.get('/performance-issues', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var issues, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, recommendationsService.detectPerformanceIssues()];
            case 1:
                issues = _a.sent();
                res.json({
                    success: true,
                    data: issues,
                    count: issues.length
                });
                return [3 /*break*/, 3];
            case 2:
                error_7 = _a.sent();
                console.error('Error detecting performance issues:', error_7);
                res.status(500).json({
                    success: false,
                    error: error_7 instanceof Error ? error_7.message : 'Failed to detect performance issues'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/recommendations/for-page
 * Generate personalized recommendations for a specific page
 */
router.post('/for-page', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var parsed, analysis, recommendations, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                parsed = recommendForPageSchema.parse(req.body);
                analysis = {
                    wordCount: parsed.analysis.wordCount,
                    readability: parsed.analysis.readability,
                    keywordOptimization: parsed.analysis.keywordOptimization,
                    headingStructure: parsed.analysis.headingStructure,
                    internalLinks: parsed.analysis.internalLinks,
                    images: parsed.analysis.images,
                    eeat: parsed.analysis.eeat,
                    score: parsed.analysis.score,
                    recommendations: parsed.analysis.recommendations
                };
                return [4 /*yield*/, recommendationsService.recommendForPage(parsed.url, parsed.content, analysis)];
            case 1:
                recommendations = _a.sent();
                res.json({
                    success: true,
                    data: recommendations,
                    count: recommendations.length,
                    url: parsed.url
                });
                return [3 /*break*/, 3];
            case 2:
                error_8 = _a.sent();
                console.error('Error generating page recommendations:', error_8);
                res.status(400).json({
                    success: false,
                    error: error_8 instanceof Error ? error_8.message : 'Failed to generate page recommendations'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
