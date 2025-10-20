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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GRPCClient = void 0;
const grpc = __importStar(require("@grpc/grpc-js"));
const protoLoader = __importStar(require("@grpc/proto-loader"));
const path = __importStar(require("path"));
const events_1 = require("events");
const fs = __importStar(require("fs"));
const types_1 = require("../types");
class GRPCClient extends events_1.EventEmitter {
    constructor(nodeId, config, logger) {
        super();
        this.client = null;
        this.nodeId = nodeId;
        this.config = config;
        this.logger = logger;
    }
    async connect() {
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
            const federationProto = grpc.loadPackageDefinition(packageDefinition).federation;
            const credentials = this.createClientCredentials();
            this.client = new federationProto.FederationService(`${this.config.host}:${this.config.port}`, credentials);
            this.logger.info(`gRPC client connected to ${this.config.host}:${this.config.port}`);
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Failed to connect gRPC client', error);
            throw new types_1.FederationError(types_1.FederationErrorCode.CONNECTION_FAILED, message);
        }
    }
    createClientCredentials() {
        if (this.config.tls?.enabled) {
            const cert = this.config.tls.certPath ? fs.readFileSync(this.config.tls.certPath) : undefined;
            const key = this.config.tls.keyPath ? fs.readFileSync(this.config.tls.keyPath) : undefined;
            const ca = this.config.tls.caPath ? fs.readFileSync(this.config.tls.caPath) : undefined;
            return grpc.credentials.createSsl(ca, key, cert);
        }
        return grpc.credentials.createInsecure();
    }
    async createProtoFile() {
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
    async sendMessage(message) {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                reject(new types_1.FederationError(types_1.FederationErrorCode.CONNECTION_FAILED, 'Client not connected'));
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
            this.client.SendMessage(request, (error, response) => {
                if (error) {
                    this.logger.error('Error sending message via gRPC', error);
                    reject(new types_1.FederationError(types_1.FederationErrorCode.CONNECTION_FAILED, error.message));
                    return;
                }
                resolve(response.success);
            });
        });
    }
    async getNodeInfo(nodeId) {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                reject(new types_1.FederationError(types_1.FederationErrorCode.CONNECTION_FAILED, 'Client not connected'));
                return;
            }
            this.client.GetNodeInfo({ node_id: nodeId }, (error, response) => {
                if (error) {
                    this.logger.error('Error getting node info via gRPC', error);
                    reject(new types_1.FederationError(types_1.FederationErrorCode.CONNECTION_FAILED, error.message));
                    return;
                }
                resolve(response);
            });
        });
    }
    async healthCheck() {
        return new Promise((resolve, reject) => {
            if (!this.client) {
                reject(new types_1.FederationError(types_1.FederationErrorCode.CONNECTION_FAILED, 'Client not connected'));
                return;
            }
            this.client.HealthCheck({}, (error, response) => {
                if (error) {
                    this.logger.error('Error performing health check via gRPC', error);
                    reject(new types_1.FederationError(types_1.FederationErrorCode.CONNECTION_FAILED, error.message));
                    return;
                }
                resolve(response);
            });
        });
    }
    async disconnect() {
        if (this.client) {
            this.client.close();
            this.client = null;
        }
        this.logger.info('gRPC client disconnected');
    }
}
exports.GRPCClient = GRPCClient;
//# sourceMappingURL=GRPCClient.js.map