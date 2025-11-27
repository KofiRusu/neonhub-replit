"use strict";
/**
 * Global Orchestration API Routes
 * Endpoints for node management, routing, scaling, and failover
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
var orchestrationService = require("../services/orchestration/index.js");
var logger_js_1 = require("../lib/logger.js");
var router = (0, express_1.Router)();
// POST /api/orchestration/nodes/register - Register a new node
router.post('/nodes/register', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, region, endpoint, capabilities, metadata, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, id = _a.id, region = _a.region, endpoint = _a.endpoint, capabilities = _a.capabilities, metadata = _a.metadata;
                if (!id || !region || !endpoint || !capabilities) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'id, region, endpoint, and capabilities are required'
                        })];
                }
                return [4 /*yield*/, orchestrationService.registerNode({ id: id, region: region, endpoint: endpoint, capabilities: capabilities, metadata: metadata })];
            case 1:
                _b.sent();
                res.json({
                    success: true,
                    message: 'Node registered successfully',
                    nodeId: id
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                logger_js_1.logger.error({ error: error_1 }, 'Failed to register node');
                res.status(500).json({
                    error: 'Failed to register node',
                    details: error_1 instanceof Error ? error_1.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/orchestration/nodes - Discover nodes
router.get('/nodes', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var region, nodes, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                region = req.query.region;
                return [4 /*yield*/, orchestrationService.discoverNodes(region)];
            case 1:
                nodes = _a.sent();
                res.json({
                    success: true,
                    nodes: nodes,
                    count: nodes.length
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                logger_js_1.logger.error({ error: error_2 }, 'Failed to discover nodes');
                res.status(500).json({
                    error: 'Failed to discover nodes',
                    details: error_2 instanceof Error ? error_2.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /api/orchestration/route - Route a request
router.post('/route', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, requestId, sourceRegion, priority, payload, routing, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, requestId = _a.requestId, sourceRegion = _a.sourceRegion, priority = _a.priority, payload = _a.payload;
                if (!requestId || !sourceRegion || !priority || !payload) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'requestId, sourceRegion, priority, and payload are required'
                        })];
                }
                return [4 /*yield*/, orchestrationService.routeRequest({
                        requestId: requestId,
                        sourceRegion: sourceRegion,
                        priority: priority,
                        payload: payload
                    })];
            case 1:
                routing = _b.sent();
                res.json({
                    success: true,
                    routing: routing,
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _b.sent();
                logger_js_1.logger.error({ error: error_3 }, 'Failed to route request');
                res.status(500).json({
                    error: 'Failed to route request',
                    details: error_3 instanceof Error ? error_3.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/orchestration/health - Get system health
router.get('/health', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var health, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, orchestrationService.getSystemHealth()];
            case 1:
                health = _a.sent();
                res.json({
                    success: true,
                    health: health,
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                logger_js_1.logger.error({ error: error_4 }, 'Failed to get system health');
                res.status(500).json({
                    error: 'Failed to get system health',
                    details: error_4 instanceof Error ? error_4.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /api/orchestration/scaling/evaluate - Evaluate scaling decision
router.post('/scaling/evaluate', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, cpuUtilization, memoryUtilization, requestRate, decision, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, cpuUtilization = _a.cpuUtilization, memoryUtilization = _a.memoryUtilization, requestRate = _a.requestRate;
                if (cpuUtilization === undefined || memoryUtilization === undefined || requestRate === undefined) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'cpuUtilization, memoryUtilization, and requestRate are required'
                        })];
                }
                return [4 /*yield*/, orchestrationService.evaluateScaling({
                        cpuUtilization: cpuUtilization,
                        memoryUtilization: memoryUtilization,
                        requestRate: requestRate
                    })];
            case 1:
                decision = _b.sent();
                res.json({
                    success: true,
                    decision: decision,
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _b.sent();
                logger_js_1.logger.error({ error: error_5 }, 'Failed to evaluate scaling');
                res.status(500).json({
                    error: 'Failed to evaluate auto-scaling',
                    details: error_5 instanceof Error ? error_5.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /api/orchestration/failover/:nodeId - Execute failover
router.post('/failover/:nodeId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var nodeId, result, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                nodeId = req.params.nodeId;
                return [4 /*yield*/, orchestrationService.executeFailover(nodeId)];
            case 1:
                result = _a.sent();
                res.json({
                    success: result.success,
                    result: result,
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                logger_js_1.logger.error({ error: error_6 }, 'Failed to execute failover');
                res.status(500).json({
                    error: 'Failed to execute failover',
                    details: error_6 instanceof Error ? error_6.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/orchestration/metrics - Get orchestration metrics
router.get('/metrics', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var metrics, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, orchestrationService.getOrchestrationMetrics()];
            case 1:
                metrics = _a.sent();
                res.json({
                    success: true,
                    metrics: metrics,
                    timestamp: new Date().toISOString()
                });
                return [3 /*break*/, 3];
            case 2:
                error_7 = _a.sent();
                logger_js_1.logger.error({ error: error_7 }, 'Failed to get orchestration metrics');
                res.status(500).json({
                    error: 'Failed to retrieve orchestration metrics',
                    details: error_7 instanceof Error ? error_7.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// PUT /api/orchestration/config - Update configuration
router.put('/config', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var config, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                config = req.body;
                if (!config || Object.keys(config).length === 0) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Configuration object is required'
                        })];
                }
                return [4 /*yield*/, orchestrationService.updateConfiguration(config)];
            case 1:
                _a.sent();
                res.json({
                    success: true,
                    message: 'Configuration updated successfully'
                });
                return [3 /*break*/, 3];
            case 2:
                error_8 = _a.sent();
                logger_js_1.logger.error({ error: error_8 }, 'Failed to update configuration');
                res.status(500).json({
                    error: 'Failed to update configuration',
                    details: error_8 instanceof Error ? error_8.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
