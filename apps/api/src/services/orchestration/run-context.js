"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runWithAgentContext = runWithAgentContext;
exports.getAgentRunContext = getAgentRunContext;
var node_async_hooks_1 = require("node:async_hooks");
var agentRunContext = new node_async_hooks_1.AsyncLocalStorage();
function runWithAgentContext(ctx, executor) {
    return agentRunContext.run(ctx, executor);
}
function getAgentRunContext() {
    return agentRunContext.getStore();
}
