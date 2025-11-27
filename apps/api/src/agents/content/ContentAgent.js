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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.contentAgent = exports.ContentAgent = void 0;
var zod_1 = require("zod");
var openai_js_1 = require("../../ai/openai.js");
var prisma_js_1 = require("../../db/prisma.js");
var AgentJobManager_js_1 = require("../base/AgentJobManager.js");
var SEOAgent_js_1 = require("../SEOAgent.js");
var brand_voice_ingestion_js_1 = require("../../services/brand-voice-ingestion.js");
var internal_linking_service_js_1 = require("../../services/seo/internal-linking.service.js");
var logger_js_1 = require("../../lib/logger.js");
var index_js_1 = require("../../ws/index.js");
var normalize_js_1 = require("../_shared/normalize.js");
var agent_run_js_1 = require("../utils/agent-run.js");
var context_service_js_1 = require("../../services/rag/context.service.js");
var knowledge_service_js_1 = require("../../services/rag/knowledge.service.js");
var OPENAI_MODEL = "gpt-4o-mini";
var DEFAULT_TONE = "professional";
var TITLE_MIN = 50;
var TITLE_MAX = 60;
var DESCRIPTION_MIN = 150;
var DESCRIPTION_MAX = 160;
var RATE_LIMIT_WINDOW_MS = 60000;
var RATE_LIMIT_MAX_CALLS = 6;
var RateLimiter = /** @class */ (function () {
    function RateLimiter(maxCalls, windowMs) {
        this.maxCalls = maxCalls;
        this.windowMs = windowMs;
        this.buckets = new Map();
    }
    RateLimiter.prototype.consume = function (key) {
        var now = Date.now();
        var bucket = this.buckets.get(key);
        if (!bucket || bucket.resetAt <= now) {
            this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
            return;
        }
        if (bucket.count >= this.maxCalls) {
            var waitMs = bucket.resetAt - now;
            throw new Error("Rate limit exceeded. Try again in ".concat(Math.ceil(waitMs / 1000), " seconds."));
        }
        bucket.count += 1;
    };
    return RateLimiter;
}());
var RepurposeFormatSchema = zod_1.z.enum(["linkedin", "twitter", "email", "outline"]);
var GenerateDraftPayloadSchema = zod_1.z.object({
    topic: zod_1.z.string().min(1, "topic is required"),
    primaryKeyword: zod_1.z.string().min(1, "primaryKeyword is required"),
    personaId: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
    secondaryKeywords: zod_1.z.array(zod_1.z.string().min(1)).optional(),
    outline: zod_1.z.array(zod_1.z.string().min(1)).optional(),
    tone: zod_1.z.enum(["professional", "casual", "friendly", "authoritative"]).optional(),
    audience: zod_1.z.string().optional(),
    callToAction: zod_1.z.string().optional(),
    brandId: zod_1.z.string().optional(),
    brandVoiceId: zod_1.z.string().optional(),
    wordCount: zod_1.z.number().int().min(300).max(4000).optional(),
    createdById: zod_1.z.string().optional(),
});
var SummarizePayloadSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "content is required"),
    sentences: zod_1.z.number().int().min(1).max(6).optional(),
    highlights: zod_1.z.number().int().min(1).max(6).optional(),
    createdById: zod_1.z.string().optional(),
});
var RepurposePayloadSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "content is required"),
    format: RepurposeFormatSchema.default("linkedin"),
    topic: zod_1.z.string().optional(),
    primaryKeyword: zod_1.z.string().optional(),
    tone: zod_1.z.string().optional(),
    brandId: zod_1.z.string().optional(),
    brandVoiceId: zod_1.z.string().optional(),
    createdById: zod_1.z.string().optional(),
});
var rateLimiter = new RateLimiter(RATE_LIMIT_MAX_CALLS, RATE_LIMIT_WINDOW_MS);
function clampLength(text, min, max) {
    if (text.length <= max) {
        return text.length >= min ? text : text.padEnd(min, ".");
    }
    var truncated = text.slice(0, max - 1);
    var lastSpace = truncated.lastIndexOf(" ");
    return "".concat(truncated.slice(0, lastSpace > 0 ? lastSpace : truncated.length), "\u2026");
}
function countSyllables(word) {
    var sanitized = word.toLowerCase().replace(/[^a-z]/g, "");
    if (!sanitized)
        return 0;
    var vowelGroups = sanitized.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").match(/[aeiouy]{1,2}/g);
    return Math.max(vowelGroups ? vowelGroups.length : 1, 1);
}
function computeReadability(text) {
    var sentences = text.split(/[.!?]+/).filter(function (part) { return part.trim().length > 0; });
    var words = text.split(/\s+/).filter(function (part) { return part.trim().length > 0; });
    var paragraphs = text.split(/\n{2,}/).filter(function (part) { return part.trim().length > 0; });
    var syllables = words.reduce(function (acc, word) { return acc + countSyllables(word); }, 0);
    if (words.length === 0 || sentences.length === 0) {
        return {
            fleschEase: 100,
            gradeBand: "Very Easy",
            words: 0,
            sentences: 0,
            paragraphs: 0,
            avgSentenceLength: 0,
        };
    }
    var flesch = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
    var gradeBand = flesch >= 90
        ? "Very Easy"
        : flesch >= 80
            ? "Easy"
            : flesch >= 70
                ? "Fairly Easy"
                : flesch >= 60
                    ? "Standard"
                    : flesch >= 50
                        ? "Fairly Difficult"
                        : flesch >= 30
                            ? "Difficult"
                            : "Very Confusing";
    return {
        fleschEase: Math.max(0, Math.min(100, Number(flesch.toFixed(2)))),
        gradeBand: gradeBand,
        words: words.length,
        sentences: sentences.length,
        paragraphs: paragraphs.length,
        avgSentenceLength: Number((words.length / sentences.length).toFixed(2)),
    };
}
function calculateKeywordDensity(content, keywords) {
    var words = content
        .toLowerCase()
        .split(/\s+/)
        .filter(function (word) { return word.trim().length > 0; });
    if (words.length === 0) {
        return keywords.map(function (keyword) { return ({ keyword: keyword, occurrences: 0, density: 0 }); });
    }
    return keywords.map(function (keyword) {
        var normalized = keyword.toLowerCase();
        var regex = new RegExp("\\b".concat(normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "\\b"), "gi");
        var matches = content.match(regex);
        var count = matches ? matches.length : 0;
        return {
            keyword: keyword,
            occurrences: count,
            density: Number(((count / words.length) * 100).toFixed(2)),
        };
    });
}
function computeQualityScore(content, keywords) {
    var readability = computeReadability(content);
    var keywordDensity = calculateKeywordDensity(content, keywords);
    var densityScore = keywordDensity.reduce(function (acc, item) { return acc + (item.density >= 0.5 && item.density <= 3 ? 1 : 0); }, 0) /
        Math.max(keywordDensity.length, 1);
    var readabilityScore = readability.fleschEase >= 55 && readability.fleschEase <= 80 ? 1 : Math.max(readability.fleschEase / 100, 0);
    var overall = Number(((readabilityScore * 0.6 + densityScore * 0.4) * 100).toFixed(2));
    return {
        readability: readability,
        keywordDensity: keywordDensity,
        overall: overall,
    };
}
function stringifySchema(data) {
    return JSON.stringify(data, null, 2);
}
function safeJsonParse(raw) {
    try {
        return JSON.parse(raw);
    }
    catch (_a) {
        return null;
    }
}
var ContentAgent = /** @class */ (function () {
    function ContentAgent(deps) {
        if (deps === void 0) { deps = {}; }
        var _a, _b, _c, _d, _e, _f;
        this.orchestratorAgentId = "ContentAgent";
        this.contentStopWords = new Set([
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
            "make",
            "made",
            "toward",
            "towards",
        ]);
        this.prisma = (_a = deps.prisma) !== null && _a !== void 0 ? _a : prisma_js_1.prisma;
        this.jobManager = (_b = deps.jobManager) !== null && _b !== void 0 ? _b : AgentJobManager_js_1.agentJobManager;
        this.seoAgent = (_c = deps.seoAgent) !== null && _c !== void 0 ? _c : SEOAgent_js_1.seoAgent;
        this.brandVoiceSearch = (_d = deps.brandVoiceSearch) !== null && _d !== void 0 ? _d : brand_voice_ingestion_js_1.searchSimilarBrandVoice;
        this.generateText = (_e = deps.generateText) !== null && _e !== void 0 ? _e : openai_js_1.generateText;
        this.ragContextService = new context_service_js_1.RagContextService();
        this.knowledgeBase = new knowledge_service_js_1.KnowledgeBaseService();
        this.now = (_f = deps.now) !== null && _f !== void 0 ? _f : (function () { return new Date(); });
    }
    /**
     * Generate a long-form article draft with SEO and brand alignment.
     */
    ContentAgent.prototype.generateArticle = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var jobId, _a, organizationId, brandVoice, keywordContext, ragContext, _b, ragPrompt, structuredArticle, body, internalLinkingService, contentSlug, linkSuggestions, highPriorityLinks, mediumPriorityLinks, linksToInsert, linkError_1, meta, schema, keywordsForScoring, quality, socialSnippets, draft, outputPayload, error_1, message;
            var _c, _d, _e, _f, _g;
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        if (!input.createdById) {
                            throw new Error("createdById is required");
                        }
                        rateLimiter.consume(input.createdById);
                        return [4 /*yield*/, this.jobManager.createJob({
                                agent: "content",
                                input: input,
                                createdById: input.createdById,
                            })];
                    case 1:
                        jobId = _h.sent();
                        return [4 /*yield*/, this.jobManager.startJob(jobId)];
                    case 2:
                        _h.sent();
                        _h.label = 3;
                    case 3:
                        _h.trys.push([3, 17, , 19]);
                        return [4 /*yield*/, Promise.all([
                                this.resolveOrganizationId(input.createdById),
                                this.buildBrandVoiceSnippet(input),
                                this.collectKeywordInsights({
                                    primaryKeyword: input.primaryKeyword,
                                    personaId: input.personaId,
                                    secondaryKeywords: input.secondaryKeywords,
                                }),
                            ])];
                    case 4:
                        _a = _h.sent(), organizationId = _a[0], brandVoice = _a[1], keywordContext = _a[2];
                        _b = organizationId;
                        if (!_b) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.ragContextService.build({
                                organizationId: organizationId,
                                brandId: input.brandId,
                                query: input.topic,
                                categories: ["content", "seo"],
                                personId: input.createdById,
                            })];
                    case 5:
                        _b = (_h.sent());
                        _h.label = 6;
                    case 6:
                        ragContext = _b;
                        ragPrompt = ragContext ? this.ragContextService.formatForPrompt(ragContext) : "";
                        return [4 /*yield*/, this.requestArticleFromModel(input, brandVoice, keywordContext, ragPrompt)];
                    case 7:
                        structuredArticle = _h.sent();
                        body = this.composeMarkdownBody(structuredArticle);
                        _h.label = 8;
                    case 8:
                        _h.trys.push([8, 10, , 11]);
                        internalLinkingService = new internal_linking_service_js_1.InternalLinkingService(this.prisma);
                        contentSlug = structuredArticle.title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                        return [4 /*yield*/, internalLinkingService.suggestLinks({
                                currentPageUrl: "/content/".concat(contentSlug),
                                currentPageContent: body,
                                targetKeyword: input.primaryKeyword,
                                maxSuggestions: 5,
                            })];
                    case 9:
                        linkSuggestions = _h.sent();
                        highPriorityLinks = linkSuggestions.filter(function (link) { return link.priority === 'high'; }).slice(0, 3);
                        mediumPriorityLinks = linkSuggestions.filter(function (link) { return link.priority === 'medium'; }).slice(0, 2);
                        linksToInsert = __spreadArray(__spreadArray([], highPriorityLinks, true), mediumPriorityLinks, true).slice(0, 5);
                        if (linksToInsert.length > 0) {
                            body = this.insertLinksIntoContent(body, linksToInsert);
                            logger_js_1.logger.info({ linkCount: linksToInsert.length }, '[ContentAgent] Internal links inserted');
                        }
                        return [3 /*break*/, 11];
                    case 10:
                        linkError_1 = _h.sent();
                        logger_js_1.logger.warn({ error: linkError_1 }, '[ContentAgent] Internal linking failed, continuing without links');
                        return [3 /*break*/, 11];
                    case 11:
                        meta = this.createMetaTags({
                            title: structuredArticle.title,
                            summary: structuredArticle.summary,
                            primaryKeyword: input.primaryKeyword,
                            brand: brandVoice.brandName,
                            callToAction: structuredArticle.callToAction,
                        });
                        schema = this.createSchemaMarkup({
                            meta: meta,
                            brand: brandVoice.brandName,
                            topic: input.topic,
                            draftId: undefined,
                        });
                        keywordsForScoring = __spreadArray([
                            input.primaryKeyword
                        ], ((_c = input.secondaryKeywords) !== null && _c !== void 0 ? _c : keywordContext.slice(1).map(function (item) { return item.keyword; })), true).filter(function (value, index, array) { return array.indexOf(value) === index; });
                        quality = computeQualityScore(body, keywordsForScoring);
                        return [4 /*yield*/, this.generateSocialSnippets({
                                topic: input.topic,
                                primaryKeyword: input.primaryKeyword,
                                brandId: input.brandId,
                                brandVoiceId: input.brandVoiceId,
                                tone: (_d = input.tone) !== null && _d !== void 0 ? _d : DEFAULT_TONE,
                            })];
                    case 12:
                        socialSnippets = _h.sent();
                        return [4 /*yield*/, this.prisma.contentDraft.create({
                                data: {
                                    title: structuredArticle.title,
                                    topic: input.topic,
                                    body: body,
                                    tone: (_e = input.tone) !== null && _e !== void 0 ? _e : DEFAULT_TONE,
                                    audience: input.audience,
                                    status: "generated",
                                    createdById: input.createdById,
                                    organizationId: organizationId !== null && organizationId !== void 0 ? organizationId : null,
                                },
                            })];
                    case 13:
                        draft = _h.sent();
                        outputPayload = {
                            draftId: draft.id,
                            title: structuredArticle.title,
                            summary: structuredArticle.summary,
                            meta: meta,
                            schema: schema,
                            keywordInsights: keywordContext,
                            quality: quality,
                            socialSnippets: socialSnippets,
                        };
                        return [4 /*yield*/, this.jobManager.completeJob(jobId, outputPayload, {
                                generatedAt: this.now().toISOString(),
                                primaryKeyword: input.primaryKeyword,
                                seoOpportunity: (_g = (_f = keywordContext[0]) === null || _f === void 0 ? void 0 : _f.opportunity) !== null && _g !== void 0 ? _g : 0,
                            })];
                    case 14:
                        _h.sent();
                        (0, index_js_1.broadcast)("metrics:delta", {
                            type: "content_draft_created",
                            increment: 1,
                            timestamp: this.now(),
                        });
                        if (!organizationId) return [3 /*break*/, 16];
                        return [4 /*yield*/, this.knowledgeBase.ingestSnippet({
                                organizationId: organizationId,
                                datasetSlug: "content-".concat(organizationId),
                                datasetName: "Content Knowledge",
                                title: structuredArticle.title,
                                content: body,
                                ownerId: input.createdById,
                                metadata: {
                                    agent: "ContentAgent",
                                    primaryKeyword: input.primaryKeyword,
                                    topic: input.topic,
                                },
                            })];
                    case 15:
                        _h.sent();
                        _h.label = 16;
                    case 16: return [2 /*return*/, {
                            jobId: jobId,
                            draftId: draft.id,
                            title: structuredArticle.title,
                            summary: structuredArticle.summary,
                            body: body,
                            meta: meta,
                            schema: schema,
                            keywordInsights: keywordContext,
                            quality: quality,
                            socialSnippets: socialSnippets,
                        }];
                    case 17:
                        error_1 = _h.sent();
                        message = error_1 instanceof Error ? error_1.message : "Unknown error";
                        return [4 /*yield*/, this.jobManager.failJob(jobId, message)];
                    case 18:
                        _h.sent();
                        logger_js_1.logger.error({ jobId: jobId, error: message }, "Content generation failed");
                        throw error_1;
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Optimize existing content for SEO alignment.
     */
    ContentAgent.prototype.optimizeArticle = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var jobId, organizationId, _a, brandVoice, keywordContext, ragContext, _b, ragPrompt, prompt_1, response, parsed, quality, error_2, message;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        if (!input.createdById) {
                            throw new Error("createdById is required");
                        }
                        rateLimiter.consume(input.createdById);
                        return [4 /*yield*/, this.jobManager.createJob({
                                agent: "content",
                                input: input,
                                createdById: input.createdById,
                            })];
                    case 1:
                        jobId = _c.sent();
                        return [4 /*yield*/, this.jobManager.startJob(jobId)];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        _c.trys.push([3, 14, , 16]);
                        return [4 /*yield*/, this.resolveOrganizationId(input.createdById)];
                    case 4:
                        organizationId = _c.sent();
                        return [4 /*yield*/, Promise.all([
                                this.buildBrandVoiceSnippet({
                                    topic: input.primaryKeyword,
                                    primaryKeyword: input.primaryKeyword,
                                    brandId: input.brandId,
                                    brandVoiceId: input.brandVoiceId,
                                    createdById: input.createdById,
                                }),
                                this.collectKeywordInsights({
                                    primaryKeyword: input.primaryKeyword,
                                    personaId: input.personaId,
                                }),
                            ])];
                    case 5:
                        _a = _c.sent(), brandVoice = _a[0], keywordContext = _a[1];
                        _b = organizationId;
                        if (!_b) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.ragContextService.build({
                                organizationId: organizationId,
                                brandId: input.brandId,
                                query: input.primaryKeyword,
                                categories: ["content", "seo"],
                                personId: input.createdById,
                            })];
                    case 6:
                        _b = (_c.sent());
                        _c.label = 7;
                    case 7:
                        ragContext = _b;
                        ragPrompt = ragContext ? this.ragContextService.formatForPrompt(ragContext) : "";
                        prompt_1 = this.buildOptimizationPrompt(input, brandVoice, keywordContext, ragPrompt);
                        return [4 /*yield*/, this.generateText({
                                prompt: prompt_1,
                                model: OPENAI_MODEL,
                                temperature: 0.4,
                                maxTokens: 1200,
                                systemPrompt: "You are a senior SEO editor. Produce only JSON with fields {\"revision\":\"string\",\"notes\":[\"string\"]}.",
                            })];
                    case 8:
                        response = _c.sent();
                        parsed = this.parseOptimizationResponse(response.text, input.content);
                        quality = computeQualityScore(parsed.revision, __spreadArray([
                            input.primaryKeyword
                        ], keywordContext.slice(1, 3).map(function (item) { return item.keyword; }), true));
                        if (!input.draftId) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.prisma.contentDraft.update({
                                where: { id: input.draftId },
                                data: { body: parsed.revision },
                            })];
                    case 9:
                        _c.sent();
                        _c.label = 10;
                    case 10:
                        if (!organizationId) return [3 /*break*/, 12];
                        return [4 /*yield*/, this.knowledgeBase.ingestSnippet({
                                organizationId: organizationId,
                                datasetSlug: "content-".concat(organizationId),
                                datasetName: "Content Knowledge",
                                title: "Optimization: ".concat(input.primaryKeyword),
                                content: parsed.revision,
                                ownerId: input.createdById,
                                metadata: {
                                    agent: "ContentAgent",
                                    operation: "optimize",
                                    primaryKeyword: input.primaryKeyword,
                                },
                            })];
                    case 11:
                        _c.sent();
                        _c.label = 12;
                    case 12: return [4 /*yield*/, this.jobManager.completeJob(jobId, {
                            revisedContent: parsed.revision,
                            notes: parsed.notes,
                            quality: quality,
                        }, {
                            optimizedAt: this.now().toISOString(),
                            targetKeyword: input.primaryKeyword,
                        })];
                    case 13:
                        _c.sent();
                        return [2 /*return*/, {
                                jobId: jobId,
                                revisedContent: parsed.revision,
                                notes: parsed.notes,
                                quality: quality,
                            }];
                    case 14:
                        error_2 = _c.sent();
                        message = error_2 instanceof Error ? error_2.message : "Unknown error";
                        return [4 /*yield*/, this.jobManager.failJob(jobId, message)];
                    case 15:
                        _c.sent();
                        logger_js_1.logger.error({ jobId: jobId, error: message }, "Content optimization failed");
                        throw error_2;
                    case 16: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Score content quality and keyword density without external calls.
     */
    ContentAgent.prototype.scoreContent = function (content, keywords) {
        return computeQualityScore(content, keywords);
    };
    /**
     * Generate OpenGraph, Twitter, and canonical meta tags.
     */
    ContentAgent.prototype.generateMetaTagsForContent = function (content, primaryKeyword, titleHint) {
        var _a;
        var firstSentence = (_a = content.split(/[.!?]/).find(function (line) { return line.trim().length > 0; })) !== null && _a !== void 0 ? _a : "";
        return this.createMetaTags({
            title: titleHint !== null && titleHint !== void 0 ? titleHint : firstSentence.trim(),
            summary: firstSentence.trim(),
            primaryKeyword: primaryKeyword,
        });
    };
    /**
     * Create social snippets aligned with generated content.
     */
    ContentAgent.prototype.generateSocialSnippets = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, response, parsed;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        prompt = "Create platform-specific social copy based on the topic \"".concat(input.topic, "\" and keyword \"").concat(input.primaryKeyword, "\".\n\nReturn JSON:\n{\n  \"linkedin\": \"long-form post\",\n  \"twitter\": \"concise tweet\",\n  \"emailSubject\": \"catchy subject line\"\n}\n\nConstraints:\n- Respect brand voice descriptors if provided.\n- Include the primary keyword in at least one post.\n- Focus on value-driven messaging.");
                        return [4 /*yield*/, this.generateText({
                                prompt: prompt,
                                model: OPENAI_MODEL,
                                temperature: 0.6,
                                maxTokens: 500,
                                systemPrompt: "You are a social media strategist. Respond with JSON only.",
                            })];
                    case 1:
                        response = _d.sent();
                        parsed = safeJsonParse(response.text);
                        return [2 /*return*/, {
                                linkedin: (_a = parsed === null || parsed === void 0 ? void 0 : parsed.linkedin) !== null && _a !== void 0 ? _a : "Discover insights about ".concat(input.primaryKeyword, "."),
                                twitter: (_b = parsed === null || parsed === void 0 ? void 0 : parsed.twitter) !== null && _b !== void 0 ? _b : "".concat(input.primaryKeyword, " matters now. #").concat(input.primaryKeyword.replace(/\s+/g, "")),
                                emailSubject: (_c = parsed === null || parsed === void 0 ? void 0 : parsed.emailSubject) !== null && _c !== void 0 ? _c : "New insights on ".concat(input.topic),
                            }];
                }
            });
        });
    };
    /**
     * Schedule a generated draft for publication via editorial calendar entry.
     */
    ContentAgent.prototype.schedulePublication = function (_a) {
        return __awaiter(this, arguments, void 0, function (_b) {
            var draft;
            var draftId = _b.draftId, publishAt = _b.publishAt, personaId = _b.personaId, channel = _b.channel;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.prisma.contentDraft.findUnique({
                            where: { id: draftId },
                            select: { title: true, topic: true, organizationId: true },
                        })];
                    case 1:
                        draft = _c.sent();
                        if (!draft) {
                            throw new Error("Draft not found");
                        }
                        return [4 /*yield*/, this.prisma.editorialCalendar.create({
                                data: {
                                    title: draft.title,
                                    publishAt: publishAt,
                                    status: "scheduled:".concat(channel),
                                    personaId: personaId !== null && personaId !== void 0 ? personaId : null,
                                    priority: 50,
                                },
                            })];
                    case 2:
                        _c.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    ContentAgent.prototype.resolveOrganizationId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var membership;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.prisma.organizationMembership.findFirst({
                            where: { userId: userId },
                            select: { organizationId: true },
                        })];
                    case 1:
                        membership = _b.sent();
                        return [2 /*return*/, (_a = membership === null || membership === void 0 ? void 0 : membership.organizationId) !== null && _a !== void 0 ? _a : undefined];
                }
            });
        });
    };
    ContentAgent.prototype.buildBrandVoiceSnippet = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var brandVoice, _a, brand, _b, _c, searchResults, _d, knowledgeBase;
            var _e, _f, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        if (!input.brandId && !input.brandVoiceId) {
                            return [2 /*return*/, {
                                    summary: "",
                                    tone: [],
                                    vocabulary: [],
                                    doExamples: [],
                                    dontExamples: [],
                                    knowledgeBase: [],
                                }];
                        }
                        if (!input.brandVoiceId) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.prisma.brandVoice.findUnique({
                                where: { id: input.brandVoiceId },
                                select: {
                                    id: true,
                                    promptTemplate: true,
                                    styleRulesJson: true,
                                    brand: {
                                        select: {
                                            id: true,
                                            name: true,
                                            slogan: true,
                                            metadata: true,
                                        },
                                    },
                                },
                            })];
                    case 1:
                        _a = _j.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = null;
                        _j.label = 3;
                    case 3:
                        brandVoice = _a;
                        if (!(brandVoice === null || brandVoice === void 0 ? void 0 : brandVoice.brand)) return [3 /*break*/, 4];
                        _b = brandVoice.brand;
                        return [3 /*break*/, 8];
                    case 4:
                        if (!input.brandId) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.prisma.brand.findUnique({
                                where: { id: input.brandId },
                                select: { id: true, name: true, slogan: true, metadata: true },
                            })];
                    case 5:
                        _c = _j.sent();
                        return [3 /*break*/, 7];
                    case 6:
                        _c = null;
                        _j.label = 7;
                    case 7:
                        _b = _c;
                        _j.label = 8;
                    case 8:
                        brand = _b;
                        if (!((brand === null || brand === void 0 ? void 0 : brand.id) && input.primaryKeyword)) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.brandVoiceSearch({
                                brandId: brand.id,
                                query: input.primaryKeyword,
                                limit: 5,
                            })];
                    case 9:
                        _d = _j.sent();
                        return [3 /*break*/, 11];
                    case 10:
                        _d = [];
                        _j.label = 11;
                    case 11:
                        searchResults = _d;
                        knowledgeBase = searchResults.map(function (item) { return item.summary; });
                        return [2 /*return*/, {
                                summary: (_e = brandVoice === null || brandVoice === void 0 ? void 0 : brandVoice.promptTemplate) !== null && _e !== void 0 ? _e : "",
                                tone: this.jsonArray(brandVoice === null || brandVoice === void 0 ? void 0 : brandVoice.styleRulesJson, "tone"),
                                vocabulary: this.jsonArray(brandVoice === null || brandVoice === void 0 ? void 0 : brandVoice.styleRulesJson, "vocabulary"),
                                doExamples: this.jsonArray(brandVoice === null || brandVoice === void 0 ? void 0 : brandVoice.styleRulesJson, "doExamples"),
                                dontExamples: this.jsonArray(brandVoice === null || brandVoice === void 0 ? void 0 : brandVoice.styleRulesJson, "dontExamples"),
                                knowledgeBase: knowledgeBase,
                                brandName: (_f = brand === null || brand === void 0 ? void 0 : brand.name) !== null && _f !== void 0 ? _f : undefined,
                                slogan: (_g = brand === null || brand === void 0 ? void 0 : brand.slogan) !== null && _g !== void 0 ? _g : undefined,
                                website: (_h = this.extractWebsite(brand === null || brand === void 0 ? void 0 : brand.metadata)) !== null && _h !== void 0 ? _h : null,
                            }];
                }
            });
        });
    };
    ContentAgent.prototype.extractWebsite = function (metadata) {
        var _a;
        if (!metadata || typeof metadata !== "object") {
            return null;
        }
        var record = metadata;
        var website = (_a = record.website) !== null && _a !== void 0 ? _a : record.url;
        return typeof website === "string" ? website : null;
    };
    ContentAgent.prototype.jsonArray = function (value, key) {
        if (!value || typeof value !== "object") {
            return [];
        }
        var record = value;
        var raw = record[key];
        if (Array.isArray(raw)) {
            return raw.map(function (item) { return String(item); });
        }
        return [];
    };
    ContentAgent.prototype.collectKeywordInsights = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var opportunities, error_3;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.seoAgent.discoverOpportunities({
                                personaId: input.personaId,
                                limit: 6,
                                includeSeeds: [input.primaryKeyword],
                            })];
                    case 1:
                        opportunities = _b.sent();
                        return [2 /*return*/, opportunities.opportunities.slice(0, 6).map(function (item) { return ({
                                keyword: item.keyword,
                                intent: item.intent,
                                opportunity: item.opportunityScore,
                                difficulty: item.difficulty,
                                searchVolume: item.searchVolume,
                            }); })];
                    case 2:
                        error_3 = _b.sent();
                        logger_js_1.logger.warn({ error: error_3 }, "Falling back to synthetic keyword insights");
                        return [2 /*return*/, __spreadArray([
                                {
                                    keyword: input.primaryKeyword,
                                    intent: "informational",
                                    opportunity: 72,
                                    difficulty: 38,
                                    searchVolume: 1200,
                                }
                            ], ((_a = input.secondaryKeywords) !== null && _a !== void 0 ? _a : []).map(function (keyword, index) { return ({
                                keyword: keyword,
                                intent: "commercial",
                                opportunity: 55 - index * 5,
                                difficulty: 45 + index * 4,
                                searchVolume: 800 - index * 60,
                            }); }), true)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ContentAgent.prototype.requestArticleFromModel = function (input, brand, keywordInsights, ragSection) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, response, parsed, fallback, title, sections;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0:
                        prompt = this.buildArticlePrompt(input, brand, keywordInsights, ragSection);
                        return [4 /*yield*/, this.generateText({
                                prompt: prompt,
                                model: OPENAI_MODEL,
                                temperature: 0.55,
                                maxTokens: 2200,
                                systemPrompt: "You are an SEO strategist and senior copywriter. Respond ONLY with JSON matching {\"title\":\"\",\"summary\":\"\",\"sections\":[{\"heading\":\"\",\"body\":\"\"}],\"conclusion\":\"\",\"callToAction\":\"\"}.",
                            })];
                    case 1:
                        response = _k.sent();
                        parsed = safeJsonParse(response.text);
                        if (parsed &&
                            parsed.title &&
                            parsed.summary &&
                            Array.isArray(parsed.sections) &&
                            parsed.sections.length > 0) {
                            return [2 /*return*/, {
                                    title: parsed.title,
                                    summary: parsed.summary,
                                    sections: parsed.sections.map(function (section) {
                                        var _a, _b;
                                        return ({
                                            heading: (_a = section.heading) !== null && _a !== void 0 ? _a : "Section",
                                            body: (_b = section.body) !== null && _b !== void 0 ? _b : "",
                                        });
                                    }),
                                    conclusion: (_a = parsed.conclusion) !== null && _a !== void 0 ? _a : "",
                                    callToAction: (_c = (_b = parsed.callToAction) !== null && _b !== void 0 ? _b : input.callToAction) !== null && _c !== void 0 ? _c : "",
                                }];
                        }
                        logger_js_1.logger.warn({ response: response.text.slice(0, 200) }, "Model response not in JSON format, falling back");
                        fallback = response.text.split(/\n#+\s/).filter(function (block) { return block.trim().length > 0; });
                        title = (_d = fallback.shift()) !== null && _d !== void 0 ? _d : input.topic;
                        sections = fallback.map(function (block) {
                            var _a = block.split("\n"), headingLine = _a[0], rest = _a.slice(1);
                            return {
                                heading: headingLine.trim(),
                                body: rest.join("\n").trim(),
                            };
                        });
                        return [2 /*return*/, {
                                title: title.replace(/^#\s*/, "").trim(),
                                summary: (_f = (_e = sections[0]) === null || _e === void 0 ? void 0 : _e.body.slice(0, 200)) !== null && _f !== void 0 ? _f : input.topic,
                                sections: sections.length > 0 ? sections : [{ heading: input.topic, body: response.text.trim() }],
                                conclusion: (_h = (_g = sections.at(-1)) === null || _g === void 0 ? void 0 : _g.body) !== null && _h !== void 0 ? _h : "",
                                callToAction: (_j = input.callToAction) !== null && _j !== void 0 ? _j : "",
                            }];
                }
            });
        });
    };
    ContentAgent.prototype.buildArticlePrompt = function (input, brand, keywordInsights, ragSection) {
        var _a, _b, _c, _d, _e;
        var outline = ((_a = input.outline) === null || _a === void 0 ? void 0 : _a.length)
            ? input.outline.map(function (item, index) { return "".concat(index + 1, ". ").concat(item); }).join("\n")
            : "1. Hook\n2. Problem Context\n3. Strategic Recommendations\n4. Implementation Guidance\n5. Closing Takeaways";
        var tone = (_b = input.tone) !== null && _b !== void 0 ? _b : DEFAULT_TONE;
        var keywordBlock = keywordInsights
            .map(function (item, index) {
            return "".concat(index === 0 ? "Primary" : "Secondary", " Keyword: \"").concat(item.keyword, "\" \u2014 intent ").concat(item.intent, ", opportunity ").concat(item.opportunity, "/100");
        })
            .join("\n");
        var brandDirectives = [
            brand.brandName ? "Brand: ".concat(brand.brandName) : null,
            brand.slogan ? "Brand Promise: ".concat(brand.slogan) : null,
            brand.tone.length ? "Tone Descriptors: ".concat(brand.tone.join(", ")) : null,
            brand.vocabulary.length ? "Preferred Vocabulary: ".concat(brand.vocabulary.join(", ")) : null,
        ]
            .filter(Boolean)
            .join("\n");
        var knowledgeBase = brand.knowledgeBase.length
            ? "Brand Voice Excerpts:\n".concat(brand.knowledgeBase.map(function (item) { return "- ".concat(item); }).join("\n"))
            : "";
        var ragContextBlock = ragSection ? "\nAdditional context:\n".concat(ragSection, "\n") : "";
        return "Create an SEO-optimized article as JSON for the topic \"".concat(input.topic, "\" targeting \"").concat(input.primaryKeyword, "\".\n\nTone: ").concat(tone, "\nAudience: ").concat((_c = input.audience) !== null && _c !== void 0 ? _c : "Marketing decision makers", "\nDesired Word Count: ").concat((_d = input.wordCount) !== null && _d !== void 0 ? _d : 900, "\n\n").concat(brandDirectives, "\n\n").concat(knowledgeBase, "\n\n").concat(ragContextBlock, "\n\nSEO Keywords:\n").concat(keywordBlock, "\n\nOutline:\n").concat(outline, "\n\nInclude:\n- A compelling title (<= 60 characters)\n- A 2-3 sentence summary aligned with the keyword\n- 4-6 sections with actionable insights and subheadings\n- References to data or trends where relevant (fabricate respectfully if unavailable)\n- A conclusion and CTA: ").concat((_e = input.callToAction) !== null && _e !== void 0 ? _e : "Invite readers to explore NeonHub solutions.", "\n- Incorporate the primary keyword in title, summary, first section, and conclusion\n- Maintain factual tone and avoid unsupported product claims.");
    };
    ContentAgent.prototype.buildOptimizationPrompt = function (input, brand, keywordContext, ragSection) {
        var _a, _b;
        var keywordBlock = keywordContext
            .map(function (item) { return "- ".concat(item.keyword, " (").concat(item.intent, ", opportunity ").concat(item.opportunity, ")"); })
            .join("\n");
        var ragContextBlock = ragSection ? "\nContextual insights:\n".concat(ragSection, "\n") : "";
        return "Revise the following Markdown content to improve SEO performance for the keyword \"".concat(input.primaryKeyword, "\".\n\nBrand Voice:\n- Name: ").concat((_a = brand.brandName) !== null && _a !== void 0 ? _a : "Generic", "\n- Tone: ").concat(brand.tone.join(", ") || "Professional", "\n- Preferred Vocabulary: ").concat(brand.vocabulary.join(", ") || "N/A", "\n\nSEO Keywords:\n").concat(keywordBlock, "\n\n").concat(ragContextBlock, "\n\nCall To Action: ").concat((_b = input.callToAction) !== null && _b !== void 0 ? _b : "Encourage readers to engage with NeonHub.", "\n\nOriginal Content:\n").concat(input.content, "\n\nImprove keyword placement, clarity, and readability. Return JSON with keys \"revision\" and \"notes\".");
    };
    ContentAgent.prototype.parseOptimizationResponse = function (response, fallbackContent) {
        var parsed = safeJsonParse(response);
        if (parsed === null || parsed === void 0 ? void 0 : parsed.revision) {
            return {
                revision: parsed.revision,
                notes: Array.isArray(parsed.notes) ? parsed.notes.map(function (note) { return String(note); }) : [],
            };
        }
        return {
            revision: fallbackContent,
            notes: ["Model response could not be parsed; original content retained."],
        };
    };
    ContentAgent.prototype.composeMarkdownBody = function (article) {
        var sections = article.sections
            .map(function (section) { return "## ".concat(section.heading, "\n\n").concat(section.body.trim()); })
            .join("\n\n");
        var conclusion = article.conclusion ? "\n\n## Conclusion\n\n".concat(article.conclusion.trim()) : "";
        var cta = article.callToAction ? "\n\n**Call to Action:** ".concat(article.callToAction.trim()) : "";
        return "# ".concat(article.title, "\n\n").concat(article.summary, "\n\n").concat(sections).concat(conclusion).concat(cta).trim();
    };
    ContentAgent.prototype.createMetaTags = function (_a) {
        var title = _a.title, summary = _a.summary, primaryKeyword = _a.primaryKeyword, brand = _a.brand, callToAction = _a.callToAction;
        var normalizedTitle = clampLength(title.includes(primaryKeyword) ? title : "".concat(primaryKeyword, " | ").concat(title), TITLE_MIN, TITLE_MAX);
        var descriptionSource = summary ||
            callToAction ||
            "Discover how ".concat(primaryKeyword, " drives outcomes for ").concat(brand !== null && brand !== void 0 ? brand : "modern teams", ".");
        var description = clampLength(descriptionSource, DESCRIPTION_MIN, DESCRIPTION_MAX);
        var ogTitle = "".concat(normalizedTitle).concat(brand ? " \u2022 ".concat(brand) : "");
        return {
            title: normalizedTitle,
            description: description,
            canonicalUrl: undefined,
            openGraph: {
                title: ogTitle,
                description: description,
                type: "article",
            },
            twitter: {
                card: "summary_large_image",
                title: normalizedTitle,
                description: description,
            },
        };
    };
    ContentAgent.prototype.createSchemaMarkup = function (_a) {
        var meta = _a.meta, brand = _a.brand, topic = _a.topic, draftId = _a.draftId;
        var now = this.now().toISOString();
        var articleSchema = stringifySchema({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: meta.title,
            description: meta.description,
            datePublished: now,
            dateModified: now,
            author: {
                "@type": "Organization",
                name: brand !== null && brand !== void 0 ? brand : "NeonHub",
            },
            mainEntityOfPage: {
                "@type": "WebPage",
                "@id": "https://neonhub.example/articles/".concat(draftId !== null && draftId !== void 0 ? draftId : "draft"),
            },
        });
        var organizationSchema = stringifySchema({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: brand !== null && brand !== void 0 ? brand : "NeonHub",
            url: "https://neonhub.example",
        });
        var breadcrumbSchema = stringifySchema({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
                {
                    "@type": "ListItem",
                    position: 1,
                    name: "Home",
                    item: "https://neonhub.example",
                },
                {
                    "@type": "ListItem",
                    position: 2,
                    name: "SEO",
                    item: "https://neonhub.example/seo",
                },
                {
                    "@type": "ListItem",
                    position: 3,
                    name: topic,
                    item: "https://neonhub.example/seo/".concat(encodeURIComponent(topic.toLowerCase())),
                },
            ],
        });
        return {
            article: articleSchema,
            organization: organizationSchema,
            breadcrumb: breadcrumbSchema,
        };
    };
    /**
     * Insert internal links into markdown content at optimal positions
     * @private
     */
    ContentAgent.prototype.insertLinksIntoContent = function (markdownBody, linkSuggestions) {
        var paragraphs = markdownBody.split('\n\n');
        var insertedCount = 0;
        for (var _i = 0, linkSuggestions_1 = linkSuggestions; _i < linkSuggestions_1.length; _i++) {
            var link = linkSuggestions_1[_i];
            var linkMarkdown = "[".concat(link.anchorText, "](").concat(link.targetUrl, " \"").concat(link.targetTitle, "\")");
            // Try to insert at specified position
            if (link.position && link.position.paragraph < paragraphs.length) {
                var targetParagraph = paragraphs[link.position.paragraph];
                // Replace first occurrence of anchor text with link
                if (targetParagraph.toLowerCase().includes(link.anchorText.toLowerCase())) {
                    var regex = new RegExp("\\b".concat(link.anchorText, "\\b"), 'i');
                    paragraphs[link.position.paragraph] = targetParagraph.replace(regex, linkMarkdown);
                    insertedCount++;
                }
                else {
                    // Append to end of paragraph if exact match not found
                    paragraphs[link.position.paragraph] = "".concat(targetParagraph, " ").concat(linkMarkdown);
                    insertedCount++;
                }
            }
            else {
                // No position specified or invalid — append as "Related" link at end
                var relatedSection = paragraphs[paragraphs.length - 1];
                if (relatedSection === null || relatedSection === void 0 ? void 0 : relatedSection.startsWith('**Related:**')) {
                    paragraphs[paragraphs.length - 1] = "".concat(relatedSection, ", ").concat(linkMarkdown);
                }
                else {
                    paragraphs.push("\n**Related:** ".concat(linkMarkdown));
                }
                insertedCount++;
            }
        }
        logger_js_1.logger.debug({ insertedCount: insertedCount }, '[ContentAgent] Inserted internal links');
        return paragraphs.join('\n\n');
    };
    ContentAgent.prototype.buildSummary = function (input) {
        var _a, _b;
        var sentences = this.extractSentences(input.content);
        var desiredSentences = Math.max(1, Math.min((_a = input.sentences) !== null && _a !== void 0 ? _a : 3, sentences.length || 1));
        var summarySentences = sentences.slice(0, desiredSentences);
        var summaryText = summarySentences.join(" ").trim();
        var highlights = this.buildHighlightSentences(sentences, (_b = input.highlights) !== null && _b !== void 0 ? _b : Math.min(3, sentences.length || 1));
        var wordCount = input.content.split(/\s+/).filter(Boolean).length;
        var readingTimeMinutes = Number((wordCount / 200).toFixed(2));
        return {
            summary: summaryText,
            highlights: highlights,
            stats: {
                sentences: summarySentences.length,
                words: wordCount,
                readingTimeMinutes: readingTimeMinutes,
            },
        };
    };
    ContentAgent.prototype.extractSentences = function (content) {
        var _a;
        return ((_a = content.match(/[^.!?]+[.!?]?/g)) !== null && _a !== void 0 ? _a : [content])
            .map(function (sentence) { return sentence.trim(); })
            .filter(Boolean);
    };
    ContentAgent.prototype.buildHighlightSentences = function (sentences, limit) {
        if (sentences.length === 0 || limit <= 0) {
            return [];
        }
        var scored = sentences.map(function (sentence, index) { return ({
            index: index,
            sentence: sentence.replace(/\s+/g, " ").trim(),
            score: sentence.length,
        }); });
        scored.sort(function (a, b) { return b.score - a.score || a.index - b.index; });
        var selected = scored.slice(0, Math.min(limit, scored.length));
        selected.sort(function (a, b) { return a.index - b.index; });
        return selected.map(function (item) { return item.sentence; });
    };
    ContentAgent.prototype.deriveTopicFromContent = function (content) {
        var sentences = this.extractSentences(content);
        if (sentences.length > 0) {
            var words = sentences[0].split(/\s+/).filter(Boolean);
            return words.slice(0, 12).join(" ") || "Content insight";
        }
        var fallbackWords = content.split(/\s+/).filter(Boolean);
        return fallbackWords.slice(0, 8).join(" ") || "Content insight";
    };
    ContentAgent.prototype.deriveKeywordFromContent = function (content) {
        var _this = this;
        var _a, _b, _c;
        var tokens = (_a = content.toLowerCase().match(/\b[a-z0-9]{4,}\b/g)) !== null && _a !== void 0 ? _a : [];
        var tally = new Map();
        tokens.forEach(function (token) {
            var _a;
            if (!_this.contentStopWords.has(token)) {
                tally.set(token, ((_a = tally.get(token)) !== null && _a !== void 0 ? _a : 0) + 1);
            }
        });
        if (tally.size === 0) {
            return (_b = tokens[0]) !== null && _b !== void 0 ? _b : "insights";
        }
        var top = Array.from(tally.entries()).sort(function (a, b) { return b[1] - a[1]; })[0];
        return (_c = top === null || top === void 0 ? void 0 : top[0]) !== null && _c !== void 0 ? _c : "insights";
    };
    ContentAgent.prototype.buildOutlineFromContent = function (content) {
        var _this = this;
        var paragraphs = content
            .split(/\n{2,}/)
            .map(function (paragraph) { return paragraph.replace(/\s+/g, " ").trim(); })
            .filter(Boolean);
        if (paragraphs.length === 0) {
            return ["1. Introduction", "2. Key Insight", "3. Next Steps"].join("\n");
        }
        return paragraphs
            .slice(0, 5)
            .map(function (paragraph, index) {
            var _a;
            var sentence = (_a = _this.extractSentences(paragraph)[0]) !== null && _a !== void 0 ? _a : paragraph;
            var words = sentence.split(/\s+/).filter(Boolean);
            var heading = words.slice(0, 10).join(" ");
            return "".concat(index + 1, ". ").concat(heading);
        })
            .join("\n");
    };
    ContentAgent.prototype.truncateTweet = function (text) {
        var limit = 260;
        if (text.length <= limit) {
            return text;
        }
        return "".concat(text.slice(0, limit - 3).trimEnd(), "...");
    };
    ContentAgent.prototype.repurposeContent = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var format, topic, primaryKeyword, requestedTone, allowedTones, tone, snippets, summary, repurposed;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        format = input.format;
                        topic = ((_a = input.topic) === null || _a === void 0 ? void 0 : _a.trim()) || this.deriveTopicFromContent(input.content);
                        primaryKeyword = ((_b = input.primaryKeyword) === null || _b === void 0 ? void 0 : _b.trim()) || this.deriveKeywordFromContent(input.content);
                        requestedTone = (_d = (_c = input.tone) === null || _c === void 0 ? void 0 : _c.trim().toLowerCase()) !== null && _d !== void 0 ? _d : DEFAULT_TONE;
                        allowedTones = new Set(["professional", "casual", "friendly", "authoritative"]);
                        tone = allowedTones.has(requestedTone)
                            ? requestedTone
                            : DEFAULT_TONE;
                        return [4 /*yield*/, this.generateSocialSnippets({
                                topic: topic,
                                primaryKeyword: primaryKeyword,
                                brandId: input.brandId,
                                brandVoiceId: input.brandVoiceId,
                                tone: tone,
                            })];
                    case 1:
                        snippets = _e.sent();
                        summary = this.buildSummary({
                            content: input.content,
                            sentences: 2,
                            highlights: 3,
                        });
                        switch (format) {
                            case "twitter":
                                repurposed = this.truncateTweet(snippets.twitter);
                                break;
                            case "email":
                                repurposed = "Subject: ".concat(snippets.emailSubject, "\n\n").concat(summary.summary);
                                break;
                            case "outline":
                                repurposed = this.buildOutlineFromContent(input.content);
                                break;
                            case "linkedin":
                            default:
                                repurposed = snippets.linkedin;
                                break;
                        }
                        return [2 /*return*/, {
                                format: format,
                                content: repurposed.trim(),
                                metadata: {
                                    topic: topic,
                                    primaryKeyword: primaryKeyword,
                                    tone: tone,
                                    estimatedLength: repurposed.length,
                                },
                            }];
                }
            });
        });
    };
    ContentAgent.prototype.attachUser = function (input, context) {
        var _a;
        if (input.createdById || !context.userId) {
            return input;
        }
        return __assign(__assign({}, input), { createdById: (_a = context.userId) !== null && _a !== void 0 ? _a : undefined });
    };
    ContentAgent.prototype.resolveExecutionContext = function (context) {
        var _a;
        var validated = (0, normalize_js_1.validateAgentContext)(context);
        return {
            organizationId: validated.organizationId,
            prisma: validated.prisma,
            logger: validated.logger,
            userId: (_a = validated.userId) !== null && _a !== void 0 ? _a : null,
        };
    };
    ContentAgent.prototype.invalidInput = function (error) {
        var message = error instanceof Error ? error.message : "Invalid input";
        return { ok: false, error: message, code: "INVALID_INPUT" };
    };
    ContentAgent.prototype.executionError = function (error) {
        var message = error instanceof Error ? error.message : "Agent execution failed";
        return { ok: false, error: message, code: "AGENT_EXECUTION_FAILED" };
    };
    ContentAgent.prototype.handleGenerateDraftIntent = function (payload, context, intent) {
        return __awaiter(this, void 0, void 0, function () {
            var parsed, augmented, generateInput, result, error_4;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        try {
                            parsed = GenerateDraftPayloadSchema.parse(payload);
                        }
                        catch (error) {
                            return [2 /*return*/, this.invalidInput(error)];
                        }
                        augmented = this.attachUser(parsed, context);
                        if (!augmented.createdById) {
                            return [2 /*return*/, this.invalidInput(new Error("createdById is required for draft generation"))];
                        }
                        generateInput = {
                            topic: augmented.topic,
                            primaryKeyword: augmented.primaryKeyword,
                            personaId: augmented.personaId,
                            secondaryKeywords: augmented.secondaryKeywords,
                            outline: augmented.outline,
                            tone: (_a = augmented.tone) !== null && _a !== void 0 ? _a : DEFAULT_TONE,
                            audience: augmented.audience,
                            callToAction: augmented.callToAction,
                            brandId: augmented.brandId,
                            brandVoiceId: augmented.brandVoiceId,
                            wordCount: augmented.wordCount,
                            createdById: augmented.createdById,
                        };
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, agent_run_js_1.executeAgentRun)(this.orchestratorAgentId, context, generateInput, function () { return _this.generateArticle(generateInput); }, {
                                intent: intent,
                                buildMetrics: function (output) { return ({
                                    draftId: output.draftId,
                                    wordCount: output.body.split(/\s+/).filter(Boolean).length,
                                    keywordInsights: output.keywordInsights.length,
                                }); },
                            })];
                    case 2:
                        result = (_b.sent()).result;
                        return [2 /*return*/, { ok: true, data: result }];
                    case 3:
                        error_4 = _b.sent();
                        return [2 /*return*/, this.executionError(error_4)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ContentAgent.prototype.handleSummarizeIntent = function (payload, context, intent) {
        return __awaiter(this, void 0, void 0, function () {
            var parsed, augmented, summary, result, error_5;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            parsed = SummarizePayloadSchema.parse(payload);
                        }
                        catch (error) {
                            return [2 /*return*/, this.invalidInput(error)];
                        }
                        augmented = this.attachUser(parsed, context);
                        summary = this.buildSummary(augmented);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, agent_run_js_1.executeAgentRun)(this.orchestratorAgentId, context, augmented, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, summary];
                            }); }); }, {
                                intent: intent,
                                buildMetrics: function () { return ({
                                    sentences: summary.stats.sentences,
                                    words: summary.stats.words,
                                }); },
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
    ContentAgent.prototype.handleRepurposeIntent = function (payload, context, intent) {
        return __awaiter(this, void 0, void 0, function () {
            var parsed, augmented, result, error_6;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            parsed = RepurposePayloadSchema.parse(payload);
                        }
                        catch (error) {
                            return [2 /*return*/, this.invalidInput(error)];
                        }
                        augmented = this.attachUser(parsed, context);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, agent_run_js_1.executeAgentRun)(this.orchestratorAgentId, context, augmented, function () { return _this.repurposeContent(augmented); }, {
                                intent: intent,
                                buildMetrics: function (output) { return ({
                                    format: output.format,
                                    length: output.content.length,
                                }); },
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
    ContentAgent.prototype.handle = function (request) {
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
                    case "generate-draft":
                        return [2 /*return*/, this.handleGenerateDraftIntent(request.payload, executionContext, request.intent)];
                    case "summarize":
                        return [2 /*return*/, this.handleSummarizeIntent(request.payload, executionContext, request.intent)];
                    case "repurpose":
                        return [2 /*return*/, this.handleRepurposeIntent(request.payload, executionContext, request.intent)];
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
    return ContentAgent;
}());
exports.ContentAgent = ContentAgent;
exports.contentAgent = new ContentAgent();
