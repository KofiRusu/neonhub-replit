"use strict";
/**
 * SEO Meta Tags API Routes
 *
 * Endpoints for AI-powered title and meta description generation
 *
 * @module routes/seo/meta
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var zod_1 = require("zod");
var meta_generation_service_1 = require("@/services/seo/meta-generation.service");
var router = (0, express_1.Router)();
var metaService = new meta_generation_service_1.MetaGenerationService();
// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================
var metaRequirementsSchema = zod_1.z.object({
    keyword: zod_1.z.string().min(1).max(200),
    pageType: zod_1.z.enum(['homepage', 'product', 'blog', 'docs', 'landing', 'comparison']),
    pageContent: zod_1.z.string().max(5000).optional(),
    brand: zod_1.z.string().max(50).optional(),
    targetAudience: zod_1.z.string().max(200).optional(),
    uniqueSellingPoint: zod_1.z.string().max(200).optional()
});
var generateTitleSchema = metaRequirementsSchema;
var generateDescriptionSchema = metaRequirementsSchema;
var generateMetaTagsSchema = metaRequirementsSchema;
var generateWithVariationsSchema = metaRequirementsSchema.extend({
    variationCount: zod_1.z.number().int().min(2).max(5).optional().default(3)
});
var validateMetaTagsSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(200),
    description: zod_1.z.string().min(1).max(500),
    keyword: zod_1.z.string().min(1).max(200)
});
var toMetaRequirements = function (input) { return ({
    keyword: input.keyword,
    pageType: input.pageType,
    pageContent: input.pageContent,
    brand: input.brand,
    targetAudience: input.targetAudience,
    uniqueSellingPoint: input.uniqueSellingPoint
}); };
// ============================================================================
// ROUTES
// ============================================================================
/**
 * POST /api/seo/meta/generate-title
 * Generate optimized title tag
 */
router.post('/generate-title', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var parsed, requirements, title, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                parsed = generateTitleSchema.parse(req.body);
                requirements = toMetaRequirements(parsed);
                return [4 /*yield*/, metaService.generateTitle(requirements)];
            case 1:
                title = _a.sent();
                res.json({
                    success: true,
                    data: title
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Error generating title:', error_1);
                res.status(400).json({
                    success: false,
                    error: error_1 instanceof Error ? error_1.message : 'Failed to generate title'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/meta/generate-title-variations
 * Generate multiple title variations for A/B testing
 */
router.post('/generate-title-variations', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var parsed, variationCount, rest, requirements, variations, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                parsed = generateWithVariationsSchema.parse(req.body);
                variationCount = parsed.variationCount, rest = __rest(parsed, ["variationCount"]);
                requirements = toMetaRequirements(rest);
                return [4 /*yield*/, metaService.generateTitleVariations(requirements, variationCount)];
            case 1:
                variations = _a.sent();
                res.json({
                    success: true,
                    data: variations,
                    count: variations.length
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                console.error('Error generating title variations:', error_2);
                res.status(400).json({
                    success: false,
                    error: error_2 instanceof Error ? error_2.message : 'Failed to generate title variations'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/meta/generate-description
 * Generate optimized meta description
 */
router.post('/generate-description', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var parsed, requirements, description, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                parsed = generateDescriptionSchema.parse(req.body);
                requirements = toMetaRequirements(parsed);
                return [4 /*yield*/, metaService.generateDescription(requirements)];
            case 1:
                description = _a.sent();
                res.json({
                    success: true,
                    data: description
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Error generating description:', error_3);
                res.status(400).json({
                    success: false,
                    error: error_3 instanceof Error ? error_3.message : 'Failed to generate description'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/meta/generate-description-variations
 * Generate multiple description variations for A/B testing
 */
router.post('/generate-description-variations', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var parsed, variationCount, rest, requirements, variations, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                parsed = generateWithVariationsSchema.parse(req.body);
                variationCount = parsed.variationCount, rest = __rest(parsed, ["variationCount"]);
                requirements = toMetaRequirements(rest);
                return [4 /*yield*/, metaService.generateDescriptionVariations(requirements, variationCount)];
            case 1:
                variations = _a.sent();
                res.json({
                    success: true,
                    data: variations,
                    count: variations.length
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error('Error generating description variations:', error_4);
                res.status(400).json({
                    success: false,
                    error: error_4 instanceof Error ? error_4.message : 'Failed to generate description variations'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/meta/generate
 * Generate complete meta tags (title + description)
 */
router.post('/generate', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var parsed, requirements, metaTags, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                parsed = generateMetaTagsSchema.parse(req.body);
                requirements = toMetaRequirements(parsed);
                return [4 /*yield*/, metaService.generateMetaTags(requirements)];
            case 1:
                metaTags = _a.sent();
                res.json({
                    success: true,
                    data: metaTags
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                console.error('Error generating meta tags:', error_5);
                res.status(400).json({
                    success: false,
                    error: error_5 instanceof Error ? error_5.message : 'Failed to generate meta tags'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/meta/generate-with-alternatives
 * Generate meta tags with A/B testing alternatives
 */
router.post('/generate-with-alternatives', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var parsed, variationCount, rest, requirements, metaTags, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                parsed = generateWithVariationsSchema.parse(req.body);
                variationCount = parsed.variationCount, rest = __rest(parsed, ["variationCount"]);
                requirements = toMetaRequirements(rest);
                return [4 /*yield*/, metaService.generateMetaTagsWithAlternatives(requirements, variationCount)];
            case 1:
                metaTags = _a.sent();
                res.json({
                    success: true,
                    data: metaTags
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                console.error('Error generating meta tags with alternatives:', error_6);
                res.status(400).json({
                    success: false,
                    error: error_6 instanceof Error ? error_6.message : 'Failed to generate meta tags with alternatives'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/seo/meta/validate
 * Validate existing meta tags and get recommendations
 */
router.post('/validate', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, title, description, keyword, validation;
    return __generator(this, function (_b) {
        try {
            _a = validateMetaTagsSchema.parse(req.body), title = _a.title, description = _a.description, keyword = _a.keyword;
            validation = metaService.validateMetaTags(title, description, keyword);
            res.json({
                success: true,
                data: validation
            });
        }
        catch (error) {
            console.error('Error validating meta tags:', error);
            res.status(400).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to validate meta tags'
            });
        }
        return [2 /*return*/];
    });
}); });
exports.default = router;
