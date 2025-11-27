"use strict";
/**
 * SEO Content Optimization API Routes
 *
 * Endpoints for content analysis, readability, and optimization recommendations
 *
 * @module routes/seo/content
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
var content_optimizer_service_1 = require("@/services/seo/content-optimizer.service");
var router = (0, express_1.Router)();
var contentService = new content_optimizer_service_1.ContentOptimizerService();
// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================
var analyzeContentSchema = zod_1.z.object({
    content: zod_1.z.string().min(100).max(50000),
    targetKeyword: zod_1.z.string().min(1).max(200)
});
var calculateReadabilitySchema = zod_1.z.object({
    content: zod_1.z.string().min(100).max(50000)
});
var analyzeKeywordsSchema = zod_1.z.object({
    content: zod_1.z.string().min(100).max(50000),
    targetKeyword: zod_1.z.string().min(1).max(200)
});
var analyzeHeadingsSchema = zod_1.z.object({
    content: zod_1.z.string().min(100).max(50000)
});
var analyzeLinksSchema = zod_1.z.object({
    content: zod_1.z.string().min(100).max(50000)
});
var analyzeImagesSchema = zod_1.z.object({
    content: zod_1.z.string().min(100).max(50000)
});
var analyzeEEATSchema = zod_1.z.object({
    content: zod_1.z.string().min(100).max(50000)
});
var optimizeContentSchema = zod_1.z.object({
    html: zod_1.z.string().optional(),
    markdown: zod_1.z.string().optional(),
    personaId: zod_1.z.string().optional(),
    targetKeyword: zod_1.z.string().optional()
});
// ============================================================================
// ROUTES
// ============================================================================
/**
 * POST /api/seo/content/analyze
 * Comprehensive content analysis with recommendations
 */
router.post('/analyze', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, content, targetKeyword, analysis, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = analyzeContentSchema.parse(req.body), content = _a.content, targetKeyword = _a.targetKeyword;
                return [4 /*yield*/, contentService.analyzeContent(content, targetKeyword)];
            case 1:
                analysis = _b.sent();
                res.json({
                    success: true,
                    data: analysis
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                console.error('Error analyzing content:', error_1);
                res.status(400).json({
                    success: false,
                    error: error_1 instanceof Error ? error_1.message : 'Failed to analyze content'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/content/readability
 * Calculate readability scores (Flesch Reading Ease, Flesch-Kincaid Grade Level)
 */
router.post('/readability', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var content, readability, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                content = calculateReadabilitySchema.parse(req.body).content;
                return [4 /*yield*/, contentService.calculateReadability(content)];
            case 1:
                readability = _a.sent();
                res.json({
                    success: true,
                    data: readability
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Error calculating readability:', error_2);
                res.status(400).json({
                    success: false,
                    error: error_2 instanceof Error ? error_2.message : 'Failed to calculate readability'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/content/keywords
 * Analyze keyword optimization (density, frequency, prominence, LSI keywords)
 */
router.post('/keywords', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, content, targetKeyword, keywordAnalysis, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = analyzeKeywordsSchema.parse(req.body), content = _a.content, targetKeyword = _a.targetKeyword;
                return [4 /*yield*/, contentService.analyzeKeywords(content, targetKeyword)];
            case 1:
                keywordAnalysis = _b.sent();
                res.json({
                    success: true,
                    data: keywordAnalysis
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _b.sent();
                console.error('Error analyzing keywords:', error_3);
                res.status(400).json({
                    success: false,
                    error: error_3 instanceof Error ? error_3.message : 'Failed to analyze keywords'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/content/headings
 * Analyze heading structure (H1, H2, H3 hierarchy and quality)
 */
router.post('/headings', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var content, headingAnalysis, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                content = analyzeHeadingsSchema.parse(req.body).content;
                return [4 /*yield*/, contentService.analyzeHeadings(content)];
            case 1:
                headingAnalysis = _a.sent();
                res.json({
                    success: true,
                    data: headingAnalysis
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error('Error analyzing headings:', error_4);
                res.status(400).json({
                    success: false,
                    error: error_4 instanceof Error ? error_4.message : 'Failed to analyze headings'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/content/links
 * Analyze internal and external links (count, quality, anchor text)
 */
router.post('/links', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var content, linkAnalysis, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                content = analyzeLinksSchema.parse(req.body).content;
                return [4 /*yield*/, contentService.analyzeLinks(content)];
            case 1:
                linkAnalysis = _a.sent();
                res.json({
                    success: true,
                    data: linkAnalysis
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                console.error('Error analyzing links:', error_5);
                res.status(400).json({
                    success: false,
                    error: error_5 instanceof Error ? error_5.message : 'Failed to analyze links'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/content/images
 * Analyze images and alt text quality
 */
router.post('/images', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var content, imageAnalysis, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                content = analyzeImagesSchema.parse(req.body).content;
                return [4 /*yield*/, contentService.analyzeImages(content)];
            case 1:
                imageAnalysis = _a.sent();
                res.json({
                    success: true,
                    data: imageAnalysis
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                console.error('Error analyzing images:', error_6);
                res.status(400).json({
                    success: false,
                    error: error_6 instanceof Error ? error_6.message : 'Failed to analyze images'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/content/eeat
 * Analyze E-E-A-T signals (Experience, Expertise, Authoritativeness, Trustworthiness)
 */
router.post('/eeat', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var content, eeatAnalysis, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                content = analyzeEEATSchema.parse(req.body).content;
                return [4 /*yield*/, contentService.analyzeEEAT(content)];
            case 1:
                eeatAnalysis = _a.sent();
                res.json({
                    success: true,
                    data: eeatAnalysis
                });
                return [3 /*break*/, 3];
            case 2:
                error_7 = _a.sent();
                console.error('Error analyzing E-E-A-T:', error_7);
                res.status(400).json({
                    success: false,
                    error: error_7 instanceof Error ? error_7.message : 'Failed to analyze E-E-A-T'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/content/optimize
 * Generate optimized content metadata with JSON-LD for SEO Agent
 * (Lightweight endpoint for quick content optimization)
 */
router.post('/optimize', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, html, markdown, _personaId, targetKeyword, content, primary, title, metaDescription, h1, suggestions, wordCount, jsonLd;
    return __generator(this, function (_b) {
        try {
            _a = optimizeContentSchema.parse(req.body), html = _a.html, markdown = _a.markdown, _personaId = _a.personaId, targetKeyword = _a.targetKeyword;
            content = markdown || html || "";
            primary = targetKeyword || "your topic";
            title = "".concat(primary.charAt(0).toUpperCase() + primary.slice(1), " | Comprehensive Guide");
            metaDescription = "Discover everything about ".concat(primary, ". Expert insights, actionable tips, and detailed analysis to help you succeed.");
            h1 = "Complete Guide to ".concat(primary.charAt(0).toUpperCase() + primary.slice(1));
            suggestions = [
                "Ensure canonical URL is set to avoid duplicate content issues.",
                "Include internal links to related articles for better site architecture.",
                "Use schema.org Article markup for rich snippets in search results.",
                "Target keyword \"".concat(primary, "\" should appear in the first 100 words."),
                "Add alt text to all images with relevant keywords.",
            ];
            wordCount = content.split(/\s+/).length;
            if (wordCount < 300) {
                suggestions.push("Expand content to at least 800 words for better search visibility.");
            }
            jsonLd = {
                "@context": "https://schema.org",
                "@type": "Article",
                headline: title,
                description: metaDescription,
                author: {
                    "@type": "Organization",
                    name: "NeonHub",
                },
                publisher: {
                    "@type": "Organization",
                    name: "NeonHub",
                    logo: {
                        "@type": "ImageObject",
                        url: "https://neonhub.com/logo.png",
                    },
                },
                datePublished: new Date().toISOString(),
                dateModified: new Date().toISOString(),
                mainEntityOfPage: {
                    "@type": "WebPage",
                    "@id": "https://neonhub.com/content",
                },
            };
            res.json({
                success: true,
                data: {
                    title: title,
                    metaDescription: metaDescription,
                    h1: h1,
                    suggestions: suggestions,
                    jsonLd: jsonLd,
                    optimizedAt: new Date().toISOString(),
                }
            });
        }
        catch (error) {
            console.error('Error optimizing content:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to optimize content'
            });
        }
        return [2 /*return*/];
    });
}); });
exports.default = router;
