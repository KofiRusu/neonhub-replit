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
exports.campaignRouter = void 0;
var express_1 = require("express");
var zod_1 = require("zod");
var CampaignAgent_js_1 = require("../agents/CampaignAgent.js");
var EmailAgent_js_1 = require("../agents/EmailAgent.js");
var SocialAgent_js_1 = require("../agents/SocialAgent.js");
var errors_js_1 = require("../lib/errors.js");
var logger_js_1 = require("../lib/logger.js");
var requestUser_js_1 = require("../lib/requestUser.js");
var campaign_js_1 = require("../schemas/campaign.js");
var router = (0, express_1.Router)();
/**
 * POST /api/campaigns - Create a new campaign
 */
router.post("/", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var ownerId, body, result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                ownerId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                body = campaign_js_1.createCampaignSchema.parse(req.body);
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.createCampaign({
                        name: body.name,
                        type: body.type,
                        config: body.config,
                        ownerId: ownerId,
                    })];
            case 1:
                result = _a.sent();
                res.status(201).json({
                    success: true,
                    data: result,
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                if (error_1 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Validation failed", 400, "VALIDATION_ERROR"))];
                }
                next(error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/campaigns - List user campaigns
 */
router.get("/", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var ownerId, query, campaigns, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                ownerId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                query = campaign_js_1.listCampaignsQuerySchema.parse(req.query);
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.listCampaigns(ownerId, {
                        status: query.status,
                        type: query.type,
                    })];
            case 1:
                campaigns = _a.sent();
                res.json({
                    success: true,
                    data: campaigns,
                    meta: {
                        total: campaigns.length,
                    },
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                if (error_2 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Validation failed", 400, "VALIDATION_ERROR"))];
                }
                next(error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/campaigns/:id - Get campaign details
 */
router.get("/:id", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var id, ownerId, campaign, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                ownerId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.getCampaign(id)];
            case 1:
                campaign = _a.sent();
                if (!campaign) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Campaign not found", 404, "NOT_FOUND"))];
                }
                if (campaign.ownerId !== ownerId) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Unauthorized", 403, "FORBIDDEN"))];
                }
                res.json({
                    success: true,
                    data: campaign,
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                next(error_3);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * PUT /api/campaigns/:id - Update campaign
 */
router.put("/:id", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var id, ownerId, campaign, updated, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                id = req.params.id;
                ownerId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                campaign_js_1.updateCampaignSchema.parse(req.body);
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.getCampaign(id)];
            case 1:
                campaign = _a.sent();
                if (!campaign) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Campaign not found", 404, "NOT_FOUND"))];
                }
                if (campaign.ownerId !== ownerId) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Unauthorized", 403, "FORBIDDEN"))];
                }
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.getCampaign(id)];
            case 2:
                updated = _a.sent();
                res.json({
                    success: true,
                    data: updated,
                });
                return [3 /*break*/, 4];
            case 3:
                error_4 = _a.sent();
                if (error_4 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Validation failed", 400, "VALIDATION_ERROR"))];
                }
                next(error_4);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * DELETE /api/campaigns/:id - Delete campaign
 */
router.delete("/:id", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var id, ownerId, campaign, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                id = req.params.id;
                ownerId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.getCampaign(id)];
            case 1:
                campaign = _a.sent();
                if (!campaign) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Campaign not found", 404, "NOT_FOUND"))];
                }
                if (campaign.ownerId !== ownerId) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Unauthorized", 403, "FORBIDDEN"))];
                }
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.deleteCampaign(id)];
            case 2:
                _a.sent();
                res.json({
                    success: true,
                    message: "Campaign deleted successfully",
                });
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                next(error_5);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/campaigns/:id/schedule - Schedule campaign
 */
router.post("/:id/schedule", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var id, ownerId, body, campaign, result, error_6;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                id = req.params.id;
                ownerId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                body = campaign_js_1.scheduleCampaignSchema.parse(req.body);
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.getCampaign(id)];
            case 1:
                campaign = _b.sent();
                if (!campaign) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Campaign not found", 404, "NOT_FOUND"))];
                }
                if (campaign.ownerId !== ownerId) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Unauthorized", 403, "FORBIDDEN"))];
                }
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.scheduleCampaign({
                        campaignId: id,
                        schedule: {
                            startDate: new Date(body.startDate),
                            endDate: body.endDate ? new Date(body.endDate) : undefined,
                            emailSequence: body.emailSequence,
                            socialPosts: (_a = body.socialPosts) === null || _a === void 0 ? void 0 : _a.map(function (post) { return ({
                                platform: post.platform,
                                content: post.content,
                                scheduledFor: new Date(post.scheduledFor),
                            }); }),
                        },
                        requestedById: ownerId,
                    })];
            case 2:
                result = _b.sent();
                res.json({
                    success: true,
                    data: result,
                });
                return [3 /*break*/, 4];
            case 3:
                error_6 = _b.sent();
                if (error_6 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Validation failed", 400, "VALIDATION_ERROR"))];
                }
                next(error_6);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/campaigns/:id/ab-test - Run A/B test
 */
router.post("/:id/ab-test", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var id, ownerId, body, campaign, result, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                id = req.params.id;
                ownerId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                body = campaign_js_1.runABTestSchema.parse(req.body);
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.getCampaign(id)];
            case 1:
                campaign = _a.sent();
                if (!campaign) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Campaign not found", 404, "NOT_FOUND"))];
                }
                if (campaign.ownerId !== ownerId) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Unauthorized", 403, "FORBIDDEN"))];
                }
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.runABTest(id, body.variants, ownerId)];
            case 2:
                result = _a.sent();
                res.json({
                    success: true,
                    data: result,
                });
                return [3 /*break*/, 4];
            case 3:
                error_7 = _a.sent();
                if (error_7 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Validation failed", 400, "VALIDATION_ERROR"))];
                }
                next(error_7);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/campaigns/:id/analytics - Get campaign analytics
 */
router.get("/:id/analytics", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var id, ownerId, campaign, metrics, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                id = req.params.id;
                ownerId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                campaign_js_1.getCampaignMetricsQuerySchema.parse(req.query);
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.getCampaign(id)];
            case 1:
                campaign = _a.sent();
                if (!campaign) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Campaign not found", 404, "NOT_FOUND"))];
                }
                if (campaign.ownerId !== ownerId) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Unauthorized", 403, "FORBIDDEN"))];
                }
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.getCampaignMetrics(id)];
            case 2:
                metrics = _a.sent();
                res.json({
                    success: true,
                    data: metrics,
                });
                return [3 /*break*/, 4];
            case 3:
                error_8 = _a.sent();
                if (error_8 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Validation failed", 400, "VALIDATION_ERROR"))];
                }
                next(error_8);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/campaigns/:id/optimize - Optimize campaign
 */
router.post("/:id/optimize", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var id, ownerId, body, campaign, result, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                id = req.params.id;
                ownerId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                body = campaign_js_1.optimizeCampaignSchema.parse(req.body);
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.getCampaign(id)];
            case 1:
                campaign = _a.sent();
                if (!campaign) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Campaign not found", 404, "NOT_FOUND"))];
                }
                if (campaign.ownerId !== ownerId) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Unauthorized", 403, "FORBIDDEN"))];
                }
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.optimizeCampaign({
                        campaignId: id,
                        optimizationGoals: body.optimizationGoals,
                        requestedById: ownerId,
                    })];
            case 2:
                result = _a.sent();
                res.json({
                    success: true,
                    data: result,
                });
                return [3 /*break*/, 4];
            case 3:
                error_9 = _a.sent();
                if (error_9 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Validation failed", 400, "VALIDATION_ERROR"))];
                }
                next(error_9);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/campaigns/:id/email/sequence - Generate email sequence
 */
router.post("/:id/email/sequence", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var id, ownerId, body, campaign, result, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                id = req.params.id;
                ownerId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                body = campaign_js_1.generateEmailSequenceSchema.parse(req.body);
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.getCampaign(id)];
            case 1:
                campaign = _a.sent();
                if (!campaign) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Campaign not found", 404, "NOT_FOUND"))];
                }
                if (campaign.ownerId !== ownerId) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Unauthorized", 403, "FORBIDDEN"))];
                }
                return [4 /*yield*/, EmailAgent_js_1.emailAgent.generateSequence({
                        topic: body.topic,
                        audience: body.audience,
                        numEmails: body.numEmails,
                        tone: body.tone,
                        createdById: ownerId,
                    })];
            case 2:
                result = _a.sent();
                res.json({
                    success: true,
                    data: result,
                });
                return [3 /*break*/, 4];
            case 3:
                error_10 = _a.sent();
                if (error_10 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Validation failed", 400, "VALIDATION_ERROR"))];
                }
                next(error_10);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/campaigns/email/optimize-subject - Optimize email subject line
 */
router.post("/email/optimize-subject", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var ownerId, body, result, error_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                ownerId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                body = campaign_js_1.optimizeSubjectLineSchema.parse(req.body);
                return [4 /*yield*/, EmailAgent_js_1.emailAgent.optimizeSubjectLine({
                        originalSubject: body.originalSubject,
                        context: body.context,
                        createdById: ownerId,
                    })];
            case 1:
                result = _a.sent();
                res.json({
                    success: true,
                    data: result,
                });
                return [3 /*break*/, 3];
            case 2:
                error_11 = _a.sent();
                if (error_11 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Validation failed", 400, "VALIDATION_ERROR"))];
                }
                next(error_11);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/campaigns/social/generate - Generate social post
 */
router.post("/social/generate", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var ownerId, body, result, error_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                ownerId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                body = campaign_js_1.generateSocialPostSchema.parse(req.body);
                return [4 /*yield*/, SocialAgent_js_1.socialAgent.generatePost({
                        content: body.content,
                        platform: body.platform,
                        tone: body.tone,
                        includeHashtags: body.includeHashtags,
                        createdById: ownerId,
                    })];
            case 1:
                result = _a.sent();
                res.json({
                    success: true,
                    data: result,
                });
                return [3 /*break*/, 3];
            case 2:
                error_12 = _a.sent();
                if (error_12 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Validation failed", 400, "VALIDATION_ERROR"))];
                }
                next(error_12);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/campaigns/social/optimize - Optimize content for platform
 */
router.post("/social/optimize", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var ownerId, body, result, error_13;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                ownerId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                body = campaign_js_1.optimizeForPlatformSchema.parse(req.body);
                return [4 /*yield*/, SocialAgent_js_1.socialAgent.optimizeForPlatform({
                        content: body.content,
                        platform: body.platform,
                        createdById: ownerId,
                    })];
            case 1:
                result = _a.sent();
                res.json({
                    success: true,
                    data: result,
                });
                return [3 /*break*/, 3];
            case 2:
                error_13 = _a.sent();
                if (error_13 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Validation failed", 400, "VALIDATION_ERROR"))];
                }
                next(error_13);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/campaigns/:id/social/schedule - Schedule social post
 */
router.post("/:id/social/schedule", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var id, ownerId, body, campaign, result, error_14;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                id = req.params.id;
                ownerId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                body = campaign_js_1.schedulePostSchema.parse(req.body);
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.getCampaign(id)];
            case 1:
                campaign = _a.sent();
                if (!campaign) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Campaign not found", 404, "NOT_FOUND"))];
                }
                if (campaign.ownerId !== ownerId) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Unauthorized", 403, "FORBIDDEN"))];
                }
                return [4 /*yield*/, SocialAgent_js_1.socialAgent.schedulePost({
                        campaignId: id,
                        platform: body.platform,
                        content: body.content,
                        mediaUrls: body.mediaUrls,
                        scheduledFor: new Date(body.scheduledFor),
                        createdById: ownerId,
                    })];
            case 2:
                result = _a.sent();
                res.json({
                    success: true,
                    data: result,
                });
                return [3 /*break*/, 4];
            case 3:
                error_14 = _a.sent();
                if (error_14 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Validation failed", 400, "VALIDATION_ERROR"))];
                }
                next(error_14);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * PATCH /api/campaigns/:id/status - Update campaign status
 */
router.patch("/:id/status", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var id, ownerId, status_1, campaign, updated, error_15;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                id = req.params.id;
                ownerId = (0, requestUser_js_1.getAuthenticatedUserId)(req);
                status_1 = req.body.status;
                if (!["draft", "scheduled", "active", "paused", "completed"].includes(status_1)) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Invalid status", 400, "VALIDATION_ERROR"))];
                }
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.getCampaign(id)];
            case 1:
                campaign = _a.sent();
                if (!campaign) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Campaign not found", 404, "NOT_FOUND"))];
                }
                if (campaign.ownerId !== ownerId) {
                    return [2 /*return*/, next(new errors_js_1.AppError("Unauthorized", 403, "FORBIDDEN"))];
                }
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.updateCampaignStatus(id, status_1)];
            case 2:
                _a.sent();
                return [4 /*yield*/, CampaignAgent_js_1.campaignAgent.getCampaign(id)];
            case 3:
                updated = _a.sent();
                res.json({
                    success: true,
                    data: updated,
                });
                return [3 /*break*/, 5];
            case 4:
                error_15 = _a.sent();
                next(error_15);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
logger_js_1.logger.info("Campaign routes registered");
exports.campaignRouter = router;
