import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import {
  FederationMessage,
  ConnectionConfig,
  FederationError,
  FederationErrorCode,
  MessagePriority
} from '../types';
import { Logger } from '../utils/Logger';

export class GRPCClient extends EventEmitter {
  private client: any = null;
  private config: ConnectionConfig;
  private logger: Logger;
  private nodeId: string;

  constructor(nodeId: string, config: ConnectionConfig, logger: Logger) {
    super();
    this.nodeId = nodeId;
    this.config = config;
    this.logger = logger;
  }

  async connect(): Promise<void> {
    try {
      const protoPath = path.join(__dirname, 'federation.proto');
      if (!fs.existsSync(protoPath)) {
        await this.createProtoFile();
      }

      const packageDefinition = protoLoader.loadSync(protoPath, {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
      });

      const federationProto = grpc.loadPackageDefinition(packageDefinition).federation as any;

      const credentials = this.createClientCredentials();

      this.client = new federationProto.FederationService(
        `${this.config.host}:${this.config.port}`,
        credentials
      );

      this.logger.info(`gRPC client connected to ${this.config.host}:${this.config.port}`);
    } catch (error) {
      this.logger.error('Failed to connect gRPC client', error);
      throw new FederationError(FederationErrorCode.CONNECTION_FAILED, error.message);
    }
  }

  private createClientCredentials(): grpc.ChannelCredentials {
    if (this.config.tls?.enabled) {
      const cert = this.config.tls.certPath ? fs.readFileSync(this.config.tls.certPath) : undefined;
      const key = this.config.tls.keyPath ? fs.readFileSync(this.config.tls.keyPath) : undefined;
      const ca = this.config.tls.caPath ? fs.readFileSync(this.config.tls.caPath) : undefined;

      return grpc.credentials.createSsl(ca, key, cert);
    }

    return grpc.credentials.createInsecure();
  }

  private async createProtoFile(): Promise<void> {
    const protoContent = `
syntax = "proto3";

package federation;

service FederationService {
  rpc SendMessage (FederationMessage) returns (MessageResponse);
  rpc GetNodeInfo (NodeRequest) returns (NodeInfo);
  rpc HealthCheck (HealthRequest) returns (HealthResponse);
  rpc StreamMessages (StreamRequest) returns (stream FederationMessage);
}

message FederationMessage {
  string id = 1;
  string type = 2;
  string payload = 3;
  int64 timestamp = 4;
  string source_node_id = 5;
  string target_node_id = 6;
  int32 priority = 7;
  int64 ttl = 8;
}

message MessageResponse {
  bool success = 1;
  string error = 2;
}

message NodeRequest {
  string node_id = 1;
}

message NodeInfo {
  string node_id = 1;
  string address = 2;
  int32 port = 3;
  repeated string capabilities = 4;
  string status = 5;
  int64 last_seen = 6;
}

message HealthRequest {}

message HealthResponse {
  bool healthy = 1;
  string status = 2;
}

message StreamRequest {
  string node_id = 1;
}
`;

    const protoPath = path.join(__dirname, 'federation.proto');
    fs.writeFileSync(protoPath, protoContent);
  }

  async sendMessage(message: FederationMessage): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new FederationError(FederationErrorCode.CONNECTION_FAILED, 'Client not connected'));
        return;
      }

      const request = {
        id: message.id,
        type: message.type,
        payload: JSON.stringify(message.payload),
        timestamp: message.timestamp,
        source_node_id: message.sourceNodeId,
        target_node_id: message.targetNodeId,
        priority: message.priority,
        ttl: message.ttl,
      };

      this.client.SendMessage(request, (error: any, response: any) => {
        if (error) {
          this.logger.error('Error sending message via gRPC', error);
          reject(new FederationError(FederationErrorCode.CONNECTION_FAILED, error.message));
          return;
        }

        resolve(response.success);
      });
    });
  }

  async getNodeInfo(nodeId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new FederationError(FederationErrorCode.CONNECTION_FAILED, 'Client not connected'));
        return;
      }

      this.client.GetNodeInfo({ node_id: nodeId }, (error: any, response: any) => {
        if (error) {
          this.logger.error('Error getting node info via gRPC', error);
          reject(new FederationError(FederationErrorCode.CONNECTION_FAILED, error.message));
          return;
        }

        resolve(response);
      });
    });
  }

  async healthCheck(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.client) {
        reject(new FederationError(FederationErrorCode.CONNECTION_FAILED, 'Client not connected'));
        return;
      }

      this.client.HealthCheck({}, (error: any, response: any) => {
        if (error) {
          this.logger.error('Error performing health check via gRPC', error);
          reject(new FederationError(FederationErrorCode.CONNECTION_FAILED, error.message));
          return;
        }

        resolve(response);
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.close();
      this.client = null;
    }
    this.logger.info('gRPC client disconnected');
  }
}