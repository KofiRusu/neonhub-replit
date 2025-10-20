import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import * as path from 'path';
import { EventEmitter } from 'events';
import * as fs from 'fs';
import {
  FederationMessage,
  GRPCServiceDefinition,
  ConnectionConfig,
  FederationError,
  FederationErrorCode,
  MessagePriority
} from '../types';
import { Logger } from '../utils/Logger';

export class GRPCServer extends EventEmitter {
  private server: grpc.Server | null = null;
  private config: ConnectionConfig;
  private logger: Logger;
  private services: Map<string, any> = new Map();

  constructor(config: ConnectionConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
  }

  async start(): Promise<void> {
    try {
      this.server = new grpc.Server();

      // Load and register services
      await this.loadServices();

      // Configure server credentials
      const credentials = this.createServerCredentials();

      this.server.bindAsync(
        `${this.config.host}:${this.config.port}`,
        credentials,
        (error, port) => {
          if (error) {
            this.logger.error('Failed to bind gRPC server', error);
            throw new FederationError(FederationErrorCode.CONNECTION_FAILED, error.message);
          }

          this.server!.start();
          this.logger.info(`gRPC server started on ${this.config.host}:${port}`);
          this.emit('started');
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to start gRPC server', error);
      throw new FederationError(FederationErrorCode.CONNECTION_FAILED, message);
    }
  }

  private async loadServices(): Promise<void> {
    // Define federation service
    const federationService = {
      SendMessage: this.handleSendMessage.bind(this),
      GetNodeInfo: this.handleGetNodeInfo.bind(this),
      HealthCheck: this.handleHealthCheck.bind(this),
      StreamMessages: this.handleStreamMessages.bind(this),
    };

    // Load proto definition
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

    this.server!.addService(federationProto.FederationService.service, federationService);
    this.services.set('federation', federationService);
  }

  private createServerCredentials(): grpc.ServerCredentials {
    if (this.config.tls?.enabled) {
      const cert = fs.readFileSync(this.config.tls.certPath!);
      const key = fs.readFileSync(this.config.tls.keyPath!);
      const ca = this.config.tls.caPath ? fs.readFileSync(this.config.tls.caPath) : null;

      return grpc.ServerCredentials.createSsl(ca, [{ private_key: key, cert_chain: cert }], true);
    }

    return grpc.ServerCredentials.createInsecure();
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

  private handleSendMessage(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): void {
    try {
      const message: FederationMessage = {
        id: call.request.id,
        type: call.request.type,
        payload: JSON.parse(call.request.payload),
        timestamp: call.request.timestamp,
        sourceNodeId: call.request.source_node_id,
        targetNodeId: call.request.target_node_id,
        priority: call.request.priority,
        ttl: call.request.ttl,
      };

      this.emit('message', message);

      callback(null, { success: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Error handling send message', error);
      callback({ code: grpc.status.INTERNAL, message });
    }
  }

  private handleGetNodeInfo(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): void {
    // This would be implemented to return node information
    // For now, return a placeholder
    callback(null, {
      node_id: call.request.node_id,
      address: this.config.host,
      port: this.config.port,
      capabilities: ['federation'],
      status: 'online',
      last_seen: Date.now(),
    });
  }

  private handleHealthCheck(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>
  ): void {
    callback(null, {
      healthy: true,
      status: 'OK',
    });
  }

  private handleStreamMessages(
    call: grpc.ServerDuplexStream<any, any>
  ): void {
    // Handle streaming messages
    call.on('data', (message) => {
      this.emit('streamMessage', message);
    });

    call.on('end', () => {
      call.end();
    });

    call.on('error', (error) => {
      this.logger.error('Stream error', error);
    });
  }

  async stop(): Promise<void> {
    if (this.server) {
      this.server.forceShutdown();
      this.server = null;
    }
    this.logger.info('gRPC server stopped');
  }
}