import WebSocket from 'ws';
import { EventEmitter } from 'events';
import * as tls from 'tls';
import * as fs from 'fs';
import { FederationMessageType, FederationError, FederationErrorCode, NodeStatus, MessagePriority } from '../types';
export class WebSocketServer extends EventEmitter {
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
            this.wss = new WebSocket.Server(serverOptions);
            this.wss.on('connection', (ws, request) => {
                this.handleConnection(ws, request);
            });
            this.wss.on('error', (error) => {
                this.logger.error('WebSocket server error', error);
                this.emit('error', new FederationError(FederationErrorCode.CONNECTION_FAILED, error.message));
            });
            this.logger.info(`WebSocket server started on ${this.config.host}:${this.config.port}`);
        }
        catch (error) {
            this.logger.error('Failed to start WebSocket server', error);
            throw new FederationError(FederationErrorCode.CONNECTION_FAILED, error instanceof Error ? error.message : 'Unknown error');
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
                status: NodeStatus.ONLINE,
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
                type: FederationMessageType.COORDINATION,
                payload: { message: 'Connected to federation network' },
                timestamp: Date.now(),
                sourceNodeId: 'server',
                priority: MessagePriority.NORMAL,
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
                this.sendError(nodeId, FederationErrorCode.INVALID_MESSAGE, 'Invalid message format');
                return;
            }
            this.emit('message', message);
        }
        catch (error) {
            this.logger.error(`Error parsing message from ${nodeId}`, error);
            this.sendError(nodeId, FederationErrorCode.INVALID_MESSAGE, 'Failed to parse message');
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
            nodeInfo.status = NodeStatus.OFFLINE;
            this.emit('nodeDisconnected', nodeInfo);
        }
        this.logger.info(`Node ${nodeId} disconnected`);
    }
    sendToNode(nodeId, message) {
        const ws = this.connections.get(nodeId);
        if (!ws || ws.readyState !== WebSocket.OPEN) {
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
            if (nodeId !== excludeNodeId && ws.readyState === WebSocket.OPEN) {
                this.sendToNode(nodeId, message);
            }
        }
    }
    sendError(nodeId, code, message) {
        const errorMessage = {
            id: `error-${Date.now()}`,
            type: FederationMessageType.ERROR_REPORT,
            payload: { code, message },
            timestamp: Date.now(),
            sourceNodeId: 'server',
            priority: MessagePriority.HIGH,
        };
        this.sendToNode(nodeId, errorMessage);
    }
    getConnectedNodes() {
        return Array.from(this.nodeRegistry.values()).filter(node => node.status === NodeStatus.ONLINE);
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
//# sourceMappingURL=WebSocketServer.js.map