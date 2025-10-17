"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisLogger = exports.ConsoleLogger = exports.ConfigurationManager = exports.FailoverService = exports.AutoScalingService = exports.IntelligentRoutingService = exports.HealthMonitoringService = exports.NodeDiscoveryService = exports.GlobalOrchestratorManager = void 0;
// Main exports for the Global Orchestrator module
var GlobalOrchestratorManager_1 = require("./core/GlobalOrchestratorManager");
Object.defineProperty(exports, "GlobalOrchestratorManager", { enumerable: true, get: function () { return GlobalOrchestratorManager_1.GlobalOrchestratorManager; } });
// Service exports
var NodeDiscoveryService_1 = require("./services/NodeDiscoveryService");
Object.defineProperty(exports, "NodeDiscoveryService", { enumerable: true, get: function () { return NodeDiscoveryService_1.NodeDiscoveryService; } });
var HealthMonitoringService_1 = require("./services/HealthMonitoringService");
Object.defineProperty(exports, "HealthMonitoringService", { enumerable: true, get: function () { return HealthMonitoringService_1.HealthMonitoringService; } });
var IntelligentRoutingService_1 = require("./services/IntelligentRoutingService");
Object.defineProperty(exports, "IntelligentRoutingService", { enumerable: true, get: function () { return IntelligentRoutingService_1.IntelligentRoutingService; } });
var AutoScalingService_1 = require("./services/AutoScalingService");
Object.defineProperty(exports, "AutoScalingService", { enumerable: true, get: function () { return AutoScalingService_1.AutoScalingService; } });
var FailoverService_1 = require("./services/FailoverService");
Object.defineProperty(exports, "FailoverService", { enumerable: true, get: function () { return FailoverService_1.FailoverService; } });
var ConfigurationManager_1 = require("./services/ConfigurationManager");
Object.defineProperty(exports, "ConfigurationManager", { enumerable: true, get: function () { return ConfigurationManager_1.ConfigurationManager; } });
// Utility exports
var Logger_1 = require("./utils/Logger");
Object.defineProperty(exports, "ConsoleLogger", { enumerable: true, get: function () { return Logger_1.ConsoleLogger; } });
Object.defineProperty(exports, "RedisLogger", { enumerable: true, get: function () { return Logger_1.RedisLogger; } });
// Type exports
__exportStar(require("./types"), exports);
//# sourceMappingURL=index.js.map