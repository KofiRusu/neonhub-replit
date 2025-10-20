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
exports.AuthManager = void 0;
const jwt = __importStar(require("jsonwebtoken"));
const types_1 = require("../types");
class AuthManager {
    constructor(config, logger) {
        this.config = config;
        this.logger = logger;
    }
    async authenticate(request) {
        try {
            switch (this.config.type) {
                case 'jwt':
                    return this.authenticateJWT(request);
                case 'certificate':
                    return this.authenticateCertificate(request);
                case 'api_key':
                    return this.authenticateApiKey(request);
                default:
                    return { success: false, error: 'Unsupported auth type' };
            }
        }
        catch (error) {
            this.logger.error('Authentication failed', error);
            return { success: false, error: 'Authentication error' };
        }
    }
    authenticateJWT(request) {
        const token = this.extractToken(request);
        if (!token) {
            return { success: false, error: 'No token provided' };
        }
        try {
            const decoded = jwt.verify(token, this.config.token);
            return { success: true, nodeId: decoded.nodeId };
        }
        catch (error) {
            return { success: false, error: 'Invalid token' };
        }
    }
    authenticateCertificate(request) {
        if (!request.socket || !request.socket.getPeerCertificate) {
            return { success: false, error: 'Certificate not provided' };
        }
        const cert = request.socket.getPeerCertificate();
        if (!cert || !cert.subject) {
            return { success: false, error: 'Invalid certificate' };
        }
        // In a real implementation, you would validate the certificate against a CA
        // For now, we'll just extract the node ID from the certificate subject
        const nodeId = cert.subject.CN || `cert-${Date.now()}`;
        return { success: true, nodeId };
    }
    authenticateApiKey(request) {
        const apiKey = this.extractApiKey(request);
        if (!apiKey || apiKey !== this.config.apiKey) {
            return { success: false, error: 'Invalid API key' };
        }
        // Generate a node ID based on the API key (in production, use a proper mapping)
        const nodeId = `api-${Buffer.from(apiKey).toString('base64').slice(0, 8)}`;
        return { success: true, nodeId };
    }
    extractToken(request) {
        const authHeader = request.headers?.authorization || request.headers?.Authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.substring(7);
        }
        return null;
    }
    extractApiKey(request) {
        return request.headers?.['x-api-key'] || request.headers?.['X-API-Key'] || null;
    }
    generateToken(nodeId) {
        if (this.config.type !== 'jwt' || !this.config.token) {
            throw new types_1.FederationError(types_1.FederationErrorCode.AUTHENTICATION_FAILED, 'JWT not configured');
        }
        return jwt.sign({ nodeId, iat: Date.now() }, this.config.token, {
            expiresIn: '24h'
        });
    }
}
exports.AuthManager = AuthManager;
//# sourceMappingURL=AuthManager.js.map