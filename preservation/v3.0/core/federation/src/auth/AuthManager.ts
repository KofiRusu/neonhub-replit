import * as jwt from 'jsonwebtoken';
import * as fs from 'fs';
import { AuthConfig, FederationError, FederationErrorCode } from '../types';
import { Logger } from '../utils/Logger';

export interface AuthResult {
  success: boolean;
  nodeId?: string;
  error?: string;
}

export class AuthManager {
  private config: AuthConfig;
  private logger: Logger;

  constructor(config: AuthConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  async authenticate(request: any): Promise<AuthResult> {
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
    } catch (error) {
      this.logger.error('Authentication failed', error);
      return { success: false, error: 'Authentication error' };
    }
  }

  private authenticateJWT(request: any): AuthResult {
    const token = this.extractToken(request);
    if (!token) {
      return { success: false, error: 'No token provided' };
    }

    try {
      const decoded = jwt.verify(token, this.config.token!) as any;
      return { success: true, nodeId: decoded.nodeId };
    } catch (error) {
      return { success: false, error: 'Invalid token' };
    }
  }

  private authenticateCertificate(request: any): AuthResult {
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

  private authenticateApiKey(request: any): AuthResult {
    const apiKey = this.extractApiKey(request);
    if (!apiKey || apiKey !== this.config.apiKey) {
      return { success: false, error: 'Invalid API key' };
    }

    // Generate a node ID based on the API key (in production, use a proper mapping)
    const nodeId = `api-${Buffer.from(apiKey).toString('base64').slice(0, 8)}`;
    return { success: true, nodeId };
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers?.authorization || request.headers?.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    return null;
  }

  private extractApiKey(request: any): string | null {
    return request.headers?.['x-api-key'] || request.headers?.['X-API-Key'] || null;
  }

  generateToken(nodeId: string): string {
    if (this.config.type !== 'jwt' || !this.config.token) {
      throw new FederationError(FederationErrorCode.AUTHENTICATION_FAILED, 'JWT not configured');
    }

    return jwt.sign({ nodeId, iat: Date.now() }, this.config.token, {
      expiresIn: '24h'
    });
  }
}