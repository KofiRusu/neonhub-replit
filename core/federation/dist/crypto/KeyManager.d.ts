import { Logger } from '../utils/Logger';
import { KeyExchangeRequest, KeyPurpose } from '../types';
import { HomomorphicKeyPair } from './HomomorphicEncryption';
export interface KeyStoreEntry {
    keyId: string;
    keyPair: HomomorphicKeyPair;
    purpose: KeyPurpose;
    participants: string[];
    created: number;
    expires?: number;
    usageCount: number;
    lastUsed?: number;
}
export declare class KeyManager {
    private logger;
    private keyStore;
    private keyExchanges;
    constructor(logger: Logger);
    /**
     * Generates a new key pair for a specific purpose
     */
    generateKeyPair(purpose: KeyPurpose, algorithm?: string): HomomorphicKeyPair;
    /**
     * Initiates a key exchange with participants
     */
    initiateKeyExchange(request: KeyExchangeRequest): string;
    /**
     * Accepts a key exchange from a participant
     */
    acceptKeyExchange(exchangeId: string, participantId: string, publicKey?: string): boolean;
    /**
     * Gets a key pair by ID
     */
    getKeyPair(keyId: string): HomomorphicKeyPair | undefined;
    /**
     * Gets all key pairs for a specific purpose
     */
    getKeyPairsByPurpose(purpose: KeyPurpose): HomomorphicKeyPair[];
    /**
     * Gets key pairs accessible by a participant
     */
    getParticipantKeyPairs(participantId: string): HomomorphicKeyPair[];
    /**
     * Revokes access to a key for a participant
     */
    revokeKeyAccess(keyId: string, participantId: string): boolean;
    /**
     * Deletes a key pair
     */
    deleteKeyPair(keyId: string): boolean;
    /**
     * Rotates a key pair (creates new key and migrates participants)
     */
    rotateKey(keyId: string, newAlgorithm?: string): HomomorphicKeyPair | null;
    /**
     * Gets key usage statistics
     */
    getKeyStatistics(): {
        totalKeys: number;
        keysByPurpose: Record<KeyPurpose, number>;
        expiredKeys: number;
        averageUsageCount: number;
    };
    /**
     * Cleans up expired keys
     */
    cleanupExpiredKeys(): number;
    /**
     * Generates a random key string
     */
    private generateRandomKey;
}
//# sourceMappingURL=KeyManager.d.ts.map