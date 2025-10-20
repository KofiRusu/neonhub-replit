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
exports.GRPCServer = void 0;
const grpc = __importStar(require("@grpc/grpc-js"));
const protoLoader = __importStar(require("@grpc/proto-loader"));
const path = __importStar(require("path"));
const events_1 = require("events");
const fs = __importStar(require("fs"));
const types_1 = require("../types");
class GRPCServer extends events_1.EventEmitter {
    constructor(config, logger) {
        super();
        this.server = null;
        this.services = new Map();
        this.config = config;
        this.logger = logger;
    }
    async start() {
        try {
            this.server = new grpc.Server();
            // Load and register services
            await this.loadServices();
            // Configure server credentials
            const credentials = this.createServerCredentials();
            this.server.bindAsync(`${this.config.host}:${this.config.port}`, credentials, (error, port) => {
                if (error) {
                    this.logger.error('Failed to bind gRPC server', error);
                    throw new types_1.FederationError(types_1.FederationErrorCode.CONNECTION_FAILED, error.message);
                }
                this.server.start();
                this.logger.info(`gRPC server started on ${this.config.host}:${port}`);
                this.emit('started');
            });
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Failed to start gRPC server', error);
            throw new types_1.FederationError(types_1.FederationErrorCode.CONNECTION_FAILED, message);
        }
    }
    async loadServices() {
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
        const federationProto = grpc.loadPackageDefinition(packageDefinition).federation;
        this.server.addService(federationProto.FederationService.service, federationService);
        this.services.set('federation', federationService);
    }
    createServerCredentials() {
        if (this.config.tls?.enabled) {
            const cert = fs.readFileSync(this.config.tls.certPath);
            const key = fs.readFileSync(this.config.tls.keyPath);
            const ca = this.config.tls.caPath ? fs.readFileSync(this.config.tls.caPath) : null;
            return grpc.ServerCredentials.createSsl(ca, [{ private_key: key, cert_chain: cert }], true);
        }
        return grpc.ServerCredentials.createInsecure();
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
    handleSendMessage(call, callback) {
        try {
            const message = {
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
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error('Error handling send message', error);
            callback({ code: grpc.status.INTERNAL, message });
        }
    }
    handleGetNodeInfo(call, callback) {
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
    handleHealthCheck(call, callback) {
        callback(null, {
            healthy: true,
            status: 'OK',
        });
    }
    handleStreamMessages(call) {
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
    async stop() {
        if (this.server) {
            this.server.forceShutdown();
            this.server = null;
        }
        this.logger.info('gRPC server stopped');
    }
}
exports.GRPCServer = GRPCServer;
//# sourceMappingURL=GRPCServer.js.map