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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebSocketServer = void 0;
const ws_1 = __importDefault(require("ws"));
const events_1 = require("events");
const tls = __importStar(require("tls"));
const fs = __importStar(require("fs"));
const types_1 = require("../types");
class WebSocketServer extends events_1.EventEmitter {
    constructor(config, logger, authManager) {
        super();
        this.wss = null;
        this.connections = new Map();
        this.nodeRegistry = new Map();
        this.config = config;
        this.logger = logger;
        this.authManager = authManager;
    }
    async start() {
        try {
            const serverOptions = {
                port: this.config.port,
                host: this.config.host,
            };
            // Configure TLS if enabled
            if (this.config.tls?.enabled) {
                serverOptions.server = this.createTLSServer();
            }
            this.wss = new ws_1.default.Server(serverOptions);
            this.wss.on('connection', (ws, request) => {
                this.handleConnection(ws, request);
            });
            this.wss.on('error', (error) => {
                this.logger.error('WebSocket server error', error);
                this.emit('error', new types_1.FederationError(types_1.FederationErrorCode.CONNECTION_FAILED, error.message));
            });
            this.logger.info(`WebSocket server started on ${this.config.host}:${this.config.port}`);
        }
        catch (error) {
            this.logger.error('Failed to start WebSocket server', error);
            throw new types_1.FederationError(types_1.FederationErrorCode.CONNECTION_FAILED, error instanceof Error ? error.message : 'Unknown error');
        }
    }
    createTLSServer() {
        if (!this.config.tls) {
            throw new Error('TLS config not provided');
        }
        const options = {
            cert: fs.readFileSync(this.config.tls.certPath),
            key: fs.readFileSync(this.config.tls.keyPath),
            ca: this.config.tls.caPath ? fs.readFileSync(this.config.tls.caPath) : undefined,
            requestCert: true,
            rejectUnauthorized: this.config.tls.rejectUnauthorized ?? true,
        };
        return tls.createServer(options);
    }
    async handleConnection(ws, request) {
        try {
            // Authenticate the connection
            const authResult = await this.authenticateConnection(request);
            if (!authResult.success) {
                ws.close(1008, 'Authentication failed');
                return;
            }
            const nodeId = authResult.nodeId;
            this.connections.set(nodeId, ws);
            // Register node
            const nodeInfo = {
                nodeId,
                address: request.socket.remoteAddress,
                port: request.socket.remotePort,
                capabilities: [],
                status: types_1.NodeStatus.ONLINE,
                lastSeen: Date.now(),
            };
            this.nodeRegistry.set(nodeId, nodeInfo);
            this.logger.info(`Node ${nodeId} connected`);
            ws.on('message', (data) => {
                this.handleMessage(nodeId, data);
            });
            ws.on('close', () => {
                this.handleDisconnection(nodeId);
            });
            ws.on('error', (error) => {
                this.logger.error(`WebSocket error for node ${nodeId}`, error);
                this.handleDisconnection(nodeId);
            });
            // Send welcome message
            this.sendToNode(nodeId, {
                id: `welcome-${Date.now()}`,
                type: types_1.FederationMessageType.COORDINATION,
                payload: { message: 'Connected to federation network' },
                timestamp: Date.now(),
                sourceNodeId: 'server',
                priority: types_1.MessagePriority.NORMAL,
            });
            this.emit('nodeConnected', nodeInfo);
        }
        catch (error) {
            this.logger.error('Error handling connection', error);
            ws.close(1011, 'Internal server error');
        }
    }
    async authenticateConnection(request) {
        if (!this.config.auth?.enabled) {
            return { success: true, nodeId: `node-${Date.now()}` };
        }
        try {
            const authResult = await this.authManager.authenticate(request);
            return authResult;
        }
        catch (error) {
            this.logger.error('Authentication error', error);
            return { success: false };
        }
    }
    handleMessage(nodeId, data) {
        try {
            const message = JSON.parse(data.toString());
            // Update node last seen
            const nodeInfo = this.nodeRegistry.get(nodeId);
            if (nodeInfo) {
                nodeInfo.lastSeen = Date.now();
            }
            this.logger.debug(`Received message from ${nodeId}: ${message.type}`);
            // Validate message
            if (!this.validateMessage(message)) {
                this.sendError(nodeId, types_1.FederationErrorCode.INVALID_MESSAGE, 'Invalid message format');
                return;
            }
            this.emit('message', message);
        }
        catch (error) {
            this.logger.error(`Error parsing message from ${nodeId}`, error);
            this.sendError(nodeId, types_1.FederationErrorCode.INVALID_MESSAGE, 'Failed to parse message');
        }
    }
    validateMessage(message) {
        return !!(message.id &&
            message.type &&
            message.timestamp &&
            message.sourceNodeId &&
            typeof message.priority === 'number');
    }
    handleDisconnection(nodeId) {
        this.connections.delete(nodeId);
        const nodeInfo = this.nodeRegistry.get(nodeId);
        if (nodeInfo) {
            nodeInfo.status = types_1.NodeStatus.OFFLINE;
            this.emit('nodeDisconnected', nodeInfo);
        }
        this.logger.info(`Node ${nodeId} disconnected`);
    }
    sendToNode(nodeId, message) {
        const ws = this.connections.get(nodeId);
        if (!ws || ws.readyState !== ws_1.default.OPEN) {
            this.logger.warn(`Cannot send message to ${nodeId}: connection not available`);
            return false;
        }
        try {
            ws.send(JSON.stringify(message));
            this.logger.debug(`Sent message to ${nodeId}: ${message.type}`);
            return true;
        }
        catch (error) {
            this.logger.error(`Error sending message to ${nodeId}`, error);
            return false;
        }
    }
    broadcast(message, excludeNodeId) {
        for (const [nodeId, ws] of this.connections) {
            if (nodeId !== excludeNodeId && ws.readyState === ws_1.default.OPEN) {
                this.sendToNode(nodeId, message);
            }
        }
    }
    sendError(nodeId, code, message) {
        const errorMessage = {
            id: `error-${Date.now()}`,
            type: types_1.FederationMessageType.ERROR_REPORT,
            payload: { code, message },
            timestamp: Date.now(),
            sourceNodeId: 'server',
            priority: types_1.MessagePriority.HIGH,
        };
        this.sendToNode(nodeId, errorMessage);
    }
    getConnectedNodes() {
        return Array.from(this.nodeRegistry.values()).filter(node => node.status === types_1.NodeStatus.ONLINE);
    }
    async stop() {
        if (this.wss) {
            this.wss.close();
            this.wss = null;
        }
        this.connections.clear();
        this.nodeRegistry.clear();
        this.logger.info('WebSocket server stopped');
    }
}
exports.WebSocketServer = WebSocketServer;
//# sourceMappingURL=WebSocketServer.js.map