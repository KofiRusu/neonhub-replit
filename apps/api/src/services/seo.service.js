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
exports.audit = audit;
exports.optimize = optimize;
exports.keywordAnalysis = keywordAnalysis;
exports.analyzeKeywords = analyzeKeywords;
exports.optimizeContent = optimizeContent;
var prisma_js_1 = require("../db/prisma.js");
var HTTPS_PATTERN = /^https?:\/\//i;
function scoreFromIssues(issueCount) {
    var base = 92 - issueCount * 12;
    return Math.max(35, Math.min(100, base));
}
function audit(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var normalizedUrl, issues, _c, topKeywords, upcomingArticles, recommendations;
        var url = _b.url, notes = _b.notes;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    if (!url)
                        throw new Error("url required");
                    normalizedUrl = url.trim();
                    issues = [];
                    if (!HTTPS_PATTERN.test(normalizedUrl)) {
                        issues.push("Include http:// or https:// in the target URL.");
                    }
                    if (!normalizedUrl.startsWith("https://")) {
                        issues.push("Serve the page over HTTPS to avoid mixed content warnings.");
                    }
                    if (!/\/$/.test(normalizedUrl)) {
                        issues.push("Consider adding a trailing slash for canonical consistency.");
                    }
                    return [4 /*yield*/, Promise.all([
                            prisma_js_1.prisma.keyword.findMany({
                                orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
                                take: 3,
                                include: { persona: true },
                            }),
                            prisma_js_1.prisma.editorialCalendar.count({
                                where: {
                                    publishAt: {
                                        gte: new Date(),
                                    },
                                },
                            }),
                        ])];
                case 1:
                    _c = _d.sent(), topKeywords = _c[0], upcomingArticles = _c[1];
                    recommendations = topKeywords.map(function (keyword) {
                        var _a;
                        var persona = ((_a = keyword.persona) === null || _a === void 0 ? void 0 : _a.name) ? " for ".concat(keyword.persona.name) : "";
                        return "Publish a ".concat(keyword.intent, " article focused on \"").concat(keyword.term, "\"").concat(persona, ".");
                    });
                    if (upcomingArticles === 0) {
                        recommendations.push("Schedule new articles in the editorial calendar to keep content fresh.");
                    }
                    return [2 /*return*/, {
                            url: normalizedUrl,
                            score: scoreFromIssues(issues.length),
                            issues: issues,
                            recommendations: recommendations,
                            notes: notes,
                            context: {
                                totalKeywordOpportunities: topKeywords.length,
                                upcomingScheduledArticles: upcomingArticles,
                            },
                        }];
            }
        });
    });
}
function optimize(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var keywordFilters, keywords, fallbackTitle, primary, secondary, title, metaDescription, headings, internalLinkTargets, recommendations;
        var url = _b.url, personaId = _b.personaId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    keywordFilters = personaId ? { personaId: personaId } : {};
                    return [4 /*yield*/, prisma_js_1.prisma.keyword.findMany({
                            where: keywordFilters,
                            include: { persona: true },
                            orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
                            take: 5,
                        })];
                case 1:
                    keywords = _c.sent();
                    fallbackTitle = "Improve on-page SEO with fresh copy and internal links";
                    primary = keywords.at(0);
                    secondary = keywords.slice(1, 3);
                    title = primary ? "".concat(primary.term, " | ").concat(primary.intent, " strategy guide") : fallbackTitle;
                    metaDescription = primary
                        ? "Learn how to address ".concat(primary.intent, " needs with focused content targeting \"").concat(primary.term, "\".")
                        : "Optimise this page with unique copy, descriptive meta tags, and internal links that reinforce your top topics.";
                    headings = secondary.map(function (keyword) {
                        var _a, _b;
                        return ({
                            level: "h2",
                            text: "".concat(keyword.term, " best practices"),
                            persona: (_b = (_a = keyword.persona) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : null,
                        });
                    });
                    return [4 /*yield*/, prisma_js_1.prisma.editorialCalendar.findMany({
                            where: personaId ? { personaId: personaId } : {},
                            orderBy: { publishAt: "asc" },
                            take: 3,
                        })];
                case 2:
                    internalLinkTargets = _c.sent();
                    recommendations = __spreadArray([
                        "Add structured data (Article) so search engines understand the page content.",
                        "Compress hero and gallery images to keep Largest Contentful Paint under 2.5s.",
                        "Ensure the page has exactly one H1 that includes the primary keyword."
                    ], internalLinkTargets.map(function (entry) { return "Link to the scheduled article \"".concat(entry.title, "\" once it goes live."); }), true);
                    return [2 /*return*/, {
                            url: url,
                            title: title,
                            metaDescription: metaDescription,
                            headings: headings,
                            recommendations: recommendations,
                        }];
            }
        });
    });
}
function keywordAnalysis(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var keywords, primaryKeywords, secondaryKeywords, searchVolume, competition, suggestions;
        var personaId = _b.personaId;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0: return [4 /*yield*/, prisma_js_1.prisma.keyword.findMany({
                        where: personaId ? { personaId: personaId } : {},
                        include: { persona: true },
                        orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
                    })];
                case 1:
                    keywords = _c.sent();
                    primaryKeywords = keywords.slice(0, 5).map(function (keyword) { return keyword.term; });
                    secondaryKeywords = keywords.slice(5, 10).map(function (keyword) { return keyword.term; });
                    searchVolume = Object.fromEntries(keywords.map(function (keyword) {
                        var _a;
                        return [
                            keyword.term,
                            400 + ((_a = keyword.priority) !== null && _a !== void 0 ? _a : 50) * 18,
                        ];
                    }));
                    competition = Object.fromEntries(keywords.map(function (keyword) {
                        var _a, _b;
                        return [
                            keyword.term,
                            ((_a = keyword.priority) !== null && _a !== void 0 ? _a : 50) > 70 ? "high" : ((_b = keyword.priority) !== null && _b !== void 0 ? _b : 50) > 40 ? "medium" : "low",
                        ];
                    }));
                    suggestions = keywords.slice(0, 3).map(function (keyword) {
                        var _a;
                        var persona = ((_a = keyword.persona) === null || _a === void 0 ? void 0 : _a.name) ? " for ".concat(keyword.persona.name) : "";
                        return "Target \"".concat(keyword.term, "\" with a ").concat(keyword.intent, " article").concat(persona, ".");
                    });
                    return [2 /*return*/, {
                            personaId: personaId,
                            primaryKeywords: primaryKeywords,
                            secondaryKeywords: secondaryKeywords,
                            searchVolume: searchVolume,
                            competition: competition,
                            suggestions: suggestions,
                        }];
            }
        });
    });
}
function analyzeKeywords(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var analyzed;
        var terms = _b.terms, personaId = _b.personaId;
        return __generator(this, function (_c) {
            analyzed = terms.map(function (term) {
                var termLower = term.toLowerCase();
                var wordCount = termLower.split(/\s+/).length;
                // Score calculation: longer tail = higher score
                var baseScore = Math.min(100, 50 + wordCount * 15);
                // Determine intent based on keyword patterns
                var intent = "info";
                if (termLower.match(/buy|purchase|price|shop|order/))
                    intent = "tran";
                else if (termLower.match(/how|what|why|guide|tutorial/))
                    intent = "info";
                else if (termLower.match(/^[a-z\s]+\.(com|org|io)$/))
                    intent = "nav";
                else if (termLower.match(/review|best|vs|compare|top/))
                    intent = "comm";
                return {
                    term: termLower,
                    score: baseScore,
                    intent: intent,
                };
            });
            // Sort by score descending
            return [2 /*return*/, {
                    terms: analyzed.sort(function (a, b) { return b.score - a.score; }),
                    personaId: personaId,
                    analyzedAt: new Date().toISOString(),
                }];
        });
    });
}
function optimizeContent(_a) {
    return __awaiter(this, arguments, void 0, function (_b) {
        var keywords, primary, content, title, metaDescription, h1, suggestions, wordCount, jsonLd;
        var _c, _d, _e;
        var html = _b.html, markdown = _b.markdown, personaId = _b.personaId, targetKeyword = _b.targetKeyword;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0: return [4 /*yield*/, prisma_js_1.prisma.keyword.findMany({
                        where: personaId ? { personaId: Number(personaId) } : {},
                        orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
                        take: 5,
                        include: { persona: true },
                    })];
                case 1:
                    keywords = _f.sent();
                    primary = targetKeyword || ((_c = keywords[0]) === null || _c === void 0 ? void 0 : _c.term) || "your topic";
                    content = markdown || html || "";
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
                            name: ((_e = (_d = keywords[0]) === null || _d === void 0 ? void 0 : _d.persona) === null || _e === void 0 ? void 0 : _e.name) || "NeonHub",
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
                        keywords: keywords.map(function (k) { return k.term; }).join(", "),
                    };
                    return [2 /*return*/, {
                            title: title,
                            metaDescription: metaDescription,
                            h1: h1,
                            suggestions: suggestions,
                            jsonLd: jsonLd,
                            keywords: keywords.map(function (k) { return k.term; }),
                            optimizedAt: new Date().toISOString(),
                        }];
            }
        });
    });
}
