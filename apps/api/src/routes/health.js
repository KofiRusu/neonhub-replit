"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
exports.healthRouter = void 0;
var express_1 = require("express");
var prisma_js_1 = require("../db/prisma.js");
var index_js_1 = require("../ws/index.js");
// Health check types defined inline
var stripe_1 = require("stripe");
var openai_1 = require("openai");
var env_js_1 = require("../config/env.js");
var bootstrap_js_1 = require("../services/orchestration/bootstrap.js");
var registry_js_1 = require("../services/orchestration/registry.js");
var logger_js_1 = require("../lib/logger.js");
exports.healthRouter = (0, express_1.Router)();
// Health check helpers
function checkDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        var start, connected, latency, _error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    start = Date.now();
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, prisma_js_1.checkDatabaseConnection)()];
                case 2:
                    connected = _a.sent();
                    latency = Date.now() - start;
                    return [2 /*return*/, connected ? { status: "ok", latency: latency } : { status: "error" }];
                case 3:
                    _error_1 = _a.sent();
                    return [2 /*return*/, { status: "error" }];
                case 4: return [2 /*return*/];
            }
        });
    });
}
function checkStripe() {
    return __awaiter(this, void 0, void 0, function () {
        var stripe, _error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    if (!env_js_1.env.STRIPE_SECRET_KEY) {
                        return [2 /*return*/, { status: "not_configured" }];
                    }
                    stripe = new stripe_1.default(env_js_1.env.STRIPE_SECRET_KEY, { apiVersion: "2025-09-30.clover" });
                    return [4 /*yield*/, stripe.customers.list({ limit: 1 })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { status: "ok" }];
                case 2:
                    _error_2 = _a.sent();
                    return [2 /*return*/, { status: "error" }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function checkOpenAI() {
    return __awaiter(this, void 0, void 0, function () {
        var openai, _error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    if (!env_js_1.env.OPENAI_API_KEY) {
                        return [2 /*return*/, { status: "not_configured" }];
                    }
                    openai = new openai_1.default({ apiKey: env_js_1.env.OPENAI_API_KEY });
                    return [4 /*yield*/, openai.models.list()];
                case 1:
                    _a.sent();
                    return [2 /*return*/, { status: "ok" }];
                case 2:
                    _error_3 = _a.sent();
                    return [2 /*return*/, { status: "error" }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function checkWebSocket() {
    return __awaiter(this, void 0, void 0, function () {
        var io, sockets, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    io = (0, index_js_1.getIO)();
                    if (!io) {
                        return [2 /*return*/, { status: "error" }];
                    }
                    return [4 /*yield*/, io.fetchSockets()];
                case 1:
                    sockets = _b.sent();
                    return [2 /*return*/, { status: "ok", connections: sockets.length }];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, { status: "error" }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function checkVectorExtension() {
    return __awaiter(this, void 0, void 0, function () {
        var result, _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, prisma_js_1.prisma.$queryRaw(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      SELECT extversion AS version FROM pg_extension WHERE extname = 'vector'\n    "], ["\n      SELECT extversion AS version FROM pg_extension WHERE extname = 'vector'\n    "])))];
                case 1:
                    result = _b.sent();
                    if (Array.isArray(result) && result.length > 0) {
                        return [2 /*return*/, { status: "ok", version: result[0].version }];
                    }
                    return [2 /*return*/, { status: "missing" }];
                case 2:
                    _a = _b.sent();
                    return [2 /*return*/, { status: "error" }];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function checkAgents() {
    return __awaiter(this, void 0, void 0, function () {
        var agents;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, (0, bootstrap_js_1.ensureOrchestratorBootstrap)()];
                case 1:
                    _a.sent();
                    agents = (0, registry_js_1.listAgents)().map(function (agent) { return ({ name: agent.name, version: agent.version }); });
                    return [2 /*return*/, {
                            status: agents.length > 0 ? "ok" : "empty",
                            registered: agents.length,
                            agents: agents
                        }];
            }
        });
    });
}
exports.healthRouter.get("/health", function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, database, stripe, openai, websocket, vector, agents, checks, criticalServices, allOk, anyError, health, statusCode;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, Promise.all([
                    checkDatabase(),
                    checkStripe(),
                    checkOpenAI(),
                    checkWebSocket(),
                    checkVectorExtension(),
                    checkAgents()
                ])];
            case 1:
                _a = _b.sent(), database = _a[0], stripe = _a[1], openai = _a[2], websocket = _a[3], vector = _a[4], agents = _a[5];
                checks = {
                    database: database,
                    stripe: stripe,
                    openai: openai,
                    websocket: websocket,
                    vector: vector,
                    agents: agents
                };
                criticalServices = [database.status, websocket.status, vector.status];
                allOk = criticalServices.every(function (s) { return s === "ok"; });
                anyError = Object.values(checks).some(function (c) { return c.status === "error"; });
                health = {
                    status: allOk ? (anyError ? "degraded" : "healthy") : "unhealthy",
                    version: "3.2.0",
                    checks: checks,
                    timestamp: new Date().toISOString(),
                    uptime: process.uptime(),
                };
                statusCode = health.status === "healthy" ? 200 : health.status === "degraded" ? 200 : 503;
                res.status(statusCode).json(health);
                return [2 /*return*/];
        }
    });
}); });
// Lightweight readiness probe (for K8s/load balancers)
exports.healthRouter.get("/readyz", function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var dbConnected, vectorResult, pgvector, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, (0, prisma_js_1.checkDatabaseConnection)()];
            case 1:
                dbConnected = _a.sent();
                if (!dbConnected) {
                    return [2 /*return*/, res.status(503).json({
                            ok: false,
                            error: "database_unreachable",
                            timestamp: new Date().toISOString()
                        })];
                }
                return [4 /*yield*/, prisma_js_1.prisma.$queryRaw(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      SELECT extname FROM pg_extension WHERE extname = 'vector'\n    "], ["\n      SELECT extname FROM pg_extension WHERE extname = 'vector'\n    "])))];
            case 2:
                vectorResult = _a.sent();
                pgvector = Array.isArray(vectorResult) && vectorResult.length > 0;
                if (!pgvector) {
                    return [2 /*return*/, res.status(503).json({
                            ok: false,
                            error: "pgvector_missing",
                            timestamp: new Date().toISOString()
                        })];
                }
                // All good
                return [2 /*return*/, res.status(200).json({
                        ok: true,
                        pgvector: true,
                        timestamp: new Date().toISOString()
                    })];
            case 3:
                error_1 = _a.sent();
                logger_js_1.logger.error({ error: error_1 }, "Readiness check failed");
                return [2 /*return*/, res.status(503).json({
                        ok: false,
                        error: "internal_error",
                        timestamp: new Date().toISOString()
                    })];
            case 4: return [2 /*return*/];
        }
    });
}); });
var templateObject_1, templateObject_2;
