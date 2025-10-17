import {
  IntegrityCheck,
  IntegrityVerifierInterface,
  IntegrityError,
  HashAlgorithm,
  MerkleProof
} from '../types/index.js';
import { DataHasher } from './DataHasher.js';
import { MerkleTree } from './MerkleTree.js';

export class IntegrityVerifier implements IntegrityVerifierInterface {
  private hasher: DataHasher;
  private merkleTrees: Map<string, MerkleTree> = new Map();

  constructor() {
    this.hasher = new DataHasher();
  }

  /**
   * Check integrity of a single data item
   */
  async checkIntegrity(
    dataId: string,
    data: string | Buffer,
    expectedHash?: string,
    algorithm: HashAlgorithm = 'sha256'
  ): Promise<IntegrityCheck> {
    try {
      const actualHashResult = await this.hasher.hash(data, algorithm);
      const isValid = expectedHash ? actualHashResult.hash === expectedHash : true;

      const check: IntegrityCheck = {
        dataId,
        expectedHash: expectedHash || actualHashResult.hash,
        actualHash: actualHashResult.hash,
        isValid,
        timestamp: new Date(),
        algorithm
      };

      return check;
    } catch (error) {
      throw new IntegrityError(
        `Failed to check integrity for data ID: ${dataId}`,
        { originalError: error, dataId, algorithm }
      );
    }
  }

  /**
   * Verify Merkle proof for data integrity
   */
  async verifyMerkleProof(dataId: string, proof: MerkleProof): Promise<boolean> {
    try {
      const tree = this.merkleTrees.get(dataId);
      if (!tree) {
        throw new IntegrityError(`Merkle tree not found for data ID: ${dataId}`);
      }

      return tree.verifyProof(proof.leaf, proof);
    } catch (error) {
      throw new IntegrityError(
        `Failed to verify Merkle proof for data ID: ${dataId}`,
        { originalError: error, dataId, proof }
      );
    }
  }

  /**
   * Batch check integrity for multiple data items
   */
  async batchCheckIntegrity(
    checks: Array<{ dataId: string; data: string | Buffer; expectedHash?: string; algorithm?: HashAlgorithm }>
  ): Promise<IntegrityCheck[]> {
    try {
      const promises = checks.map(check =>
        this.checkIntegrity(
          check.dataId,
          check.data,
          check.expectedHash,
          check.algorithm
        )
      );

      return await Promise.all(promises);
    } catch (error) {
      throw new IntegrityError(
        'Failed to perform batch integrity check',
        { originalError: error, checkCount: checks.length }
      );
    }
  }

  /**
   * Get integrity check history for a data item
   */
  async getIntegrityHistory(dataId: string): Promise<IntegrityCheck[]> {
    // In a real implementation, this would query a database
    // For now, return empty array as we don't persist history
    return [];
  }

  /**
   * Create Merkle tree for a dataset
   */
  async createMerkleTree(dataId: string, dataItems: string[]): Promise<string> {
    try {
      const tree = new MerkleTree();
      await tree.build(dataItems);
      this.merkleTrees.set(dataId, tree);

      return tree.getRoot();
    } catch (error) {
      throw new IntegrityError(
        `Failed to create Merkle tree for data ID: ${dataId}`,
        { originalError: error, dataId, itemCount: dataItems.length }
      );
    }
  }

  /**
   * Generate Merkle proof for data item
   */
  generateMerkleProof(dataId: string, dataItem: string): MerkleProof {
    const tree = this.merkleTrees.get(dataId);
    if (!tree) {
      throw new IntegrityError(`Merkle tree not found for data ID: ${dataId}`);
    }

    return tree.generateProof(dataItem);
  }

  /**
   * Verify data against multiple integrity checks
   */
  async comprehensiveIntegrityCheck(
    dataId: string,
    data: string | Buffer,
    options: {
      expectedHash?: string;
      algorithm?: HashAlgorithm;
      merkleProof?: MerkleProof;
      blockchainVerification?: boolean;
    } = {}
  ): Promise<{
    hashCheck: IntegrityCheck;
    merkleCheck?: boolean;
    blockchainCheck?: boolean;
    overallValid: boolean;
  }> {
    try {
      // Hash integrity check
      const hashCheck = await this.checkIntegrity(
        dataId,
        data,
        options.expectedHash,
        options.algorithm
      );

      let merkleCheck: boolean | undefined;
      let blockchainCheck: boolean | undefined;

      // Merkle proof verification
      if (options.merkleProof) {
        merkleCheck = await this.verifyMerkleProof(dataId, options.merkleProof);
      }

      // Blockchain verification (placeholder - would integrate with BlockchainConnector)
      if (options.blockchainVerification) {
        blockchainCheck = true; // Placeholder implementation
      }

      const overallValid = hashCheck.isValid &&
                          (merkleCheck === undefined || merkleCheck) &&
                          (blockchainCheck === undefined || blockchainCheck);

      return {
        hashCheck,
        merkleCheck,
        blockchainCheck,
        overallValid
      };
    } catch (error) {
      throw new IntegrityError(
        `Failed comprehensive integrity check for data ID: ${dataId}`,
        { originalError: error, dataId, options }
      );
    }
  }

  /**
   * Validate data format and structure
   */
  async validateDataFormat(dataId: string, data: string | Buffer, expectedFormat: string): Promise<boolean> {
    try {
      // Basic format validation based on expected format
      const dataString = Buffer.isBuffer(data) ? data.toString('utf8') : data;

      switch (expectedFormat.toLowerCase()) {
        case 'json':
          try {
            JSON.parse(dataString);
            return true;
          } catch {
            return false;
          }

        case 'xml':
          return /^<\?xml.*?\?>/.test(dataString) || /^<[^>]+>/.test(dataString);

        case 'csv':
          return dataString.includes(',') && dataString.split('\n').length > 1;

        default:
          return true; // Unknown format, assume valid
      }
    } catch (error) {
      throw new IntegrityError(
        `Failed to validate data format for data ID: ${dataId}`,
        { originalError: error, dataId, expectedFormat }
      );
    }
  }

  /**
   * Check data consistency across multiple sources
   */
  async checkConsistency(
    dataId: string,
    sources: Array<{ source: string; data: string | Buffer; expectedHash?: string }>
  ): Promise<{
    consistent: boolean;
    sourceResults: Array<{ source: string; valid: boolean; hash: string }>;
  }> {
    try {
      const sourceResults = await Promise.all(
        sources.map(async (source) => {
          const hashResult = await this.hasher.hash(source.data);
          const valid = source.expectedHash ? hashResult.hash === source.expectedHash : true;

          return {
            source: source.source,
            valid,
            hash: hashResult.hash
          };
        })
      );

      // Check if all sources have the same hash
      const hashes = sourceResults.map(r => r.hash);
      const consistent = hashes.every(hash => hash === hashes[0]);

      return {
        consistent,
        sourceResults
      };
    } catch (error) {
      throw new IntegrityError(
        `Failed to check data consistency for data ID: ${dataId}`,
        { originalError: error, dataId, sourceCount: sources.length }
      );
    }
  }

  /**
   * Clean up Merkle trees for old data
   */
  cleanupMerkleTrees(olderThan: Date): number {
    let cleanedCount = 0;

    for (const [dataId, tree] of this.merkleTrees) {
      // In a real implementation, you'd check timestamps
      // For now, just remove all trees (placeholder)
      this.merkleTrees.delete(dataId);
      cleanedCount++;
    }

    return cleanedCount;
  }

  /**
   * Get integrity statistics
   */
  getIntegrityStats(): {
    totalTrees: number;
    totalChecks: number;
    successRate: number;
  } {
    return {
      totalTrees: this.merkleTrees.size,
      totalChecks: 0, // Would track in real implementation
      successRate: 1.0 // Would calculate in real implementation
    };
  }
}