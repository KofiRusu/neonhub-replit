"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectionPool = void 0;
const events_1 = require("events");
const types_1 = require("../types");
const WebSocketClient_1 = require("../websocket/WebSocketClient");
const GRPCClient_1 = require("../grpc/GRPCClient");
class ConnectionPool extends events_1.EventEmitter {
    constructor(config, connectionConfig, logger, authManager) {
        super();
        this.connections = new Map();
        this.availableConnections = new Set();
        this.waitingQueue = [];
        this.config = config;
        this.logger = logger;
        this.authManager = authManager;
    }
    async getConnection(nodeId) {
        // Check for available connection
        const availableConnection = this.findAvailableConnection(nodeId);
        if (availableConnection) {
            return availableConnection;
        }
        // Check if we can create a new connection
        if (this.connections.size < this.config.maxConnections) {
            return this.createConnection(nodeId);
        }
        // Wait for an available connection
        return this.waitForConnection(nodeId);
    }
    findAvailableConnection(nodeId) {
        for (const connectionId of this.availableConnections) {
            const connection = this.connections.get(connectionId);
            if (connection && connection.nodeId === nodeId && connection.active) {
                this.availableConnections.delete(connectionId);
                connection.lastUsed = Date.now();
                return connection;
            }
        }
        return null;
    }
    async createConnection(nodeId) {
        const connectionId = `${nodeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const connection = {
            id: connectionId,
            nodeId,
            lastUsed: Date.now(),
            created: Date.now(),
            active: true,
        };
        try {
            // Create WebSocket client
            connection.wsClient = new WebSocketClient_1.WebSocketClient(nodeId, {
                host: 'localhost', // This would be configured per node
                port: 8080,
                tls: { enabled: false },
                auth: { enabled: false, type: 'jwt' },
                reconnect: { enabled: true, maxAttempts: 5, initialDelay: 1000, maxDelay: 10000, backoffMultiplier: 2 }
            }, this.logger, this.authManager);
            // Create gRPC client
            connection.grpcClient = new GRPCClient_1.GRPCClient(nodeId, {
                host: 'localhost', // This would be configured per node
                port: 9090,
                tls: { enabled: false }
            }, this.logger);
            // Connect clients
            await Promise.all([
                connection.wsClient.connect(),
                connection.grpcClient.connect()
            ]);
            this.connections.set(connectionId, connection);
            this.logger.info(`Created new connection ${connectionId} for node ${nodeId}`);
            return connection;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to create connection for node ${nodeId}`, error);
            throw new types_1.FederationError(types_1.FederationErrorCode.CONNECTION_FAILED, message);
        }
    }
    waitForConnection(nodeId) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                // Remove from queue
                const index = this.waitingQueue.findIndex(item => item.timeout === timeout);
                if (index !== -1) {
                    this.waitingQueue.splice(index, 1);
                }
                reject(new types_1.FederationError(types_1.FederationErrorCode.POOL_EXHAUSTED, 'Connection pool exhausted'));
            }, this.config.acquireTimeout);
            this.waitingQueue.push({ resolve, reject, timeout });
        });
    }
    releaseConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            connection.lastUsed = Date.now();
            this.availableConnections.add(connectionId);
            // Notify waiting requests
            if (this.waitingQueue.length > 0) {
                const waiting = this.waitingQueue.shift();
                if (waiting) {
                    clearTimeout(waiting.timeout);
                    waiting.resolve(connection);
                }
            }
            this.logger.debug(`Released connection ${connectionId}`);
        }
    }
    async removeConnection(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            connection.active = false;
            this.availableConnections.delete(connectionId);
            // Close clients
            try {
                await Promise.all([
                    connection.wsClient?.disconnect(),
                    connection.grpcClient?.disconnect()
                ]);
            }
            catch (error) {
                this.logger.error(`Error closing connection ${connectionId}`, error);
            }
            this.connections.delete(connectionId);
            this.logger.info(`Removed connection ${connectionId}`);
        }
    }
    async cleanup() {
        const now = Date.now();
        const idleTimeout = this.config.idleTimeout;
        for (const [connectionId, connection] of this.connections) {
            if (now - connection.lastUsed > idleTimeout) {
                await this.removeConnection(connectionId);
            }
        }
    }
    getStats() {
        return {
            total: this.connections.size,
            active: Array.from(this.connections.values()).filter(c => c.active).length,
            available: this.availableConnections.size,
            waiting: this.waitingQueue.length,
        };
    }
    async shutdown() {
        // Reject all waiting requests
        for (const waiting of this.waitingQueue) {
            clearTimeout(waiting.timeout);
            waiting.reject(new types_1.FederationError(types_1.FederationErrorCode.CONNECTION_FAILED, 'Pool shutting down'));
        }
        this.waitingQueue = [];
        // Close all connections
        const closePromises = Array.from(this.connections.keys()).map(id => this.removeConnection(id));
        await Promise.all(closePromises);
        this.logger.info('Connection pool shut down');
    }
}
exports.ConnectionPool = ConnectionPool;
//# sourceMappingURL=ConnectionPool.js.map