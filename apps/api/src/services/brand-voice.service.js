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
exports.BrandVoiceService = void 0;
var prisma_js_1 = require("../lib/prisma.js");
var openai_js_1 = require("../lib/openai.js");
var logger_js_1 = require("../lib/logger.js");
var env_js_1 = require("../config/env.js");
var person_service_js_1 = require("./person.service.js");
var DEFAULT_VARIANT_COUNT = 2;
var FALLBACK_CHANNEL_LIMITS = {
    sms: 160,
    dm: 280,
    email: 1200,
    post: 500,
};
var FORBIDDEN_PATTERNS = [
    /{{\s*unsubscribe\s*}}/i,
    /http:\/\//i,
    /lorem ipsum/i,
    /\bBUY NOW\b/i,
    /\bFREE!!!\b/i,
];
var PII_REGEX = /\b\d{9,}\b/g;
function coerceString(value) {
    if (typeof value === "string" && value.trim().length) {
        return value.trim();
    }
    return undefined;
}
function safeJsonParse(payload) {
    try {
        var trimmed = payload.trim();
        var withoutCodeFence = trimmed.startsWith("{") ? trimmed : trimmed.replace(/^```json|```$/g, "");
        return JSON.parse(withoutCodeFence);
    }
    catch (error) {
        logger_js_1.logger.warn({ error: error, payloadPreview: payload.slice(0, 200) }, "Failed to parse OpenAI response as JSON");
        return undefined;
    }
}
function truncateToLimit(text, channel) {
    var _a;
    var limit = (_a = FALLBACK_CHANNEL_LIMITS[channel]) !== null && _a !== void 0 ? _a : 500;
    if (text.length <= limit)
        return text;
    return "".concat(text.slice(0, limit - 3), "...");
}
function sanitizeChannelLength(body, channel) {
    return truncateToLimit(body, channel);
}
function asJsonObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return null;
    }
    return value;
}
function fetchPromptContext(brandId, channel) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, brandVoice, snippets;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0: return [4 /*yield*/, Promise.all([
                        prisma_js_1.prisma.brandVoice.findFirst({
                            where: { brandId: brandId },
                        }),
                        prisma_js_1.prisma.snippetLibrary.findMany({
                            where: {
                                brandId: brandId,
                                channel: channel,
                            },
                            orderBy: [{ winRate: "desc" }, { usageCount: "desc" }],
                            take: 3,
                        }),
                    ])];
                case 1:
                    _a = _b.sent(), brandVoice = _a[0], snippets = _a[1];
                    return [2 /*return*/, { brandVoice: brandVoice, snippets: snippets }];
            }
        });
    });
}
function buildPrompt(args, structuredPrompt, person, memory, snippets, topics) {
    var _a;
    var personaLine = [
        person.displayName ? "Name: ".concat(person.displayName) : null,
        person.primaryEmail ? "Email: ".concat(person.primaryEmail) : null,
        person.primaryHandle ? "Handle: ".concat(person.primaryHandle) : null,
        person.primaryPhone ? "Phone: ".concat(person.primaryPhone) : null,
    ]
        .filter(Boolean)
        .join(" | ");
    var topicLine = topics
        .slice(0, 5)
        .map(function (topic) { return "".concat(topic.name, " (").concat(topic.weight.toFixed(2), ")"); })
        .join(", ");
    var snippetLine = snippets
        .map(function (snippet, index) { return "Snippet ".concat(index + 1, ": ").concat(snippet.name, " \u2014 ").concat(truncateToLimit(snippet.content, args.channel)); })
        .join("\n");
    var constraintsLine = args.constraints ? JSON.stringify(args.constraints, null, 2) : "{}";
    var guidance = structuredPrompt
        ? "".concat(structuredPrompt.system, "\nVoice: ").concat(structuredPrompt.brandVoice.join(", "), "\nGuidelines: ").concat(((_a = structuredPrompt.guardrails) !== null && _a !== void 0 ? _a : []).join(", "))
        : "Craft a message consistent with the brand's professional, optimistic tone.";
    var message = "Compose a ".concat(args.channel, " message for the objective \"").concat(args.objective, "\".\nPerson: ").concat(personaLine || "Unknown", "\nTopics: ").concat(topicLine || "None", "\nMemory Highlights: ").concat(memory || "None", "\nConstraints: ").concat(constraintsLine, "\nWinning Snippets:\n").concat(snippetLine || "(no snippets available)", "\nOutput JSON with keys subject (optional), body, variants (array of {subject?, body, cta?}), and cta.");
    return [
        { role: "system", content: guidance },
        { role: "user", content: message },
    ];
}
function fallbackResponse(args, personName) {
    var greeting = personName ? "Hi ".concat(personName.split(" ")[0], ",") : "Hi there,";
    var body = truncateToLimit("".concat(greeting, "\n\nWe're focused on ").concat(args.objective, ". Here's a quick update tailored for you. Let me know if you'd like more details or a different direction."), args.channel);
    var subjectPrefix = personName ? "".concat(personName.split(" ")[0], ", ") : "";
    var cta = args.channel === "email" ? "Reply to this email if you'd like to continue." : "Let me know what you think.";
    return {
        subject: args.channel === "email" ? "".concat(subjectPrefix, "quick update on ").concat(args.objective).trim() : undefined,
        body: body,
        variants: [
            {
                subject: args.channel === "email" ? "Next steps for ".concat(args.objective) : undefined,
                body: body,
                cta: cta,
                score: 0.5,
            },
        ],
        cta: cta,
        metadata: { fallback: true },
    };
}
function applyGuardrails(text) {
    var violations = [];
    for (var _i = 0, FORBIDDEN_PATTERNS_1 = FORBIDDEN_PATTERNS; _i < FORBIDDEN_PATTERNS_1.length; _i++) {
        var pattern = FORBIDDEN_PATTERNS_1[_i];
        if (pattern.test(text)) {
            violations.push("Contains forbidden pattern: ".concat(pattern));
        }
    }
    var redacted = text.replace(PII_REGEX, "[REDACTED]");
    var safe = violations.length === 0 && redacted.length === text.length;
    return { safe: safe, redacted: safe ? undefined : redacted, violations: violations };
}
exports.BrandVoiceService = {
    compose: function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var person, _a, _b, brandVoice, snippets, memoryRecords, objectives, memorySummary, styleRules, promptPack, messages, completion, messageContent, parsed, sanitizedVariants, primaryBody, error_1;
            var _c, _d, _e, _f, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.person.findUnique({
                            where: { id: args.personId },
                            include: {
                                topics: {
                                    orderBy: { weight: "desc" },
                                    take: 5,
                                },
                            },
                        })];
                    case 1:
                        person = _j.sent();
                        if (!person) {
                            throw new Error("Person not found for id ".concat(args.personId));
                        }
                        return [4 /*yield*/, Promise.all([
                                fetchPromptContext(args.brandId, args.channel),
                                person_service_js_1.PersonService.getMemory(args.personId, { limit: 5, includeVectors: false }),
                                prisma_js_1.prisma.objective.findMany({
                                    where: { personId: args.personId, status: "active" },
                                    orderBy: { priority: "desc" },
                                    take: 3,
                                    select: { title: true },
                                }),
                            ])];
                    case 2:
                        _a = _j.sent(), _b = _a[0], brandVoice = _b.brandVoice, snippets = _b.snippets, memoryRecords = _a[1], objectives = _a[2];
                        memorySummary = memoryRecords
                            .map(function (record) {
                            var _a, _b;
                            var metadata = ((_a = record.metadata) !== null && _a !== void 0 ? _a : {});
                            return (_b = coerceString(metadata.summary)) !== null && _b !== void 0 ? _b : coerceString(record.label);
                        })
                            .filter(Boolean)
                            .join(" | ");
                        styleRules = asJsonObject(brandVoice === null || brandVoice === void 0 ? void 0 : brandVoice.styleRulesJson);
                        promptPack = brandVoice
                            ? {
                                system: brandVoice.promptTemplate,
                                brandVoice: Array.isArray(styleRules === null || styleRules === void 0 ? void 0 : styleRules.voice) ? styleRules === null || styleRules === void 0 ? void 0 : styleRules.voice : [brandVoice.promptTemplate.slice(0, 120)],
                                guardrails: Array.isArray(styleRules === null || styleRules === void 0 ? void 0 : styleRules.guardrails) ? styleRules === null || styleRules === void 0 ? void 0 : styleRules.guardrails : undefined,
                                examples: undefined,
                                metadata: (_c = brandVoice.metrics) !== null && _c !== void 0 ? _c : undefined,
                            }
                            : null;
                        messages = buildPrompt(args, promptPack, person, memorySummary, snippets, person.topics);
                        if (!openai_js_1.isOpenAIConfigured) {
                            logger_js_1.logger.warn("OPENAI_API_KEY not set. Using fallback brand voice response.");
                            return [2 /*return*/, fallbackResponse(args, person.displayName)];
                        }
                        _j.label = 3;
                    case 3:
                        _j.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, openai_js_1.openai.chat.completions.create({
                                model: (_d = env_js_1.env.OPENAI_MODEL) !== null && _d !== void 0 ? _d : "gpt-4o-mini",
                                temperature: 0.8,
                                messages: messages,
                                max_tokens: args.channel === "email" ? 600 : 320,
                            })];
                    case 4:
                        completion = _j.sent();
                        messageContent = (_g = (_f = (_e = completion.choices) === null || _e === void 0 ? void 0 : _e[0]) === null || _f === void 0 ? void 0 : _f.message) === null || _g === void 0 ? void 0 : _g.content;
                        if (!messageContent) {
                            return [2 /*return*/, fallbackResponse(args, person.displayName)];
                        }
                        parsed = safeJsonParse(messageContent);
                        if (parsed) {
                            sanitizedVariants = ((_h = parsed.variants) !== null && _h !== void 0 ? _h : [])
                                .slice(0, DEFAULT_VARIANT_COUNT)
                                .map(function (variant) {
                                var _a;
                                return ({
                                    subject: variant.subject,
                                    body: sanitizeChannelLength(variant.body, args.channel),
                                    cta: variant.cta,
                                    score: (_a = variant.score) !== null && _a !== void 0 ? _a : 0.75,
                                });
                            });
                            primaryBody = sanitizeChannelLength(parsed.body, args.channel);
                            return [2 /*return*/, {
                                    subject: parsed.subject,
                                    body: primaryBody,
                                    variants: sanitizedVariants.length > 0
                                        ? sanitizedVariants
                                        : [
                                            {
                                                subject: parsed.subject,
                                                body: primaryBody,
                                                cta: parsed.cta,
                                                score: 0.8,
                                            },
                                        ],
                                    cta: parsed.cta,
                                    metadata: {
                                        completionId: completion.id,
                                        usage: completion.usage,
                                        objectives: objectives,
                                    },
                                }];
                        }
                        return [2 /*return*/, fallbackResponse(args, person.displayName)];
                    case 5:
                        error_1 = _j.sent();
                        logger_js_1.logger.error({ error: error_1 }, "BrandVoiceService.compose failed. Falling back.");
                        return [2 /*return*/, fallbackResponse(args, person.displayName)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    },
    guardrail: function (text, channel, brandId) {
        return __awaiter(this, void 0, void 0, function () {
            var base, limit, snippet;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        base = applyGuardrails(text);
                        if (!base.safe) {
                            return [2 /*return*/, base];
                        }
                        limit = (_a = FALLBACK_CHANNEL_LIMITS[channel]) !== null && _a !== void 0 ? _a : 500;
                        if (text.length > limit) {
                            return [2 /*return*/, {
                                    safe: false,
                                    redacted: truncateToLimit(text, channel),
                                    violations: ["Length exceeds limit for ".concat(channel, " (").concat(limit, " chars)")],
                                }];
                        }
                        return [4 /*yield*/, prisma_js_1.prisma.snippetLibrary.findFirst({
                                where: { brandId: brandId, channel: channel },
                                orderBy: { winRate: "desc" },
                            })];
                    case 1:
                        snippet = _b.sent();
                        return [2 /*return*/, __assign(__assign({}, base), { metadata: snippet
                                    ? {
                                        checkedAgainst: snippet.id,
                                        baselineWinRate: snippet.winRate,
                                    }
                                    : { checkedAgainst: null } })];
                }
            });
        });
    },
    getPromptPack: function (useCase, brandId) {
        return __awaiter(this, void 0, void 0, function () {
            var brand, voice, styleRules, metrics, prompt;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.brand.findUnique({
                            where: { id: brandId },
                            include: {
                                brandVoices: true,
                            },
                        })];
                    case 1:
                        brand = _b.sent();
                        if (!brand) {
                            throw new Error("Brand not found for id ".concat(brandId));
                        }
                        voice = brand.brandVoices[0];
                        styleRules = asJsonObject(voice === null || voice === void 0 ? void 0 : voice.styleRulesJson);
                        metrics = asJsonObject((_a = voice === null || voice === void 0 ? void 0 : voice.metrics) !== null && _a !== void 0 ? _a : null);
                        prompt = voice
                            ? {
                                system: voice.promptTemplate,
                                brandVoice: Array.isArray(styleRules === null || styleRules === void 0 ? void 0 : styleRules.voice) ? styleRules === null || styleRules === void 0 ? void 0 : styleRules.voice : [voice.promptTemplate.slice(0, 120)],
                                guardrails: Array.isArray(styleRules === null || styleRules === void 0 ? void 0 : styleRules.guardrails) ? styleRules === null || styleRules === void 0 ? void 0 : styleRules.guardrails : undefined,
                                examples: Array.isArray(metrics === null || metrics === void 0 ? void 0 : metrics.examples)
                                    ? metrics === null || metrics === void 0 ? void 0 : metrics.examples
                                    : undefined,
                                metadata: metrics !== null && metrics !== void 0 ? metrics : undefined,
                            }
                            : {
                                system: "You are the Brand Voice orchestrator for ".concat(brand.name, ". Maintain a consistent tone across channels."),
                                brandVoice: ["Confident", "Helpful", "Data-backed"],
                                guardrails: ["Avoid overpromising", "Stay compliant with TCPA"],
                            };
                        return [2 /*return*/, {
                                useCase: useCase,
                                brandId: brandId,
                                prompt: prompt,
                            }];
                }
            });
        });
    },
};
