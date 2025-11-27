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
exports.brandVoiceRouter = void 0;
var express_1 = require("express");
var zod_1 = require("zod");
var auth_js_1 = require("../middleware/auth.js");
var brand_voice_service_js_1 = require("../services/brand-voice.service.js");
var http_js_1 = require("../lib/http.js");
var agentic_js_1 = require("../types/agentic.js");
exports.brandVoiceRouter = (0, express_1.Router)();
var composeSchema = zod_1.z.object({
    channel: zod_1.z.enum(["email", "sms", "dm", "post"]),
    objective: zod_1.z.string().min(1),
    personId: zod_1.z.string().min(1),
    brandId: zod_1.z.string().min(1),
    constraints: zod_1.z.record(zod_1.z.unknown()).optional(),
});
var guardrailSchema = zod_1.z.object({
    text: zod_1.z.string().min(1),
    channel: zod_1.z.string().min(1),
    brandId: zod_1.z.string().min(1),
});
exports.brandVoiceRouter.post("/compose", auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var payload, composeArgs, result, error_1, message;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 2, , 3]);
                payload = composeSchema.parse((_a = req.body) !== null && _a !== void 0 ? _a : {});
                composeArgs = {
                    channel: (0, agentic_js_1.normalizeChannel)(payload.channel, agentic_js_1.DEFAULT_CHANNEL),
                    objective: payload.objective,
                    personId: payload.personId,
                    brandId: payload.brandId,
                    constraints: payload.constraints,
                };
                return [4 /*yield*/, brand_voice_service_js_1.BrandVoiceService.compose(composeArgs)];
            case 1:
                result = _d.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(result))];
            case 2:
                error_1 = _d.sent();
                if (error_1 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)((_c = (_b = error_1.errors[0]) === null || _b === void 0 ? void 0 : _b.message) !== null && _c !== void 0 ? _c : "Invalid request").body)];
                }
                message = error_1 instanceof Error ? error_1.message : "Failed to compose brand voice";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.brandVoiceRouter.post("/guardrail", auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var payload, result, error_2, message;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 2, , 3]);
                payload = guardrailSchema.parse((_a = req.body) !== null && _a !== void 0 ? _a : {});
                return [4 /*yield*/, brand_voice_service_js_1.BrandVoiceService.guardrail(payload.text, payload.channel, payload.brandId)];
            case 1:
                result = _d.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(result))];
            case 2:
                error_2 = _d.sent();
                if (error_2 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)((_c = (_b = error_2.errors[0]) === null || _b === void 0 ? void 0 : _b.message) !== null && _c !== void 0 ? _c : "Invalid request").body)];
                }
                message = error_2 instanceof Error ? error_2.message : "Failed to evaluate guardrail";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.brandVoiceRouter.get("/prompt/:useCase", auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var paramsSchema, useCase, brandIdSchema, brandId, result, error_3, message;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                paramsSchema = zod_1.z.object({
                    useCase: zod_1.z.string().min(1),
                });
                useCase = paramsSchema.parse(req.params).useCase;
                brandIdSchema = zod_1.z.object({ brandId: zod_1.z.string().min(1) });
                brandId = brandIdSchema.parse(req.query).brandId;
                return [4 /*yield*/, brand_voice_service_js_1.BrandVoiceService.getPromptPack(useCase, brandId)];
            case 1:
                result = _c.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(result))];
            case 2:
                error_3 = _c.sent();
                if (error_3 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)((_b = (_a = error_3.errors[0]) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : "Invalid request").body)];
                }
                message = error_3 instanceof Error ? error_3.message : "Failed to load prompt pack";
                return [2 /*return*/, res.status(message.includes("not found") ? 404 : 500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = exports.brandVoiceRouter;
