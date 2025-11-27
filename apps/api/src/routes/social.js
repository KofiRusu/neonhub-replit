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
Object.defineProperty(exports, "__esModule", { value: true });
exports.socialRouter = void 0;
var express_1 = require("express");
var zod_1 = require("zod");
var auth_js_1 = require("../middleware/auth.js");
var SocialMessagingAgent_js_1 = require("../agents/SocialMessagingAgent.js");
var http_js_1 = require("../lib/http.js");
var prisma_js_1 = require("../lib/prisma.js");
var event_intake_service_js_1 = require("../services/event-intake.service.js");
exports.socialRouter = (0, express_1.Router)();
var platformSchema = zod_1.z.enum(["instagram", "x", "reddit", "whatsapp"]);
var sendSchema = zod_1.z.object({
    personId: zod_1.z.string().min(1),
    objective: zod_1.z.string().min(1),
    brandId: zod_1.z.string().min(1),
});
var inboundSchema = zod_1.z.object({
    handle: zod_1.z.string().min(1),
    message: zod_1.z.string().min(1),
    brandId: zod_1.z.string().optional(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.socialRouter.post("/:platform/dm", auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var platform, payload, args, error_1, message;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 2, , 3]);
                platform = platformSchema.parse(req.params.platform);
                payload = sendSchema.parse((_a = req.body) !== null && _a !== void 0 ? _a : {});
                args = {
                    personId: payload.personId,
                    objective: payload.objective,
                    brandId: payload.brandId,
                    platform: platform,
                    operatorId: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id,
                };
                return [4 /*yield*/, SocialMessagingAgent_js_1.socialMessagingAgent.sendDM(args)];
            case 1:
                _e.sent();
                return [2 /*return*/, res.status(202).json((0, http_js_1.ok)({ status: "queued" }))];
            case 2:
                error_1 = _e.sent();
                if (error_1 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)((_d = (_c = error_1.errors[0]) === null || _c === void 0 ? void 0 : _c.message) !== null && _d !== void 0 ? _d : "Invalid request").body)];
                }
                message = error_1 instanceof Error ? error_1.message : "Failed to send direct message";
                return [2 /*return*/, res.status(message.includes("Consent") ? 403 : 500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.socialRouter.post("/:platform/inbound", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var platform, payload, identity, error_2, message;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 3, , 4]);
                platform = platformSchema.parse(req.params.platform);
                payload = inboundSchema.parse((_a = req.body) !== null && _a !== void 0 ? _a : {});
                return [4 /*yield*/, prisma_js_1.prisma.identity.findFirst({
                        where: {
                            type: "handle",
                            value: payload.handle.toLowerCase(),
                            channel: platform,
                        },
                        select: {
                            personId: true,
                            person: {
                                select: { organizationId: true },
                            },
                        },
                    })];
            case 1:
                identity = _e.sent();
                if (!(identity === null || identity === void 0 ? void 0 : identity.personId) || !identity.person) {
                    return [2 /*return*/, res.status(404).json((0, http_js_1.fail)("Person not found for inbound handle").body)];
                }
                return [4 /*yield*/, event_intake_service_js_1.EventIntakeService.ingest({
                        organizationId: identity.person.organizationId,
                        personId: identity.personId,
                        channel: "dm",
                        type: "reply",
                        payload: {
                            platform: platform,
                            handle: payload.handle,
                            message: payload.message,
                        },
                        metadata: (_b = payload.metadata) !== null && _b !== void 0 ? _b : {},
                        source: "".concat(platform, "-webhook"),
                    })];
            case 2:
                _e.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)({ received: true }))];
            case 3:
                error_2 = _e.sent();
                if (error_2 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)((_d = (_c = error_2.errors[0]) === null || _c === void 0 ? void 0 : _c.message) !== null && _d !== void 0 ? _d : "Invalid inbound payload").body)];
                }
                message = error_2 instanceof Error ? error_2.message : "Failed to process inbound DM";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 4: return [2 /*return*/];
        }
    });
}); });
exports.default = exports.socialRouter;
