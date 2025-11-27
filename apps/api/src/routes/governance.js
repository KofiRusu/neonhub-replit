"use strict";
/**
 * AI Governance API Routes
 * Endpoints for policy management, ethical assessments, and compliance checks
 */
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
var express_1 = require("express");
var governanceService = require("../services/governance/index.js");
var logger_js_1 = require("../lib/logger.js");
var router = (0, express_1.Router)();
// POST /api/governance/evaluate - Evaluate action against policies
router.post('/evaluate', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, action, context, evaluation, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, action = _a.action, context = _a.context;
                if (!action || !context) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Action and context are required'
                        })];
                }
                return [4 /*yield*/, governanceService.evaluateAction({ action: action, context: context })];
            case 1:
                evaluation = _b.sent();
                res.json({
                    success: true,
                    evaluation: evaluation,
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                logger_js_1.logger.error({ error: error_1 }, 'Failed to evaluate action');
                res.status(500).json({
                    error: 'Failed to evaluate action',
                    details: error_1 instanceof Error ? error_1.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /api/governance/policies - Add a new policy
router.post('/policies', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var policy, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                policy = req.body;
                if (!policy.id || !policy.name || !policy.rules) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Policy id, name, and rules are required'
                        })];
                }
                return [4 /*yield*/, governanceService.addPolicy(policy)];
            case 1:
                _a.sent();
                res.json({
                    success: true,
                    message: 'Policy added successfully',
                    policyId: policy.id
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                logger_js_1.logger.error({ error: error_2 }, 'Failed to add policy');
                res.status(500).json({
                    error: 'Failed to add policy',
                    details: error_2 instanceof Error ? error_2.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/governance/policies - Get all policies
router.get('/policies', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var policies, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, governanceService.getPolicies()];
            case 1:
                policies = _a.sent();
                res.json({
                    success: true,
                    policies: policies,
                    count: policies.length
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                logger_js_1.logger.error({ error: error_3 }, 'Failed to get policies');
                res.status(500).json({
                    error: 'Failed to retrieve policies',
                    details: error_3 instanceof Error ? error_3.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /api/governance/ethics/assess - Perform ethical assessment
router.post('/ethics/assess', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, scenario, stakeholders, potentialImpacts, assessment, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, scenario = _a.scenario, stakeholders = _a.stakeholders, potentialImpacts = _a.potentialImpacts;
                if (!scenario || !stakeholders || !potentialImpacts) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Scenario, stakeholders, and potentialImpacts are required'
                        })];
                }
                return [4 /*yield*/, governanceService.assessEthics({
                        scenario: scenario,
                        stakeholders: stakeholders,
                        potentialImpacts: potentialImpacts
                    })];
            case 1:
                assessment = _b.sent();
                res.json({
                    success: true,
                    assessment: assessment,
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                logger_js_1.logger.error({ error: error_4 }, 'Failed to assess ethics');
                res.status(500).json({
                    error: 'Failed to perform ethical assessment',
                    details: error_4 instanceof Error ? error_4.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/governance/health - Get governance system health
router.get('/health', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var health, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, governanceService.getHealthStatus()];
            case 1:
                health = _a.sent();
                res.json({
                    success: true,
                    health: health,
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                logger_js_1.logger.error({ error: error_5 }, 'Failed to get health status');
                res.status(500).json({
                    error: 'Failed to get governance health',
                    details: error_5 instanceof Error ? error_5.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/governance/audit-logs - Get audit logs
router.get('/audit-logs', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, startDate, endDate, level, category, filter, logs, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, startDate = _a.startDate, endDate = _a.endDate, level = _a.level, category = _a.category;
                filter = {};
                if (startDate)
                    filter.startDate = new Date(startDate);
                if (endDate)
                    filter.endDate = new Date(endDate);
                if (level)
                    filter.level = level;
                if (category)
                    filter.category = category;
                return [4 /*yield*/, governanceService.getAuditLogs(filter)];
            case 1:
                logs = _b.sent();
                res.json({
                    success: true,
                    logs: logs,
                    count: logs.length
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _b.sent();
                logger_js_1.logger.error({ error: error_6 }, 'Failed to get audit logs');
                res.status(500).json({
                    error: 'Failed to retrieve audit logs',
                    details: error_6 instanceof Error ? error_6.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
