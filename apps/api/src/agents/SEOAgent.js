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
exports.seoAgent = exports.SEOAgent = void 0;
var crypto_1 = require("crypto");
var zod_1 = require("zod");
var prisma_js_1 = require("../db/prisma.js");
var AgentJobManager_js_1 = require("./base/AgentJobManager.js");
var logger_js_1 = require("../lib/logger.js");
var normalize_js_1 = require("./_shared/normalize.js");
var agent_run_js_1 = require("./utils/agent-run.js");
var context_service_js_1 = require("../services/rag/context.service.js");
var knowledge_service_js_1 = require("../services/rag/knowledge.service.js");
var STOP_WORDS = new Set([
    "the",
    "a",
    "an",
    "for",
    "to",
    "and",
    "of",
    "with",
    "in",
    "on",
    "at",
    "by",
    "from",
    "best",
    "top",
    "guide",
    "how",
    "what",
]);
var TREND_VALUES = ["rising", "stable", "declining"];
var DEFAULT_DESCRIPTOR = {
    id: "seo",
    name: "SEO Strategy Agent",
    capabilities: [
        "keyword_discovery",
        "intent_analysis",
        "difficulty_scoring",
        "opportunity_ranking",
    ],
    config: {
        dataSources: ["prisma.keywords", "editorial_calendar"],
        refreshInterval: "weekly",
        defaultLimit: 40,
    },
};
var DiscoverKeywordsPayloadSchema = zod_1.z
    .object({
    seeds: zod_1.z.array(zod_1.z.string().min(1, "seed keyword cannot be empty")).optional(),
    seed: zod_1.z.string().min(1).optional(),
    topic: zod_1.z.string().min(1).optional(),
    personaId: zod_1.z.union([zod_1.z.string(), zod_1.z.number()]).optional(),
    limit: zod_1.z.number().int().positive().max(100).optional(),
    competitorDomains: zod_1.z.array(zod_1.z.string().min(1)).optional(),
    createdById: zod_1.z.string().optional(),
})
    .refine(function (data) { return Boolean((data.seeds && data.seeds.length > 0) || data.seed || data.topic); }, { message: "At least one seed keyword is required." });
var SeoAuditPayloadSchema = zod_1.z
    .object({
    keyword: zod_1.z.string().min(1).optional(),
    url: zod_1.z.string().url().optional(),
    competitorDomains: zod_1.z.array(zod_1.z.string().min(1)).optional(),
    backlinkCount: zod_1.z.number().int().nonnegative().optional(),
    domainAuthority: zod_1.z.number().min(0).max(100).optional(),
    createdById: zod_1.z.string().optional(),
})
    .refine(function (data) { return Boolean(data.keyword || data.url); }, {
    message: "Provide either keyword or url.",
});
/**
 * SEOAgent coordinates keyword discovery, intent analysis, and opportunity scoring.
 * The implementation is deterministic to remain test-friendly in offline environments.
 */
var SEOAgent = /** @class */ (function () {
    function SEOAgent(deps) {
        if (deps === void 0) { deps = {}; }
        var _a, _b, _c;
        this.agentName = "seo";
        this.orchestratorAgentId = "SEOAgent";
        this.descriptor = DEFAULT_DESCRIPTOR;
        this.prisma = (_a = deps.prisma) !== null && _a !== void 0 ? _a : prisma_js_1.prisma;
        this.jobManager = (_b = deps.jobManager) !== null && _b !== void 0 ? _b : AgentJobManager_js_1.agentJobManager;
        this.now = (_c = deps.now) !== null && _c !== void 0 ? _c : (function () { return new Date(); });
        this.ragContext = new context_service_js_1.RagContextService();
        this.knowledgeBase = new knowledge_service_js_1.KnowledgeBaseService();
    }
    /**
     * Discover and cluster keyword opportunities around a set of seed terms.
     */
    SEOAgent.prototype.discoverKeywords = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var seeds, personaId, limit, jobId, personaKeywords, candidates, enriched, ragContext, _a, contextSnippets, ranked, clusters, summary, highlightLines, error_1, message;
            var _this = this;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        seeds = this.normalizeSeedList(input.seeds);
                        if (seeds.length === 0) {
                            throw new Error("At least one seed keyword is required.");
                        }
                        personaId = this.coercePersonaId(input.personaId);
                        limit = this.normalizeLimit(input.limit);
                        return [4 /*yield*/, this.jobManager.createJob({
                                agent: this.agentName,
                                input: {
                                    seeds: seeds,
                                    personaId: personaId,
                                    limit: limit,
                                    competitorDomains: (_b = input.competitorDomains) !== null && _b !== void 0 ? _b : [],
                                },
                                createdById: input.createdById,
                            })];
                    case 1:
                        jobId = _c.sent();
                        return [4 /*yield*/, this.jobManager.startJob(jobId)];
                    case 2:
                        _c.sent();
                        _c.label = 3;
                    case 3:
                        _c.trys.push([3, 10, , 12]);
                        return [4 /*yield*/, this.fetchPersonaKeywords(personaId)];
                    case 4:
                        personaKeywords = _c.sent();
                        candidates = this.buildCandidateKeywords(seeds, personaKeywords);
                        enriched = candidates.map(function (candidate) {
                            return _this.enrichKeyword(candidate, personaId);
                        });
                        _a = input.organizationId;
                        if (!_a) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.ragContext.build({
                                organizationId: input.organizationId,
                                query: seeds.join(" "),
                                categories: ["seo"],
                                personId: input.createdById,
                            })];
                    case 5:
                        _a = (_c.sent());
                        _c.label = 6;
                    case 6:
                        ragContext = _a;
                        contextSnippets = ragContext
                            ? __spreadArray(__spreadArray([], ragContext.knowledge.slice(0, 3).map(function (entry) { return entry.text; }), true), ragContext.memories.slice(0, 2).map(function (entry) { var _a; return (_a = entry.label) !== null && _a !== void 0 ? _a : ""; }), true).filter(Boolean)
                            : [];
                        ranked = enriched
                            .sort(function (a, b) { return b.opportunityScore - a.opportunityScore; })
                            .slice(0, limit);
                        clusters = this.buildClusters(ranked);
                        summary = this.buildDiscoverySummary(clusters, personaId, seeds.length);
                        summary.contextSnippets = contextSnippets;
                        return [4 /*yield*/, this.jobManager.completeJob(jobId, {
                                clusters: clusters,
                                summary: summary,
                            }, {
                                processedKeywords: ranked.length,
                                totalClusters: clusters.length,
                            })];
                    case 7:
                        _c.sent();
                        if (!(input.organizationId && input.createdById)) return [3 /*break*/, 9];
                        highlightLines = clusters.slice(0, 3).map(function (cluster, index) {
                            return "".concat(index + 1, ". ").concat(cluster.label, " \u2192 ").concat(cluster.keywords
                                .slice(0, 3)
                                .map(function (kw) { return kw.keyword; })
                                .join(", "));
                        });
                        return [4 /*yield*/, this.knowledgeBase.ingestSnippet({
                                organizationId: input.organizationId,
                                datasetSlug: "seo-".concat(input.organizationId),
                                datasetName: "SEO Knowledge",
                                title: "Keyword research ".concat(this.now().toISOString()),
                                content: "Seeds: ".concat(seeds.join(", "), "\n").concat(highlightLines.join("\n")),
                                ownerId: input.createdById,
                                metadata: {
                                    agent: "SEOAgent",
                                    personaId: personaId,
                                },
                            })];
                    case 8:
                        _c.sent();
                        _c.label = 9;
                    case 9: return [2 /*return*/, {
                            jobId: jobId,
                            clusters: clusters,
                            summary: summary,
                        }];
                    case 10:
                        error_1 = _c.sent();
                        message = error_1 instanceof Error ? error_1.message : "Unknown discovery error";
                        return [4 /*yield*/, this.jobManager.failJob(jobId, message)];
                    case 11:
                        _c.sent();
                        logger_js_1.logger.error({ error: message, seeds: seeds, personaId: personaId }, "SEO keyword discovery failed");
                        throw error_1;
                    case 12: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Classify search intent for a list of keywords.
     */
    SEOAgent.prototype.analyzeIntent = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var keywords, personaId, personaKeywords, personaIntentMap, intents, summary;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        keywords = this.normalizeSeedList(input.keywords);
                        if (keywords.length === 0) {
                            throw new Error("At least one keyword is required for analysis.");
                        }
                        personaId = this.coercePersonaId(input.personaId);
                        return [4 /*yield*/, this.fetchPersonaKeywords(personaId)];
                    case 1:
                        personaKeywords = _a.sent();
                        personaIntentMap = new Map();
                        personaKeywords.forEach(function (keyword) {
                            var normalized = _this.normalizeKeyword(keyword.term);
                            var normalizedIntent = _this.normalizeIntent(keyword.intent);
                            if (normalizedIntent) {
                                personaIntentMap.set(normalized, normalizedIntent);
                            }
                        });
                        intents = keywords.map(function (keyword) {
                            var presetIntent = personaIntentMap.get(_this.normalizeKeyword(keyword));
                            var classification = _this.classifyIntent(keyword, presetIntent);
                            return {
                                keyword: keyword,
                                intent: classification.intent,
                                confidence: Number(Math.min(1, classification.confidence).toFixed(2)),
                                reasons: classification.reasons,
                            };
                        });
                        summary = this.buildIntentSummary(intents, personaId);
                        return [2 /*return*/, {
                                intents: intents,
                                summary: summary,
                            }];
                }
            });
        });
    };
    /**
     * Score the ranking difficulty for a keyword using deterministic heuristics.
     */
    SEOAgent.prototype.scoreDifficulty = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var keyword, normalized, baseHash, competition, backlinkProfile, domainAuthorityGap, serpVolatility, contentQuality, difficulty, tier, recommendations;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                keyword = (_a = input.keyword) === null || _a === void 0 ? void 0 : _a.trim();
                if (!keyword) {
                    throw new Error("Keyword is required for difficulty scoring.");
                }
                normalized = this.normalizeKeyword(keyword);
                baseHash = this.hash(normalized);
                competition = this.computeCompetitionScore(baseHash, input.competitorDomains);
                backlinkProfile = this.computeBacklinkDifficulty(baseHash, input.backlinkCount);
                domainAuthorityGap = this.computeDomainAuthorityGap(baseHash, input.domainAuthority);
                serpVolatility = 30 + ((baseHash >> 8) % 45);
                contentQuality = 50 + ((baseHash >> 14) % 45);
                difficulty = Math.round(competition * 0.35 +
                    backlinkProfile * 0.25 +
                    domainAuthorityGap * 0.2 +
                    serpVolatility * 0.1 +
                    (100 - contentQuality) * 0.1);
                tier = difficulty < 35 ? "easy" : difficulty < 65 ? "moderate" : "hard";
                recommendations = this.buildDifficultyRecommendations({
                    competition: competition,
                    backlinkProfile: backlinkProfile,
                    domainAuthorityGap: domainAuthorityGap,
                    serpVolatility: serpVolatility,
                    contentQuality: contentQuality,
                    tier: tier,
                });
                return [2 /*return*/, {
                        keyword: keyword,
                        difficulty: Math.min(100, Math.max(0, difficulty)),
                        tier: tier,
                        components: {
                            competition: competition,
                            backlinkProfile: backlinkProfile,
                            domainAuthorityGap: domainAuthorityGap,
                            serpVolatility: serpVolatility,
                            contentQuality: contentQuality,
                        },
                        recommendations: recommendations,
                        context: {
                            competitorDomains: (_b = input.competitorDomains) !== null && _b !== void 0 ? _b : [],
                            referencedBacklinks: (_c = input.backlinkCount) !== null && _c !== void 0 ? _c : Math.max(20, (baseHash >> 5) % 400),
                            domainAuthority: (_d = input.domainAuthority) !== null && _d !== void 0 ? _d : 45 + (baseHash % 30),
                            calculatedAt: this.now().toISOString(),
                            ragPrompt: input.ragPrompt,
                            knowledgeSnippets: input.knowledgeSnippets,
                        },
                    }];
            });
        });
    };
    SEOAgent.prototype.formatAuditSnippet = function (result) {
        var _a;
        var recommendations = result.recommendations.slice(0, 3).join("\n- ");
        var contextLines = ((_a = result.context.knowledgeSnippets) === null || _a === void 0 ? void 0 : _a.length)
            ? "Context:\n- ".concat(result.context.knowledgeSnippets.join("\n- "), "\n")
            : "";
        return [
            "Keyword: ".concat(result.keyword),
            "Difficulty: ".concat(result.difficulty, " (").concat(result.tier, ")"),
            contextLines ? contextLines.trimEnd() : "",
            "Recommendations:\n- ".concat(recommendations),
        ]
            .filter(Boolean)
            .join("\n\n");
    };
    /**
     * Rank existing keyword records to surface the best near-term opportunities.
     */
    SEOAgent.prototype.discoverOpportunities = function () {
        return __awaiter(this, arguments, void 0, function (input) {
            var personaId, limit, personaKeywords, opportunityPool, seedCandidates, combined, unique, ranked, summary;
            var _this = this;
            var _a, _b, _c;
            if (input === void 0) { input = {}; }
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        personaId = this.coercePersonaId(input.personaId);
                        limit = Math.max(1, Math.min((_a = input.limit) !== null && _a !== void 0 ? _a : 15, 50));
                        return [4 /*yield*/, this.fetchPersonaKeywords(personaId)];
                    case 1:
                        personaKeywords = _d.sent();
                        opportunityPool = personaKeywords.map(function (keyword) {
                            var _a;
                            return _this.enrichKeyword({
                                term: keyword.term,
                                source: "persona",
                                personaPriority: (_a = keyword.priority) !== null && _a !== void 0 ? _a : undefined,
                                presetIntent: _this.normalizeIntent(keyword.intent),
                            }, personaId);
                        });
                        seedCandidates = (_c = (_b = input.includeSeeds) === null || _b === void 0 ? void 0 : _b.map(function (term) {
                            return _this.enrichKeyword({ term: term, source: "seed" }, personaId);
                        })) !== null && _c !== void 0 ? _c : [];
                        combined = __spreadArray(__spreadArray([], opportunityPool, true), seedCandidates, true);
                        unique = this.deduplicateByKeyword(combined);
                        ranked = unique
                            .sort(function (a, b) { return b.opportunityScore - a.opportunityScore; })
                            .slice(0, limit);
                        summary = {
                            personaId: personaId !== null && personaId !== void 0 ? personaId : undefined,
                            limit: limit,
                            dominantIntent: this.computeDominantIntent(ranked),
                            averageOpportunity: Number((ranked.reduce(function (acc, item) { return acc + item.opportunityScore; }, 0) /
                                Math.max(1, ranked.length)).toFixed(2)),
                            generatedAt: this.now().toISOString(),
                        };
                        return [2 /*return*/, {
                                opportunities: ranked,
                                summary: summary,
                            }];
                }
            });
        });
    };
    /**
     * Return agent descriptor metadata for registration purposes.
     */
    SEOAgent.prototype.getDescriptor = function () {
        return this.descriptor;
    };
    SEOAgent.prototype.normalizeSeedList = function (list) {
        return Array.from(new Set((list !== null && list !== void 0 ? list : [])
            .map(function (value) { return value === null || value === void 0 ? void 0 : value.trim().toLowerCase(); })
            .filter(function (value) { return Boolean(value); })));
    };
    SEOAgent.prototype.normalizeLimit = function (limit) {
        if (typeof limit !== "number" || Number.isNaN(limit)) {
            return DEFAULT_DESCRIPTOR.config.defaultLimit;
        }
        return Math.max(15, Math.min(Math.floor(limit), 100));
    };
    SEOAgent.prototype.coercePersonaId = function (personaId) {
        if (typeof personaId === "number" && Number.isFinite(personaId)) {
            return personaId;
        }
        if (typeof personaId === "string" && personaId.trim().length > 0) {
            var parsed = Number(personaId);
            return Number.isFinite(parsed) ? parsed : undefined;
        }
        return undefined;
    };
    SEOAgent.prototype.fetchPersonaKeywords = function (personaId) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.prisma.keyword.findMany({
                                where: personaId ? { personaId: personaId } : undefined,
                                orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
                                take: 200,
                            })];
                    case 1: return [2 /*return*/, _a.sent()];
                    case 2:
                        error_2 = _a.sent();
                        logger_js_1.logger.warn({ error: error_2, personaId: personaId }, "Falling back to empty persona keyword list");
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    SEOAgent.prototype.buildCandidateKeywords = function (seeds, personaKeywords) {
        var _this = this;
        var candidates = new Map();
        personaKeywords.forEach(function (keyword) {
            var _a;
            var normalized = _this.normalizeKeyword(keyword.term);
            candidates.set(normalized, {
                term: keyword.term,
                source: "persona",
                personaPriority: (_a = keyword.priority) !== null && _a !== void 0 ? _a : undefined,
                presetIntent: _this.normalizeIntent(keyword.intent),
            });
        });
        seeds.forEach(function (seed) {
            var normalized = _this.normalizeKeyword(seed);
            if (!candidates.has(normalized)) {
                candidates.set(normalized, {
                    term: seed,
                    source: "seed",
                });
            }
            _this.generateVariants(seed).forEach(function (variant) {
                var normalizedVariant = _this.normalizeKeyword(variant);
                if (!candidates.has(normalizedVariant)) {
                    candidates.set(normalizedVariant, {
                        term: variant,
                        source: "generated",
                    });
                }
            });
        });
        return Array.from(candidates.values());
    };
    SEOAgent.prototype.generateVariants = function (seed) {
        var _a;
        var normalized = seed.trim();
        var baseWords = normalized.split(/\s+/);
        var head = (_a = baseWords[0]) !== null && _a !== void 0 ? _a : normalized;
        return [
            "".concat(normalized, " strategy"),
            "".concat(normalized, " tools"),
            "".concat(normalized, " best practices"),
            "how to ".concat(normalized),
            "".concat(head, " vs alternative"),
        ];
    };
    SEOAgent.prototype.enrichKeyword = function (candidate, _personaId) {
        var _a;
        var normalized = this.normalizeKeyword(candidate.term);
        var hash = this.hash(normalized);
        var classification = this.classifyIntent(candidate.term, (_a = candidate.presetIntent) !== null && _a !== void 0 ? _a : undefined);
        var searchVolume = 250 + (hash % 7500);
        var difficulty = 25 + ((hash >> 5) % 60);
        var competitionScore = 30 + ((hash >> 8) % 60);
        var competitionLevel = competitionScore < 45 ? "low" : competitionScore < 70 ? "medium" : "high";
        var backlinks = 40 + ((hash >> 10) % 500);
        var domainAuthority = 35 + ((hash >> 13) % 55);
        var personaRelevance = candidate.personaPriority != null
            ? this.normalizePersonaPriority(candidate.personaPriority)
            : 0.5 + ((hash >> 16) % 30) / 100;
        var opportunityScore = this.calculateOpportunityScore({
            searchVolume: searchVolume,
            difficulty: difficulty,
            competitionScore: competitionScore,
            personaRelevance: personaRelevance,
            trend: TREND_VALUES[hash % TREND_VALUES.length],
        });
        var insights = this.buildKeywordInsights({
            intent: classification.intent,
            trend: TREND_VALUES[hash % TREND_VALUES.length],
            opportunityScore: opportunityScore,
            difficulty: difficulty,
            personaRelevance: personaRelevance,
        });
        return {
            keyword: this.formatKeyword(candidate.term),
            normalizedKeyword: normalized,
            source: candidate.source,
            intent: classification.intent,
            confidence: Number(Math.min(1, classification.confidence).toFixed(2)),
            searchVolume: searchVolume,
            difficulty: difficulty,
            opportunityScore: opportunityScore,
            competitionScore: competitionScore,
            competitionLevel: competitionLevel,
            backlinks: backlinks,
            domainAuthority: domainAuthority,
            trend: TREND_VALUES[hash % TREND_VALUES.length],
            personaRelevance: Number(personaRelevance.toFixed(2)),
            insights: insights,
        };
    };
    SEOAgent.prototype.normalizePersonaPriority = function (priority) {
        if (Number.isNaN(priority)) {
            return 0.5;
        }
        return Math.max(0, Math.min(1, priority / 100));
    };
    SEOAgent.prototype.normalizeKeyword = function (keyword) {
        return keyword.trim().toLowerCase();
    };
    SEOAgent.prototype.formatKeyword = function (keyword) {
        var lower = keyword.trim().toLowerCase();
        return lower.replace(/\b\w/g, function (char) { return char.toUpperCase(); });
    };
    SEOAgent.prototype.hash = function (value) {
        return parseInt((0, crypto_1.createHash)("sha256").update(value).digest("hex").slice(0, 8), 16);
    };
    SEOAgent.prototype.calculateOpportunityScore = function (input) {
        var volumeScore = Math.min(1, input.searchVolume / 10000);
        var difficultyScore = 1 - input.difficulty / 100;
        var competitionScore = 1 - input.competitionScore / 100;
        var trendBoost = input.trend === "rising" ? 0.1 : input.trend === "declining" ? -0.05 : 0;
        var raw = volumeScore * 0.45 +
            difficultyScore * 0.25 +
            competitionScore * 0.15 +
            input.personaRelevance * 0.1 +
            trendBoost;
        return Math.round(Math.max(0, Math.min(1, raw)) * 100);
    };
    SEOAgent.prototype.classifyIntent = function (keyword, presetIntent) {
        if (presetIntent) {
            return {
                intent: presetIntent,
                confidence: 0.92,
                reasons: ["Persona dataset"],
            };
        }
        var normalized = keyword.toLowerCase();
        var patterns = [
            {
                intent: "transactional",
                regex: /\b(buy|purchase|pricing|order|subscribe|get)\b/,
                boost: 0.25,
                reason: "Transactional verb detected",
            },
            {
                intent: "commercial",
                regex: /\b(best|top|vs|review|compare|comparison)\b/,
                boost: 0.22,
                reason: "Comparison pattern",
            },
            {
                intent: "informational",
                regex: /\b(how|what|guide|tutorial|tips|strategy|ideas)\b/,
                boost: 0.2,
                reason: "Educational language",
            },
            {
                intent: "navigational",
                regex: /\b(login|dashboard|pricing page|contact|neonhub)\b/,
                boost: 0.18,
                reason: "Brand/navigation term",
            },
        ];
        var intent = "informational";
        var confidence = 0.55;
        var reasons = [];
        for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
            var pattern = patterns_1[_i];
            if (pattern.regex.test(normalized)) {
                intent = pattern.intent;
                confidence += pattern.boost;
                reasons.push(pattern.reason);
            }
        }
        if (normalized.length <= 3) {
            intent = "navigational";
            confidence = 0.6;
            reasons.push("Short branded query heuristic");
        }
        return {
            intent: intent,
            confidence: confidence,
            reasons: reasons.length > 0 ? reasons : ["Heuristic classification"],
        };
    };
    SEOAgent.prototype.normalizeIntent = function (intent) {
        if (!intent) {
            return undefined;
        }
        var normalized = intent.toLowerCase();
        switch (normalized) {
            case "informational":
            case "info":
                return "informational";
            case "navigational":
            case "navigational-intent":
                return "navigational";
            case "commercial":
            case "commercial-investigation":
                return "commercial";
            case "transactional":
            case "trans":
                return "transactional";
            default:
                return undefined;
        }
    };
    SEOAgent.prototype.buildClusters = function (opportunities) {
        var _this = this;
        var clusterMap = new Map();
        opportunities.forEach(function (opportunity) {
            var _a;
            var key = _this.extractClusterKey(opportunity.normalizedKeyword);
            var bucket = (_a = clusterMap.get(key)) !== null && _a !== void 0 ? _a : [];
            bucket.push(opportunity);
            clusterMap.set(key, bucket);
        });
        return Array.from(clusterMap.entries())
            .map(function (_a) {
            var key = _a[0], list = _a[1];
            var sorted = __spreadArray([], list, true).sort(function (a, b) { return b.opportunityScore - a.opportunityScore; });
            var head = sorted[0];
            var totalSearchVolume = sorted.reduce(function (acc, item) { return acc + item.searchVolume; }, 0);
            var averageDifficulty = sorted.reduce(function (acc, item) { return acc + item.difficulty; }, 0) /
                Math.max(1, sorted.length);
            var aggregateOpportunity = sorted.reduce(function (acc, item) { return acc + item.opportunityScore; }, 0) /
                Math.max(1, sorted.length);
            var intentShare = {
                informational: 0,
                navigational: 0,
                commercial: 0,
                transactional: 0,
            };
            sorted.forEach(function (item) {
                intentShare[item.intent] += 1;
            });
            return {
                key: key,
                label: _this.toTitleCase(key),
                headKeyword: head.keyword,
                aggregateOpportunity: Number(aggregateOpportunity.toFixed(2)),
                averageDifficulty: Number(averageDifficulty.toFixed(2)),
                totalSearchVolume: totalSearchVolume,
                intentShare: intentShare,
                keywords: sorted,
            };
        })
            .sort(function (a, b) { return b.aggregateOpportunity - a.aggregateOpportunity; });
    };
    SEOAgent.prototype.extractClusterKey = function (keyword) {
        var _a;
        var tokens = keyword
            .split(/\s+/)
            .map(function (token) { return token.replace(/[^a-z0-9]/g, ""); })
            .filter(function (token) { return token && !STOP_WORDS.has(token); });
        if (tokens.length === 0) {
            return keyword;
        }
        tokens.sort(function (a, b) { return b.length - a.length; });
        return (_a = tokens[0]) !== null && _a !== void 0 ? _a : keyword;
    };
    SEOAgent.prototype.toTitleCase = function (value) {
        return value.replace(/\b\w/g, function (char) { return char.toUpperCase(); });
    };
    SEOAgent.prototype.buildDiscoverySummary = function (clusters, personaId, seedsAnalyzed) {
        var totalKeywords = clusters.reduce(function (acc, cluster) { return acc + cluster.keywords.length; }, 0);
        var averageOpportunity = clusters.reduce(function (acc, cluster) { return acc + cluster.aggregateOpportunity; }, 0) / Math.max(1, clusters.length);
        return {
            totalKeywords: totalKeywords,
            totalClusters: clusters.length,
            averageOpportunity: Number(averageOpportunity.toFixed(2)),
            personaId: personaId !== null && personaId !== void 0 ? personaId : undefined,
            computedAt: this.now().toISOString(),
            seedsAnalyzed: seedsAnalyzed,
        };
    };
    SEOAgent.prototype.buildIntentSummary = function (intents, personaId) {
        var _a, _b;
        var distribution = {
            informational: 0,
            navigational: 0,
            commercial: 0,
            transactional: 0,
        };
        intents.forEach(function (intent) {
            distribution[intent.intent] += 1;
        });
        var dominantIntent = ((_b = (_a = Object.entries(distribution).sort(function (a, b) { return b[1] - a[1]; })[0]) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : "informational");
        var averageConfidence = intents.reduce(function (acc, item) { return acc + item.confidence; }, 0) /
            Math.max(1, intents.length);
        return {
            distribution: distribution,
            dominantIntent: dominantIntent,
            averageConfidence: Number(averageConfidence.toFixed(2)),
            personaId: personaId !== null && personaId !== void 0 ? personaId : undefined,
            analyzedAt: this.now().toISOString(),
        };
    };
    SEOAgent.prototype.buildKeywordInsights = function (input) {
        var insights = [];
        if (input.opportunityScore > 75) {
            insights.push("High-priority gap with favorable demand-to-difficulty ratio.");
        }
        if (input.intent === "transactional") {
            insights.push("Conversion-ready traffic potential detected.");
        }
        else if (input.intent === "commercial") {
            insights.push("Strong commercial research signal; consider comparison content.");
        }
        if (input.trend === "rising") {
            insights.push("Trending upward; act before competition increases.");
        }
        if (input.personaRelevance > 0.7) {
            insights.push("Persona-aligned keyword supported by historical data.");
        }
        if (input.difficulty > 65) {
            insights.push("Expect medium-term effort to capture rankings.");
        }
        return insights;
    };
    SEOAgent.prototype.computeCompetitionScore = function (hash, competitorDomains) {
        var _a;
        var base = 35 + (hash % 50);
        var competitorModifier = Math.min(30, ((_a = competitorDomains === null || competitorDomains === void 0 ? void 0 : competitorDomains.length) !== null && _a !== void 0 ? _a : 0) * 6);
        return Math.min(100, base + competitorModifier);
    };
    SEOAgent.prototype.computeBacklinkDifficulty = function (hash, backlinkCount) {
        if (backlinkCount != null) {
            return Math.min(100, 20 + Math.log10(Math.max(1, backlinkCount)) * 25);
        }
        return 25 + ((hash >> 6) % 60);
    };
    SEOAgent.prototype.computeDomainAuthorityGap = function (hash, domainAuthority) {
        if (domainAuthority != null) {
            return Math.max(0, 100 - Math.min(100, domainAuthority * 1.2));
        }
        return 30 + ((hash >> 4) % 50);
    };
    SEOAgent.prototype.buildDifficultyRecommendations = function (input) {
        var recommendations = [];
        if (input.tier === "easy") {
            recommendations.push("Publish optimized content within 2-3 weeks to capture momentum.");
        }
        else if (input.tier === "moderate") {
            recommendations.push("Plan supporting content cluster and build 3-5 internal links post-publication.");
        }
        else {
            recommendations.push("Pair content production with targeted backlink outreach for authority lift.");
        }
        if (input.domainAuthorityGap > 55) {
            recommendations.push("Increase domain authority via digital PR or partner content syndication.");
        }
        if (input.backlinkProfile > 60) {
            recommendations.push("Develop link-worthy assets (original data, calculators) for outreach.");
        }
        if (input.serpVolatility > 55) {
            recommendations.push("Monitor rankings weekly; SERP volatility indicates algorithmic churn.");
        }
        if (input.contentQuality > 70) {
            recommendations.push("Benchmark top results to exceed depth and freshness expectations.");
        }
        return recommendations;
    };
    SEOAgent.prototype.deduplicateByKeyword = function (opportunities) {
        var seen = new Map();
        opportunities.forEach(function (item) {
            if (!seen.has(item.normalizedKeyword)) {
                seen.set(item.normalizedKeyword, item);
            }
        });
        return Array.from(seen.values());
    };
    SEOAgent.prototype.computeDominantIntent = function (opportunities) {
        var _a, _b;
        if (opportunities.length === 0) {
            return "informational";
        }
        var tallies = {
            informational: 0,
            navigational: 0,
            commercial: 0,
            transactional: 0,
        };
        opportunities.forEach(function (item) {
            tallies[item.intent] += 1;
        });
        return ((_b = (_a = Object.entries(tallies).sort(function (a, b) { return b[1] - a[1]; })[0]) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : "informational");
    };
    SEOAgent.prototype.withUserFallback = function (input, context) {
        var _a;
        if (input.createdById || !context.userId) {
            return input;
        }
        return __assign(__assign({}, input), { createdById: (_a = context.userId) !== null && _a !== void 0 ? _a : undefined });
    };
    SEOAgent.prototype.resolveExecutionContext = function (context) {
        var _a;
        var validated = (0, normalize_js_1.validateAgentContext)(context);
        return {
            organizationId: validated.organizationId,
            prisma: validated.prisma,
            logger: validated.logger,
            userId: (_a = validated.userId) !== null && _a !== void 0 ? _a : null,
        };
    };
    SEOAgent.prototype.invalidInput = function (error) {
        var message = error instanceof Error ? error.message : "Invalid input";
        return { ok: false, error: message, code: "INVALID_INPUT" };
    };
    SEOAgent.prototype.executionError = function (error) {
        var message = error instanceof Error ? error.message : "Agent execution failed";
        return { ok: false, error: message, code: "AGENT_EXECUTION_FAILED" };
    };
    SEOAgent.prototype.deriveKeywordFromUrl = function (rawUrl) {
        try {
            var parsed = new URL(rawUrl);
            var segments = parsed.pathname.split("/").filter(Boolean);
            if (segments.length > 0) {
                var lastSegment = segments[segments.length - 1];
                var normalized = lastSegment.replace(/[-_]+/g, " ").trim();
                if (normalized.length > 0) {
                    return normalized;
                }
            }
            var host = parsed.hostname.replace(/^www\./, "");
            return host.replace(/\./g, " ").trim() || "homepage";
        }
        catch (_a) {
            return rawUrl.replace(/https?:\/\//gi, "").replace(/[^a-z0-9]+/gi, " ").trim() || "homepage";
        }
    };
    SEOAgent.prototype.handleKeywordResearchIntent = function (payload, context, intent) {
        return __awaiter(this, void 0, void 0, function () {
            var parsed, seeds, input, resolvedInput, result, error_3;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        try {
                            parsed = DiscoverKeywordsPayloadSchema.parse(payload);
                        }
                        catch (error) {
                            return [2 /*return*/, this.invalidInput(error)];
                        }
                        seeds = __spreadArray(__spreadArray(__spreadArray([], ((_a = parsed.seeds) !== null && _a !== void 0 ? _a : []), true), (parsed.seed ? [parsed.seed] : []), true), (parsed.topic ? [parsed.topic] : []), true).map(function (seed) { return seed.trim(); })
                            .filter(Boolean);
                        if (seeds.length === 0) {
                            return [2 /*return*/, this.invalidInput(new Error("At least one seed keyword is required."))];
                        }
                        input = {
                            seeds: seeds,
                            personaId: parsed.personaId,
                            limit: parsed.limit,
                            competitorDomains: parsed.competitorDomains,
                            createdById: parsed.createdById,
                            organizationId: context.organizationId,
                        };
                        resolvedInput = this.withUserFallback(input, context);
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, agent_run_js_1.executeAgentRun)(this.orchestratorAgentId, context, resolvedInput, function () { return _this.discoverKeywords(resolvedInput); }, {
                                intent: intent,
                                buildMetrics: function (output) { return ({
                                    clusters: output.clusters.length,
                                    totalKeywords: output.summary.totalKeywords,
                                }); },
                            })];
                    case 2:
                        result = (_b.sent()).result;
                        return [2 /*return*/, { ok: true, data: result }];
                    case 3:
                        error_3 = _b.sent();
                        return [2 /*return*/, this.executionError(error_3)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SEOAgent.prototype.handleSeoAuditIntent = function (payload, context, intent) {
        return __awaiter(this, void 0, void 0, function () {
            var parsed, keywordSource, keyword, payloadWithUser, ragDetails, _a, ragPrompt, knowledgeSnippets, scoreInput, result, ownerId, error_4;
            var _this = this;
            var _b, _c, _d, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        try {
                            parsed = SeoAuditPayloadSchema.parse(payload);
                        }
                        catch (error) {
                            return [2 /*return*/, this.invalidInput(error)];
                        }
                        keywordSource = (_c = (_b = parsed.keyword) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : "";
                        keyword = keywordSource.length > 0
                            ? keywordSource
                            : parsed.url
                                ? this.deriveKeywordFromUrl(parsed.url)
                                : "";
                        if (!keyword) {
                            return [2 /*return*/, this.invalidInput(new Error("Unable to derive keyword for audit"))];
                        }
                        payloadWithUser = this.withUserFallback({
                            keyword: keyword,
                            competitorDomains: parsed.competitorDomains,
                            backlinkCount: parsed.backlinkCount,
                            domainAuthority: parsed.domainAuthority,
                            createdById: parsed.createdById,
                        }, context);
                        _a = context.organizationId;
                        if (!_a) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.ragContext.build({
                                organizationId: context.organizationId,
                                query: keyword,
                                categories: ["seo"],
                                personId: (_d = context.userId) !== null && _d !== void 0 ? _d : undefined,
                            })];
                    case 1:
                        _a = (_g.sent());
                        _g.label = 2;
                    case 2:
                        ragDetails = _a;
                        ragPrompt = ragDetails ? this.ragContext.formatForPrompt(ragDetails) : "";
                        knowledgeSnippets = (_e = ragDetails === null || ragDetails === void 0 ? void 0 : ragDetails.knowledge.slice(0, 3).map(function (entry) { return entry.text; })) !== null && _e !== void 0 ? _e : [];
                        scoreInput = {
                            keyword: payloadWithUser.keyword,
                            competitorDomains: payloadWithUser.competitorDomains,
                            backlinkCount: payloadWithUser.backlinkCount,
                            domainAuthority: payloadWithUser.domainAuthority,
                            ragPrompt: ragPrompt || undefined,
                            knowledgeSnippets: knowledgeSnippets.length ? knowledgeSnippets : undefined,
                        };
                        _g.label = 3;
                    case 3:
                        _g.trys.push([3, 7, , 8]);
                        return [4 /*yield*/, (0, agent_run_js_1.executeAgentRun)(this.orchestratorAgentId, context, payloadWithUser, function () { return _this.scoreDifficulty(scoreInput); }, {
                                intent: intent,
                                buildMetrics: function (output) { return ({
                                    difficulty: output.difficulty,
                                    tier: output.tier,
                                }); },
                            })];
                    case 4:
                        result = (_g.sent()).result;
                        if (!context.organizationId) return [3 /*break*/, 6];
                        ownerId = (_f = context.userId) !== null && _f !== void 0 ? _f : payloadWithUser.createdById;
                        if (!ownerId) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.knowledgeBase.ingestSnippet({
                                organizationId: context.organizationId,
                                datasetSlug: "seo-".concat(context.organizationId),
                                datasetName: "SEO Knowledge",
                                title: "SEO audit for ".concat(keyword),
                                content: this.formatAuditSnippet(result),
                                ownerId: ownerId,
                                metadata: {
                                    agent: "SEOAgent",
                                    intent: intent,
                                },
                            })];
                    case 5:
                        _g.sent();
                        _g.label = 6;
                    case 6: return [2 /*return*/, { ok: true, data: result }];
                    case 7:
                        error_4 = _g.sent();
                        return [2 /*return*/, this.executionError(error_4)];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    SEOAgent.prototype.handle = function (request) {
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
                    case "keyword-research":
                        return [2 /*return*/, this.handleKeywordResearchIntent(request.payload, executionContext, request.intent)];
                    case "seo-audit":
                        return [2 /*return*/, this.handleSeoAuditIntent(request.payload, executionContext, request.intent)];
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
    return SEOAgent;
}());
exports.SEOAgent = SEOAgent;
exports.seoAgent = new SEOAgent();
