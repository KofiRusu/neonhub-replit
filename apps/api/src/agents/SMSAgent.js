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
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsAgent = exports.SMSAgent = void 0;
var twilio_1 = require("twilio");
var prisma_js_1 = require("../lib/prisma.js");
var env_js_1 = require("../config/env.js");
var logger_js_1 = require("../lib/logger.js");
var brand_voice_service_js_1 = require("../services/brand-voice.service.js");
var person_service_js_1 = require("../services/person.service.js");
var event_intake_service_js_1 = require("../services/event-intake.service.js");
var index_js_1 = require("../queues/index.js");
var TWILIO_SID = (_b = (_a = env_js_1.env.TWILIO_SID) !== null && _a !== void 0 ? _a : env_js_1.env.TWILIO_ACCOUNT_SID) !== null && _b !== void 0 ? _b : "";
var TWILIO_TOKEN = (_c = env_js_1.env.TWILIO_AUTH_TOKEN) !== null && _c !== void 0 ? _c : "";
var TWILIO_FROM = (_d = env_js_1.env.TWILIO_PHONE_NUMBER) !== null && _d !== void 0 ? _d : "";
var twilioClient = TWILIO_SID && TWILIO_TOKEN ? (0, twilio_1.default)(TWILIO_SID, TWILIO_TOKEN) : null;
var MAX_SMS_LENGTH = 160;
function normalizePhone(value) {
    return value.replace(/[^+\d]/g, "");
}
function shortenLinks(body) {
    return body.replace(/https?:\/\/[\w./?-]+/g, function (match) {
        var hash = Buffer.from(match).toString("base64").slice(0, 6);
        return "https://n.hub/".concat(hash);
    });
}
function enqueueSmsJob(queueName, payload) {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, index_js_1.queues[queueName].add(queueName, payload, { removeOnComplete: 200, removeOnFail: 500 })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    logger_js_1.logger.warn({ error: error_1, queueName: queueName }, "Failed to enqueue sms job");
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function enforceLength(body) {
    if (body.length <= MAX_SMS_LENGTH) {
        return body;
    }
    return "".concat(body.slice(0, MAX_SMS_LENGTH - 3), "...");
}
var SMSAgent = /** @class */ (function () {
    function SMSAgent() {
    }
    SMSAgent.prototype.send = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var person, consent, identity, phone, message, variant, body;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, enqueueSmsJob("sms.compose", args)];
                    case 1:
                        _f.sent();
                        return [4 /*yield*/, prisma_js_1.prisma.person.findUnique({
                                where: { id: args.personId },
                                select: {
                                    id: true,
                                    organizationId: true,
                                    primaryPhone: true,
                                    displayName: true,
                                },
                            })];
                    case 2:
                        person = _f.sent();
                        if (!person) {
                            throw new Error("Person not found for id ".concat(args.personId));
                        }
                        return [4 /*yield*/, person_service_js_1.PersonService.getConsent(args.personId, "sms")];
                    case 3:
                        consent = (_f.sent());
                        if (consent && consent !== "granted") {
                            throw new Error("SMS consent not granted for person ".concat(args.personId));
                        }
                        return [4 /*yield*/, prisma_js_1.prisma.identity.findFirst({
                                where: { personId: args.personId, type: "phone" },
                                orderBy: { verifiedAt: "desc" },
                            })];
                    case 4:
                        identity = _f.sent();
                        phone = normalizePhone((_b = (_a = identity === null || identity === void 0 ? void 0 : identity.value) !== null && _a !== void 0 ? _a : person.primaryPhone) !== null && _b !== void 0 ? _b : "");
                        if (!phone) {
                            throw new Error("Missing phone number for person ".concat(args.personId));
                        }
                        return [4 /*yield*/, brand_voice_service_js_1.BrandVoiceService.compose({
                                channel: "sms",
                                objective: args.objective,
                                personId: args.personId,
                                brandId: args.brandId,
                                constraints: { maxLength: MAX_SMS_LENGTH },
                            })];
                    case 5:
                        message = _f.sent();
                        variant = (_c = message.variants[0]) !== null && _c !== void 0 ? _c : {
                            body: message.body,
                            cta: message.cta,
                        };
                        body = enforceLength(shortenLinks((_d = variant.body) !== null && _d !== void 0 ? _d : message.body));
                        if (!(twilioClient && TWILIO_FROM)) return [3 /*break*/, 7];
                        return [4 /*yield*/, twilioClient.messages.create({
                                from: TWILIO_FROM,
                                to: phone,
                                body: body,
                            })];
                    case 6:
                        _f.sent();
                        return [3 /*break*/, 8];
                    case 7:
                        logger_js_1.logger.info({ phone: phone, bodyLength: body.length }, "Twilio not configured. Skipping SMS send");
                        _f.label = 8;
                    case 8: return [4 /*yield*/, enqueueSmsJob("sms.send", __assign(__assign({}, args), { to: phone }))];
                    case 9:
                        _f.sent();
                        return [4 /*yield*/, event_intake_service_js_1.EventIntakeService.ingest({
                                organizationId: person.organizationId,
                                personId: args.personId,
                                channel: "sms",
                                type: "send",
                                payload: {
                                    body: body,
                                },
                                metadata: {
                                    brandId: args.brandId,
                                    objective: args.objective,
                                    operatorId: (_e = args.operatorId) !== null && _e !== void 0 ? _e : null,
                                },
                                source: "sms-agent",
                            })];
                    case 10:
                        _f.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SMSAgent.prototype.parseReply = function (inbound) {
        return __awaiter(this, void 0, void 0, function () {
            var phone, identity;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        phone = normalizePhone(inbound.From);
                        return [4 /*yield*/, prisma_js_1.prisma.identity.findFirst({
                                where: { type: "phone", value: phone },
                                select: {
                                    personId: true,
                                    person: {
                                        select: { organizationId: true },
                                    },
                                },
                            })];
                    case 1:
                        identity = _a.sent();
                        if (!(identity === null || identity === void 0 ? void 0 : identity.personId) || !identity.person) {
                            logger_js_1.logger.warn({ phone: phone }, "SMS reply received for unknown identity");
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, event_intake_service_js_1.EventIntakeService.ingest({
                                organizationId: identity.person.organizationId,
                                personId: identity.personId,
                                channel: "sms",
                                type: "reply",
                                payload: {
                                    body: inbound.Body,
                                    messageSid: inbound.MessageSid,
                                },
                                metadata: {
                                    from: inbound.From,
                                    to: inbound.To,
                                },
                                source: "twilio-webhook",
                            })];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return SMSAgent;
}());
exports.SMSAgent = SMSAgent;
exports.smsAgent = new SMSAgent();
