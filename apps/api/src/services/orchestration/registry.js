"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerAgent = registerAgent;
exports.getAgent = getAgent;
exports.listAgents = listAgents;
exports.unregisterAgent = unregisterAgent;
exports.clearRegistry = clearRegistry;
var logger_js_1 = require("../../lib/logger.js");
var handlers = new Map();
function registerAgent(name, handler, meta) {
    handlers.set(name, {
        name: name,
        handler: handler,
        registeredAt: new Date(),
        version: meta === null || meta === void 0 ? void 0 : meta.version,
        capabilities: meta === null || meta === void 0 ? void 0 : meta.capabilities
    });
    logger_js_1.logger.info({ agent: name, version: meta === null || meta === void 0 ? void 0 : meta.version }, "Agent registered with orchestrator");
}
function getAgent(name) {
    return handlers.get(name);
}
function listAgents() {
    return Array.from(handlers.values());
}
function unregisterAgent(name) {
    handlers.delete(name);
    logger_js_1.logger.info({ agent: name }, "Agent unregistered from orchestrator");
}
function clearRegistry() {
    handlers.clear();
}
