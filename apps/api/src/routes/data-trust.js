"use strict";
/**
 * Data Trust API Routes
 * Endpoints for data provenance, integrity verification, and audit trails
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
var dataTrustService = require("../services/data-trust/index.js");
var logger_js_1 = require("../lib/logger.js");
var router = (0, express_1.Router)();
// POST /api/data-trust/hash - Hash data
router.post('/hash', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var data, result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                data = req.body.data;
                if (!data) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Data is required'
                        })];
                }
                return [4 /*yield*/, dataTrustService.hashData(data)];
            case 1:
                result = _a.sent();
                res.json({
                    success: true,
                    hash: result.hash,
                    algorithm: result.algorithm,
                    timestamp: result.timestamp
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                logger_js_1.logger.error({ error: error_1 }, 'Failed to hash data');
                res.status(500).json({
                    error: 'Failed to hash data',
                    details: error_1 instanceof Error ? error_1.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /api/data-trust/verify - Verify data integrity
router.post('/verify', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, data, expectedHash, result, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, data = _a.data, expectedHash = _a.expectedHash;
                if (!data || !expectedHash) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Data and expectedHash are required'
                        })];
                }
                return [4 /*yield*/, dataTrustService.verifyIntegrity(data, expectedHash)];
            case 1:
                result = _b.sent();
                res.json({
                    success: true,
                    isValid: result.isValid,
                    actualHash: result.actualHash,
                    message: result.message
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                logger_js_1.logger.error({ error: error_2 }, 'Failed to verify integrity');
                res.status(500).json({
                    error: 'Failed to verify data integrity',
                    details: error_2 instanceof Error ? error_2.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /api/data-trust/provenance/track - Track provenance event
router.post('/provenance/track', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, eventType, dataId, actor, action, metadata, result, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, eventType = _a.eventType, dataId = _a.dataId, actor = _a.actor, action = _a.action, metadata = _a.metadata;
                if (!eventType || !dataId || !actor || !action) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'eventType, dataId, actor, and action are required'
                        })];
                }
                return [4 /*yield*/, dataTrustService.trackProvenance({
                        eventType: eventType,
                        dataId: dataId,
                        actor: actor,
                        action: action,
                        metadata: metadata
                    })];
            case 1:
                result = _b.sent();
                res.json({
                    success: true,
                    eventId: result.eventId,
                    timestamp: result.timestamp,
                    hash: result.hash
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _b.sent();
                logger_js_1.logger.error({ error: error_3 }, 'Failed to track provenance');
                res.status(500).json({
                    error: 'Failed to track provenance event',
                    details: error_3 instanceof Error ? error_3.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/data-trust/provenance/:dataId - Get provenance history
router.get('/provenance/:dataId', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var dataId, history_1, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                dataId = req.params.dataId;
                return [4 /*yield*/, dataTrustService.getProvenanceHistory(dataId)];
            case 1:
                history_1 = _a.sent();
                res.json({
                    success: true,
                    dataId: dataId,
                    history: history_1,
                    count: history_1.length
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                logger_js_1.logger.error({ error: error_4 }, 'Failed to get provenance history');
                res.status(500).json({
                    error: 'Failed to retrieve provenance history',
                    details: error_4 instanceof Error ? error_4.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/data-trust/provenance/:dataId/verify - Verify provenance chain
router.get('/provenance/:dataId/verify', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var dataId, result, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                dataId = req.params.dataId;
                return [4 /*yield*/, dataTrustService.verifyProvenanceChain(dataId)];
            case 1:
                result = _a.sent();
                res.json({
                    success: true,
                    dataId: dataId,
                    isValid: result.isValid,
                    eventCount: result.eventCount,
                    message: result.message
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                logger_js_1.logger.error({ error: error_5 }, 'Failed to verify provenance chain');
                res.status(500).json({
                    error: 'Failed to verify provenance chain',
                    details: error_5 instanceof Error ? error_5.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /api/data-trust/merkle - Create Merkle tree
router.post('/merkle', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var items, result, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                items = req.body.items;
                if (!items || !Array.isArray(items)) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Items array is required'
                        })];
                }
                return [4 /*yield*/, dataTrustService.createMerkleTree(items)];
            case 1:
                result = _a.sent();
                res.json({
                    success: true,
                    root: result.root,
                    leafCount: result.leafCount
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                logger_js_1.logger.error({ error: error_6 }, 'Failed to create Merkle tree');
                res.status(500).json({
                    error: 'Failed to create Merkle tree',
                    details: error_6 instanceof Error ? error_6.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /api/data-trust/audit/log - Log audit event
router.post('/audit/log', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, level, category, action, userId, metadata, error_7;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, level = _a.level, category = _a.category, action = _a.action, userId = _a.userId, metadata = _a.metadata;
                if (!level || !category || !action) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'level, category, and action are required'
                        })];
                }
                return [4 /*yield*/, dataTrustService.logAudit({ level: level, category: category, action: action, userId: userId, metadata: metadata })];
            case 1:
                _b.sent();
                res.json({
                    success: true,
                    message: 'Audit event logged successfully'
                });
                return [3 /*break*/, 3];
            case 2:
                error_7 = _b.sent();
                logger_js_1.logger.error({ error: error_7 }, 'Failed to log audit event');
                res.status(500).json({
                    error: 'Failed to log audit event',
                    details: error_7 instanceof Error ? error_7.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/data-trust/audit/logs - Query audit logs
router.get('/audit/logs', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, startDate, endDate, level, category, userId, query, logs, error_8;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.query, startDate = _a.startDate, endDate = _a.endDate, level = _a.level, category = _a.category, userId = _a.userId;
                query = {};
                if (startDate)
                    query.startDate = new Date(startDate);
                if (endDate)
                    query.endDate = new Date(endDate);
                if (level)
                    query.level = level;
                if (category)
                    query.category = category;
                if (userId)
                    query.userId = userId;
                return [4 /*yield*/, dataTrustService.queryAuditLogs(query)];
            case 1:
                logs = _b.sent();
                res.json({
                    success: true,
                    logs: logs,
                    count: logs.length
                });
                return [3 /*break*/, 3];
            case 2:
                error_8 = _b.sent();
                logger_js_1.logger.error({ error: error_8 }, 'Failed to query audit logs');
                res.status(500).json({
                    error: 'Failed to query audit logs',
                    details: error_8 instanceof Error ? error_8.message : 'Unknown error'
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/data-trust/status - Get system status
router.get('/status', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var status_1;
    return __generator(this, function (_a) {
        try {
            status_1 = dataTrustService.getSystemStatus();
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
