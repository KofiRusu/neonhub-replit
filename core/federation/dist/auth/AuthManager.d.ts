import { AuthConfig } from '../types';
import { Logger } from '../utils/Logger';
export interface AuthResult {
    success: boolean;
    nodeId?: string;
    error?: string;
}
export declare class AuthManager {
    private config;
    private logger;
    constructor(config: AuthConfig, logger: Logger);
    authenticate(request: any): Promise<AuthResult>;
    private authenticateJWT;
    private authenticateCertificate;
    private authenticateApiKey;
    private extractToken;
    private extractApiKey;
    generateToken(nodeId: string): string;
}
//# sourceMappingURL=AuthManager.d.ts.map