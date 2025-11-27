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
exports.orchestrateRouter = void 0;
exports.formatOrchestrateResponse = formatOrchestrateResponse;
var express_1 = require("express");
var zod_1 = require("zod");
var index_js_1 = require("../services/orchestration/index.js");
var types_js_1 = require("../services/orchestration/types.js");
var logger_js_1 = require("../lib/logger.js");
// Local schema definitions (orchestrator-contract package missing exports)
var OrchestratorRequestSchema = zod_1.z.object({
    agent: zod_1.z.string().optional(),
    intent: zod_1.z.string(),
    payload: zod_1.z.unknown().optional(),
    context: zod_1.z.record(zod_1.z.unknown()).optional(),
});
var OrchestratorResponseSchema = zod_1.z.object({}).passthrough();
// Error code constants
var DEFAULT_ERROR_CODES = {
    UNKNOWN: "UNKNOWN",
    VALIDATION_FAILED: "VALIDATION_FAILED",
    UNAUTHENTICATED: "UNAUTHENTICATED",
    RATE_LIMITED: "RATE_LIMITED",
    AGENT_NOT_REGISTERED: "AGENT_NOT_REGISTERED",
    CIRCUIT_OPEN: "CIRCUIT_OPEN",
    AGENT_EXECUTION_FAILED: "AGENT_EXECUTION_FAILED",
};
var OrchestratorErrorDetailSchema = zod_1.z.object({
    code: zod_1.z.string(),
    message: zod_1.z.string(),
    details: zod_1.z.unknown().optional(),
});
/*
Phase 4 contract alignment plan for this route:
1. Validate incoming payloads against the shared orchestrator contract.
2. Normalize every HTTP response to the unified envelope (agent, intent, status, timestamp).
3. Map orchestrator results (and legacy errors) into the schema so SDK + UI receive identical shapes.
4. Preserve existing status code mappings while returning structured error metadata.
*/
var orchestrateSchema = OrchestratorRequestSchema.extend({
    agent: zod_1.z.enum(types_js_1.AGENT_NAMES).optional(),
});
exports.orchestrateRouter = (0, express_1.Router)();
function statusFromCode(code) {
    switch (code) {
        case "UNAUTHENTICATED":
            return 401;
        case "RATE_LIMITED":
            return 429;
        case "AGENT_NOT_REGISTERED":
            return 404;
        case "CIRCUIT_OPEN":
        case "AGENT_EXECUTION_FAILED":
            return 502;
        default:
            return 400;
    }
}
function formatOrchestrateResponse(result, fallback) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    if (fallback === void 0) { fallback = { intent: "unknown" }; }
    var timestamp = new Date().toISOString();
    if (!result.ok) {
        var code = (_a = result.code) !== null && _a !== void 0 ? _a : DEFAULT_ERROR_CODES.UNKNOWN;
        var detail = OrchestratorErrorDetailSchema.parse({
            code: code,
            message: (_b = result.error) !== null && _b !== void 0 ? _b : "orchestration_failed",
            details: result.details,
        });
        var envelope_1 = OrchestratorResponseSchema.parse({
            success: false,
            status: "failed",
            agent: (_d = (_c = result.meta) === null || _c === void 0 ? void 0 : _c.agent) !== null && _d !== void 0 ? _d : fallback.agent,
            intent: (_f = (_e = result.meta) === null || _e === void 0 ? void 0 : _e.intent) !== null && _f !== void 0 ? _f : fallback.intent,
            runId: (_g = result.meta) === null || _g === void 0 ? void 0 : _g.runId,
            error: detail,
            timestamp: timestamp,
        });
        return { status: statusFromCode(code), body: envelope_1 };
    }
    var envelope = OrchestratorResponseSchema.parse({
        success: true,
        status: "completed",
        agent: (_k = (_j = (_h = result.meta) === null || _h === void 0 ? void 0 : _h.agent) !== null && _j !== void 0 ? _j : fallback.agent) !== null && _k !== void 0 ? _k : "unknown",
        intent: (_m = (_l = result.meta) === null || _l === void 0 ? void 0 : _l.intent) !== null && _m !== void 0 ? _m : fallback.intent,
        runId: (_o = result.meta) === null || _o === void 0 ? void 0 : _o.runId,
        data: result.data,
        metrics: (_p = result.meta) === null || _p === void 0 ? void 0 : _p.metrics,
        timestamp: timestamp,
    });
    return { status: 200, body: envelope };
}
exports.orchestrateRouter.post("/orchestrate", function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var input, context, result, _a, status_1, body, error_1, fallbackIntent, fallbackAgent, _b, status_2, body_1, _c, status_3, body;
    var _d, _e, _f, _g, _h;
    return __generator(this, function (_j) {
        switch (_j.label) {
            case 0:
                _j.trys.push([0, 2, , 3]);
                input = orchestrateSchema.parse(req.body);
                context = __assign(__assign({}, (input.context || {})), { userId: (_e = (_d = req.user) === null || _d === void 0 ? void 0 : _d.id) !== null && _e !== void 0 ? _e : (_f = input.context) === null || _f === void 0 ? void 0 : _f.userId });
                return [4 /*yield*/, (0, index_js_1.orchestrate)({
                        agent: input.agent,
                        intent: input.intent,
                        payload: input.payload,
                        context: context,
                    })];
            case 1:
                result = _j.sent();
                _a = formatOrchestrateResponse(result, {
                    intent: input.intent,
                    agent: input.agent,
                }), status_1 = _a.status, body = _a.body;
                res.status(status_1).json(body);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _j.sent();
                logger_js_1.logger.error({ error: error_1 }, "Failed to orchestrate agent request");
                fallbackIntent = typeof ((_g = req.body) === null || _g === void 0 ? void 0 : _g.intent) === "string" ? req.body.intent : "unknown";
                fallbackAgent = typeof ((_h = req.body) === null || _h === void 0 ? void 0 : _h.agent) === "string" ? req.body.agent : undefined;
                if (error_1 instanceof zod_1.z.ZodError) {
                    _b = formatOrchestrateResponse({
                        ok: false,
                        error: "invalid_request",
                        code: DEFAULT_ERROR_CODES.VALIDATION_FAILED,
                        details: error_1.flatten(),
                    }, { intent: fallbackIntent, agent: fallbackAgent }), status_2 = _b.status, body_1 = _b.body;
                    return [2 /*return*/, res.status(status_2).json(body_1)];
                }
                _c = formatOrchestrateResponse({
                    ok: false,
                    error: "internal_error",
                    code: DEFAULT_ERROR_CODES.UNKNOWN,
                    details: { message: error_1 instanceof Error ? error_1.message : "Unhandled error" },
                }, { intent: fallbackIntent, agent: fallbackAgent }), status_3 = _c.status, body = _c.body;
                return [2 /*return*/, res.status(status_3).json(body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
