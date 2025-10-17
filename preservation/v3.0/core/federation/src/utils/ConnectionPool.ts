import { EventEmitter } from 'events';
import {
  ConnectionConfig,
  PoolConfig,
  FederationError,
  FederationErrorCode,
  NodeInfo
} from '../types';
import { Logger } from './Logger';
import { WebSocketClient } from '../websocket/WebSocketClient';
import { GRPCClient } from '../grpc/GRPCClient';
import { AuthManager } from '../auth/AuthManager';

interface PooledConnection {
  id: string;
  nodeId: string;
  wsClient?: WebSocketClient;
  grpcClient?: GRPCClient;
  lastUsed: number;
  created: number;
  active: boolean;
}

export class ConnectionPool extends EventEmitter {
  private config: PoolConfig;
  private logger: Logger;
  private authManager: AuthManager;
  private connections: Map<string, PooledConnection> = new Map();
  private availableConnections: Set<string> = new Set();
  private waitingQueue: Array<{
    resolve: (connection: PooledConnection) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = [];

  constructor(
    config: PoolConfig,
    connectionConfig: ConnectionConfig,
    logger: Logger,
    authManager: AuthManager
  ) {
    super();
    this.config = config;
    this.logger = logger;
    this.authManager = authManager;
  }

  async getConnection(nodeId: string): Promise<PooledConnection> {
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

  private findAvailableConnection(nodeId: string): PooledConnection | null {
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

  private async createConnection(nodeId: string): Promise<PooledConnection> {
    const connectionId = `${nodeId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const connection: PooledConnection = {
      id: connectionId,
      nodeId,
      lastUsed: Date.now(),
      created: Date.now(),
      active: true,
    };

    try {
      // Create WebSocket client
      connection.wsClient = new WebSocketClient(
        nodeId,
        {
          host: 'localhost', // This would be configured per node
          port: 8080,
          tls: { enabled: false },
          auth: { enabled: false, type: 'jwt' },
          reconnect: { enabled: true, maxAttempts: 5, initialDelay: 1000, maxDelay: 10000, backoffMultiplier: 2 }
        },
        this.logger,
        this.authManager
      );

      // Create gRPC client
      connection.grpcClient = new GRPCClient(
        nodeId,
        {
          host: 'localhost', // This would be configured per node
          port: 9090,
          tls: { enabled: false }
        },
        this.logger
      );

      // Connect clients
      await Promise.all([
        connection.wsClient.connect(),
        connection.grpcClient.connect()
      ]);

      this.connections.set(connectionId, connection);
      this.logger.info(`Created new connection ${connectionId} for node ${nodeId}`);

      return connection;
    } catch (error) {
      this.logger.error(`Failed to create connection for node ${nodeId}`, error);
      throw new FederationError(FederationErrorCode.CONNECTION_FAILED, error.message);
    }
  }

  private waitForConnection(nodeId: string): Promise<PooledConnection> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Remove from queue
        const index = this.waitingQueue.findIndex(item => item.timeout === timeout);
        if (index !== -1) {
          this.waitingQueue.splice(index, 1);
        }
        reject(new FederationError(FederationErrorCode.POOL_EXHAUSTED, 'Connection pool exhausted'));
      }, this.config.acquireTimeout);

      this.waitingQueue.push({ resolve, reject, timeout });
    });
  }

  releaseConnection(connectionId: string): void {
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

  async removeConnection(connectionId: string): Promise<void> {
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
      } catch (error) {
        this.logger.error(`Error closing connection ${connectionId}`, error);
      }

      this.connections.delete(connectionId);
      this.logger.info(`Removed connection ${connectionId}`);
    }
  }

  async cleanup(): Promise<void> {
    const now = Date.now();
    const idleTimeout = this.config.idleTimeout;

    for (const [connectionId, connection] of this.connections) {
      if (now - connection.lastUsed > idleTimeout) {
        await this.removeConnection(connectionId);
      }
    }
  }

  getStats(): {
    total: number;
    active: number;
    available: number;
    waiting: number;
  } {
    return {
      total: this.connections.size,
      active: Array.from(this.connections.values()).filter(c => c.active).length,
      available: this.availableConnections.size,
      waiting: this.waitingQueue.length,
    };
  }

  async shutdown(): Promise<void> {
    // Reject all waiting requests
    for (const waiting of this.waitingQueue) {
      clearTimeout(waiting.timeout);
      waiting.reject(new FederationError(FederationErrorCode.CONNECTION_FAILED, 'Pool shutting down'));
    }
    this.waitingQueue = [];

    // Close all connections
    const closePromises = Array.from(this.connections.keys()).map(id =>
      this.removeConnection(id)
    );

    await Promise.all(closePromises);
    this.logger.info('Connection pool shut down');
  }
}