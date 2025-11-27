"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initWebSocket = initWebSocket;
exports.getIO = getIO;
exports.broadcast = broadcast;
exports.broadcastToCampaign = broadcastToCampaign;
exports.broadcastMigration = broadcastMigration;
exports.broadcastMetrics = broadcastMetrics;
exports.broadcastDeployment = broadcastDeployment;
var socket_io_1 = require("socket.io");
var logger_js_1 = require("../lib/logger.js");
var io = null;
function initWebSocket(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: process.env.NEXTAUTH_URL || "http://127.0.0.1:3000",
            methods: ["GET", "POST"],
        },
    });
    io.on("connection", function (socket) {
        logger_js_1.logger.info({ socketId: socket.id }, "Client connected");
        // Subscribe to campaign updates
        socket.on("subscribe:campaign", function (campaignId) {
            socket.join("campaign:".concat(campaignId));
            logger_js_1.logger.debug({ socketId: socket.id, campaignId: campaignId }, "Subscribed to campaign");
        });
        socket.on("unsubscribe:campaign", function (campaignId) {
            socket.leave("campaign:".concat(campaignId));
            logger_js_1.logger.debug({ socketId: socket.id, campaignId: campaignId }, "Unsubscribed from campaign");
        });
        // Migration monitoring subscriptions
        socket.on("subscribe:migration", function () {
            socket.join("migration");
            socket.emit("migration:status", { phase: "ready", timestamp: new Date() });
            logger_js_1.logger.debug({ socketId: socket.id }, "Subscribed to migration updates");
        });
        socket.on("unsubscribe:migration", function () {
            socket.leave("migration");
            logger_js_1.logger.debug({ socketId: socket.id }, "Unsubscribed from migration updates");
        });
        // Real-time metrics subscription
        socket.on("subscribe:metrics", function () {
            socket.join("metrics");
            logger_js_1.logger.debug({ socketId: socket.id }, "Subscribed to metrics");
        });
        socket.on("unsubscribe:metrics", function () {
            socket.leave("metrics");
            logger_js_1.logger.debug({ socketId: socket.id }, "Unsubscribed from metrics");
        });
        // Deployment monitoring subscription
        socket.on("subscribe:deployment", function () {
            socket.join("deployment");
            socket.emit("deployment:status", { status: "ready", timestamp: new Date() });
            logger_js_1.logger.debug({ socketId: socket.id }, "Subscribed to deployment updates");
        });
        socket.on("disconnect", function () {
            logger_js_1.logger.info({ socketId: socket.id }, "Client disconnected");
        });
    });
    return io;
}
function getIO() {
    if (!io) {
        throw new Error("WebSocket not initialized. Call initWebSocket first.");
    }
    return io;
}
function broadcast(event, data) {
    try {
        var socket = getIO();
        socket.emit(event, data);
        logger_js_1.logger.debug({ event: event, data: data }, "Broadcast event");
    }
    catch (error) {
        logger_js_1.logger.error({ error: error, event: event }, "Failed to broadcast event");
    }
}
function broadcastToCampaign(campaignId, event, data) {
    try {
        var socket = getIO();
        socket.to("campaign:".concat(campaignId)).emit(event, data);
        logger_js_1.logger.debug({ campaignId: campaignId, event: event, data: data }, "Broadcast to campaign");
    }
    catch (error) {
        logger_js_1.logger.error({ error: error, campaignId: campaignId, event: event }, "Failed to broadcast to campaign");
    }
}
// Broadcast migration events to subscribed clients
function broadcastMigration(event, data) {
    try {
        var socket = getIO();
        socket.to("migration").emit(event, __assign(__assign({}, data), { timestamp: new Date() }));
        logger_js_1.logger.info({ event: event, data: data }, "Migration event broadcast");
    }
    catch (error) {
        logger_js_1.logger.error({ error: error, event: event }, "Failed to broadcast migration event");
    }
}
// Broadcast metrics to subscribed clients
function broadcastMetrics(data) {
    try {
        var socket = getIO();
        socket.to("metrics").emit("metrics:update", __assign(__assign({}, data), { timestamp: new Date() }));
    }
    catch (error) {
        logger_js_1.logger.error({ error: error }, "Failed to broadcast metrics");
    }
}
// Broadcast deployment events
function broadcastDeployment(event, data) {
    try {
        var socket = getIO();
        socket.to("deployment").emit(event, __assign(__assign({}, data), { timestamp: new Date() }));
        logger_js_1.logger.info({ event: event, data: data }, "Deployment event broadcast");
    }
    catch (error) {
        logger_js_1.logger.error({ error: error, event: event }, "Failed to broadcast deployment event");
    }
}
