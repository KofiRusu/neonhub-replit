"use strict";
/**
 * Eco-Optimizer API Routes
 * Endpoints for energy monitoring, carbon footprint, and sustainability metrics
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
var ecoService = require("../services/eco-optimizer/index.js");
var logger_js_1 = require("../lib/logger.js");
var router = (0, express_1.Router)();
// GET /api/eco-metrics/energy - Get current energy metrics
router.get('/energy', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var metrics, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ecoService.getCurrentEnergyMetrics()];
            case 1:
                metrics = _a.sent();
                res.json({
                    success: true,
                    metrics: metrics,
                    timestamp: metrics.timestamp
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                logger_js_1.logger.error({ error: error_1 }, 'Failed to get energy metrics');
                res.status(500).json({
                    error: 'Failed to retrieve energy metrics',
                    details: error_1 instanceof Error ? error_1.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /api/eco-metrics/carbon - Calculate carbon footprint
router.post('/carbon', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var resources, footprint, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                resources = req.body.resources;
                if (!resources || !Array.isArray(resources)) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Resources array is required'
                        })];
                }
                return [4 /*yield*/, ecoService.calculateCarbonFootprint(resources)];
            case 1:
                footprint = _a.sent();
                res.json({
                    success: true,
                    footprint: footprint,
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                logger_js_1.logger.error({ error: error_2 }, 'Failed to calculate carbon footprint');
                res.status(500).json({
                    error: 'Failed to calculate carbon footprint',
                    details: error_2 instanceof Error ? error_2.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /api/eco-metrics/optimize - Optimize resource allocation
router.post('/optimize', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var resources, optimization, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                resources = req.body.resources;
                if (!resources || !Array.isArray(resources)) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Resources array is required'
                        })];
                }
                return [4 /*yield*/, ecoService.optimizeResources(resources)];
            case 1:
                optimization = _a.sent();
                res.json({
                    success: true,
                    optimization: optimization,
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                logger_js_1.logger.error({ error: error_3 }, 'Failed to optimize resources');
                res.status(500).json({
                    error: 'Failed to optimize resource allocation',
                    details: error_3 instanceof Error ? error_3.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/eco-metrics/efficiency - Analyze system efficiency
router.get('/efficiency', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, startDate, endDate, analysis, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, startDate = _a.startDate, endDate = _a.endDate;
                if (!startDate || !endDate) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'startDate and endDate query parameters are required'
                        })];
                }
                return [4 /*yield*/, ecoService.analyzeEfficiency({
                        start: new Date(startDate),
                        end: new Date(endDate)
                    })];
            case 1:
                analysis = _b.sent();
                res.json({
                    success: true,
                    analysis: analysis,
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                logger_js_1.logger.error({ error: error_4 }, 'Failed to analyze efficiency');
                res.status(500).json({
                    error: 'Failed to analyze system efficiency',
                    details: error_4 instanceof Error ? error_4.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /api/eco-metrics/green-ai - Get Green AI recommendations
router.post('/green-ai', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_1, parameters, trainingData, framework, accelerator, recommendations, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, name_1 = _a.name, parameters = _a.parameters, trainingData = _a.trainingData, framework = _a.framework, accelerator = _a.accelerator;
                if (!name_1 || !parameters || !trainingData || !framework || !accelerator) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'name, parameters, trainingData, framework, and accelerator are required'
                        })];
                }
                return [4 /*yield*/, ecoService.getGreenAIRecommendations({
                        name: name_1,
                        parameters: parameters,
                        trainingData: trainingData,
                        framework: framework,
                        accelerator: accelerator
                    })];
            case 1:
                recommendations = _b.sent();
                res.json({
                    success: true,
                    recommendations: recommendations,
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _b.sent();
                logger_js_1.logger.error({ error: error_5 }, 'Failed to get Green AI recommendations');
                res.status(500).json({
                    error: 'Failed to generate Green AI recommendations',
                    details: error_5 instanceof Error ? error_5.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/eco-metrics/sustainability-report - Generate sustainability report
router.get('/sustainability-report', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, startDate, endDate, report, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, startDate = _a.startDate, endDate = _a.endDate;
                if (!startDate || !endDate) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'startDate and endDate query parameters are required'
                        })];
                }
                return [4 /*yield*/, ecoService.generateSustainabilityReport({
                        start: new Date(startDate),
                        end: new Date(endDate)
                    })];
            case 1:
                report = _b.sent();
                res.json({
                    success: true,
                    report: report,
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _b.sent();
                logger_js_1.logger.error({ error: error_6 }, 'Failed to generate sustainability report');
                res.status(500).json({
                    error: 'Failed to generate sustainability report',
                    details: error_6 instanceof Error ? error_6.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /api/eco-metrics/track - Track energy usage
router.post('/track', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, type, provider, instanceType, region, utilizationPercent, durationHours, usage, error_7;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, type = _a.type, provider = _a.provider, instanceType = _a.instanceType, region = _a.region, utilizationPercent = _a.utilizationPercent, durationHours = _a.durationHours;
                if (!type || !provider || !instanceType || !region || utilizationPercent === undefined || !durationHours) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'type, provider, instanceType, region, utilizationPercent, and durationHours are required'
                        })];
                }
                return [4 /*yield*/, ecoService.trackEnergyUsage({
                        type: type,
                        provider: provider,
                        instanceType: instanceType,
                        region: region,
                        utilizationPercent: utilizationPercent,
                        durationHours: durationHours
                    })];
            case 1:
                usage = _b.sent();
                res.json({
                    success: true,
                    usage: usage,
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 3];
            case 2:
                error_7 = _b.sent();
                logger_js_1.logger.error({ error: error_7 }, 'Failed to track energy usage');
                res.status(500).json({
                    error: 'Failed to track energy usage',
                    details: error_7 instanceof Error ? error_7.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/eco-metrics/status - Get system status
router.get('/status', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var status_1;
    return __generator(this, function (_a) {
        try {
            status_1 = ecoService.getSystemStatus();
            res.json({
                success: true,
                status: status_1,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            logger_js_1.logger.error({ error: error }, 'Failed to get system status');
            res.status(500).json({
                error: 'Failed to get system status',
                details: error instanceof Error ? error.message : 'Unknown error'
            });
        }
        return [2 /*return*/];
    });
}); });
exports.default = router;
