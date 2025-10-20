import WebSocket from 'ws';
import { EventEmitter } from 'events';
import * as tls from 'tls';
import * as fs from 'fs';
import {
  FederationMessage,
  ConnectionConfig,
  ReconnectConfig,
  FederationError,
  FederationErrorCode,
  MessagePriority
} from '../types';
import { Logger } from '../utils/Logger';
import { AuthManager } from '../auth/AuthManager';

export class WebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: ConnectionConfig;
  private reconnectConfig: ReconnectConfig;
  private logger: Logger;
  private authManager: AuthManager;
  private nodeId: string;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private lastHeartbeat = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(
    nodeId: string,
    config: ConnectionConfig,
    logger: Logger,
    authManager: AuthManager
  ) {
    super();
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

  async connect(): Promise<void> {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;

    try {
      const url = this.buildConnectionUrl();
      const wsOptions: WebSocket.ClientOptions = {};

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

        this.ws!.on('open', () => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.logger.info(`Connected to federation server at ${url}`);
          this.startHeartbeat();
          this.emit('connected');
          resolve();
        });

        this.ws!.on('message', (data: Buffer) => {
          this.handleMessage(data);
        });

        this.ws!.on('close', (code, reason) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.logger.warn(`Connection closed: ${code} - ${reason}`);
          this.stopHeartbeat();
          this.emit('disconnected', code, reason.toString());
          this.handleReconnection();
        });

        this.ws!.on('error', (error) => {
          clearTimeout(timeout);
          this.isConnecting = false;
          this.logger.error('WebSocket client error', error);
          this.emit('error', error);
          reject(error);
        });
      });
    } catch (error) {
      this.isConnecting = false;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new FederationError(FederationErrorCode.CONNECTION_FAILED, message);
    }
  }

  private buildConnectionUrl(): string {
    const protocol = this.config.tls?.enabled ? 'wss' : 'ws';
    return `${protocol}://${this.config.host}:${this.config.port}`;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {};

    if (this.config.auth?.type === 'jwt') {
      const token = this.authManager.generateToken(this.nodeId);
      headers['Authorization'] = `Bearer ${token}`;
    } else if (this.config.auth?.type === 'api_key') {
      headers['X-API-Key'] = this.config.auth.apiKey!;
    }

    return headers;
  }

  private handleMessage(data: Buffer): void {
    try {
      const message: FederationMessage = JSON.parse(data.toString());
      this.logger.debug(`Received message: ${message.type}`);

      // Handle heartbeat
      if (message.type === 'heartbeat') {
        this.lastHeartbeat = Date.now();
        return;
      }

      this.emit('message', message);
    } catch (error) {
      this.logger.error('Error parsing message', error);
    }
  }

  private handleReconnection(): void {
    if (!this.reconnectConfig.enabled || this.reconnectAttempts >= this.reconnectConfig.maxAttempts) {
      this.emit('reconnectionFailed');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectConfig.initialDelay * Math.pow(this.reconnectConfig.backoffMultiplier, this.reconnectAttempts - 1),
      this.reconnectConfig.maxDelay
    );

    this.logger.info(`Attempting reconnection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.reconnectConfig.maxAttempts})`);

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch(error => {
        this.logger.error('Reconnection failed', error);
      });
    }, delay);
  }

  private startHeartbeat(): void {
    this.lastHeartbeat = Date.now();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const heartbeatMessage: FederationMessage = {
          id: `heartbeat-${Date.now()}`,
          type: 'heartbeat' as any,
          payload: { timestamp: Date.now() },
          timestamp: Date.now(),
          sourceNodeId: this.nodeId,
          priority: MessagePriority.LOW,
        };
        this.send(heartbeatMessage);
      }
    }, 30000); // Send heartbeat every 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  send(message: FederationMessage): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.logger.warn('Cannot send message: connection not open');
      return false;
    }

    try {
      this.ws.send(JSON.stringify(message));
      this.logger.debug(`Sent message: ${message.type}`);
      return true;
    } catch (error) {
      this.logger.error('Error sending message', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
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

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }
}