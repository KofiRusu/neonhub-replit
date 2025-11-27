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
exports.EventIntakeService = void 0;
var prisma_js_1 = require("../lib/prisma.js");
var logger_js_1 = require("../lib/logger.js");
var agentic_js_1 = require("../types/agentic.js");
var person_service_js_1 = require("./person.service.js");
var memory_service_js_1 = require("./rag/memory.service.js");
var memoryService = new memory_service_js_1.MemoryRagService();
function normalizeTimestamp(input) {
    if (!input)
        return new Date();
    if (input instanceof Date)
        return input;
    var parsed = new Date(input);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
function summarizeEvent(event, classification) {
    var payload = event.payload ? JSON.stringify(event.payload).slice(0, 400) : "{}";
    var metadata = event.metadata ? JSON.stringify(event.metadata).slice(0, 400) : "{}";
    return [
        "Channel: ".concat(event.channel),
        "Type: ".concat(event.type),
        classification.intent ? "Intent: ".concat(classification.intent) : null,
        classification.topic ? "Topic: ".concat(classification.topic) : null,
        classification.sentiment ? "Sentiment: ".concat(classification.sentiment) : null,
        "Payload: ".concat(payload),
        "Metadata: ".concat(metadata),
    ]
        .filter(Boolean)
        .join("\n");
}
function ensureChannel(channel) {
    return (0, agentic_js_1.normalizeChannel)(channel, agentic_js_1.DEFAULT_CHANNEL);
}
function ensureType(type) {
    return type.replace(/\s+/g, "_").toLowerCase();
}
exports.EventIntakeService = {
    ingest: function (raw) {
        return __awaiter(this, void 0, void 0, function () {
            var normalized, classification, eventRecord, weight;
            var _a, _b, _c, _d, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0: return [4 /*yield*/, this.normalize(raw)];
                    case 1:
                        normalized = _g.sent();
                        classification = this.classify(normalized);
                        return [4 /*yield*/, prisma_js_1.prisma.event.create({
                                data: {
                                    organizationId: normalized.organizationId,
                                    personId: normalized.personId,
                                    campaignId: normalized.campaignId,
                                    objectiveId: normalized.objectiveId,
                                    channel: normalized.channel,
                                    type: normalized.type,
                                    source: (_b = (_a = normalized.source) !== null && _a !== void 0 ? _a : raw.source) !== null && _b !== void 0 ? _b : null,
                                    providerId: (_c = normalized.providerId) !== null && _c !== void 0 ? _c : null,
                                    topic: classification.topic,
                                    intent: classification.intent,
                                    sentiment: classification.sentiment,
                                    payload: ((_d = normalized.payload) !== null && _d !== void 0 ? _d : null),
                                    metadata: __assign(__assign({}, ((_e = normalized.metadata) !== null && _e !== void 0 ? _e : {})), { classification: classification }),
                                    occurredAt: normalized.occurredAt,
                                },
                            })];
                    case 2:
                        eventRecord = _g.sent();
                        if (!classification.topic) return [3 /*break*/, 4];
                        weight = (_f = classification.confidence) !== null && _f !== void 0 ? _f : 0.6;
                        return [4 /*yield*/, person_service_js_1.PersonService.updateTopic(eventRecord.personId, classification.topic, weight)];
                    case 3:
                        _g.sent();
                        _g.label = 4;
                    case 4: return [4 /*yield*/, this.embed(__assign(__assign({}, normalized), { personId: eventRecord.personId }), eventRecord.id, classification)];
                    case 5:
                        _g.sent();
                        return [2 /*return*/];
                }
            });
        });
    },
    normalize: function (raw) {
        return __awaiter(this, void 0, void 0, function () {
            var occurredAt, channel, type, personId, _a;
            var _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (!raw.organizationId) {
                            throw new Error("organizationId is required");
                        }
                        occurredAt = normalizeTimestamp(raw.occurredAt);
                        channel = ensureChannel(raw.channel);
                        type = ensureType(raw.type);
                        if (!raw.personId) return [3 /*break*/, 1];
                        _a = raw.personId;
                        return [3 /*break*/, 3];
                    case 1: return [4 /*yield*/, person_service_js_1.PersonService.resolve({
                            organizationId: raw.organizationId,
                            email: raw.email,
                            phone: raw.phone,
                            handle: raw.handle,
                            createIfMissing: true,
                            traits: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : undefined,
                        })];
                    case 2:
                        _a = _d.sent();
                        _d.label = 3;
                    case 3:
                        personId = _a;
                        return [2 /*return*/, {
                                organizationId: raw.organizationId,
                                personId: personId,
                                channel: channel,
                                type: type,
                                payload: (_b = raw.payload) !== null && _b !== void 0 ? _b : null,
                                metadata: (_c = raw.metadata) !== null && _c !== void 0 ? _c : null,
                                campaignId: raw.campaignId,
                                objectiveId: raw.objectiveId,
                                provider: raw.provider,
                                providerId: raw.providerId,
                                occurredAt: occurredAt,
                                source: raw.source,
                            }];
                }
            });
        });
    },
    classify: function (event) {
        var summary = "".concat(event.channel, ":").concat(event.type);
        var result = { confidence: 0.5 };
        var lowerSummary = summary.toLowerCase();
        if (lowerSummary.includes("click")) {
            result.intent = "engagement";
            result.topic = "conversion";
            result.sentiment = "positive";
            result.confidence = 0.8;
        }
        else if (lowerSummary.includes("open")) {
            result.intent = "awareness";
            result.topic = "nurture";
            result.sentiment = "neutral";
            result.confidence = 0.6;
        }
        else if (lowerSummary.includes("reply") || lowerSummary.includes("response")) {
            result.intent = "conversation";
            result.topic = "relationship";
            result.sentiment = "positive";
            result.confidence = 0.7;
        }
        else if (lowerSummary.includes("unsubscribe") || lowerSummary.includes("opt_out")) {
            result.intent = "churn";
            result.topic = "retention";
            result.sentiment = "negative";
            result.confidence = 0.9;
        }
        return result;
    },
    embed: function (event, eventId, classification) {
        return __awaiter(this, void 0, void 0, function () {
            var summary, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        summary = summarizeEvent(event, classification);
                        return [4 /*yield*/, memoryService.storeSnippet({
                                organizationId: event.organizationId,
                                personId: event.personId,
                                label: "".concat(event.channel, ":").concat(event.type),
                                text: summary,
                                category: classification.intent,
                                sourceEventId: eventId,
                                metadata: {
                                    classification: classification,
                                    summary: summary,
                                    eventId: eventId,
                                },
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        logger_js_1.logger.error({ error: error_1 }, "Failed to embed event. Memory record skipped.");
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    },
};
