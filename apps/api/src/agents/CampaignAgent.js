"use strict";
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
exports.campaignAgent = exports.CampaignAgent = void 0;
var prisma_js_1 = require("../db/prisma.js");
var AgentJobManager_js_1 = require("./base/AgentJobManager.js");
var logger_js_1 = require("../lib/logger.js");
var index_js_1 = require("../ws/index.js");
var EmailAgent_js_1 = require("./EmailAgent.js");
var SocialAgent_js_1 = require("./SocialAgent.js");
var mappers_js_1 = require("../lib/mappers.js");
/**
 * CampaignAgent - Orchestrates multi-channel marketing campaigns
 */
var CampaignAgent = /** @class */ (function () {
    function CampaignAgent() {
        this.agentName = "campaign";
    }
    CampaignAgent.prototype.resolveOrganizationId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var membership;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.organizationMembership.findFirst({
                            where: { userId: userId },
                            select: { organizationId: true },
                        })];
                    case 1:
                        membership = _a.sent();
                        if (!membership) {
                            throw new Error("Organization context not found");
                        }
                        return [2 /*return*/, membership.organizationId];
                }
            });
        });
    };
    /**
     * Create a new campaign
     */
    CampaignAgent.prototype.createCampaign = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, jobId, organizationId, _a, owner, organization, config, campaign, duration, error_1, errorMessage;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        startTime = Date.now();
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.createJob({
                                agent: this.agentName,
                                input: input,
                                createdById: input.ownerId,
                            })];
                    case 1:
                        jobId = _c.sent();
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 9, , 11]);
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.startJob(jobId)];
                    case 3:
                        _c.sent();
                        if (!((_b = input.organizationId) !== null && _b !== void 0)) return [3 /*break*/, 4];
                        _a = _b;
                        return [3 /*break*/, 6];
                    case 4: return [4 /*yield*/, this.resolveOrganizationId(input.ownerId)];
                    case 5:
                        _a = (_c.sent());
                        _c.label = 6;
                    case 6:
                        organizationId = _a;
                        owner = (0, mappers_js_1.connectById)(input.ownerId);
                        organization = (0, mappers_js_1.connectById)(organizationId);
                        if (!owner || !organization) {
                            throw new Error("Unable to resolve campaign ownership context");
                        }
                        config = input.config ? input.config : undefined;
                        return [4 /*yield*/, prisma_js_1.prisma.campaign.create({
                                data: __assign(__assign({ name: input.name, type: input.type, status: "draft" }, (config !== undefined ? { config: config } : {})), { owner: owner, organization: organization }),
                            })];
                    case 7:
                        campaign = _c.sent();
                        duration = Date.now() - startTime;
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.completeJob(jobId, {
                                campaignId: campaign.id,
                                name: campaign.name,
                                type: campaign.type,
                            }, {
                                duration: duration,
                            })];
                    case 8:
                        _c.sent();
                        logger_js_1.logger.info({
                            jobId: jobId,
                            campaignId: campaign.id,
                            type: campaign.type,
                            duration: duration,
                        }, "Campaign created");
                        (0, index_js_1.broadcast)("campaign:created", {
                            campaignId: campaign.id,
                            name: campaign.name,
                            type: campaign.type,
                            status: campaign.status,
                        });
                        return [2 /*return*/, {
                                jobId: jobId,
                                campaignId: campaign.id,
                            }];
                    case 9:
                        error_1 = _c.sent();
                        errorMessage = error_1 instanceof Error ? error_1.message : "Unknown error";
                        logger_js_1.logger.error({ jobId: jobId, error: errorMessage }, "Campaign creation failed");
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.failJob(jobId, errorMessage)];
                    case 10:
                        _c.sent();
                        throw error_1;
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Schedule a campaign with email sequences and social posts
     */
    CampaignAgent.prototype.scheduleCampaign = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, jobId, campaign, scheduled, _i, _a, email, scheduledFor, emailSeq, _b, _c, post, socialPost, duration, error_2, errorMessage;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        startTime = Date.now();
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.createJob({
                                agent: this.agentName,
                                input: input,
                                createdById: input.requestedById,
                            })];
                    case 1:
                        jobId = _d.sent();
                        _d.label = 2;
                    case 2:
                        _d.trys.push([2, 15, , 17]);
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.startJob(jobId)];
                    case 3:
                        _d.sent();
                        return [4 /*yield*/, prisma_js_1.prisma.campaign.findUnique({
                                where: { id: input.campaignId },
                            })];
                    case 4:
                        campaign = _d.sent();
                        if (!campaign) {
                            throw new Error("Campaign not found");
                        }
                        scheduled = {
                            emails: [],
                            posts: [],
                        };
                        if (!(input.schedule.emailSequence && input.schedule.emailSequence.length > 0)) return [3 /*break*/, 8];
                        _i = 0, _a = input.schedule.emailSequence;
                        _d.label = 5;
                    case 5:
                        if (!(_i < _a.length)) return [3 /*break*/, 8];
                        email = _a[_i];
                        scheduledFor = new Date(input.schedule.startDate);
                        scheduledFor.setDate(scheduledFor.getDate() + email.day);
                        return [4 /*yield*/, prisma_js_1.prisma.emailSequence.create({
                                data: {
                                    campaignId: input.campaignId,
                                    subject: email.subject,
                                    body: email.body,
                                    scheduledFor: scheduledFor,
                                },
                            })];
                    case 6:
                        emailSeq = _d.sent();
                        scheduled.emails.push({
                            id: emailSeq.id,
                            day: email.day,
                            scheduledFor: scheduledFor,
                        });
                        _d.label = 7;
                    case 7:
                        _i++;
                        return [3 /*break*/, 5];
                    case 8:
                        if (!(input.schedule.socialPosts && input.schedule.socialPosts.length > 0)) return [3 /*break*/, 12];
                        _b = 0, _c = input.schedule.socialPosts;
                        _d.label = 9;
                    case 9:
                        if (!(_b < _c.length)) return [3 /*break*/, 12];
                        post = _c[_b];
                        return [4 /*yield*/, prisma_js_1.prisma.socialPost.create({
                                data: {
                                    campaignId: input.campaignId,
                                    platform: post.platform,
                                    content: post.content,
                                    scheduledFor: post.scheduledFor,
                                },
                            })];
                    case 10:
                        socialPost = _d.sent();
                        scheduled.posts.push({
                            id: socialPost.id,
                            platform: post.platform,
                            scheduledFor: post.scheduledFor,
                        });
                        _d.label = 11;
                    case 11:
                        _b++;
                        return [3 /*break*/, 9];
                    case 12: 
                    // Update campaign status and schedule
                    return [4 /*yield*/, prisma_js_1.prisma.campaign.update({
                            where: { id: input.campaignId },
                            data: {
                                status: "scheduled",
                                schedule: {
                                    startDate: input.schedule.startDate,
                                    endDate: input.schedule.endDate,
                                },
                            },
                        })];
                    case 13:
                        // Update campaign status and schedule
                        _d.sent();
                        duration = Date.now() - startTime;
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.completeJob(jobId, {
                                campaignId: input.campaignId,
                                scheduled: scheduled,
                            }, {
                                duration: duration,
                            })];
                    case 14:
                        _d.sent();
                        logger_js_1.logger.info({
                            jobId: jobId,
                            campaignId: input.campaignId,
                            emailCount: scheduled.emails.length,
                            postCount: scheduled.posts.length,
                            duration: duration,
                        }, "Campaign scheduled");
                        (0, index_js_1.broadcast)("campaign:scheduled", {
                            campaignId: input.campaignId,
                            startDate: input.schedule.startDate,
                            emailCount: scheduled.emails.length,
                            postCount: scheduled.posts.length,
                        });
                        return [2 /*return*/, {
                                jobId: jobId,
                                scheduled: scheduled,
                            }];
                    case 15:
                        error_2 = _d.sent();
                        errorMessage = error_2 instanceof Error ? error_2.message : "Unknown error";
                        logger_js_1.logger.error({ jobId: jobId, error: errorMessage }, "Campaign scheduling failed");
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.failJob(jobId, errorMessage)];
                    case 16:
                        _d.sent();
                        throw error_2;
                    case 17: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Run A/B test for campaign
     */
    CampaignAgent.prototype.runABTest = function (campaignId, variants, requestedById) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, jobId, result, duration, error_3, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.createJob({
                                agent: this.agentName,
                                input: { campaignId: campaignId, variants: variants },
                                createdById: requestedById,
                            })];
                    case 1:
                        jobId = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 6, , 8]);
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.startJob(jobId)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, EmailAgent_js_1.emailAgent.runABTest({
                                campaignId: campaignId,
                                variants: variants,
                                createdById: requestedById,
                            })];
                    case 4:
                        result = _a.sent();
                        duration = Date.now() - startTime;
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.completeJob(jobId, {
                                testId: result.testId,
                                variantCount: variants.length,
                            }, {
                                duration: duration,
                            })];
                    case 5:
                        _a.sent();
                        logger_js_1.logger.info({
                            jobId: jobId,
                            campaignId: campaignId,
                            testId: result.testId,
                            duration: duration,
                        }, "A/B test initiated");
                        return [2 /*return*/, {
                                jobId: jobId,
                                testId: result.testId,
                            }];
                    case 6:
                        error_3 = _a.sent();
                        errorMessage = error_3 instanceof Error ? error_3.message : "Unknown error";
                        logger_js_1.logger.error({ jobId: jobId, error: errorMessage }, "A/B test failed");
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.failJob(jobId, errorMessage)];
                    case 7:
                        _a.sent();
                        throw error_3;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get comprehensive campaign metrics
     */
    CampaignAgent.prototype.getCampaignMetrics = function (campaignId) {
        return __awaiter(this, void 0, void 0, function () {
            var campaign, emailMetrics, socialMetrics, overallMetrics;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.campaign.findUnique({
                            where: { id: campaignId },
                            include: {
                                emailSequences: {
                                    select: {
                                        id: true,
                                        subject: true,
                                        sentAt: true,
                                        metrics: true,
                                    },
                                },
                                socialPosts: {
                                    select: {
                                        id: true,
                                        platform: true,
                                        publishedAt: true,
                                        metrics: true,
                                    },
                                },
                                abTests: {
                                    select: {
                                        id: true,
                                        name: true,
                                        winner: true,
                                        metrics: true,
                                    },
                                },
                            },
                        })];
                    case 1:
                        campaign = _a.sent();
                        if (!campaign) {
                            throw new Error("Campaign not found");
                        }
                        return [4 /*yield*/, EmailAgent_js_1.emailAgent.analyzePerformance(campaignId)];
                    case 2:
                        emailMetrics = _a.sent();
                        return [4 /*yield*/, SocialAgent_js_1.socialAgent.getAnalytics({ campaignId: campaignId })];
                    case 3:
                        socialMetrics = _a.sent();
                        overallMetrics = {
                            campaign: {
                                id: campaign.id,
                                name: campaign.name,
                                type: campaign.type,
                                status: campaign.status,
                                createdAt: campaign.createdAt,
                            },
                            email: emailMetrics,
                            social: socialMetrics,
                            abTests: campaign.abTests.map(function (test) { return ({
                                id: test.id,
                                name: test.name,
                                winner: test.winner,
                                metrics: test.metrics,
                            }); }),
                        };
                        return [2 /*return*/, overallMetrics];
                }
            });
        });
    };
    /**
     * Optimize campaign based on performance data
     */
    CampaignAgent.prototype.optimizeCampaign = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, jobId, metrics, recommendations_1, duration, error_4, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.createJob({
                                agent: this.agentName,
                                input: input,
                                createdById: input.requestedById,
                            })];
                    case 1:
                        jobId = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 6, , 8]);
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.startJob(jobId)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.getCampaignMetrics(input.campaignId)];
                    case 4:
                        metrics = _a.sent();
                        recommendations_1 = [];
                        // Email optimization recommendations
                        if (metrics.email.openRate < 20) {
                            recommendations_1.push("Improve email subject lines - current open rate is below industry average");
                        }
                        if (metrics.email.clickRate < 2) {
                            recommendations_1.push("Add stronger call-to-actions to improve click-through rate");
                        }
                        // Social optimization recommendations
                        if (metrics.social.byPlatform) {
                            metrics.social.byPlatform.forEach(function (platform) {
                                var engagementRate = platform.totalLikes / (platform.totalImpressions || 1);
                                if (engagementRate < 0.02) {
                                    recommendations_1.push("Optimize ".concat(platform.platform, " content for better engagement"));
                                }
                            });
                        }
                        // A/B test recommendations
                        if (metrics.abTests.length === 0) {
                            recommendations_1.push("Run A/B tests to identify best-performing content");
                        }
                        // General recommendations
                        if (input.optimizationGoals.includes("conversion")) {
                            recommendations_1.push("Focus on conversion-optimized landing pages");
                        }
                        if (input.optimizationGoals.includes("reach")) {
                            recommendations_1.push("Increase posting frequency and use trending hashtags");
                        }
                        duration = Date.now() - startTime;
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.completeJob(jobId, {
                                campaignId: input.campaignId,
                                recommendations: recommendations_1,
                                currentMetrics: metrics,
                            }, {
                                duration: duration,
                            })];
                    case 5:
                        _a.sent();
                        logger_js_1.logger.info({
                            jobId: jobId,
                            campaignId: input.campaignId,
                            recommendationCount: recommendations_1.length,
                            duration: duration,
                        }, "Campaign optimization complete");
                        (0, index_js_1.broadcast)("campaign:optimized", {
                            campaignId: input.campaignId,
                            recommendations: recommendations_1,
                        });
                        return [2 /*return*/, {
                                jobId: jobId,
                                recommendations: recommendations_1,
                            }];
                    case 6:
                        error_4 = _a.sent();
                        errorMessage = error_4 instanceof Error ? error_4.message : "Unknown error";
                        logger_js_1.logger.error({ jobId: jobId, error: errorMessage }, "Campaign optimization failed");
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.failJob(jobId, errorMessage)];
                    case 7:
                        _a.sent();
                        throw error_4;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Update campaign status
     */
    CampaignAgent.prototype.updateCampaignStatus = function (campaignId, status) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.campaign.update({
                            where: { id: campaignId },
                            data: { status: status },
                        })];
                    case 1:
                        _a.sent();
                        logger_js_1.logger.info({ campaignId: campaignId, status: status }, "Campaign status updated");
                        (0, index_js_1.broadcast)("campaign:status:changed", {
                            campaignId: campaignId,
                            status: status,
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get campaign by ID
     */
    CampaignAgent.prototype.getCampaign = function (campaignId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, prisma_js_1.prisma.campaign.findUnique({
                        where: { id: campaignId },
                        include: {
                            emailSequences: true,
                            socialPosts: true,
                            abTests: true,
                            owner: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    })];
            });
        });
    };
    /**
     * List user campaigns
     */
    CampaignAgent.prototype.listCampaigns = function (ownerId, filters) {
        return __awaiter(this, void 0, void 0, function () {
            var where;
            return __generator(this, function (_a) {
                where = __assign(__assign({ ownerId: ownerId }, ((filters === null || filters === void 0 ? void 0 : filters.status) ? { status: filters.status } : {})), ((filters === null || filters === void 0 ? void 0 : filters.type) ? { type: filters.type } : {}));
                return [2 /*return*/, prisma_js_1.prisma.campaign.findMany({
                        where: where,
                        include: {
                            _count: {
                                select: {
                                    emailSequences: true,
                                    socialPosts: true,
                                    abTests: true,
                                },
                            },
                        },
                        orderBy: {
                            createdAt: "desc",
                        },
                    })];
            });
        });
    };
    /**
     * Delete campaign
     */
    CampaignAgent.prototype.deleteCampaign = function (campaignId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.campaign.delete({
                            where: { id: campaignId },
                        })];
                    case 1:
                        _a.sent();
                        logger_js_1.logger.info({ campaignId: campaignId }, "Campaign deleted");
                        (0, index_js_1.broadcast)("campaign:deleted", {
                            campaignId: campaignId,
                        });
                        return [2 /*return*/];
                }
            });
        });
    };
    return CampaignAgent;
}());
exports.CampaignAgent = CampaignAgent;
exports.campaignAgent = new CampaignAgent();
