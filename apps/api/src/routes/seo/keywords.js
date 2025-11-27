"use strict";
/**
 * SEO Keywords API Routes
 *
 * Endpoints for keyword research, intent classification, and prioritization
 *
 * @module routes/seo/keywords
 */
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
var express_1 = require("express");
var zod_1 = require("zod");
var keyword_research_service_1 = require("@/services/seo/keyword-research.service");
var prisma_1 = require("@/lib/prisma");
var router = (0, express_1.Router)();
var keywordService = new keyword_research_service_1.KeywordResearchService(prisma_1.prisma);
// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================
var classifyIntentSchema = zod_1.z.object({
    keyword: zod_1.z.string().min(1).max(200)
});
var classifyIntentBatchSchema = zod_1.z.object({
    keywords: zod_1.z.array(zod_1.z.string().min(1).max(200)).min(1).max(50)
});
var generateLongTailSchema = zod_1.z.object({
    seedKeyword: zod_1.z.string().min(1).max(200),
    count: zod_1.z.number().int().min(5).max(50).optional().default(20)
});
var findCompetitiveGapsSchema = zod_1.z.object({
    competitorUrls: zod_1.z.array(zod_1.z.string().url()).min(1).max(5),
    ourKeywords: zod_1.z.array(zod_1.z.string()).optional().default([])
});
var prioritizeKeywordsSchema = zod_1.z.object({
    keywords: zod_1.z.array(zod_1.z.object({
        keyword: zod_1.z.string(),
        searchVolume: zod_1.z.number(),
        difficulty: zod_1.z.number(),
        competition: zod_1.z.enum(['low', 'medium', 'high']),
        competitionScore: zod_1.z.number(),
        cpc: zod_1.z.number().optional(),
        trend: zod_1.z.enum(['rising', 'stable', 'declining'])
    })).min(1).max(100),
    intents: zod_1.z.array(zod_1.z.object({
        keyword: zod_1.z.string(),
        intent: zod_1.z.enum(['informational', 'navigational', 'commercial', 'transactional']),
        confidence: zod_1.z.number().min(0).max(1)
    }))
});
var extractKeywordsSchema = zod_1.z.object({
    content: zod_1.z.string().min(100).max(50000)
});
var analyzeKeywordsSimpleSchema = zod_1.z.object({
    terms: zod_1.z.array(zod_1.z.string().min(1).max(200)).min(1).max(50),
    personaId: zod_1.z.string().optional()
});
// ============================================================================
// ROUTES
// ============================================================================
/**
 * POST /api/seo/keywords/classify-intent
 * Classify search intent for a single keyword
 */
router.post('/classify-intent', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var keyword, result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                keyword = classifyIntentSchema.parse(req.body).keyword;
                return [4 /*yield*/, keywordService.classifyIntent(keyword)];
            case 1:
                result = _a.sent();
                res.json({
                    success: true,
                    data: result
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Error classifying intent:', error_1);
                res.status(400).json({
                    success: false,
                    error: error_1 instanceof Error ? error_1.message : 'Failed to classify intent'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/keywords/classify-intent-batch
 * Classify search intent for multiple keywords (batch processing)
 */
router.post('/classify-intent-batch', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var keywords, results, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                keywords = classifyIntentBatchSchema.parse(req.body).keywords;
                return [4 /*yield*/, keywordService.classifyIntentBatch(keywords)];
            case 1:
                results = _a.sent();
                res.json({
                    success: true,
                    data: results,
                    count: results.length
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Error classifying intents (batch):', error_2);
                res.status(400).json({
                    success: false,
                    error: error_2 instanceof Error ? error_2.message : 'Failed to classify intents'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/keywords/generate-long-tail
 * Generate long-tail keyword variations from a seed keyword
 */
router.post('/generate-long-tail', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, seedKeyword, count, variations, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = generateLongTailSchema.parse(req.body), seedKeyword = _a.seedKeyword, count = _a.count;
                return [4 /*yield*/, keywordService.generateLongTail(seedKeyword, count)];
            case 1:
                variations = _b.sent();
                res.json({
                    success: true,
                    data: variations,
                    count: variations.length,
                    seedKeyword: seedKeyword
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _b.sent();
                console.error('Error generating long-tail keywords:', error_3);
                res.status(400).json({
                    success: false,
                    error: error_3 instanceof Error ? error_3.message : 'Failed to generate long-tail keywords'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/keywords/competitive-gaps
 * Find keyword gaps where competitors rank but we don't
 */
router.post('/competitive-gaps', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, competitorUrls, ourKeywords, gaps, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = findCompetitiveGapsSchema.parse(req.body), competitorUrls = _a.competitorUrls, ourKeywords = _a.ourKeywords;
                return [4 /*yield*/, keywordService.findCompetitiveGaps(competitorUrls, ourKeywords)];
            case 1:
                gaps = _b.sent();
                res.json({
                    success: true,
                    data: gaps,
                    count: gaps.length,
                    competitors: competitorUrls
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                console.error('Error finding competitive gaps:', error_4);
                res.status(400).json({
                    success: false,
                    error: error_4 instanceof Error ? error_4.message : 'Failed to find competitive gaps'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/keywords/prioritize
 * Prioritize keywords based on opportunity score (volume/difficulty × intent × relevance)
 */
router.post('/prioritize', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var parsed, normalizedKeywords, normalizedIntents, suggestions, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                parsed = prioritizeKeywordsSchema.parse(req.body);
                normalizedKeywords = parsed.keywords.map(function (metric) { return ({
                    keyword: metric.keyword,
                    searchVolume: metric.searchVolume,
                    difficulty: metric.difficulty,
                    competition: metric.competition,
                    competitionScore: metric.competitionScore,
                    cpc: metric.cpc,
                    trend: metric.trend
                }); });
                normalizedIntents = parsed.intents.map(function (intent) { return ({
                    keyword: intent.keyword,
                    intent: intent.intent,
                    confidence: intent.confidence
                }); });
                return [4 /*yield*/, keywordService.prioritizeKeywords(normalizedKeywords, normalizedIntents)];
            case 1:
                suggestions = _a.sent();
                res.json({
                    success: true,
                    data: suggestions,
                    count: suggestions.length
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                console.error('Error prioritizing keywords:', error_5);
                res.status(400).json({
                    success: false,
                    error: error_5 instanceof Error ? error_5.message : 'Failed to prioritize keywords'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/keywords/extract
 * Extract keywords from existing content
 */
router.post('/extract', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var content, keywords, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                content = extractKeywordsSchema.parse(req.body).content;
                return [4 /*yield*/, keywordService.extractKeywords(content)];
            case 1:
                keywords = _a.sent();
                res.json({
                    success: true,
                    data: keywords,
                    count: keywords.length
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                console.error('Error extracting keywords:', error_6);
                res.status(400).json({
                    success: false,
                    error: error_6 instanceof Error ? error_6.message : 'Failed to extract keywords'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/keywords/density
 * Calculate keyword density for content
 */
router.post('/density', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, content, keyword, density, analysis;
    return __generator(this, function (_b) {
        try {
            _a = zod_1.z.object({
                content: zod_1.z.string().min(100),
                keyword: zod_1.z.string().min(1)
            }).parse(req.body), content = _a.content, keyword = _a.keyword;
            density = keywordService.calculateKeywordDensity(content, keyword);
            analysis = keywordService.isKeywordDensityOptimal(content, keyword);
            res.json({
                success: true,
                data: __assign({ keyword: keyword, density: density }, analysis)
            });
        }
        catch (error) {
            console.error('Error calculating keyword density:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to calculate keyword density'
            });
        }
        return [2 /*return*/];
    });
}); });
/**
 * POST /api/seo/keywords/analyze
 * Simple deterministic keyword analysis for SEO Agent
 * (Lightweight endpoint for batch keyword scoring and intent classification)
 */
router.post('/analyze', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, terms, personaId, analyzed;
    return __generator(this, function (_b) {
        try {
            _a = analyzeKeywordsSimpleSchema.parse(req.body), terms = _a.terms, personaId = _a.personaId;
            analyzed = terms.map(function (term) {
                var termLower = term.toLowerCase();
                var wordCount = termLower.split(/\s+/).length;
                // Score calculation: longer tail = higher score
                var baseScore = Math.min(100, 50 + wordCount * 15);
                // Determine intent based on keyword patterns
                var intent = "info";
                if (termLower.match(/buy|purchase|price|shop|order/))
                    intent = "tran";
                else if (termLower.match(/how|what|why|guide|tutorial/))
                    intent = "info";
                else if (termLower.match(/^[a-z\s]+\.(com|org|io)$/))
                    intent = "nav";
                else if (termLower.match(/review|best|vs|compare|top/))
                    intent = "comm";
                return {
                    term: termLower,
                    score: baseScore,
                    intent: intent,
                };
            });
            res.json({
                success: true,
                data: {
                    terms: analyzed.sort(function (a, b) { return b.score - a.score; }),
                    personaId: personaId,
                    analyzedAt: new Date().toISOString(),
                }
            });
        }
        catch (error) {
            console.error('Error analyzing keywords:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to analyze keywords'
            });
        }
        return [2 /*return*/];
    });
}); });
exports.default = router;
