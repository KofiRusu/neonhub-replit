import WebSocket from 'ws';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import { FederationError, FederationErrorCode, MessagePriority } from '../types';
export class WebSocketClient extends EventEmitter {
    constructor(nodeId, config, logger, authManager) {
        super();
        this.ws = null;
        this.reconnectAttempts = 0;
        this.reconnectTimer = null;
        this.isConnecting = false;
        this.lastHeartbeat = 0;
        this.heartbeatTimer = null;
        this.nodeId = nodeId;
        this.config = config;
        this.reconnectConfig = config.reconnect || {
            enabled: true,
            maxAttempts: 10,
            initialDelay: 1000,
            maxDelay: 30000,
            backoffMultiplier: 2
        };
        this.logger = logger;
        this.authManager = authManager;
    }
    async connect() {
        if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
            return;
        }
        this.isConnecting = true;
        try {
            const url = this.buildConnectionUrl();
            const wsOptions = {};
            // Configure TLS if enabled
            if (this.config.tls?.enabled) {
                wsOptions.cert = this.config.tls.certPath ? fs.readFileSync(this.config.tls.certPath) : undefined;
                wsOptions.key = this.config.tls.keyPath ? fs.readFileSync(this.config.tls.keyPath) : undefined;
                wsOptions.ca = this.config.tls.caPath ? fs.readFileSync(this.config.tls.caPath) : undefined;
                wsOptions.rejectUnauthorized = this.config.tls.rejectUnauthorized ?? true;
            }
            // Add authentication headers
            if (this.config.auth?.enabled) {
                wsOptions.headers = await this.getAuthHeaders();
            }
            this.ws = new WebSocket(url, wsOptions);
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    this.isConnecting = false;
                    reject(new FederationError(FederationErrorCode.CONNECTION_FAILED, 'Connection timeout'));
                }, 10000);
                this.ws.on('open', () => {
                    clearTimeout(timeout);
                    this.isConnecting = false;
                    this.reconnectAttempts = 0;
                    this.logger.info(`Connected to federation server at ${url}`);
                    this.startHeartbeat();
                    this.emit('connected');
                    resolve();
                });
                this.ws.on('message', (data) => {
                    this.handleMessage(data);
                });
                this.ws.on('close', (code, reason) => {
                    clearTimeout(timeout);
                    this.isConnecting = false;
                    this.logger.warn(`Connection closed: ${code} - ${reason}`);
                    this.stopHeartbeat();
                    this.emit('disconnected', code, reason.toString());
                    this.handleReconnection();
                });
                this.ws.on('error', (error) => {
                    clearTimeout(timeout);
                    this.isConnecting = false;
                    this.logger.error('WebSocket client error', error);
                    this.emit('error', error);
                    reject(error);
                });
            });
        }
        catch (error) {
            this.isConnecting = false;
            const message = error instanceof Error ? error.message : 'Unknown error';
            throw new FederationError(FederationErrorCode.CONNECTION_FAILED, message);
        }
    }
    buildConnectionUrl() {
        const protocol = this.config.tls?.enabled ? 'wss' : 'ws';
        return `${protocol}://${this.config.host}:${this.config.port}`;
    }
    async getAuthHeaders() {
        const headers = {};
        if (this.config.auth?.type === 'jwt') {
            const token = this.authManager.generateToken(this.nodeId);
            headers['Authorization'] = `Bearer ${token}`;
        }
        else if (this.config.auth?.type === 'api_key') {
            headers['X-API-Key'] = this.config.auth.apiKey;
        }
        return headers;
    }
    handleMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            this.logger.debug(`Received message: ${message.type}`);
            // Handle heartbeat
            if (message.type === 'heartbeat') {
                this.lastHeartbeat = Date.now();
                return;
            }
            this.emit('message', message);
        }
        catch (error) {
            this.logger.error('Error parsing message', error);
        }
    }
    handleReconnection() {
        if (!this.reconnectConfig.enabled || this.reconnectAttempts >= this.reconnectConfig.maxAttempts) {
            this.emit('reconnectionFailed');
            return;
        }
        this.reconnectAttempts++;
        const delay = Math.min(this.reconnectConfig.initialDelay * Math.pow(this.reconnectConfig.backoffMultiplier, this.reconnectAttempts - 1), this.reconnectConfig.maxDelay);
        this.logger.info(`Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.reconnectConfig.maxAttempts})`);
        this.reconnectTimer = setTimeout(() => {
            this.connect().catch(error => {
                this.logger.error('Reconnection failed', error);
            });
        }, delay);
    }
    startHeartbeat() {
        this.lastHeartbeat = Date.now();
        this.heartbeatTimer = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const heartbeatMessage = {
                    id: `heartbeat-${Date.now()}`,
                    type: 'heartbeat',
                    payload: { timestamp: Date.now() },
                    timestamp: Date.now(),
                    sourceNodeId: this.nodeId,
                    priority: MessagePriority.LOW,
                };
                this.send(heartbeatMessage);
            }
        }, 30000); // Send heartbeat every 30 seconds
    }
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
    send(message) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            this.logger.warn('Cannot send message: connection not open');
            return false;
        }
        try {
            this.ws.send(JSON.stringify(message));
            this.logger.debug(`Sent message: ${message.type}`);
            return true;
        }
        catch (error) {
            this.logger.error('Error sending message', error);
            return false;
        }
    }
    async disconnect() {
        this.stopHeartbeat();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.logger.info('WebSocket client disconnected');
    }
    isConnected() {
        return this.ws?.readyState === WebSocket.OPEN;
    }
    getReconnectAttempts() {
        return this.reconnectAttempts;
    }
}
//# sourceMappingURL=WebSocketClient.js.map