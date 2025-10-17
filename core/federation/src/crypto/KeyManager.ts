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

export class KeyManager {
  private logger: Logger;
  private keyStore: Map<string, KeyStoreEntry> = new Map();
  private keyExchanges: Map<string, KeyExchangeRequest> = new Map();

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Generates a new key pair for a specific purpose
   */
  generateKeyPair(purpose: KeyPurpose, algorithm: string = 'paillier'): HomomorphicKeyPair {
    const keyId = `${purpose}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const publicKey = this.generateRandomKey(256);
    const privateKey = this.generateRandomKey(512);

    const keyPair: HomomorphicKeyPair = {
      publicKey,
      privateKey,
      keyId,
      algorithm,
      created: Date.now()
    };

    // Store the key pair
    const entry: KeyStoreEntry = {
      keyId,
      keyPair,
      purpose,
      participants: [],
      created: Date.now(),
      usageCount: 0
    };

    this.keyStore.set(keyId, entry);
    this.logger.info(`Generated key pair ${keyId} for purpose ${purpose}`);
    return keyPair;
  }

  /**
   * Initiates a key exchange with participants
   */
  initiateKeyExchange(request: KeyExchangeRequest): string {
    const exchangeId = `exchange_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store the exchange request
    this.keyExchanges.set(exchangeId, request);

    // Create key pair if needed
    if (!this.keyStore.has(request.keyId)) {
      const keyPair = this.generateKeyPair(request.purpose, request.algorithm);
      const entry = this.keyStore.get(request.keyId);
      if (entry) {
        entry.participants = request.participants;
      }
    }

    this.logger.info(`Initiated key exchange ${exchangeId} for key ${request.keyId}`);
    return exchangeId;
  }

  /**
   * Accepts a key exchange from a participant
   */
  acceptKeyExchange(exchangeId: string, participantId: string, publicKey?: string): boolean {
    const exchange = this.keyExchanges.get(exchangeId);
    if (!exchange) {
      this.logger.warn(`Key exchange ${exchangeId} not found`);
      return false;
    }

    if (!exchange.participants.includes(participantId)) {
      this.logger.warn(`Participant ${participantId} not in exchange ${exchangeId}`);
      return false;
    }

    // In practice, verify the public key and establish secure channel
    const entry = this.keyStore.get(exchange.keyId);
    if (entry && !entry.participants.includes(participantId)) {
      entry.participants.push(participantId);
    }

    this.logger.info(`Participant ${participantId} accepted key exchange ${exchangeId}`);
    return true;
  }

  /**
   * Gets a key pair by ID
   */
  getKeyPair(keyId: string): HomomorphicKeyPair | undefined {
    const entry = this.keyStore.get(keyId);
    if (entry) {
      entry.usageCount++;
      entry.lastUsed = Date.now();
      return entry.keyPair;
    }
    return undefined;
  }

  /**
   * Gets all key pairs for a specific purpose
   */
  getKeyPairsByPurpose(purpose: KeyPurpose): HomomorphicKeyPair[] {
    const keyPairs: HomomorphicKeyPair[] = [];

    this.keyStore.forEach(entry => {
      if (entry.purpose === purpose) {
        keyPairs.push(entry.keyPair);
      }
    });

    return keyPairs;
  }

  /**
   * Gets key pairs accessible by a participant
   */
  getParticipantKeyPairs(participantId: string): HomomorphicKeyPair[] {
    const keyPairs: HomomorphicKeyPair[] = [];

    this.keyStore.forEach(entry => {
      if (entry.participants.includes(participantId)) {
        keyPairs.push(entry.keyPair);
      }
    });

    return keyPairs;
  }

  /**
   * Revokes access to a key for a participant
   */
  revokeKeyAccess(keyId: string, participantId: string): boolean {
    const entry = this.keyStore.get(keyId);
    if (entry) {
      const index = entry.participants.indexOf(participantId);
      if (index > -1) {
        entry.participants.splice(index, 1);
        this.logger.info(`Revoked access to key ${keyId} for participant ${participantId}`);
        return true;
      }
    }
    return false;
  }

  /**
   * Deletes a key pair
   */
  deleteKeyPair(keyId: string): boolean {
    const deleted = this.keyStore.delete(keyId);
    if (deleted) {
      this.logger.info(`Deleted key pair ${keyId}`);
    }
    return deleted;
  }

  /**
   * Rotates a key pair (creates new key and migrates participants)
   */
  rotateKey(keyId: string, newAlgorithm?: string): HomomorphicKeyPair | null {
    const oldEntry = this.keyStore.get(keyId);
    if (!oldEntry) {
      return null;
    }

    // Generate new key pair
    const newKeyPair = this.generateKeyPair(oldEntry.purpose, newAlgorithm || oldEntry.keyPair.algorithm);

    // Migrate participants
    const newEntry = this.keyStore.get(newKeyPair.keyId);
    if (newEntry) {
      newEntry.participants = [...oldEntry.participants];
    }

    // Mark old key as expired
    oldEntry.expires = Date.now();

    this.logger.info(`Rotated key ${keyId} to ${newKeyPair.keyId}`);
    return newKeyPair;
  }

  /**
   * Gets key usage statistics
   */
  getKeyStatistics(): {
    totalKeys: number;
    keysByPurpose: Record<KeyPurpose, number>;
    expiredKeys: number;
    averageUsageCount: number;
  } {
    const keys = Array.from(this.keyStore.values());
    const totalKeys = keys.length;
    const keysByPurpose: Record<KeyPurpose, number> = {
      [KeyPurpose.HOMOMORPHIC_ENCRYPTION]: 0,
      [KeyPurpose.SECURE_AGGREGATION]: 0,
      [KeyPurpose.SIGNATURE_VERIFICATION]: 0
    };

    let totalUsage = 0;
    let expiredKeys = 0;

    keys.forEach(entry => {
      keysByPurpose[entry.purpose]++;
      totalUsage += entry.usageCount;

      if (entry.expires && entry.expires < Date.now()) {
        expiredKeys++;
      }
    });

    const averageUsageCount = totalKeys > 0 ? totalUsage / totalKeys : 0;

    return {
      totalKeys,
      keysByPurpose,
      expiredKeys,
      averageUsageCount
    };
  }

  /**
   * Cleans up expired keys
   */
  cleanupExpiredKeys(): number {
    let cleanedCount = 0;

    this.keyStore.forEach((entry, keyId) => {
      if (entry.expires && entry.expires < Date.now()) {
        this.keyStore.delete(keyId);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      this.logger.info(`Cleaned up ${cleanedCount} expired keys`);
    }

    return cleanedCount;
  }

  /**
   * Generates a random key string
   */
  private generateRandomKey(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}