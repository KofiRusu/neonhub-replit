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
exports.budgetRouter = void 0;
var express_1 = require("express");
var zod_1 = require("zod");
var auth_js_1 = require("../middleware/auth.js");
var budget_service_js_1 = require("../services/budget.service.js");
var http_js_1 = require("../lib/http.js");
var agentic_js_1 = require("../types/agentic.js");
exports.budgetRouter = (0, express_1.Router)();
var objectiveSchema = zod_1.z.object({
    objectiveId: zod_1.z.string().min(1),
    amount: zod_1.z.number().positive(),
    channel: zod_1.z.string().optional(),
    priority: zod_1.z.number().int().optional(),
});
var planSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().min(1),
    objectives: zod_1.z.array(objectiveSchema).min(1),
});
var allocationSchema = zod_1.z.object({
    allocationId: zod_1.z.string().min(1),
});
var ledgerQuerySchema = zod_1.z.object({
    workspaceId: zod_1.z.string().min(1),
    start: zod_1.z.string().datetime(),
    end: zod_1.z.string().datetime(),
});
exports.budgetRouter.post("/plan", auth_js_1.requireAuth, function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var payload, objectives, allocation, error_1, message;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 2, , 3]);
                payload = planSchema.parse((_a = _req.body) !== null && _a !== void 0 ? _a : {});
                objectives = payload.objectives.map(function (objective) { return ({
                    objectiveId: objective.objectiveId,
                    amount: objective.amount,
                    channel: objective.channel ? (0, agentic_js_1.normalizeChannel)(objective.channel, agentic_js_1.DEFAULT_CHANNEL) : undefined,
                    priority: objective.priority,
                }); });
                return [4 /*yield*/, budget_service_js_1.BudgetService.plan(payload.workspaceId, objectives)];
            case 1:
                allocation = _d.sent();
                return [2 /*return*/, res.status(201).json((0, http_js_1.ok)(allocation))];
            case 2:
                error_1 = _d.sent();
                if (error_1 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)((_c = (_b = error_1.errors[0]) === null || _b === void 0 ? void 0 : _b.message) !== null && _c !== void 0 ? _c : "Invalid request").body)];
                }
                message = error_1 instanceof Error ? error_1.message : "Failed to plan budget";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.budgetRouter.post("/execute", auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var allocationId, error_2, message;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 2, , 3]);
                allocationId = allocationSchema.parse((_a = req.body) !== null && _a !== void 0 ? _a : {}).allocationId;
                return [4 /*yield*/, budget_service_js_1.BudgetService.execute(allocationId)];
            case 1:
                _d.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)({ status: "executing" }))];
            case 2:
                error_2 = _d.sent();
                if (error_2 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)((_c = (_b = error_2.errors[0]) === null || _b === void 0 ? void 0 : _b.message) !== null && _c !== void 0 ? _c : "Invalid request").body)];
                }
                message = error_2 instanceof Error ? error_2.message : "Failed to execute budget allocation";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.budgetRouter.post("/reconcile", auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var allocationId, error_3, message;
    var _a, _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 2, , 3]);
                allocationId = allocationSchema.parse((_a = req.body) !== null && _a !== void 0 ? _a : {}).allocationId;
                return [4 /*yield*/, budget_service_js_1.BudgetService.reconcile(allocationId)];
            case 1:
                _d.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)({ status: "completed" }))];
            case 2:
                error_3 = _d.sent();
                if (error_3 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)((_c = (_b = error_3.errors[0]) === null || _b === void 0 ? void 0 : _b.message) !== null && _c !== void 0 ? _c : "Invalid request").body)];
                }
                message = error_3 instanceof Error ? error_3.message : "Failed to reconcile allocation";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.budgetRouter.get("/ledger", auth_js_1.requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var query, entries, error_4, message;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                query = ledgerQuerySchema.parse(req.query);
                return [4 /*yield*/, budget_service_js_1.BudgetService.getLedger(query.workspaceId, {
                        start: new Date(query.start),
                        end: new Date(query.end),
                    })];
            case 1:
                entries = _c.sent();
                return [2 /*return*/, res.json((0, http_js_1.ok)(entries))];
            case 2:
                error_4 = _c.sent();
                if (error_4 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json((0, http_js_1.fail)((_b = (_a = error_4.errors[0]) === null || _a === void 0 ? void 0 : _a.message) !== null && _b !== void 0 ? _b : "Invalid query").body)];
                }
                message = error_4 instanceof Error ? error_4.message : "Failed to fetch ledger";
                return [2 /*return*/, res.status(500).json((0, http_js_1.fail)(message).body)];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = exports.budgetRouter;
