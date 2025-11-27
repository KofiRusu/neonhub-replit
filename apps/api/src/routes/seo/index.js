"use strict";
/**
 * SEO API Routes - Main Router
 *
 * Aggregates all SEO-related routes:
 * - Keywords (research, intent, prioritization)
 * - Meta tags (generation, validation, A/B testing)
 * - Content (analysis, optimization, recommendations)
 * - Recommendations (weekly, competitive, trending)
 * - Links (internal linking, anchor text, topic clusters)
 *
 * @module routes/seo
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
var keywords_1 = require("./keywords");
var meta_1 = require("./meta");
var content_1 = require("./content");
var recommendations_1 = require("./recommendations");
var links_1 = require("./links");
var seo_service_1 = require("../../services/seo.service");
var router = (0, express_1.Router)();
// Mount sub-routers
router.use('/keywords', keywords_1.default);
router.use('/meta', meta_1.default);
router.use('/content', content_1.default);
router.use('/recommendations', recommendations_1.default);
router.use('/links', links_1.default);
/**
 * GET /api/seo
 * API health check and available endpoints
 */
router.get('/', function (req, res) {
    res.json({
        success: true,
        message: 'NeonHub SEO API',
        version: '1.0.0',
        endpoints: {
            keywords: {
                'POST /keywords/classify-intent': 'Classify search intent for a keyword',
                'POST /keywords/classify-intent-batch': 'Classify intent for multiple keywords',
                'POST /keywords/generate-long-tail': 'Generate long-tail keyword variations',
                'POST /keywords/competitive-gaps': 'Find keyword gaps vs competitors',
                'POST /keywords/prioritize': 'Prioritize keywords by opportunity score',
                'POST /keywords/extract': 'Extract keywords from content',
                'POST /keywords/density': 'Calculate keyword density'
            },
            meta: {
                'POST /meta/generate-title': 'Generate optimized title tag',
                'POST /meta/generate-title-variations': 'Generate title A/B test variations',
                'POST /meta/generate-description': 'Generate optimized meta description',
                'POST /meta/generate-description-variations': 'Generate description A/B test variations',
                'POST /meta/generate': 'Generate complete meta tags',
                'POST /meta/generate-with-alternatives': 'Generate meta tags with alternatives',
                'POST /meta/validate': 'Validate existing meta tags'
            },
            content: {
                'POST /content/analyze': 'Comprehensive content analysis',
                'POST /content/readability': 'Calculate readability scores',
                'POST /content/keywords': 'Analyze keyword optimization',
                'POST /content/headings': 'Analyze heading structure',
                'POST /content/links': 'Analyze links (internal/external)',
                'POST /content/images': 'Analyze images and alt text',
                'POST /content/eeat': 'Analyze E-E-A-T signals'
            },
            recommendations: {
                'GET /recommendations/weekly': 'Generate weekly SEO recommendations',
                'POST /recommendations/competitors': 'Analyze competitors',
                'GET /recommendations/content-gaps': 'Identify content gaps',
                'GET /recommendations/trending': 'Find trending keywords',
                'GET /recommendations/stale-content': 'Find stale content',
                'GET /recommendations/competitive-gaps': 'Find competitive keyword gaps',
                'GET /recommendations/performance-issues': 'Detect performance issues',
                'POST /recommendations/for-page': 'Generate page-specific recommendations'
            },
            links: {
                'POST /links/suggest': 'Suggest internal links for a page',
                'POST /links/generate-anchor': 'Generate anchor text',
                'POST /links/validate-anchor': 'Validate anchor text quality',
                'GET /links/site-structure': 'Analyze site-wide link structure',
                'POST /links/topic-clusters': 'Build topic clusters'
            }
        },
        documentation: '/api/seo/docs'
    });
});
/**
 * GET /api/seo/health
 * Detailed health check for SEO services
 */
router.get('/health', function (req, res) {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            keywords: 'operational',
            meta: 'operational',
            content: 'operational',
            recommendations: 'operational',
            links: 'operational'
        },
        dependencies: {
            openai: process.env.OPENAI_API_KEY ? 'configured' : 'missing',
            prisma: 'operational',
            database: 'operational'
        }
    });
});
/**
 * POST /api/seo/audit
 * Quick SEO audit endpoint (used by SEOAgent)
 */
router.post('/audit', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, url, notes, data, e_1, message;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, url = _a.url, notes = _a.notes;
                if (!url) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            error: 'url required'
                        })];
                }
                return [4 /*yield*/, (0, seo_service_1.audit)({ url: url, notes: notes })];
            case 1:
                data = _b.sent();
                return [2 /*return*/, res.json({
                        success: true,
                        data: data
                    })];
            case 2:
                e_1 = _b.sent();
                message = e_1 instanceof Error ? e_1.message : "Server error";
                return [2 /*return*/, res.status(500).json({
                        success: false,
                        error: message
                    })];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
