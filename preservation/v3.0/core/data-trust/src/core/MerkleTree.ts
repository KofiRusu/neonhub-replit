import { createHash } from 'crypto';
import { MerkleNode, MerkleProof, MerkleTreeConfig, MerkleTreeInterface, MerkleTreeError } from '../types/index.js';

export class MerkleTree implements MerkleTreeInterface {
  private leaves: string[] = [];
  private tree: MerkleNode[] = [];
  private config: MerkleTreeConfig;

  constructor(config: MerkleTreeConfig = {}) {
    this.config = {
      algorithm: 'sha256',
      leafEncoding: 'hex',
      sortLeaves: false,
      sortPairs: false,
      ...config
    };
  }

  /**
   * Build the Merkle tree from leaves
   */
  async build(leaves: string[]): Promise<void> {
    try {
      this.leaves = this.config.sortLeaves ? [...leaves].sort() : [...leaves];
      this.tree = [];

      if (this.leaves.length === 0) {
        throw new MerkleTreeError('Cannot build tree with empty leaves');
      }

      // Create leaf nodes
      const leafNodes: MerkleNode[] = this.leaves.map(leaf => ({
        hash: this.hashLeaf(leaf),
        data: leaf
      }));

      this.tree.push(...leafNodes);

      // Build tree upwards
      let currentLevel = leafNodes;
      while (currentLevel.length > 1) {
        currentLevel = this.buildNextLevel(currentLevel);
        this.tree.push(...currentLevel);
      }
    } catch (error) {
      throw new MerkleTreeError(
        'Failed to build Merkle tree',
        { originalError: error, leafCount: leaves.length }
      );
    }
  }

  /**
   * Get the root hash of the tree
   */
  getRoot(): string {
    if (this.tree.length === 0) {
      throw new MerkleTreeError('Tree not built yet');
    }

    const rootLevel = this.getLevel(this.getTreeHeight() - 1);
    return rootLevel[0].hash;
  }

  /**
   * Generate a proof for a specific leaf
   */
  generateProof(leaf: string): MerkleProof {
    const leafIndex = this.leaves.indexOf(leaf);
    if (leafIndex === -1) {
      throw new MerkleTreeError(`Leaf not found in tree: ${leaf}`);
    }

    const proof: string[] = [];
    let currentIndex = leafIndex;

    for (let level = 0; level < this.getTreeHeight() - 1; level++) {
      const levelNodes = this.getLevel(level);
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;

      if (siblingIndex < levelNodes.length) {
        proof.push(levelNodes[siblingIndex].hash);
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return {
      leaf,
      proof,
      root: this.getRoot(),
      index: leafIndex
    };
  }

  /**
   * Verify a proof against the tree
   */
  verifyProof(leaf: string, proof: MerkleProof): boolean {
    try {
      let hash = this.hashLeaf(leaf);

      for (const proofHash of proof.proof) {
        // Determine order based on index parity
        const isLeft = proof.index % 2 === 0;
        hash = this.hashPair(isLeft ? hash : proofHash, isLeft ? proofHash : hash);
        proof.index = Math.floor(proof.index / 2);
      }

      return hash === proof.root;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get all leaves
   */
  getLeaves(): string[] {
    return [...this.leaves];
  }

  /**
   * Get the complete tree structure
   */
  getTree(): MerkleNode {
    if (this.tree.length === 0) {
      throw new MerkleTreeError('Tree not built yet');
    }

    return this.reconstructTree();
  }

  /**
   * Get tree height
   */
  private getTreeHeight(): number {
    return Math.ceil(Math.log2(this.leaves.length)) + 1;
  }

  /**
   * Get nodes at a specific level
   */
  private getLevel(level: number): MerkleNode[] {
    const startIndex = level === 0 ? 0 : Math.pow(2, level) - 1;
    const endIndex = Math.pow(2, level + 1) - 1;
    return this.tree.slice(startIndex, Math.min(endIndex, this.tree.length));
  }

  /**
   * Hash a leaf node
   */
  private hashLeaf(leaf: string): string {
    const data = this.config.leafEncoding === 'hex' ? leaf : Buffer.from(leaf, 'utf8').toString('hex');
    return createHash(this.config.algorithm!).update(data).digest('hex');
  }

  /**
   * Hash a pair of nodes
   */
  private hashPair(left: string, right: string): string {
    const pair = this.config.sortPairs && left > right ? right + left : left + right;
    return createHash(this.config.algorithm!).update(pair).digest('hex');
  }

  /**
   * Build the next level of the tree
   */
  private buildNextLevel(currentLevel: MerkleNode[]): MerkleNode[] {
    const nextLevel: MerkleNode[] = [];

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;

      const combinedHash = this.hashPair(left.hash, right.hash);
      nextLevel.push({
        hash: combinedHash,
        left,
        right
      });
    }

    return nextLevel;
  }

  /**
   * Reconstruct the tree structure from flat array
   */
  private reconstructTree(): MerkleNode {
    if (this.tree.length === 0) return { hash: '' };

    const height = this.getTreeHeight();
    let levelStart = Math.pow(2, height - 2) - 1;

    const buildNode = (index: number, level: number): MerkleNode => {
      if (level === 0) {
        return this.tree[index];
      }

      const leftIndex = (index - (Math.pow(2, level - 1) - 1)) * 2;
      const rightIndex = leftIndex + 1;

      const leftChild = buildNode(leftIndex, level - 1);
      const rightChild = rightIndex < Math.pow(2, level - 1) ? buildNode(rightIndex, level - 1) : leftChild;

      return {
        hash: this.hashPair(leftChild.hash, rightChild.hash),
        left: leftChild,
        right: rightChild
      };
    };

    return buildNode(0, height - 1);
  }

  /**
   * Get proof indices for a given leaf index
   */
  getProofIndices(leafIndex: number): number[] {
    const indices: number[] = [];
    let currentIndex = leafIndex;

    for (let level = 0; level < this.getTreeHeight() - 1; level++) {
      const siblingIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      indices.push(siblingIndex);
      currentIndex = Math.floor(currentIndex / 2);
    }

    return indices;
  }

  /**
   * Verify tree consistency
   */
  verifyTree(): boolean {
    try {
      if (this.tree.length === 0) return false;

      // Verify each level
      for (let level = 0; level < this.getTreeHeight() - 1; level++) {
        const currentLevel = this.getLevel(level);
        const nextLevel = this.getLevel(level + 1);

        for (let i = 0; i < nextLevel.length; i++) {
          const leftIndex = i * 2;
          const rightIndex = i * 2 + 1;

          const leftHash = currentLevel[leftIndex].hash;
          const rightHash = rightIndex < currentLevel.length ? currentLevel[rightIndex].hash : leftHash;

          const expectedHash = this.hashPair(leftHash, rightHash);
          if (expectedHash !== nextLevel[i].hash) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}