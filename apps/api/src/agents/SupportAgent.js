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
exports.supportAgent = exports.SupportAgent = void 0;
var zod_1 = require("zod");
var support_service_js_1 = require("../services/support.service.js");
var logger_js_1 = require("../lib/logger.js");
var normalize_js_1 = require("./_shared/normalize.js");
var agent_run_js_1 = require("./utils/agent-run.js");
var context_service_js_1 = require("../services/rag/context.service.js");
var knowledge_service_js_1 = require("../services/rag/knowledge.service.js");
var SupportRequestSchema = zod_1.z
    .object({
    notes: zod_1.z.string().optional(),
    subject: zod_1.z.string().optional(),
    sentiment: zod_1.z.enum(["positive", "neutral", "negative"]).optional(),
    createdById: zod_1.z.string().optional(),
})
    .refine(function (data) { return Boolean((data.notes && data.notes.trim()) || (data.subject && data.subject.trim())); }, { message: "notes or subject is required" });
var TriageRequestSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "content is required"),
    channel: zod_1.z.enum(["email", "chat", "phone"]).optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
    createdById: zod_1.z.string().optional(),
});
var MacroSuggestRequestSchema = zod_1.z.object({
    content: zod_1.z.string().min(1, "content is required"),
    channel: zod_1.z.enum(["email", "chat", "phone"]).optional(),
    createdById: zod_1.z.string().optional(),
});
var NEGATIVE_KEYWORDS = [
    "angry",
    "frustrated",
    "urgent",
    "immediately",
    "not working",
    "broken",
    "error",
    "fail",
    "failure",
    "down",
    "refund",
    "cancel",
    "complaint",
    "escalate",
    "critical",
];
var POSITIVE_KEYWORDS = ["love", "great", "thanks", "appreciate", "awesome", "amazing", "happy", "excellent"];
var BILLING_KEYWORDS = ["invoice", "billing", "charge", "payment", "refund", "price", "pricing", "subscription"];
var ACCOUNT_KEYWORDS = ["password", "login", "account", "access", "credentials", "reset"];
var BUG_KEYWORDS = ["bug", "error", "issue", "broken", "crash", "fail", "failure", "glitch", "not working"];
var SupportAgent = /** @class */ (function () {
    function SupportAgent(deps) {
        if (deps === void 0) { deps = {}; }
        var _a, _b;
        this.orchestratorAgentId = "SupportAgent";
        this.ragContext = (_a = deps.ragContext) !== null && _a !== void 0 ? _a : new context_service_js_1.RagContextService();
        this.knowledgeBase = (_b = deps.knowledgeBase) !== null && _b !== void 0 ? _b : new knowledge_service_js_1.KnowledgeBaseService();
    }
    SupportAgent.prototype.buildSupportContext = function (message, context) {
        return __awaiter(this, void 0, void 0, function () {
            var rag, prompt;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!message.trim() || !context.organizationId) {
                            return [2 /*return*/, {}];
                        }
                        return [4 /*yield*/, this.ragContext.build({
                                organizationId: context.organizationId,
                                query: message,
                                categories: ["support"],
                                personId: (_a = context.userId) !== null && _a !== void 0 ? _a : undefined,
                                limit: 3,
                            })];
                    case 1:
                        rag = _b.sent();
                        prompt = this.ragContext.formatForPrompt(rag);
                        return [2 /*return*/, { prompt: prompt, organizationId: context.organizationId }];
                }
            });
        });
    };
    SupportAgent.prototype.persistSupportKnowledge = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var ownerId, error_1;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        ownerId = (_a = args.context.userId) !== null && _a !== void 0 ? _a : args.request.createdById;
                        if (!args.context.organizationId || !ownerId) {
                            return [2 /*return*/];
                        }
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.knowledgeBase.ingestSnippet({
                                organizationId: args.context.organizationId,
                                datasetSlug: "support-".concat(args.context.organizationId),
                                datasetName: "Support Knowledge",
                                title: "Support reply ".concat(new Date().toISOString()),
                                content: [
                                    "Request: ".concat((_c = (_b = args.request.notes) !== null && _b !== void 0 ? _b : args.request.subject) !== null && _c !== void 0 ? _c : "n/a"),
                                    "Reply: ".concat(args.response.reply),
                                ].join("\n\n"),
                                ownerId: ownerId,
                                metadata: {
                                    agent: "SupportAgent",
                                    intent: args.intent,
                                    sentiment: args.response.sentiment,
                                },
                            })];
                    case 2:
                        _d.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _d.sent();
                        logger_js_1.logger.warn({ error: error_1, intent: args.intent }, "Failed to persist support knowledge");
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SupportAgent.prototype.buildReplySummary = function (text) {
        var _a, _b, _c;
        var sentences = (_a = text.match(/[^.!?]+[.!?]?/g)) !== null && _a !== void 0 ? _a : [text];
        var firstSentence = (_c = (_b = sentences[0]) === null || _b === void 0 ? void 0 : _b.trim()) !== null && _c !== void 0 ? _c : "";
        return firstSentence.length > 0 ? firstSentence : text.slice(0, 120).trim();
    };
    SupportAgent.prototype.detectSentiment = function (content) {
        var lower = content.toLowerCase();
        var hasNegative = NEGATIVE_KEYWORDS.some(function (keyword) { return lower.includes(keyword); });
        var hasPositive = POSITIVE_KEYWORDS.some(function (keyword) { return lower.includes(keyword); });
        if (hasNegative && !hasPositive) {
            return "negative";
        }
        if (hasPositive && !hasNegative) {
            return "positive";
        }
        return "neutral";
    };
    SupportAgent.prototype.inferCategory = function (content) {
        var lower = content.toLowerCase();
        if (BILLING_KEYWORDS.some(function (keyword) { return lower.includes(keyword); })) {
            return "billing";
        }
        if (ACCOUNT_KEYWORDS.some(function (keyword) { return lower.includes(keyword); })) {
            return "account_access";
        }
        if (BUG_KEYWORDS.some(function (keyword) { return lower.includes(keyword); })) {
            return "bug_report";
        }
        return "general_question";
    };
    SupportAgent.prototype.inferPriority = function (content) {
        var lower = content.toLowerCase();
        if (lower.includes("outage") || lower.includes("down") || lower.includes("urgent") || lower.includes("immediately")) {
            return "high";
        }
        if (BUG_KEYWORDS.some(function (keyword) { return lower.includes(keyword); }) || lower.includes("issue") || lower.includes("problem")) {
            return "medium";
        }
        return "low";
    };
    SupportAgent.prototype.buildRecommendedActions = function (category, priority) {
        var actions = [];
        if (priority === "high") {
            actions.push("Escalate to on-call specialist");
            actions.push("Send acknowledgment within 10 minutes");
        }
        else if (priority === "medium") {
            actions.push("Confirm receipt and share expected response time");
        }
        else {
            actions.push("Respond with standard SLA");
        }
        switch (category) {
            case "billing":
                actions.push("Review latest invoice and payment history");
                actions.push("Check active promotions or credits");
                break;
            case "account_access":
                actions.push("Verify authentication logs and recent security events");
                actions.push("Prepare password reset or access restoration steps");
                break;
            case "bug_report":
                actions.push("Log incident in bug tracker with reproduction steps");
                actions.push("Collect console logs or screenshots if available");
                break;
            default:
                actions.push("Consult knowledge base for relevant guide");
                break;
        }
        return Array.from(new Set(actions));
    };
    SupportAgent.prototype.buildMacros = function (category, priority) {
        var macros = [];
        if (category === "billing") {
            macros.push({
                title: "Billing clarification",
                body: "Hi there! I’m happy to help clarify your recent charges. Could you confirm the invoice number or billing cycle you’re seeing the issue on? I’ll review it right away.",
                tags: ["billing", "clarification"],
            });
            macros.push({
                title: "Refund acknowledgment",
                body: "Thanks for flagging this. I’ve logged your refund request and will update you within one business day once finance completes the review.",
                tags: ["billing", "refund"],
            });
        }
        else if (category === "account_access") {
            macros.push({
                title: "Password reset steps",
                body: "Let’s get you back in. You can reset your password here: https://app.neonhub.dev/reset. If that doesn’t work, reply and I’ll generate a temporary passcode.",
                tags: ["access", "password"],
            });
            macros.push({
                title: "2FA recovery",
                body: "If you’re locked out due to two-factor authentication, I can help. Please confirm the last four digits of your phone number and I’ll send a verification link.",
                tags: ["access", "2fa"],
            });
        }
        else if (category === "bug_report") {
            macros.push({
                title: "Bug acknowledgment",
                body: "Appreciate the heads up. I’ve recorded this for engineering with your description. If you have steps to reproduce or screenshots, send them over so we can speed up the fix.",
                tags: ["bug", "acknowledge"],
            });
            macros.push({
                title: "Workaround suggestion",
                body: "While our team investigates, a quick workaround is to clear cache and refresh the workspace. Let me know if the issue persists afterward.",
                tags: ["bug", "workaround"],
            });
        }
        else {
            macros.push({
                title: "General greeting",
                body: "Thanks for reaching out! I’m reviewing this now and will follow up with the next steps shortly. Let me know if there’s anything else I should know.",
                tags: ["general"],
            });
        }
        if (priority === "high") {
            macros.unshift({
                title: "Urgent escalation acknowledgment",
                body: "I’m escalating this to our on-call specialist right now. You’ll hear back from us shortly with a detailed update—thanks for your patience.",
                tags: ["escalation", "urgent"],
            });
        }
        return macros;
    };
    SupportAgent.prototype.attachUser = function (input, context) {
        var _a;
        if (input.createdById || !context.userId) {
            return input;
        }
        return __assign(__assign({}, input), { createdById: (_a = context.userId) !== null && _a !== void 0 ? _a : undefined });
    };
    SupportAgent.prototype.resolveExecutionContext = function (context) {
        var _a;
        var validated = (0, normalize_js_1.validateAgentContext)(context);
        return {
            organizationId: validated.organizationId,
            prisma: validated.prisma,
            logger: validated.logger,
            userId: (_a = validated.userId) !== null && _a !== void 0 ? _a : null,
        };
    };
    SupportAgent.prototype.invalidInput = function (error) {
        var message = error instanceof Error ? error.message : "Invalid input";
        return { ok: false, error: message, code: "INVALID_INPUT" };
    };
    SupportAgent.prototype.executionError = function (error) {
        var message = error instanceof Error ? error.message : "Agent execution failed";
        return { ok: false, error: message, code: "AGENT_EXECUTION_FAILED" };
    };
    SupportAgent.prototype.draftSupportReply = function (input, ragPrompt) {
        return __awaiter(this, void 0, void 0, function () {
            var message, sentiment, notesWithContext, generated, summary;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        message = (_b = (_a = input.notes) !== null && _a !== void 0 ? _a : input.subject) !== null && _b !== void 0 ? _b : "";
                        sentiment = (_c = input.sentiment) !== null && _c !== void 0 ? _c : this.detectSentiment(message);
                        notesWithContext = ragPrompt ? "".concat(message, "\n\nContext:\n").concat(ragPrompt) : message;
                        return [4 /*yield*/, (0, support_service_js_1.reply)({ notes: notesWithContext })];
                    case 1:
                        generated = _e.sent();
                        summary = this.buildReplySummary(generated.reply);
                        return [2 /*return*/, {
                                reply: generated.reply,
                                tone: generated.tone,
                                summary: summary,
                                suggestedSubject: (_d = input.subject) !== null && _d !== void 0 ? _d : summary.slice(0, 72),
                                sentiment: sentiment,
                            }];
                }
            });
        });
    };
    SupportAgent.prototype.triageTicket = function (input) {
        var sentiment = this.detectSentiment(input.content);
        var category = this.inferCategory(input.content);
        var priority = this.inferPriority(input.content);
        return {
            category: category,
            priority: priority,
            sentiment: sentiment,
            recommendedActions: this.buildRecommendedActions(category, priority),
            channel: input.channel,
        };
    };
    SupportAgent.prototype.suggestMacros = function (input) {
        var triage = this.triageTicket({
            content: input.content,
            channel: input.channel,
            metadata: undefined,
            createdById: input.createdById,
        });
        return {
            macros: this.buildMacros(triage.category, triage.priority),
            context: {
                category: triage.category,
                priority: triage.priority,
                sentiment: triage.sentiment,
            },
        };
    };
    SupportAgent.prototype.handleSupportIntent = function (payload, context, intent) {
        return __awaiter(this, void 0, void 0, function () {
            var parsed, augmented, ragContext, result, error_2;
            var _this = this;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        try {
                            parsed = SupportRequestSchema.parse(payload);
                        }
                        catch (error) {
                            return [2 /*return*/, this.invalidInput(error)];
                        }
                        augmented = this.attachUser(parsed, context);
                        return [4 /*yield*/, this.buildSupportContext((_b = (_a = augmented.notes) !== null && _a !== void 0 ? _a : augmented.subject) !== null && _b !== void 0 ? _b : "", context)];
                    case 1:
                        ragContext = _c.sent();
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 5, , 6]);
                        return [4 /*yield*/, (0, agent_run_js_1.executeAgentRun)(this.orchestratorAgentId, context, augmented, function () { return _this.draftSupportReply(augmented, ragContext.prompt); }, {
                                intent: intent,
                                buildMetrics: function (output) { return ({
                                    tone: output.tone,
                                    sentiment: output.sentiment,
                                    replyLength: output.reply.length,
                                }); },
                            })];
                    case 3:
                        result = (_c.sent()).result;
                        return [4 /*yield*/, this.persistSupportKnowledge({
                                context: context,
                                request: augmented,
                                response: result,
                                intent: intent,
                            })];
                    case 4:
                        _c.sent();
                        return [2 /*return*/, { ok: true, data: result }];
                    case 5:
                        error_2 = _c.sent();
                        return [2 /*return*/, this.executionError(error_2)];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    SupportAgent.prototype.handleTriageIntent = function (payload, context, intent) {
        return __awaiter(this, void 0, void 0, function () {
            var parsed, augmented, result, error_3;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            parsed = TriageRequestSchema.parse(payload);
                        }
                        catch (error) {
                            return [2 /*return*/, this.invalidInput(error)];
                        }
                        augmented = this.attachUser(parsed, context);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, agent_run_js_1.executeAgentRun)(this.orchestratorAgentId, context, augmented, function () { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
                                return [2 /*return*/, this.triageTicket(augmented)];
                            }); }); }, {
                                intent: intent,
                                buildMetrics: function (output) { return ({
                                    category: output.category,
                                    priority: output.priority,
                                }); },
                            })];
                    case 2:
                        result = (_a.sent()).result;
                        return [2 /*return*/, { ok: true, data: result }];
                    case 3:
                        error_3 = _a.sent();
                        return [2 /*return*/, this.executionError(error_3)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SupportAgent.prototype.handleMacroSuggestIntent = function (payload, context, intent) {
        return __awaiter(this, void 0, void 0, function () {
            var parsed, augmented, result, error_4;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        try {
                            parsed = MacroSuggestRequestSchema.parse(payload);
                        }
                        catch (error) {
                            return [2 /*return*/, this.invalidInput(error)];
                        }
                        augmented = this.attachUser(parsed, context);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, (0, agent_run_js_1.executeAgentRun)(this.orchestratorAgentId, context, augmented, function () { return Promise.resolve(_this.suggestMacros(augmented)); }, {
                                intent: intent,
                                buildMetrics: function (output) { return ({
                                    macros: output.macros.length,
                                    category: output.context.category,
                                }); },
                            })];
                    case 2:
                        result = (_a.sent()).result;
                        return [2 /*return*/, { ok: true, data: result }];
                    case 3:
                        error_4 = _a.sent();
                        return [2 /*return*/, this.executionError(error_4)];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SupportAgent.prototype.handle = function (request) {
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
                    case "support":
                        logger_js_1.logger.info({ intent: request.intent }, "SupportAgent drafting reply");
                        return [2 /*return*/, this.handleSupportIntent(request.payload, executionContext, request.intent)];
                    case "triage":
                        logger_js_1.logger.info({ intent: request.intent }, "SupportAgent triaging request");
                        return [2 /*return*/, this.handleTriageIntent(request.payload, executionContext, request.intent)];
                    case "macro-suggest":
                        logger_js_1.logger.info({ intent: request.intent }, "SupportAgent suggesting macros");
                        return [2 /*return*/, this.handleMacroSuggestIntent(request.payload, executionContext, request.intent)];
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
    return SupportAgent;
}());
exports.SupportAgent = SupportAgent;
exports.supportAgent = new SupportAgent();
