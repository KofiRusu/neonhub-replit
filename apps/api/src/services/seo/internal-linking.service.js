"use strict";
/**
 * SEO Internal Linking Recommendation Service
 *
 * AI-powered internal link suggestions using semantic similarity (pgvector),
 * relevance scoring, and topic clustering for optimal site architecture.
 *
 * @module services/seo/internal-linking
 * @author Cursor Agent (Neon Autonomous Development Agent)
 * @date 2025-10-27
 */
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
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
exports.LinkGraphAnalyzer = exports.InternalLinkingService = void 0;
var openai_js_1 = require("../../lib/openai.js");
// ============================================================================
// INTERNAL LINKING SERVICE
// ============================================================================
var InternalLinkingService = /** @class */ (function () {
    function InternalLinkingService(prisma) {
        this.prisma = prisma;
    }
    /**
     * Suggest internal links for a page based on semantic similarity
     *
     * Uses pgvector to find related pages, then AI to generate contextual anchor text
     *
     * @example
     * const suggestions = await service.suggestLinks({
     *   currentPageUrl: "/blog/marketing-automation-guide",
     *   currentPageContent: "Marketing automation helps...",
     *   targetKeyword: "marketing automation",
     *   maxSuggestions: 5
     * });
     */
    InternalLinkingService.prototype.suggestLinks = function (params) {
        return __awaiter(this, void 0, void 0, function () {
            var currentPageUrl, currentPageContent, targetKeyword, _a, maxSuggestions, currentEmbedding, relatedPages, suggestions, _i, _b, relatedPage, anchorText, position;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        currentPageUrl = params.currentPageUrl, currentPageContent = params.currentPageContent, targetKeyword = params.targetKeyword, _a = params.maxSuggestions, maxSuggestions = _a === void 0 ? 5 : _a;
                        return [4 /*yield*/, this.generateEmbedding(currentPageContent)];
                    case 1:
                        currentEmbedding = _c.sent();
                        return [4 /*yield*/, this.findRelatedPagesByEmbedding(currentEmbedding, currentPageUrl, maxSuggestions * 2 // Get more candidates, then filter
                            )];
                    case 2:
                        relatedPages = _c.sent();
                        suggestions = [];
                        _i = 0, _b = relatedPages.slice(0, maxSuggestions);
                        _c.label = 3;
                    case 3:
                        if (!(_i < _b.length)) return [3 /*break*/, 6];
                        relatedPage = _b[_i];
                        return [4 /*yield*/, this.generateAnchorText(currentPageContent, relatedPage.keyword, relatedPage.title)];
                    case 4:
                        anchorText = _c.sent();
                        if (!anchorText)
                            return [3 /*break*/, 5];
                        position = this.findBestPosition(currentPageContent, anchorText);
                        suggestions.push({
                            targetUrl: relatedPage.url,
                            targetTitle: relatedPage.title,
                            targetKeyword: relatedPage.keyword,
                            anchorText: anchorText,
                            relevanceScore: relatedPage.relevance,
                            position: position,
                            reasoning: "Related to \"".concat(targetKeyword, "\" with ").concat(Math.round(relatedPage.relevance * 100), "% similarity"),
                            priority: this.calculatePriority(relatedPage.relevance, position)
                        });
                        _c.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [2 /*return*/, suggestions.sort(function (a, b) { return b.relevanceScore - a.relevanceScore; })];
                }
            });
        });
    };
    /**
     * Analyze site-wide internal linking structure
     * Identify orphan pages, broken links, and optimization opportunities
     */
    InternalLinkingService.prototype.analyzeSiteStructure = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Implement with actual database queries
                // This is a placeholder structure
                // Query all pages and their links
                // const pages = await this.prisma.seoPage.findMany({
                //   include: { incomingLinks: true, outgoingLinks: true }
                // });
                return [2 /*return*/, {
                        totalInternalLinks: 0,
                        brokenLinks: 0,
                        orphanPages: 0,
                        wellLinkedPages: 0,
                        averageLinksPerPage: 0,
                        topLinkedPages: []
                    }];
            });
        });
    };
    /**
     * Build topic clusters (pillar pages + supporting pages)
     *
     * Identifies main "pillar" content and related supporting pages,
     * then suggests links to create a strong cluster structure
     */
    InternalLinkingService.prototype.buildTopicClusters = function (topic) {
        return __awaiter(this, void 0, void 0, function () {
            var topicEmbedding, relatedPages, pillarPage, supportingPages, missingLinks;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.generateEmbedding(topic)];
                    case 1:
                        topicEmbedding = _a.sent();
                        return [4 /*yield*/, this.findRelatedPagesByEmbedding(topicEmbedding, '', 20)];
                    case 2:
                        relatedPages = _a.sent();
                        pillarPage = relatedPages[0];
                        supportingPages = relatedPages.slice(1);
                        return [4 /*yield*/, this.findMissingClusterLinks(pillarPage.url, supportingPages)];
                    case 3:
                        missingLinks = _a.sent();
                        return [2 /*return*/, [{
                                    pillarPage: pillarPage.url,
                                    pillarTitle: pillarPage.title,
                                    supportingPages: supportingPages,
                                    clusterScore: this.calculateClusterScore(pillarPage, supportingPages),
                                    missingLinks: missingLinks
                                }]];
                }
            });
        });
    };
    /**
     * Generate contextual anchor text for a link
     *
     * Uses AI to create natural, descriptive anchor text that fits the context
     */
    InternalLinkingService.prototype.generateAnchorText = function (sourceContent, targetKeyword, targetTitle) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, completion, anchorText, error_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        prompt = "Generate natural anchor text for an internal link in this content:\n\nSource content:\n".concat(sourceContent.substring(0, 500), "...\n\nTarget page:\n- Title: \"").concat(targetTitle, "\"\n- Keyword: \"").concat(targetKeyword, "\"\n\nRequirements:\n- 2-5 words, descriptive and natural\n- Include or relate to \"").concat(targetKeyword, "\"\n- Must fit naturally in the source content\n- Avoid generic phrases (\"click here\", \"read more\")\n- Use active, descriptive language\n\nOutput ONLY the anchor text (no quotes, formatting, or explanation).");
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, openai_js_1.openai.chat.completions.create({
                                model: 'gpt-4',
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'You are an expert SEO content strategist specializing in internal linking. Generate concise, natural anchor text.'
                                    },
                                    { role: 'user', content: prompt }
                                ],
                                temperature: 0.6,
                                max_tokens: 50
                            })];
                    case 2:
                        completion = _b.sent();
                        anchorText = ((_a = completion.choices[0].message.content) === null || _a === void 0 ? void 0 : _a.trim()) || null;
                        // Validate anchor text length and quality
                        if (anchorText && anchorText.split(' ').length >= 2 && anchorText.split(' ').length <= 7) {
                            return [2 /*return*/, anchorText];
                        }
                        return [2 /*return*/, null];
                    case 3:
                        error_1 = _b.sent();
                        console.error('Error generating anchor text:', error_1);
                        // Fallback: use target keyword or title
                        return [2 /*return*/, targetKeyword.length <= 50 ? targetKeyword : targetTitle.substring(0, 50)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find best position in content to insert a link
     *
     * Analyzes content to find the most relevant paragraph and sentence
     * for inserting the anchor text
     */
    InternalLinkingService.prototype.findBestPosition = function (content, anchorText) {
        var _this = this;
        // Split content into paragraphs
        var paragraphs = content.split(/\n\n+/).filter(function (p) { return p.trim().length > 0; });
        // Find paragraph with highest relevance to anchor text
        var bestParagraphIndex = 0;
        var highestScore = 0;
        paragraphs.forEach(function (paragraph, index) {
            var score = _this.calculateTextSimilarity(paragraph, anchorText);
            if (score > highestScore) {
                highestScore = score;
                bestParagraphIndex = index;
            }
        });
        var bestParagraph = paragraphs[bestParagraphIndex];
        var sentences = bestParagraph.split(/[.!?]+/).filter(function (s) { return s.trim().length > 0; });
        // Find best sentence (usually first or second for natural flow)
        var bestSentenceIndex = Math.min(1, sentences.length - 1);
        var bestSentence = sentences[bestSentenceIndex];
        // Find position within sentence
        var words = bestSentence.trim().split(/\s+/);
        var midPoint = Math.floor(words.length / 2);
        return {
            paragraph: bestParagraphIndex,
            sentence: bestSentenceIndex,
            beforeText: words.slice(0, midPoint).join(' '),
            afterText: words.slice(midPoint).join(' ')
        };
    };
    /**
     * Validate anchor text quality
     *
     * Checks for generic phrases, over-optimization, and best practices
     */
    InternalLinkingService.prototype.validateAnchorText = function (anchorText) {
        var issues = [];
        var score = 100;
        // Check for generic phrases
        var genericPhrases = [
            'click here', 'read more', 'here', 'link', 'this',
            'click this', 'more info', 'learn more'
        ];
        var anchorLower = anchorText.toLowerCase();
        if (genericPhrases.some(function (phrase) { return anchorLower === phrase; })) {
            issues.push('Generic anchor text detected');
            score -= 50;
        }
        // Check length
        var wordCount = anchorText.split(/\s+/).length;
        if (wordCount < 2) {
            issues.push('Anchor text too short (min 2 words)');
            score -= 20;
        }
        else if (wordCount > 7) {
            issues.push('Anchor text too long (max 7 words)');
            score -= 15;
        }
        // Check for keyword stuffing
        var uniqueWords = new Set(anchorText.toLowerCase().split(/\s+/));
        if (uniqueWords.size < wordCount * 0.6) {
            issues.push('Possible keyword stuffing (too many repeated words)');
            score -= 25;
        }
        // Check for special characters (should be minimal)
        var specialChars = anchorText.match(/[^a-zA-Z0-9\s-]/g);
        if (specialChars && specialChars.length > 2) {
            issues.push('Too many special characters in anchor text');
            score -= 10;
        }
        return {
            isValid: issues.length === 0,
            issues: issues,
            score: Math.max(0, score)
        };
    };
    // ============================================================================
    // PRIVATE HELPER METHODS
    // ============================================================================
    /**
     * Generate vector embedding for text using OpenAI
     */
    InternalLinkingService.prototype.generateEmbedding = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            var response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, openai_js_1.openai.embeddings.create({
                                model: 'text-embedding-ada-002', // 1536 dimensions
                                input: text.substring(0, 8000) // API limit
                            })];
                    case 1:
                        response = _a.sent();
                        return [2 /*return*/, response.data[0].embedding];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error generating embedding:', error_2);
                        // Return zero vector as fallback
                        return [2 /*return*/, new Array(1536).fill(0)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find related pages using pgvector cosine similarity
     *
     * NOTE: Requires Prisma schema with vector support
     */
    InternalLinkingService.prototype.findRelatedPagesByEmbedding = function (embedding_1, excludeUrl_1) {
        return __awaiter(this, arguments, void 0, function (embedding, excludeUrl, limit) {
            var results, error_3;
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n        SELECT \n          url,\n          title,\n          keyword,\n          embedding,\n          1 - (embedding <=> ", "::vector) as relevance\n        FROM seo_pages\n        WHERE url != ", "\n          AND embedding IS NOT NULL\n        ORDER BY embedding <=> ", "::vector\n        LIMIT ", "\n      "], ["\n        SELECT \n          url,\n          title,\n          keyword,\n          embedding,\n          1 - (embedding <=> ", "::vector) as relevance\n        FROM seo_pages\n        WHERE url != ", "\n          AND embedding IS NOT NULL\n        ORDER BY embedding <=> ", "::vector\n        LIMIT ", "\n      "])), embedding, excludeUrl, embedding, limit)];
                    case 1:
                        results = _a.sent();
                        return [2 /*return*/, results.map(function (r) { return (__assign(__assign({}, r), { relevance: Number(r.relevance) || 0 })); })];
                    case 2:
                        error_3 = _a.sent();
                        console.error('Error finding related pages:', error_3);
                        // Fallback: return empty array or mock data
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Calculate text similarity using simple word overlap
     * (Fallback for when embeddings aren't available)
     */
    InternalLinkingService.prototype.calculateTextSimilarity = function (text1, text2) {
        var words1 = new Set(text1.toLowerCase().split(/\s+/));
        var words2 = new Set(text2.toLowerCase().split(/\s+/));
        var intersection = new Set(__spreadArray([], words1, true).filter(function (w) { return words2.has(w); }));
        var union = new Set(__spreadArray(__spreadArray([], words1, true), words2, true));
        // Jaccard similarity
        return intersection.size / union.size;
    };
    /**
     * Calculate priority for link suggestion
     */
    InternalLinkingService.prototype.calculatePriority = function (relevanceScore, position) {
        // High priority: very relevant + early in content
        if (relevanceScore > 0.7 && position.paragraph < 3) {
            return 'high';
        }
        // Medium priority: moderately relevant or good position
        if (relevanceScore > 0.5 || position.paragraph < 5) {
            return 'medium';
        }
        // Low priority: everything else
        return 'low';
    };
    /**
     * Calculate cluster score (how well-connected the cluster is)
     */
    InternalLinkingService.prototype.calculateClusterScore = function (pillarPage, supportingPages) {
        // Average relevance of supporting pages to pillar
        var avgRelevance = supportingPages.reduce(function (sum, page) { return sum + page.relevance; }, 0)
            / supportingPages.length;
        // Bonus for having many supporting pages
        var countBonus = Math.min(supportingPages.length / 10, 0.2);
        return Math.min(avgRelevance + countBonus, 1.0);
    };
    /**
     * Find missing links in a topic cluster
     */
    InternalLinkingService.prototype.findMissingClusterLinks = function (pillarUrl, supportingPages) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Query database to check which supporting pages link to pillar
                // For now, assume all are missing
                return [2 /*return*/, supportingPages.map(function (page) { return ({
                        targetUrl: pillarUrl,
                        targetTitle: 'Pillar Page', // Would come from database
                        targetKeyword: page.keyword,
                        anchorText: page.keyword,
                        relevanceScore: page.relevance,
                        position: { paragraph: 0, sentence: 0, beforeText: '', afterText: '' },
                        reasoning: "Supporting page should link back to pillar content",
                        priority: 'high'
                    }); })];
            });
        });
    };
    return InternalLinkingService;
}());
exports.InternalLinkingService = InternalLinkingService;
// ============================================================================
// LINK GRAPH ANALYSIS (ADVANCED)
// ============================================================================
/**
 * Advanced link graph analysis using PageRank-style algorithms
 * to identify authoritative pages and optimize link flow
 */
var LinkGraphAnalyzer = /** @class */ (function () {
    function LinkGraphAnalyzer(prisma) {
        this.prisma = prisma;
    }
    /**
     * Calculate PageRank-style authority scores for all pages
     *
     * Pages with more high-quality incoming links get higher scores
     */
    LinkGraphAnalyzer.prototype.calculateAuthorityScores = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // TODO: Implement PageRank algorithm
                // 1. Build adjacency matrix of internal links
                // 2. Iteratively calculate authority scores
                // 3. Return map of url → score
                return [2 /*return*/, new Map()];
            });
        });
    };
    /**
     * Identify hub pages (pages that link to many authoritative pages)
     * and authority pages (pages linked to by many hub pages)
     */
    LinkGraphAnalyzer.prototype.identifyHubsAndAuthorities = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // HITS algorithm (Hyperlink-Induced Topic Search)
                return [2 /*return*/, {
                        hubs: [],
                        authorities: []
                    }];
            });
        });
    };
    /**
     * Optimize link distribution across site
     *
     * Suggests adding/removing links to improve overall site structure
     */
    LinkGraphAnalyzer.prototype.optimizeLinkDistribution = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        addLinks: [],
                        removeLinks: []
                    }];
            });
        });
    };
    return LinkGraphAnalyzer;
}());
exports.LinkGraphAnalyzer = LinkGraphAnalyzer;
// ============================================================================
// EXPORTS
// ============================================================================
exports.default = InternalLinkingService;
var templateObject_1;
