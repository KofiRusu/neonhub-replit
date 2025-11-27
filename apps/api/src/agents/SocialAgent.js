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
exports.socialAgent = exports.SocialAgent = void 0;
var zod_1 = require("zod");
var openai_js_1 = require("../ai/openai.js");
var prisma_js_1 = require("../db/prisma.js");
var AgentJobManager_js_1 = require("./base/AgentJobManager.js");
var logger_js_1 = require("../lib/logger.js");
var index_js_1 = require("../ws/index.js");
var normalize_js_1 = require("./_shared/normalize.js");
var agent_run_js_1 = require("./utils/agent-run.js");
var OptimizeForPlatformInputSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "content is required"),
    platform: normalize_js_1.SocialPlatformSchema,
    createdById: zod_1.z.string().optional(),
});
var HashtagPackInputSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "content is required"),
    topic: zod_1.z.string().optional(),
    platform: normalize_js_1.SocialPlatformSchema.default("instagram"),
    createdById: zod_1.z.string().optional(),
});
/**
 * SocialAgent - Generates and optimizes social media content
 */
var SocialAgent = /** @class */ (function () {
    function SocialAgent() {
        this.agentName = "social";
        this.orchestratorAgentId = "SocialAgent";
        // Platform-specific constraints
        this.platformLimits = {
            twitter: { maxLength: 280, optimal: 250 },
            linkedin: { maxLength: 3000, optimal: 150 },
            facebook: { maxLength: 63206, optimal: 250 },
            instagram: { maxLength: 2200, optimal: 138 },
        };
        this.hashtagStopWords = new Set([
            "the",
            "and",
            "for",
            "with",
            "from",
            "that",
            "this",
            "about",
            "into",
            "your",
            "you",
            "have",
            "will",
            "just",
            "more",
            "than",
            "then",
            "them",
            "they",
            "their",
            "what",
            "when",
            "where",
            "which",
            "while",
            "after",
            "before",
            "over",
            "under",
            "between",
            "across",
            "within",
            "without",
            "take",
            "make",
            "made",
        ]);
    }
    /**
     * Generate platform-optimized social media post
     */
    SocialAgent.prototype.generatePost = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, normalized, jobId, platform, limits, tone, contentTopic, hashtagDirective, prompt_1, result, generated, duration, error_1, errorMessage;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        startTime = Date.now();
                        normalized = (0, normalize_js_1.normalizePostInput)(input);
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.createJob({
                                agent: this.agentName,
                                input: normalized,
                                createdById: normalized.createdById,
                            })];
                    case 1:
                        jobId = _c.sent();
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 6, , 8]);
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.startJob(jobId)];
                    case 3:
                        _c.sent();
                        platform = normalized.platform;
                        limits = (_a = this.platformLimits[platform]) !== null && _a !== void 0 ? _a : this.platformLimits.twitter;
                        tone = normalized.tone === "authoritative" ? "professional" : normalized.tone;
                        contentTopic = normalized.content || normalized.topic;
                        hashtagDirective = normalized.includeHashtags && normalized.hashtags.length > 0
                            ? "Use these hashtags: ".concat(normalized.hashtags.join(", "))
                            : normalized.includeHashtags
                                ? "Include relevant hashtags"
                                : "No hashtags";
                        prompt_1 = "Create a ".concat(platform, " post about: ").concat(contentTopic, "\n\nPlatform: ").concat(platform, "\nTone: ").concat(tone, "\nCharacter limit: ").concat(limits.maxLength, " (optimal: ").concat(limits.optimal, ")\n").concat(hashtagDirective, "\nCall to action: ").concat(normalized.callToAction, "\nBrand ID: ").concat(normalized.brandId, "\n\nRequirements:\n").concat(this.getPlatformRequirements(platform), "\n\nReturn as JSON with format:\n{\n  \"content\": \"Post content\",\n  \"hashtags\": [\"tag1\", \"tag2\"],\n  \"estimatedReach\": 1000\n}");
                        logger_js_1.logger.info({ jobId: jobId, platform: platform, contentLength: contentTopic.length, includeHashtags: normalized.includeHashtags }, "Generating social post with AI");
                        return [4 /*yield*/, (0, openai_js_1.generateText)({
                                prompt: prompt_1,
                                temperature: 0.8,
                                maxTokens: 500,
                                systemPrompt: this.getPlatformSystemPrompt(platform),
                            })];
                    case 4:
                        result = _c.sent();
                        generated = this.parseGeneratedPost(result.text, platform);
                        duration = Date.now() - startTime;
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.completeJob(jobId, __assign(__assign({}, generated), { platform: platform, mock: result.mock }), {
                                duration: duration,
                                tokens: ((_b = result.usage) === null || _b === void 0 ? void 0 : _b.totalTokens) || 0,
                                model: result.model,
                            })];
                    case 5:
                        _c.sent();
                        logger_js_1.logger.info({
                            jobId: jobId,
                            platform: platform,
                            contentLength: generated.content.length,
                            duration: duration,
                            mock: result.mock,
                        }, "Social post generation complete");
                        (0, index_js_1.broadcast)("metrics:delta", {
                            type: "social_post_created",
                            increment: 1,
                            platform: platform,
                            timestamp: new Date(),
                        });
                        return [2 /*return*/, __assign({ jobId: jobId }, generated)];
                    case 6:
                        error_1 = _c.sent();
                        errorMessage = error_1 instanceof Error ? error_1.message : "Unknown error";
                        logger_js_1.logger.error({ jobId: jobId, error: errorMessage }, "Social post generation failed");
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.failJob(jobId, errorMessage)];
                    case 7:
                        _c.sent();
                        throw error_1;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Optimize content for specific platform
     */
    SocialAgent.prototype.optimizeForPlatform = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, jobId, limits, prompt_2, result, optimized, duration, error_2, errorMessage;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        startTime = Date.now();
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.createJob({
                                agent: this.agentName,
                                input: input,
                                createdById: input.createdById,
                            })];
                    case 1:
                        jobId = _b.sent();
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 6, , 8]);
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.startJob(jobId)];
                    case 3:
                        _b.sent();
                        limits = this.platformLimits[input.platform];
                        prompt_2 = "Optimize this content for ".concat(input.platform, ":\n\nOriginal: \"").concat(input.content, "\"\n\nPlatform constraints:\n- Max length: ").concat(limits.maxLength, " characters\n- Optimal length: ").concat(limits.optimal, " characters\n").concat(this.getPlatformRequirements(input.platform), "\n\nReturn optimized version as JSON:\n{\n  \"content\": \"Optimized content\",\n  \"hashtags\": [\"relevant\", \"tags\"],\n  \"estimatedReach\": 1500\n}");
                        logger_js_1.logger.info({ jobId: jobId, platform: input.platform }, "Optimizing content for platform");
                        return [4 /*yield*/, (0, openai_js_1.generateText)({
                                prompt: prompt_2,
                                temperature: 0.7,
                                maxTokens: 400,
                                systemPrompt: this.getPlatformSystemPrompt(input.platform),
                            })];
                    case 4:
                        result = _b.sent();
                        optimized = this.parseGeneratedPost(result.text, input.platform);
                        duration = Date.now() - startTime;
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.completeJob(jobId, __assign(__assign({}, optimized), { platform: input.platform, mock: result.mock }), {
                                duration: duration,
                                tokens: ((_a = result.usage) === null || _a === void 0 ? void 0 : _a.totalTokens) || 0,
                                model: result.model,
                            })];
                    case 5:
                        _b.sent();
                        logger_js_1.logger.info({
                            jobId: jobId,
                            platform: input.platform,
                            duration: duration,
                            mock: result.mock,
                        }, "Content optimization complete");
                        return [2 /*return*/, __assign({ jobId: jobId }, optimized)];
                    case 6:
                        error_2 = _b.sent();
                        errorMessage = error_2 instanceof Error ? error_2.message : "Unknown error";
                        logger_js_1.logger.error({ jobId: jobId, error: errorMessage }, "Content optimization failed");
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.failJob(jobId, errorMessage)];
                    case 7:
                        _b.sent();
                        throw error_2;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Build hashtag recommendations without external calls
     */
    SocialAgent.prototype.generateHashtagPack = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, jobId, hashtags, duration, error_3, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.createJob({
                                agent: this.agentName,
                                input: input,
                                createdById: input.createdById,
                            })];
                    case 1:
                        jobId = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 5, , 7]);
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.startJob(jobId)];
                    case 3:
                        _a.sent();
                        hashtags = this.buildHashtagPack(input);
                        duration = Date.now() - startTime;
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.completeJob(jobId, {
                                hashtags: hashtags,
                                platform: input.platform,
                            }, {
                                duration: duration,
                                hashtagCount: hashtags.length,
                                platform: input.platform,
                            })];
                    case 4:
                        _a.sent();
                        (0, index_js_1.broadcast)("metrics:delta", {
                            type: "social_hashtag_pack_created",
                            increment: 1,
                            platform: input.platform,
                            timestamp: new Date(),
                        });
                        return [2 /*return*/, {
                                jobId: jobId,
                                platform: input.platform,
                                hashtags: hashtags,
                            }];
                    case 5:
                        error_3 = _a.sent();
                        errorMessage = error_3 instanceof Error ? error_3.message : "Unknown error";
                        logger_js_1.logger.error({ jobId: jobId, error: errorMessage }, "Hashtag pack generation failed");
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.failJob(jobId, errorMessage)];
                    case 6:
                        _a.sent();
                        throw error_3;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Schedule a post for publishing
     */
    SocialAgent.prototype.schedulePost = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, jobId, post, duration, error_4, errorMessage;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.createJob({
                                agent: this.agentName,
                                input: input,
                                createdById: input.createdById,
                            })];
                    case 1:
                        jobId = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 6, , 8]);
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.startJob(jobId)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, prisma_js_1.prisma.socialPost.create({
                                data: {
                                    campaignId: input.campaignId,
                                    platform: input.platform,
                                    content: input.content,
                                    mediaUrls: input.mediaUrls || null,
                                    scheduledFor: input.scheduledFor,
                                },
                            })];
                    case 4:
                        post = _a.sent();
                        duration = Date.now() - startTime;
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.completeJob(jobId, {
                                postId: post.id,
                                platform: input.platform,
                                scheduledFor: input.scheduledFor,
                            }, {
                                duration: duration,
                            })];
                    case 5:
                        _a.sent();
                        logger_js_1.logger.info({
                            jobId: jobId,
                            postId: post.id,
                            platform: input.platform,
                            duration: duration,
                        }, "Post scheduled");
                        (0, index_js_1.broadcast)("campaign:post:scheduled", {
                            postId: post.id,
                            campaignId: input.campaignId,
                            platform: input.platform,
                            scheduledFor: input.scheduledFor,
                        });
                        return [2 /*return*/, {
                                jobId: jobId,
                                postId: post.id,
                            }];
                    case 6:
                        error_4 = _a.sent();
                        errorMessage = error_4 instanceof Error ? error_4.message : "Unknown error";
                        logger_js_1.logger.error({ jobId: jobId, error: errorMessage }, "Post scheduling failed");
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
     * Get analytics for social posts
     */
    SocialAgent.prototype.getAnalytics = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var where, posts, byPlatform, aggregated, total;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        where = { campaignId: input.campaignId };
                        if (input.platform) {
                            where.platform = input.platform;
                        }
                        return [4 /*yield*/, prisma_js_1.prisma.socialPost.findMany({
                                where: where,
                                select: {
                                    id: true,
                                    platform: true,
                                    publishedAt: true,
                                    metrics: true,
                                },
                            })];
                    case 1:
                        posts = _a.sent();
                        byPlatform = {};
                        posts.forEach(function (post) {
                            if (!byPlatform[post.platform]) {
                                byPlatform[post.platform] = {
                                    platform: post.platform,
                                    posts: 0,
                                    published: 0,
                                    totalImpressions: 0,
                                    totalLikes: 0,
                                    totalShares: 0,
                                    totalComments: 0,
                                    totalClicks: 0,
                                };
                            }
                            var metrics = post.metrics;
                            byPlatform[post.platform].posts++;
                            if (post.publishedAt) {
                                byPlatform[post.platform].published++;
                                if (metrics) {
                                    byPlatform[post.platform].totalImpressions += metrics.impressions || 0;
                                    byPlatform[post.platform].totalLikes += metrics.likes || 0;
                                    byPlatform[post.platform].totalShares += metrics.shares || 0;
                                    byPlatform[post.platform].totalComments += metrics.comments || 0;
                                    byPlatform[post.platform].totalClicks += metrics.clicks || 0;
                                }
                            }
                        });
                        aggregated = Object.values(byPlatform);
                        total = {
                            totalPosts: posts.length,
                            totalPublished: posts.filter(function (p) { return p.publishedAt; }).length,
                            byPlatform: aggregated,
                        };
                        return [2 /*return*/, total];
                }
            });
        });
    };
    /**
     * Get platform-specific requirements
     */
    SocialAgent.prototype.getPlatformRequirements = function (platform) {
        var requirements = {
            twitter: "- Use concise, punchy language\n- Include call-to-action\n- Emojis are encouraged\n- Optimize for engagement",
            linkedin: "- Professional tone\n- Value-driven content\n- Include industry insights\n- Thought leadership angle",
            facebook: "- Conversational tone\n- Story-driven content\n- Community engagement\n- Visual content friendly",
            instagram: "- Visual-first mindset\n- Lifestyle/aesthetic focus\n- Strong call-to-action\n- Strategic hashtag use",
        };
        return requirements[platform] || "- Engaging content\n- Clear message";
    };
    /**
     * Get platform-specific system prompt
     */
    SocialAgent.prototype.getPlatformSystemPrompt = function (platform) {
        var prompts = {
            twitter: "You are a Twitter marketing expert. Create concise, engaging tweets that drive conversation and retweets.",
            linkedin: "You are a LinkedIn content strategist. Create professional, thought-leading posts that establish authority.",
            facebook: "You are a Facebook marketing specialist. Create community-focused posts that encourage sharing and commenting.",
            instagram: "You are an Instagram content creator. Create visually-oriented, lifestyle posts with strategic hashtag use.",
        };
        return prompts[platform] || "You are a social media marketing expert.";
    };
    /**
     * Parse generated post from AI response
     */
    SocialAgent.prototype.parseGeneratedPost = function (text, platform) {
        try {
            var jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                var parsed = JSON.parse(jsonMatch[0]);
                return {
                    content: this.enforceLimit(parsed.content || text, platform),
                    hashtags: parsed.hashtags || [],
                    estimatedReach: parsed.estimatedReach || 1000,
                };
            }
        }
        catch (error) {
            logger_js_1.logger.warn({ error: error }, "Failed to parse post as JSON, using fallback");
        }
        // Fallback: Use text directly
        return {
            content: this.enforceLimit(text, platform),
            hashtags: this.extractHashtags(text),
            estimatedReach: 1000,
        };
    };
    /**
     * Enforce platform character limits
     */
    SocialAgent.prototype.enforceLimit = function (content, platform) {
        var limit = this.platformLimits[platform].maxLength;
        if (content.length <= limit) {
            return content;
        }
        return content.substring(0, limit - 3) + "...";
    };
    /**
     * Extract hashtags from text
     */
    SocialAgent.prototype.extractHashtags = function (text) {
        var matches = text.match(/#\w+/g);
        return matches ? matches.slice(0, 5) : [];
    };
    SocialAgent.prototype.buildHashtagPack = function (input) {
        var _this = this;
        var _a;
        var existing = this.extractHashtags(input.content);
        var baseText = "".concat((_a = input.topic) !== null && _a !== void 0 ? _a : "", " ").concat(input.content);
        var candidates = this.extractHashtagCandidates(baseText);
        var normalized = new Set();
        existing.forEach(function (tag) {
            var formatted = _this.normalizeHashtag(tag);
            if (formatted) {
                normalized.add(formatted);
            }
        });
        candidates.forEach(function (candidate) {
            var formatted = _this.normalizeHashtag(candidate);
            if (formatted) {
                normalized.add(formatted);
            }
        });
        var hashtags = Array.from(normalized).slice(0, 8);
        if (hashtags.length === 0) {
            hashtags.push("#neonhub");
        }
        return hashtags;
    };
    SocialAgent.prototype.extractHashtagCandidates = function (text) {
        var _this = this;
        var _a;
        return ((_a = text.match(/\b[a-zA-Z0-9]{3,}\b/g)) !== null && _a !== void 0 ? _a : [])
            .map(function (token) { return token.toLowerCase(); })
            .filter(function (token) { return !_this.hashtagStopWords.has(token); })
            .filter(function (token, index, array) { return array.indexOf(token) === index; })
            .slice(0, 12);
    };
    SocialAgent.prototype.normalizeHashtag = function (token) {
        var cleaned = token.replace(/^#+/, "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
        if (!cleaned) {
            return null;
        }
        return "#".concat(cleaned.slice(0, 32));
    };
    SocialAgent.prototype.withUserFallback = function (input, context) {
        var _a;
        if (input.createdById || !context.userId) {
            return input;
        }
        return __assign(__assign({}, input), { createdById: (_a = context.userId) !== null && _a !== void 0 ? _a : undefined });
    };
    SocialAgent.prototype.resolveExecutionContext = function (context) {
        var _a;
        var validated = (0, normalize_js_1.validateAgentContext)(context);
        return {
            organizationId: validated.organizationId,
            prisma: validated.prisma,
            logger: validated.logger,
            userId: (_a = validated.userId) !== null && _a !== void 0 ? _a : null,
        };
    };
    SocialAgent.prototype.invalidInput = function (error) {
        var message = error instanceof Error ? error.message : "Invalid input";
        return { ok: false, error: message, code: "INVALID_INPUT" };
    };
    SocialAgent.prototype.executionError = function (error) {
        var message = error instanceof Error ? error.message : "Agent execution failed";
        return { ok: false, error: message, code: "AGENT_EXECUTION_FAILED" };
    };
    SocialAgent.prototype.handleGeneratePostIntent = function (payload, context, intent) {
        return __awaiter(this, void 0, void 0, function () {
            var input, resolvedInput, result, error_5;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            input = (0, normalize_js_1.normalizePostInput)((payload !== null && payload !== void 0 ? payload : {}));
                        }
                        catch (error) {
                            return [2 /*return*/, this.invalidInput(error)];
                        }
                        resolvedInput = this.withUserFallback(input, context);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, agent_run_js_1.executeAgentRun)(this.orchestratorAgentId, context, resolvedInput, function () { return _this.generatePost(resolvedInput); }, {
                                intent: intent,
                                buildMetrics: function (output) {
                                    var _a, _b;
                                    return ({
                                        platform: resolvedInput.platform,
                                        contentLength: output.content.length,
                                        hashtagCount: (_b = (_a = output.hashtags) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0,
                                    });
                                },
                            })];
                    case 2:
                        result = (_a.sent()).result;
                        return [2 /*return*/, { ok: true, data: result }];
                    case 3:
                        error_5 = _a.sent();
                        return [2 /*return*/, this.executionError(error_5)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SocialAgent.prototype.handleOptimizeCaptionIntent = function (payload, context, intent) {
        return __awaiter(this, void 0, void 0, function () {
            var input, resolvedInput, result, error_6;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            input = OptimizeForPlatformInputSchema.parse(payload);
                        }
                        catch (error) {
                            return [2 /*return*/, this.invalidInput(error)];
                        }
                        resolvedInput = this.withUserFallback(input, context);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, agent_run_js_1.executeAgentRun)(this.orchestratorAgentId, context, resolvedInput, function () { return _this.optimizeForPlatform(resolvedInput); }, {
                                intent: intent,
                                buildMetrics: function (output) {
                                    var _a, _b;
                                    return ({
                                        platform: resolvedInput.platform,
                                        contentLength: output.content.length,
                                        hashtagCount: (_b = (_a = output.hashtags) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0,
                                    });
                                },
                            })];
                    case 2:
                        result = (_a.sent()).result;
                        return [2 /*return*/, { ok: true, data: result }];
                    case 3:
                        error_6 = _a.sent();
                        return [2 /*return*/, this.executionError(error_6)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SocialAgent.prototype.handleHashtagPackIntent = function (payload, context, intent) {
        return __awaiter(this, void 0, void 0, function () {
            var input, resolvedInput, result, error_7;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            input = HashtagPackInputSchema.parse(payload);
                        }
                        catch (error) {
                            return [2 /*return*/, this.invalidInput(error)];
                        }
                        resolvedInput = this.withUserFallback(input, context);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, agent_run_js_1.executeAgentRun)(this.orchestratorAgentId, context, resolvedInput, function () { return _this.generateHashtagPack(resolvedInput); }, {
                                intent: intent,
                                buildMetrics: function (output) { return ({
                                    platform: resolvedInput.platform,
                                    hashtagCount: output.hashtags.length,
                                }); },
                            })];
                    case 2:
                        result = (_a.sent()).result;
                        return [2 /*return*/, { ok: true, data: result }];
                    case 3:
                        error_7 = _a.sent();
                        return [2 /*return*/, this.executionError(error_7)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SocialAgent.prototype.handle = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var executionContext;
            return __generator(this, function (_a) {
                try {
                    executionContext = this.resolveExecutionContext(request.context);
                }
                catch (error) {
                    return [2 /*return*/, {
                            ok: false,
                            error: error instanceof Error ? error.message : "Invalid context",
                            code: "INVALID_CONTEXT",
                        }];
                }
                switch (request.intent) {
                    case "generate-post":
                        return [2 /*return*/, this.handleGeneratePostIntent(request.payload, executionContext, request.intent)];
                    case "optimize-caption":
                        return [2 /*return*/, this.handleOptimizeCaptionIntent(request.payload, executionContext, request.intent)];
                    case "hashtag-pack":
                        return [2 /*return*/, this.handleHashtagPackIntent(request.payload, executionContext, request.intent)];
                    default:
                        return [2 /*return*/, {
                                ok: false,
                                error: "Unsupported intent: ".concat(request.intent),
                                code: "UNSUPPORTED_INTENT",
                            }];
                }
                return [2 /*return*/];
            });
        });
    };
    return SocialAgent;
}());
exports.SocialAgent = SocialAgent;
exports.socialAgent = new SocialAgent();
