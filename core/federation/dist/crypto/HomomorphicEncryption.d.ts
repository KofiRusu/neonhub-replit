import { Logger } from '../utils/Logger';
export interface HomomorphicKeyPair {
    publicKey: string;
    privateKey: string;
    keyId: string;
    algorithm: string;
    created: number;
}
export declare class HomomorphicEncryption {
    private logger;
    private keyPairs;
    constructor(logger: Logger);
    /**
     * Generates a new homomorphic encryption key pair
     */
    generateKeyPair(algorithm?: string): HomomorphicKeyPair;
    /**
     * Encrypts data using homomorphic encryption
     */
    encrypt(data: number[], publicKey: string): string;
    /**
     * Decrypts data using homomorphic encryption
     */
    decrypt(encryptedData: string, privateKey: string): number[];
    /**
     * Performs homomorphic addition on encrypted data
     */
    addEncrypted(encryptedA: string, encryptedB: string, publicKey: string): string;
    /**
     * Performs homomorphic multiplication by scalar on encrypted data
     */
    multiplyByScalar(encryptedData: string, scalar: number, publicKey: string): string;
    /**
     * Aggregates encrypted model updates homomorphically
     */
    aggregateEncryptedUpdates(encryptedUpdates: string[], weights: number[], publicKey: string): string;
    /**
     * Gets a key pair by ID
     */
    getKeyPair(keyId: string): HomomorphicKeyPair | undefined;
    /**
     * Lists all available key pairs
     */
    listKeyPairs(): HomomorphicKeyPair[];
    /**
     * Deletes a key pair
     */
    deleteKeyPair(keyId: string): boolean;
    /**
     * Generates a random key string
     */
    private generateRandomKey;
}
//# sourceMappingURL=HomomorphicEncryption.d.ts.map