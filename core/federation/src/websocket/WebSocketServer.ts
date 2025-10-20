import WebSocket from 'ws';
import { EventEmitter } from 'events';
import * as tls from 'tls';
import * as fs from 'fs';
import {
  FederationMessage,
  FederationMessageType,
  ConnectionConfig,
  TLSConfig,
  AuthConfig,
  FederationError,
  FederationErrorCode,
  NodeInfo,
  NodeStatus,
  MessagePriority
} from '../types';
import { Logger } from '../utils/Logger';
import { AuthManager } from '../auth/AuthManager';

export class WebSocketServer extends EventEmitter {
  private wss: WebSocket.Server | null = null;
  private config: ConnectionConfig;
  private logger: Logger;
  private authManager: AuthManager;
  private connections: Map<string, WebSocket> = new Map();
  private nodeRegistry: Map<string, NodeInfo> = new Map();

  constructor(config: ConnectionConfig, logger: Logger, authManager: AuthManager) {
    super();
    this.config = config;
    this.logger = logger;
    this.authManager = authManager;
  }

  async start(): Promise<void> {
    try {
      const serverOptions: WebSocket.ServerOptions = {
        port: this.config.port,
        host: this.config.host,
      };

      // Configure TLS if enabled
      if (this.config.tls?.enabled) {
        serverOptions.server = this.createTLSServer() as any;
      }

      this.wss = new WebSocket.Server(serverOptions);

      this.wss.on('connection', (ws: WebSocket, request) => {
        this.handleConnection(ws, request);
      });

      this.wss.on('error', (error) => {
        this.logger.error('WebSocket server error', error);
        this.emit('error', new FederationError(FederationErrorCode.CONNECTION_FAILED, error.message));
      });

      this.logger.info(`WebSocket server started on ${this.config.host}:${this.config.port}`);
    } catch (error) {
      this.logger.error('Failed to start WebSocket server', error);
      throw new FederationError(FederationErrorCode.CONNECTION_FAILED, error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private createTLSServer(): tls.Server {
    if (!this.config.tls) {
      throw new Error('TLS config not provided');
    }

    const options: tls.TlsOptions = {
      cert: fs.readFileSync(this.config.tls.certPath!),
      key: fs.readFileSync(this.config.tls.keyPath!),
      ca: this.config.tls.caPath ? fs.readFileSync(this.config.tls.caPath) : undefined,
      requestCert: true,
      rejectUnauthorized: this.config.tls.rejectUnauthorized ?? true,
    };

    return tls.createServer(options);
  }

  private async handleConnection(ws: WebSocket, request: any): Promise<void> {
    try {
      // Authenticate the connection
      const authResult = await this.authenticateConnection(request);
      if (!authResult.success) {
        ws.close(1008, 'Authentication failed');
        return;
      }

      const nodeId = authResult.nodeId!;
      this.connections.set(nodeId, ws);

      // Register node
      const nodeInfo: NodeInfo = {
        nodeId,
        address: request.socket.remoteAddress!,
        port: request.socket.remotePort!,
        capabilities: [],
        status: NodeStatus.ONLINE,
        lastSeen: Date.now(),
      };
      this.nodeRegistry.set(nodeId, nodeInfo);

      this.logger.info(`Node ${nodeId} connected`);

      ws.on('message', (data: Buffer) => {
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
    } catch (error) {
      this.logger.error('Error handling connection', error);
      ws.close(1011, 'Internal server error');
    }
  }

  private async authenticateConnection(request: any): Promise<{ success: boolean; nodeId?: string }> {
    if (!this.config.auth?.enabled) {
      return { success: true, nodeId: `node-${Date.now()}` };
    }

    try {
      const authResult = await this.authManager.authenticate(request);
      return authResult;
    } catch (error) {
      this.logger.error('Authentication error', error);
      return { success: false };
    }
  }

  private handleMessage(nodeId: string, data: Buffer): void {
    try {
      const message: FederationMessage = JSON.parse(data.toString());

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
    } catch (error) {
      this.logger.error(`Error parsing message from ${nodeId}`, error);
      this.sendError(nodeId, FederationErrorCode.INVALID_MESSAGE, 'Failed to parse message');
    }
  }

  private validateMessage(message: FederationMessage): boolean {
    return !!(
      message.id &&
      message.type &&
      message.timestamp &&
      message.sourceNodeId &&
      typeof message.priority === 'number'
    );
  }

  private handleDisconnection(nodeId: string): void {
    this.connections.delete(nodeId);
    const nodeInfo = this.nodeRegistry.get(nodeId);
    if (nodeInfo) {
      nodeInfo.status = NodeStatus.OFFLINE;
      this.emit('nodeDisconnected', nodeInfo);
    }
    this.logger.info(`Node ${nodeId} disconnected`);
  }

  sendToNode(nodeId: string, message: FederationMessage): boolean {
    const ws = this.connections.get(nodeId);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      this.logger.warn(`Cannot send message to ${nodeId}: connection not available`);
      return false;
    }

    try {
      ws.send(JSON.stringify(message));
      this.logger.debug(`Sent message to ${nodeId}: ${message.type}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending message to ${nodeId}`, error);
      return false;
    }
  }

  broadcast(message: FederationMessage, excludeNodeId?: string): void {
    for (const [nodeId, ws] of this.connections) {
      if (nodeId !== excludeNodeId && ws.readyState === WebSocket.OPEN) {
        this.sendToNode(nodeId, message);
      }
    }
  }

  private sendError(nodeId: string, code: FederationErrorCode, message: string): void {
    const errorMessage: FederationMessage = {
      id: `error-${Date.now()}`,
      type: FederationMessageType.ERROR_REPORT,
      payload: { code, message },
      timestamp: Date.now(),
      sourceNodeId: 'server',
      priority: MessagePriority.HIGH,
    };
    this.sendToNode(nodeId, errorMessage);
  }

  getConnectedNodes(): NodeInfo[] {
    return Array.from(this.nodeRegistry.values()).filter(node => node.status === NodeStatus.ONLINE);
  }

  async stop(): Promise<void> {
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    this.connections.clear();
    this.nodeRegistry.clear();
    this.logger.info('WebSocket server stopped');
  }
}