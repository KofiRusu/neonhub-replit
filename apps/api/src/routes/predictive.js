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
var express_1 = require("express");
var predictive_engine_1 = require("../services/predictive-engine");
var router = (0, express_1.Router)();
// POST /api/predictive/scale - Process metrics and make scaling decisions
router.post('/scale', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var metrics, decision, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                metrics = req.body.metrics;
                if (!metrics) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Metrics data is required'
                        })];
                }
                return [4 /*yield*/, (0, predictive_engine_1.processMetricsForScaling)(metrics)];
            case 1:
                decision = _a.sent();
                res.json({
                    success: true,
                    decision: decision,
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Error processing scaling decision:', error_1);
                res.status(500).json({
                    error: 'Failed to process scaling decision',
                    details: error_1 instanceof Error ? error_1.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /api/predictive/execute - Execute scaling decision
router.post('/execute', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, decision, namespace, deploymentName, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, decision = _a.decision, namespace = _a.namespace, deploymentName = _a.deploymentName;
                if (!decision) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Scaling decision is required'
                        })];
                }
                return [4 /*yield*/, (0, predictive_engine_1.executeAutoScaling)(decision, namespace, deploymentName)];
            case 1:
                _b.sent();
                res.json({
                    success: true,
                    message: 'Scaling executed successfully',
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                console.error('Error executing scaling:', error_2);
                res.status(500).json({
                    error: 'Failed to execute scaling',
                    details: error_2 instanceof Error ? error_2.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/predictive/health - Get predictive engine health status
router.get('/health', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var health, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, predictive_engine_1.getPredictiveEngineHealth)()];
            case 1:
                health = _a.sent();
                res.json({
                    success: true,
                    health: health,
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                console.error('Error getting predictive engine health:', error_3);
                res.status(500).json({
                    error: 'Failed to get predictive engine health',
                    details: error_3 instanceof Error ? error_3.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/predictive/stats - Get adaptive agent learning statistics
router.get('/stats', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var stats;
    return __generator(this, function (_a) {
        try {
            stats = (0, predictive_engine_1.getAdaptiveAgentStats)();
            res.json({
                success: true,
                stats: stats,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            console.error('Error getting adaptive agent stats:', error);
            res.status(500).json({
                error: 'Failed to get adaptive agent statistics',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
        return [2 /*return*/];
    });
}); });
// GET /api/predictive/baseline - Get baseline performance metrics
router.get('/baseline', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var baseline, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, predictive_engine_1.getBaselineMetrics)()];
            case 1:
                baseline = _a.sent();
                res.json({
                    success: true,
                    baseline: baseline,
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error('Error getting baseline metrics:', error_4);
                res.status(500).json({
                    error: 'Failed to get baseline metrics',
                    details: error_4 instanceof Error ? error_4.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
