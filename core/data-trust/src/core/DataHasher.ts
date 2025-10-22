import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { HashAlgorithm, HashResult, DataHasher as IDataHasher, HashingError } from '../types/index.js';

export class DataHasher implements IDataHasher {
  private readonly defaultAlgorithm: HashAlgorithm = 'sha256';

  /**
   * Hash data using the specified algorithm
   */
  async hash(data: string | Buffer, algorithm: HashAlgorithm = this.defaultAlgorithm): Promise<HashResult> {
    try {
      const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
      const hash = createHash(algorithm).update(buffer).digest('hex');

      return {
        hash,
        algorithm,
        timestamp: new Date(),
        dataSize: buffer.length
      };
    } catch (error) {
      throw new HashingError(
        `Failed to hash data with algorithm ${algorithm}`,
        { originalError: error, algorithm, dataSize: Buffer.isBuffer(data) ? data.length : data.length }
      );
    }
  }

  /**
   * Hash a file using the specified algorithm
   */
  async hashFile(filePath: string, algorithm: HashAlgorithm = this.defaultAlgorithm): Promise<HashResult> {
    try {
      const buffer = await fs.readFile(filePath);
      return this.hash(buffer, algorithm);
    } catch (error) {
      if (error instanceof HashingError) {
        throw error;
      }
      throw new HashingError(
        `Failed to hash file: ${filePath}`,
        { originalError: error, filePath, algorithm }
      );
    }
  }

  /**
   * Verify data against an expected hash
   */
  async verify(
    data: string | Buffer,
    expectedHash: string,
    algorithm: HashAlgorithm = this.defaultAlgorithm
  ): Promise<boolean> {
    try {
      const result = await this.hash(data, algorithm);
      return result.hash === expectedHash;
    } catch (error) {
      throw new HashingError(
        `Failed to verify data hash`,
        { originalError: error, expectedHash, algorithm }
      );
    }
  }

  /**
   * Get available hash algorithms
   */
  getAvailableAlgorithms(): HashAlgorithm[] {
    return ['sha256', 'sha3-256', 'sha3-512', 'blake2b-256', 'blake2b-512'];
  }

  /**
   * Get algorithm-specific hash length in bytes
   */
  getHashLength(algorithm: HashAlgorithm): number {
    const lengths: Record<HashAlgorithm, number> = {
      'sha256': 32,
      'sha3-256': 32,
      'sha3-512': 64,
      'blake2b-256': 32,
      'blake2b-512': 64
    };
    return lengths[algorithm] || 32;
  }

  /**
   * Create a double hash (hash of hash) for additional security
   */
  async doubleHash(data: string | Buffer, algorithm: HashAlgorithm = this.defaultAlgorithm): Promise<HashResult> {
    const firstHash = await this.hash(data, algorithm);
    return this.hash(firstHash.hash, algorithm);
  }

  /**
   * Hash multiple data items and return combined hash
   */
  async hashMultiple(dataItems: (string | Buffer)[], algorithm: HashAlgorithm = this.defaultAlgorithm): Promise<HashResult> {
    try {
      const hashes = await Promise.all(
        dataItems.map(item => this.hash(item, algorithm))
      );

      // Calculate total original data size
      const totalDataSize = hashes.reduce((sum, h) => sum + h.dataSize, 0);

      const combinedData = hashes.map(h => h.hash).join('');
      const result = await this.hash(combinedData, algorithm);
      
      // Return with original data size, not hash size
      return {
        ...result,
        dataSize: totalDataSize
      };
    } catch (error) {
      throw new HashingError(
        `Failed to hash multiple data items`,
        { originalError: error, itemCount: dataItems.length, algorithm }
      );
    }
  }
}