"use strict";
/**
 * SEO Internal Linking API Routes
 *
 * Endpoints for internal link suggestions, anchor text generation, and topic clustering
 *
 * @module routes/seo/links
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
var internal_linking_service_1 = require("@/services/seo/internal-linking.service");
var prisma_1 = require("@/lib/prisma");
var router = (0, express_1.Router)();
var linkingService = new internal_linking_service_1.InternalLinkingService(prisma_1.prisma);
// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================
var suggestLinksSchema = zod_1.z.object({
    currentPageUrl: zod_1.z.string().url(),
    currentPageContent: zod_1.z.string().min(100).max(50000),
    targetKeyword: zod_1.z.string().min(1).max(200),
    maxSuggestions: zod_1.z.number().int().min(1).max(20).optional().default(5)
});
var generateAnchorTextSchema = zod_1.z.object({
    sourceContent: zod_1.z.string().min(100).max(5000),
    targetKeyword: zod_1.z.string().min(1).max(200),
    targetTitle: zod_1.z.string().min(1).max(200)
});
var validateAnchorTextSchema = zod_1.z.object({
    anchorText: zod_1.z.string().min(1).max(200)
});
var buildTopicClustersSchema = zod_1.z.object({
    topic: zod_1.z.string().min(1).max(200)
});
// ============================================================================
// ROUTES
// ============================================================================
/**
 * POST /api/seo/links/suggest
 * Suggest internal links for a page based on semantic similarity
 */
router.post('/suggest', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, currentPageUrl, currentPageContent, targetKeyword, maxSuggestions, suggestions, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = suggestLinksSchema.parse(req.body), currentPageUrl = _a.currentPageUrl, currentPageContent = _a.currentPageContent, targetKeyword = _a.targetKeyword, maxSuggestions = _a.maxSuggestions;
                return [4 /*yield*/, linkingService.suggestLinks({
                        currentPageUrl: currentPageUrl,
                        currentPageContent: currentPageContent,
                        targetKeyword: targetKeyword,
                        maxSuggestions: maxSuggestions
                    })];
            case 1:
                suggestions = _b.sent();
                res.json({
                    success: true,
                    data: suggestions,
                    count: suggestions.length,
                    sourceUrl: currentPageUrl
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                console.error('Error suggesting links:', error_1);
                res.status(400).json({
                    success: false,
                    error: error_1 instanceof Error ? error_1.message : 'Failed to suggest links'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/links/generate-anchor
 * Generate contextual anchor text for a link
 */
router.post('/generate-anchor', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, sourceContent, targetKeyword, targetTitle, anchorText, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = generateAnchorTextSchema.parse(req.body), sourceContent = _a.sourceContent, targetKeyword = _a.targetKeyword, targetTitle = _a.targetTitle;
                return [4 /*yield*/, linkingService.generateAnchorText(sourceContent, targetKeyword, targetTitle)];
            case 1:
                anchorText = _b.sent();
                res.json({
                    success: true,
                    data: {
                        anchorText: anchorText,
                        targetKeyword: targetKeyword,
                        targetTitle: targetTitle
                    }
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                console.error('Error generating anchor text:', error_2);
                res.status(400).json({
                    success: false,
                    error: error_2 instanceof Error ? error_2.message : 'Failed to generate anchor text'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/links/validate-anchor
 * Validate anchor text quality
 */
router.post('/validate-anchor', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var anchorText, validation;
    return __generator(this, function (_a) {
        try {
            anchorText = validateAnchorTextSchema.parse(req.body).anchorText;
            validation = linkingService.validateAnchorText(anchorText);
            res.json({
                success: true,
                data: validation
            });
        }
        catch (error) {
            console.error('Error validating anchor text:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to validate anchor text'
            });
        }
        return [2 /*return*/];
    });
}); });
/**
 * GET /api/seo/links/site-structure
 * Analyze site-wide internal linking structure
 */
router.get('/site-structure', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var analytics, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, linkingService.analyzeSiteStructure()];
            case 1:
                analytics = _a.sent();
                res.json({
                    success: true,
                    data: analytics
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Error analyzing site structure:', error_3);
                res.status(500).json({
                    success: false,
                    error: error_3 instanceof Error ? error_3.message : 'Failed to analyze site structure'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/links/topic-clusters
 * Build topic clusters (pillar pages + supporting pages)
 */
router.post('/topic-clusters', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var topic, clusters, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                topic = buildTopicClustersSchema.parse(req.body).topic;
                return [4 /*yield*/, linkingService.buildTopicClusters(topic)];
            case 1:
                clusters = _a.sent();
                res.json({
                    success: true,
                    data: clusters,
                    count: clusters.length,
                    topic: topic
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error('Error building topic clusters:', error_4);
                res.status(400).json({
                    success: false,
                    error: error_4 instanceof Error ? error_4.message : 'Failed to build topic clusters'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
