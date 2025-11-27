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
exports.emailAgent = exports.EmailAgent = void 0;
var resend_1 = require("resend");
var zod_1 = require("zod");
var openai_js_1 = require("../ai/openai.js");
var prisma_js_1 = require("../db/prisma.js");
var AgentJobManager_js_1 = require("./base/AgentJobManager.js");
var logger_js_1 = require("../lib/logger.js");
var index_js_1 = require("../ws/index.js");
var normalize_js_1 = require("./_shared/normalize.js");
var env_js_1 = require("../config/env.js");
var brand_voice_service_js_1 = require("../services/brand-voice.service.js");
var person_service_js_1 = require("../services/person.service.js");
var event_intake_service_js_1 = require("../services/event-intake.service.js");
var index_js_2 = require("../queues/index.js");
var agent_run_js_1 = require("./utils/agent-run.js");
var context_service_js_1 = require("../services/rag/context.service.js");
var knowledge_service_js_1 = require("../services/rag/knowledge.service.js");
var OptimizeSubjectLineInputSchema = zod_1.z.object({
    originalSubject: zod_1.z.string().min(1, "originalSubject is required"),
    context: zod_1.z.string().optional(),
    createdById: zod_1.z.string().optional(),
});
var RunABTestInputSchema = zod_1.z.object({
    campaignId: zod_1.z.string().min(1, "campaignId is required"),
    variants: zod_1.z
        .array(zod_1.z.object({
        subject: zod_1.z.string().min(1, "subject is required"),
        body: zod_1.z.string().min(1, "body is required"),
    }))
        .min(2, "At least two variants are required"),
    createdById: zod_1.z.string().optional(),
});
var BLOCKED_EMAIL_DOMAINS = new Set(["example.com", "test.com", "invalid.test"]);
var resendClient = null;
function getResendClient() {
    if (resendClient)
        return resendClient;
    try {
        resendClient = new resend_1.Resend(env_js_1.env.RESEND_API_KEY);
    }
    catch (error) {
        logger_js_1.logger.warn({ error: error }, "Failed to initialise Resend client");
        resendClient = null;
    }
    return resendClient;
}
function ensureDeliverability(email) {
    var atIndex = email.indexOf("@");
    if (atIndex === -1) {
        throw new Error("Invalid email address");
    }
    var domain = email.slice(atIndex + 1).toLowerCase();
    if (BLOCKED_EMAIL_DOMAINS.has(domain)) {
        throw new Error("Email domain ".concat(domain, " is not allowed for delivery"));
    }
}
function renderEmailHtml(body, cta) {
    var paragraphs = body
        .split(/\n{2,}/)
        .map(function (paragraph) { return paragraph.trim(); })
        .filter(Boolean)
        .map(function (paragraph) { return "<p>".concat(paragraph.replace(/\n/g, "<br/>"), "</p>"); })
        .join("\n");
    var action = cta ? "<p><strong>".concat(cta, "</strong></p>") : "";
    return "<div>".concat(paragraphs).concat(action, "</div>");
}
function enqueueEmailJob(queueName, payload) {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, index_js_2.queues[queueName].add(queueName, payload, { removeOnComplete: 200, removeOnFail: 500 })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    logger_js_1.logger.warn({ error: error_1, queueName: queueName }, "Failed to enqueue email job");
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function resolveOwnerId(context, fallback) {
    return __awaiter(this, void 0, void 0, function () {
        var _a, _b;
        return __generator(this, function (_c) {
            return [2 /*return*/, (_b = (_a = context === null || context === void 0 ? void 0 : context.userId) !== null && _a !== void 0 ? _a : fallback) !== null && _b !== void 0 ? _b : undefined];
        });
    });
}
/**
 * EmailAgent - Generates email sequences and optimizes email content
 */
var EmailAgent = /** @class */ (function () {
    function EmailAgent(deps) {
        if (deps === void 0) { deps = {}; }
        var _a, _b, _c;
        this.agentName = "email";
        this.orchestratorAgentId = "EmailAgent";
        this.ragContext = (_a = deps.ragContext) !== null && _a !== void 0 ? _a : new context_service_js_1.RagContextService();
        this.knowledgeBase = (_b = deps.knowledgeBase) !== null && _b !== void 0 ? _b : new knowledge_service_js_1.KnowledgeBaseService();
        this.generateTextFn = (_c = deps.generateText) !== null && _c !== void 0 ? _c : openai_js_1.generateText;
    }
    EmailAgent.prototype.buildEmailContext = function (query, context) {
        return __awaiter(this, void 0, void 0, function () {
            var rag;
            var _a, _b;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!(!(context === null || context === void 0 ? void 0 : context.organizationId) || !query.trim())) return [3 /*break*/, 2];
                        _a = {};
                        return [4 /*yield*/, resolveOwnerId(context)];
                    case 1: return [2 /*return*/, (_a.ownerId = _d.sent(), _a)];
                    case 2: return [4 /*yield*/, this.ragContext.build({
                            organizationId: context.organizationId,
                            query: query,
                            categories: ["email", "content"],
                            personId: (_c = context.userId) !== null && _c !== void 0 ? _c : undefined,
                            limit: 3,
                        })];
                    case 3:
                        rag = _d.sent();
                        _b = {
                            prompt: this.ragContext.formatForPrompt(rag),
                            organizationId: context.organizationId
                        };
                        return [4 /*yield*/, resolveOwnerId(context)];
                    case 4: return [2 /*return*/, (_b.ownerId = _d.sent(),
                            _b)];
                }
            });
        });
    };
    EmailAgent.prototype.persistEmailKnowledge = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!args.organizationId || !args.ownerId) {
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.knowledgeBase.ingestSnippet({
                                organizationId: args.organizationId,
                                datasetSlug: "email-".concat(args.organizationId),
                                datasetName: "Email Knowledge",
                                title: args.title,
                                content: args.content,
                                ownerId: args.ownerId,
                                metadata: __assign({ agent: "EmailAgent" }, args.metadata),
                            })];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        logger_js_1.logger.warn({ error: error_2 }, "Failed to persist email knowledge");
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate an email sequence for a campaign
     */
    EmailAgent.prototype.generateSequence = function (input_1) {
        return __awaiter(this, arguments, void 0, function (input, options) {
            var startTime, normalized, jobId, numEmails, tone, contextDetails, contextBlock, prompt_1, result, sequence, duration, error_3, errorMessage;
            var _a, _b;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        startTime = Date.now();
                        normalized = (0, normalize_js_1.normalizeSequenceInput)(input);
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.createJob({
                                agent: this.agentName,
                                input: normalized,
                                createdById: normalized.createdById,
                            })];
                    case 1:
                        jobId = _c.sent();
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 8, , 10]);
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.startJob(jobId)];
                    case 3:
                        _c.sent();
                        numEmails = normalized.numEmails;
                        tone = normalized.tone === "authoritative" ? "professional" : normalized.tone;
                        return [4 /*yield*/, this.buildEmailContext(normalized.topic, options.context)];
                    case 4:
                        contextDetails = _c.sent();
                        contextBlock = contextDetails.prompt
                            ? "\nGrounding context:\n".concat(contextDetails.prompt, "\n")
                            : "";
                        prompt_1 = "Create an email sequence for a marketing campaign about: ".concat(normalized.topic, "\n").concat(normalized.audience ? "Target Audience: ".concat(normalized.audience, "\n") : "", "\nObjective: ").concat(normalized.objective, "\nTone: ").concat(tone, "\n").concat(contextBlock, "\n\nGenerate ").concat(numEmails, " emails for an automated sequence. Each email should:\n- Have a compelling subject line\n- Build on the previous email\n- Include a clear call-to-action\n- Be progressively more persuasive\n\nReturn the sequence as a JSON array with format:\n[\n  {\n    \"day\": 0,\n    \"subject\": \"Subject line\",\n    \"body\": \"Email body with proper formatting\"\n  }\n]");
                        logger_js_1.logger.info({ jobId: jobId, topic: normalized.topic }, "Generating email sequence with AI");
                        return [4 /*yield*/, this.generateTextFn({
                                prompt: prompt_1,
                                temperature: 0.7,
                                maxTokens: 2000,
                                systemPrompt: "You are an expert email marketing specialist. Create engaging, conversion-focused email sequences that feel personal and valuable to recipients.",
                            })];
                    case 5:
                        result = _c.sent();
                        sequence = this.parseSequence(result.text, numEmails);
                        duration = Date.now() - startTime;
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.completeJob(jobId, {
                                sequence: sequence,
                                emailCount: sequence.length,
                                mock: result.mock,
                            }, {
                                duration: duration,
                                tokens: ((_a = result.usage) === null || _a === void 0 ? void 0 : _a.totalTokens) || 0,
                                model: result.model,
                            })];
                    case 6:
                        _c.sent();
                        logger_js_1.logger.info({
                            jobId: jobId,
                            emailCount: sequence.length,
                            duration: duration,
                            mock: result.mock,
                        }, "Email sequence generation complete");
                        (0, index_js_1.broadcast)("metrics:delta", {
                            type: "email_sequence_created",
                            increment: 1,
                            timestamp: new Date(),
                        });
                        return [4 /*yield*/, this.persistEmailKnowledge({
                                organizationId: contextDetails.organizationId,
                                ownerId: (_b = contextDetails.ownerId) !== null && _b !== void 0 ? _b : normalized.createdById,
                                title: "Email sequence for ".concat(normalized.topic),
                                content: sequence
                                    .map(function (item) { return "Day ".concat(item.day, ": ").concat(item.subject, "\n").concat(item.body); })
                                    .join("\n\n"),
                                metadata: {
                                    objective: normalized.objective,
                                    tone: tone,
                                    count: sequence.length,
                                },
                            })];
                    case 7:
                        _c.sent();
                        return [2 /*return*/, {
                                jobId: jobId,
                                sequence: sequence,
                            }];
                    case 8:
                        error_3 = _c.sent();
                        errorMessage = error_3 instanceof Error ? error_3.message : "Unknown error";
                        logger_js_1.logger.error({ jobId: jobId, error: errorMessage }, "Email sequence generation failed");
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.failJob(jobId, errorMessage)];
                    case 9:
                        _c.sent();
                        throw error_3;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Optimize a subject line with AI suggestions
     */
    EmailAgent.prototype.optimizeSubjectLine = function (input_1) {
        return __awaiter(this, arguments, void 0, function (input, options) {
            var startTime, jobId, contextDetails, contextBlock, prompt_2, result, suggestions, duration, error_4, errorMessage;
            var _a, _b, _c;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        startTime = Date.now();
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.createJob({
                                agent: this.agentName,
                                input: input,
                                createdById: input.createdById,
                            })];
                    case 1:
                        jobId = _d.sent();
                        _d.label = 2;
                    case 2:
                        _d.trys.push([2, 8, , 10]);
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.startJob(jobId)];
                    case 3:
                        _d.sent();
                        return [4 /*yield*/, this.buildEmailContext([input.originalSubject, (_a = input.context) !== null && _a !== void 0 ? _a : ""].filter(Boolean).join(" "), options.context)];
                    case 4:
                        contextDetails = _d.sent();
                        contextBlock = contextDetails.prompt
                            ? "\nUse the following context to stay on-brand:\n".concat(contextDetails.prompt, "\n")
                            : "";
                        prompt_2 = "Optimize this email subject line for better open rates:\n\nOriginal: \"".concat(input.originalSubject, "\"\n").concat(input.context ? "Context: ".concat(input.context, "\n") : "", "\n").concat(contextBlock, "\n\nProvide 5 alternative subject lines that:\n- Are more compelling and curiosity-driving\n- Keep the core message\n- Are between 30-60 characters\n- Use proven email marketing techniques\n\nReturn as a JSON array of strings.");
                        logger_js_1.logger.info({ jobId: jobId, originalSubject: input.originalSubject }, "Optimizing subject line");
                        return [4 /*yield*/, this.generateTextFn({
                                prompt: prompt_2,
                                temperature: 0.8,
                                maxTokens: 500,
                                systemPrompt: "You are an expert email marketing copywriter specializing in subject line optimization.",
                            })];
                    case 5:
                        result = _d.sent();
                        suggestions = this.parseSuggestions(result.text);
                        duration = Date.now() - startTime;
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.completeJob(jobId, {
                                originalSubject: input.originalSubject,
                                suggestions: suggestions,
                                mock: result.mock,
                            }, {
                                duration: duration,
                                tokens: ((_b = result.usage) === null || _b === void 0 ? void 0 : _b.totalTokens) || 0,
                                model: result.model,
                            })];
                    case 6:
                        _d.sent();
                        logger_js_1.logger.info({
                            jobId: jobId,
                            suggestionCount: suggestions.length,
                            duration: duration,
                            mock: result.mock,
                        }, "Subject line optimization complete");
                        return [4 /*yield*/, this.persistEmailKnowledge({
                                organizationId: contextDetails.organizationId,
                                ownerId: (_c = contextDetails.ownerId) !== null && _c !== void 0 ? _c : input.createdById,
                                title: "Subject optimization for \"".concat(input.originalSubject, "\""),
                                content: suggestions.map(function (suggestion, idx) { return "".concat(idx + 1, ". ").concat(suggestion); }).join("\n"),
                                metadata: {
                                    type: "subject-optimization",
                                    count: suggestions.length,
                                },
                            })];
                    case 7:
                        _d.sent();
                        return [2 /*return*/, {
                                jobId: jobId,
                                suggestions: suggestions,
                            }];
                    case 8:
                        error_4 = _d.sent();
                        errorMessage = error_4 instanceof Error ? error_4.message : "Unknown error";
                        logger_js_1.logger.error({ jobId: jobId, error: errorMessage }, "Subject line optimization failed");
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.failJob(jobId, errorMessage)];
                    case 9:
                        _d.sent();
                        throw error_4;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Run A/B test on email variants
     */
    EmailAgent.prototype.runABTest = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, jobId, abTest, duration, error_5, errorMessage;
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
                        return [4 /*yield*/, prisma_js_1.prisma.aBTest.create({
                                data: {
                                    campaignId: input.campaignId,
                                    name: "Email A/B Test - ".concat(new Date().toISOString()),
                                    variants: input.variants,
                                    metrics: {
                                        variants: input.variants.map(function (_, i) { return ({
                                            variantId: "variant_".concat(i),
                                            opens: 0,
                                            clicks: 0,
                                            conversions: 0,
                                        }); }),
                                    },
                                },
                            })];
                    case 4:
                        abTest = _a.sent();
                        duration = Date.now() - startTime;
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.completeJob(jobId, {
                                testId: abTest.id,
                                variantCount: input.variants.length,
                            }, {
                                duration: duration,
                            })];
                    case 5:
                        _a.sent();
                        logger_js_1.logger.info({
                            jobId: jobId,
                            testId: abTest.id,
                            duration: duration,
                        }, "A/B test created");
                        (0, index_js_1.broadcast)("campaign:ab-test:created", {
                            testId: abTest.id,
                            campaignId: input.campaignId,
                            variantCount: input.variants.length,
                        });
                        return [2 /*return*/, {
                                jobId: jobId,
                                testId: abTest.id,
                            }];
                    case 6:
                        error_5 = _a.sent();
                        errorMessage = error_5 instanceof Error ? error_5.message : "Unknown error";
                        logger_js_1.logger.error({ jobId: jobId, error: errorMessage }, "A/B test creation failed");
                        return [4 /*yield*/, AgentJobManager_js_1.agentJobManager.failJob(jobId, errorMessage)];
                    case 7:
                        _a.sent();
                        throw error_5;
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Analyze email campaign performance
     */
    EmailAgent.prototype.analyzePerformance = function (campaignId) {
        return __awaiter(this, void 0, void 0, function () {
            var sequences, totalSent, metricsData, aggregatedMetrics;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, prisma_js_1.prisma.emailSequence.findMany({
                            where: { campaignId: campaignId },
                            select: {
                                id: true,
                                subject: true,
                                sentAt: true,
                                metrics: true,
                            },
                        })];
                    case 1:
                        sequences = _a.sent();
                        totalSent = sequences.filter(function (s) { return s.sentAt; }).length;
                        metricsData = sequences
                            .filter(function (s) { return s.metrics; })
                            .map(function (s) { return s.metrics; });
                        aggregatedMetrics = {
                            sent: totalSent,
                            opened: metricsData.reduce(function (sum, m) { return sum + (m.opened || 0); }, 0),
                            clicked: metricsData.reduce(function (sum, m) { return sum + (m.clicked || 0); }, 0),
                            converted: metricsData.reduce(function (sum, m) { return sum + (m.converted || 0); }, 0),
                            openRate: 0,
                            clickRate: 0,
                            conversionRate: 0,
                        };
                        if (totalSent > 0) {
                            aggregatedMetrics.openRate = (aggregatedMetrics.opened / totalSent) * 100;
                            aggregatedMetrics.clickRate = (aggregatedMetrics.clicked / totalSent) * 100;
                            aggregatedMetrics.conversionRate = (aggregatedMetrics.converted / totalSent) * 100;
                        }
                        return [2 /*return*/, aggregatedMetrics];
                }
            });
        });
    };
    /**
     * End-to-end personalized email send with brand voice orchestration
     */
    EmailAgent.prototype.sendPersonalized = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var person, consent, identity, emailAddress, composition, variant, subject, html, brand, fromEmail, fromName, resend, error_6;
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            return __generator(this, function (_k) {
                switch (_k.label) {
                    case 0: return [4 /*yield*/, enqueueEmailJob("email.compose", args)];
                    case 1:
                        _k.sent();
                        return [4 /*yield*/, prisma_js_1.prisma.person.findUnique({
                                where: { id: args.personId },
                                select: {
                                    id: true,
                                    organizationId: true,
                                    displayName: true,
                                    primaryEmail: true,
                                },
                            })];
                    case 2:
                        person = _k.sent();
                        if (!person) {
                            throw new Error("Person not found for id ".concat(args.personId));
                        }
                        return [4 /*yield*/, person_service_js_1.PersonService.getConsent(args.personId, "email")];
                    case 3:
                        consent = (_k.sent());
                        if (consent && consent !== "granted") {
                            throw new Error("Person ".concat(args.personId, " has not granted email consent"));
                        }
                        return [4 /*yield*/, prisma_js_1.prisma.identity.findFirst({
                                where: {
                                    personId: args.personId,
                                    type: "email",
                                },
                                orderBy: { verifiedAt: "desc" },
                            })];
                    case 4:
                        identity = _k.sent();
                        emailAddress = (_a = identity === null || identity === void 0 ? void 0 : identity.value) !== null && _a !== void 0 ? _a : person.primaryEmail;
                        if (!emailAddress) {
                            throw new Error("Email identity not found for person ".concat(args.personId));
                        }
                        ensureDeliverability(emailAddress);
                        return [4 /*yield*/, brand_voice_service_js_1.BrandVoiceService.compose({
                                channel: "email",
                                objective: args.objective,
                                personId: args.personId,
                                brandId: args.brandId,
                            })];
                    case 5:
                        composition = _k.sent();
                        variant = (_b = composition.variants[0]) !== null && _b !== void 0 ? _b : {
                            subject: composition.subject,
                            body: composition.body,
                            cta: composition.cta,
                        };
                        subject = (_d = (_c = variant.subject) !== null && _c !== void 0 ? _c : composition.subject) !== null && _d !== void 0 ? _d : "Quick update on ".concat(args.objective);
                        html = renderEmailHtml((_e = variant.body) !== null && _e !== void 0 ? _e : composition.body, (_f = variant.cta) !== null && _f !== void 0 ? _f : composition.cta);
                        return [4 /*yield*/, prisma_js_1.prisma.brand.findUnique({
                                where: { id: args.brandId },
                                select: { slug: true, name: true },
                            })];
                    case 6:
                        brand = _k.sent();
                        fromEmail = "".concat((_g = brand === null || brand === void 0 ? void 0 : brand.slug) !== null && _g !== void 0 ? _g : "neonhub", "@updates.neonhub.dev");
                        fromName = (_h = brand === null || brand === void 0 ? void 0 : brand.name) !== null && _h !== void 0 ? _h : "NeonHub";
                        resend = getResendClient();
                        if (!resend) return [3 /*break*/, 11];
                        _k.label = 7;
                    case 7:
                        _k.trys.push([7, 9, , 10]);
                        return [4 /*yield*/, resend.emails.send({
                                from: "".concat(fromName, " <").concat(fromEmail, ">"),
                                to: [emailAddress],
                                subject: subject,
                                html: html,
                            })];
                    case 8:
                        _k.sent();
                        return [3 /*break*/, 10];
                    case 9:
                        error_6 = _k.sent();
                        logger_js_1.logger.error({ error: error_6, personId: args.personId }, "Failed to send email via Resend");
                        throw error_6 instanceof Error ? error_6 : new Error("Email delivery failed");
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        logger_js_1.logger.info({ emailAddress: emailAddress, subject: subject }, "Resend not configured. Email send skipped");
                        _k.label = 12;
                    case 12: return [4 /*yield*/, enqueueEmailJob("email.send", __assign(__assign({}, args), { to: emailAddress, subject: subject }))];
                    case 13:
                        _k.sent();
                        return [4 /*yield*/, event_intake_service_js_1.EventIntakeService.ingest({
                                organizationId: person.organizationId,
                                personId: args.personId,
                                channel: "email",
                                type: "send",
                                payload: {
                                    subject: subject,
                                    variant: variant,
                                },
                                metadata: {
                                    brandId: args.brandId,
                                    objective: args.objective,
                                    operatorId: (_j = args.operatorId) !== null && _j !== void 0 ? _j : null,
                                },
                                source: "email-agent",
                            })];
                    case 14:
                        _k.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Parse email sequence from AI response
     */
    EmailAgent.prototype.parseSequence = function (text, expectedCount) {
        try {
            // Try to extract JSON from response
            var jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                var parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map(function (item, index) {
                        var _a;
                        return ({
                            day: (_a = item.day) !== null && _a !== void 0 ? _a : index * 3,
                            subject: item.subject || "Email ".concat(index + 1),
                            body: item.body || item.content || "Email content here",
                        });
                    });
                }
            }
        }
        catch (error) {
            logger_js_1.logger.warn({ error: error }, "Failed to parse sequence as JSON, using fallback");
        }
        // Fallback: Create basic sequence from text
        return Array.from({ length: expectedCount }, function (_, i) { return ({
            day: i * 3,
            subject: "Follow-up ".concat(i + 1),
            body: text.substring(0, 500) + "...",
        }); });
    };
    /**
     * Parse suggestions from AI response
     */
    EmailAgent.prototype.parseSuggestions = function (text) {
        try {
            var jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                var parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed)) {
                    return parsed.filter(function (s) { return typeof s === "string"; });
                }
            }
        }
        catch (error) {
            logger_js_1.logger.warn({ error: error }, "Failed to parse suggestions as JSON");
        }
        // Fallback: Split by line breaks
        return text
            .split("\n")
            .map(function (line) { return line.trim(); })
            .filter(function (line) { return line.length > 10 && line.length < 100; })
            .slice(0, 5);
    };
    EmailAgent.prototype.resolveExecutionContext = function (rawContext) {
        var validated = (0, normalize_js_1.validateAgentContext)(rawContext);
        return {
            organizationId: validated.organizationId,
            prisma: validated.prisma,
            logger: validated.logger,
            userId: validated.userId,
        };
    };
    EmailAgent.prototype.invalidInput = function (error) {
        var message = error instanceof Error ? error.message : "Invalid input";
        return { ok: false, error: message, code: "INVALID_INPUT" };
    };
    EmailAgent.prototype.executionError = function (error) {
        var message = error instanceof Error ? error.message : "Agent execution failed";
        return { ok: false, error: message, code: "AGENT_EXECUTION_FAILED" };
    };
    EmailAgent.prototype.handleGenerateSequenceIntent = function (payload, context, intent) {
        return __awaiter(this, void 0, void 0, function () {
            var input, result, error_7;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            input = (0, normalize_js_1.normalizeSequenceInput)((payload !== null && payload !== void 0 ? payload : {}));
                        }
                        catch (error) {
                            return [2 /*return*/, this.invalidInput(error)];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, agent_run_js_1.executeAgentRun)(this.orchestratorAgentId, context, input, function () { return _this.generateSequence(input, { context: context }); }, {
                                intent: intent,
                                buildMetrics: function (output) { return ({ emailsGenerated: output.sequence.length }); },
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
    EmailAgent.prototype.handleOptimizeSubjectIntent = function (payload, context, intent) {
        return __awaiter(this, void 0, void 0, function () {
            var input, result, error_8;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            input = OptimizeSubjectLineInputSchema.parse(payload);
                        }
                        catch (error) {
                            return [2 /*return*/, this.invalidInput(error)];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, agent_run_js_1.executeAgentRun)(this.orchestratorAgentId, context, input, function () { return _this.optimizeSubjectLine(input, { context: context }); }, {
                                intent: intent,
                                buildMetrics: function (output) { return ({ suggestions: output.suggestions.length }); },
                            })];
                    case 2:
                        result = (_a.sent()).result;
                        return [2 /*return*/, { ok: true, data: result }];
                    case 3:
                        error_8 = _a.sent();
                        return [2 /*return*/, this.executionError(error_8)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    EmailAgent.prototype.handleAbTestIntent = function (payload, context, intent) {
        return __awaiter(this, void 0, void 0, function () {
            var input, result, error_9;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            input = RunABTestInputSchema.parse(payload);
                        }
                        catch (error) {
                            return [2 /*return*/, this.invalidInput(error)];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, agent_run_js_1.executeAgentRun)(this.orchestratorAgentId, context, input, function () { return _this.runABTest(input); }, {
                                intent: intent,
                                buildMetrics: function () { return ({ variantsTested: input.variants.length }); },
                            })];
                    case 2:
                        result = (_a.sent()).result;
                        return [2 /*return*/, { ok: true, data: result }];
                    case 3:
                        error_9 = _a.sent();
                        return [2 /*return*/, this.executionError(error_9)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    EmailAgent.prototype.handle = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var executionContext;
            return __generator(this, function (_a) {
                try {
                    executionContext = this.resolveExecutionContext(request.context);
                }
                catch (error) {
                    return [2 /*return*/, { ok: false, error: error instanceof Error ? error.message : "Invalid context", code: "INVALID_CONTEXT" }];
                }
                switch (request.intent) {
                    case "generate-sequence":
                        return [2 /*return*/, this.handleGenerateSequenceIntent(request.payload, executionContext, request.intent)];
                    case "optimize-subject":
                        return [2 /*return*/, this.handleOptimizeSubjectIntent(request.payload, executionContext, request.intent)];
                    case "ab-test":
                        return [2 /*return*/, this.handleAbTestIntent(request.payload, executionContext, request.intent)];
                    default:
                        return [2 /*return*/, { ok: false, error: "Unsupported intent: ".concat(request.intent), code: "UNSUPPORTED_INTENT" }];
                }
                return [2 /*return*/];
            });
        });
    };
    return EmailAgent;
}());
exports.EmailAgent = EmailAgent;
exports.emailAgent = new EmailAgent();
