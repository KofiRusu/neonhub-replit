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
exports.socialMessagingAgent = exports.SocialMessagingAgent = void 0;
var prisma_js_1 = require("../lib/prisma.js");
var logger_js_1 = require("../lib/logger.js");
var brand_voice_service_js_1 = require("../services/brand-voice.service.js");
var person_service_js_1 = require("../services/person.service.js");
var event_intake_service_js_1 = require("../services/event-intake.service.js");
var index_js_1 = require("../queues/index.js");
var PLATFORM_LIMITS = {
    instagram: 800,
    x: 280,
    reddit: 2000,
    whatsapp: 1000,
};
function enqueueSocialJob(queueName, payload) {
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
                    logger_js_1.logger.warn({ error: error_1, queueName: queueName }, "Failed to enqueue social job");
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function enforcePlatformLimit(body, platform) {
    var _a;
    var limit = (_a = PLATFORM_LIMITS[platform]) !== null && _a !== void 0 ? _a : 500;
    if (body.length <= limit) {
        return body;
    }
    return "".concat(body.slice(0, limit - 3), "...");
}
var SocialMessagingAgent = /** @class */ (function () {
    function SocialMessagingAgent() {
    }
    SocialMessagingAgent.prototype.sendDM = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var person, consentChannel, consent, identity, handle, memory, composition, variant, body;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0: return [4 /*yield*/, enqueueSocialJob("social.compose", args)];
                    case 1:
                        _f.sent();
                        return [4 /*yield*/, prisma_js_1.prisma.person.findUnique({
                                where: { id: args.personId },
                                select: {
                                    id: true,
                                    organizationId: true,
                                    primaryHandle: true,
                                    displayName: true,
                                },
                            })];
                    case 2:
                        person = _f.sent();
                        if (!person) {
                            throw new Error("Person not found for id ".concat(args.personId));
                        }
                        consentChannel = args.platform === "whatsapp" ? "sms" : "dm";
                        return [4 /*yield*/, person_service_js_1.PersonService.getConsent(args.personId, consentChannel)];
                    case 3:
                        consent = (_f.sent());
                        if (consent && consent !== "granted") {
                            throw new Error("Consent for ".concat(consentChannel, " not granted"));
                        }
                        return [4 /*yield*/, prisma_js_1.prisma.identity.findFirst({
                                where: {
                                    personId: args.personId,
                                    channel: args.platform,
                                },
                                orderBy: { verifiedAt: "desc" },
                            })];
                    case 4:
                        identity = _f.sent();
                        handle = (_a = identity === null || identity === void 0 ? void 0 : identity.value) !== null && _a !== void 0 ? _a : person.primaryHandle;
                        if (!handle) {
                            logger_js_1.logger.warn({ personId: args.personId, platform: args.platform }, "No handle available for social DM");
                        }
                        return [4 /*yield*/, person_service_js_1.PersonService.getMemory(args.personId, { limit: 5, includeVectors: false })];
                    case 5:
                        memory = _f.sent();
                        return [4 /*yield*/, brand_voice_service_js_1.BrandVoiceService.compose({
                                channel: "dm",
                                objective: args.objective,
                                personId: args.personId,
                                brandId: args.brandId,
                                constraints: {
                                    maxLength: (_b = PLATFORM_LIMITS[args.platform]) !== null && _b !== void 0 ? _b : 500,
                                    platform: args.platform,
                                },
                            })];
                    case 6:
                        composition = _f.sent();
                        variant = (_c = composition.variants[0]) !== null && _c !== void 0 ? _c : {
                            body: composition.body,
                            cta: composition.cta,
                        };
                        body = enforcePlatformLimit((_d = variant.body) !== null && _d !== void 0 ? _d : composition.body, args.platform);
                        // Placeholder for actual platform API integration
                        logger_js_1.logger.info({
                            personId: args.personId,
                            platform: args.platform,
                            handle: handle,
                            bodyLength: body.length,
                        }, "Dispatching social DM via connector");
                        return [4 /*yield*/, enqueueSocialJob("social.send", __assign(__assign({}, args), { handle: handle }))];
                    case 7:
                        _f.sent();
                        return [4 /*yield*/, event_intake_service_js_1.EventIntakeService.ingest({
                                organizationId: person.organizationId,
                                personId: args.personId,
                                channel: "dm",
                                type: "send",
                                payload: {
                                    platform: args.platform,
                                    handle: handle,
                                    body: body,
                                },
                                metadata: {
                                    brandId: args.brandId,
                                    objective: args.objective,
                                    operatorId: (_e = args.operatorId) !== null && _e !== void 0 ? _e : null,
                                    memoryCount: memory.length,
                                },
                                source: "".concat(args.platform, "-agent"),
                            })];
                    case 8:
                        _f.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return SocialMessagingAgent;
}());
exports.SocialMessagingAgent = SocialMessagingAgent;
exports.socialMessagingAgent = new SocialMessagingAgent();
