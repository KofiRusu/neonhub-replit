import crypto from 'crypto';
import {
  MerkleNode,
  MerkleProof,
  MerkleTreeConfig,
  MerkleTreeInterface,
  MerkleTreeError
} from '../types/index.js';

type RequiredMerkleConfig = Required<MerkleTreeConfig>;

type InternalNode = {
  hash: Buffer;
  node: MerkleNode;
};

const DEFAULT_CONFIG: RequiredMerkleConfig = {
  algorithm: 'sha256',
  leafEncoding: 'utf8',
  sortLeaves: false,
  sortPairs: true
};

export class MerkleTree implements MerkleTreeInterface {
  private readonly config: RequiredMerkleConfig;
  private leaves: string[] = [];
  private layers: Buffer[][] = [];
  private rootNode: MerkleNode | null = null;

  constructor(config: MerkleTreeConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async build(leaves: string[]): Promise<void> {
    if (!Array.isArray(leaves) || leaves.length === 0) {
      throw new MerkleTreeError('Cannot build tree with empty leaves');
    }

    const normalizedLeaves = this.config.sortLeaves ? [...leaves].sort() : [...leaves];
    this.leaves = normalizedLeaves;
    this.layers = [];

    const leafNodes: InternalNode[] = normalizedLeaves.map(leaf => {
      const hash = this.hashLeaf(leaf);
      return {
        hash,
        node: {
          hash: hash.toString('hex'),
          data: leaf
        }
      };
    });

    this.layers.push(leafNodes.map(node => node.hash));
    let currentLevel = leafNodes;

    while (currentLevel.length > 1) {
      const nextLevel: InternalNode[] = [];

      for (let index = 0; index < currentLevel.length; index += 2) {
        const left = currentLevel[index];
        const right = currentLevel[index + 1] ?? left;

        const [orderedLeft, orderedRight] = this.orderPair(left.hash, right.hash);
        const parentHash = this.hashPair(orderedLeft, orderedRight);
        const parentNode: InternalNode = {
          hash: parentHash,
          node: {
            hash: parentHash.toString('hex'),
            left: left.node,
            right: right.node
          }
        };

        nextLevel.push(parentNode);
      }

      this.layers.push(nextLevel.map(node => node.hash));
      currentLevel = nextLevel;
    }

    this.rootNode = currentLevel[0]?.node ?? null;

    if (!this.rootNode) {
      throw new MerkleTreeError('Failed to build Merkle tree');
    }
  }

  getRoot(): string {
    this.ensureTreeBuilt();
    return this.rootNode!.hash;
  }

  generateProof(leaf: string): MerkleProof {
    this.ensureTreeBuilt();

    const leafIndex = this.leaves.indexOf(leaf);
    if (leafIndex === -1) {
      throw new MerkleTreeError(`Leaf not found in tree: ${leaf}`);
    }

    const proof: string[] = [];
    let index = leafIndex;

    for (let level = 0; level < this.layers.length - 1; level++) {
      const layer = this.layers[level];
      const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;
      const sibling = layer[siblingIndex] ?? layer[index];
      proof.push(sibling.toString('hex'));
      index = Math.floor(index / 2);
    }

    return {
      leaf,
      proof,
      root: this.getRoot(),
      index: leafIndex
    };
  }

  verifyProof(leaf: string, proof: MerkleProof): boolean {
    if (!proof || !Array.isArray(proof.proof)) {
      return false;
    }

    let computed = this.hashLeaf(leaf);
    let index = proof.index;

    for (const siblingHex of proof.proof) {
      const sibling = Buffer.from(siblingHex, 'hex');

      if (this.config.sortPairs) {
        const [left, right] = this.orderPair(computed, sibling);
        computed = this.hashPair(left, right);
      } else if (index % 2 === 0) {
        computed = this.hashPair(computed, sibling);
      } else {
        computed = this.hashPair(sibling, computed);
      }

      index = Math.floor(index / 2);
    }

    return computed.toString('hex') === proof.root;
  }

  getLeaves(): string[] {
    return [...this.leaves];
  }

  getTree(): MerkleNode {
    this.ensureTreeBuilt();
    return this.rootNode!;
  }

  getProofIndices(leafIndex: number): number[] {
    this.ensureTreeBuilt();

    if (leafIndex < 0 || leafIndex >= this.leaves.length) {
      throw new MerkleTreeError(`Invalid leaf index: ${leafIndex}`);
    }

    const indices: number[] = [];
    let index = leafIndex;

    for (let level = 0; level < this.layers.length - 1; level++) {
      const layer = this.layers[level];
      const siblingIndex = index % 2 === 0 ? index + 1 : index - 1;
      indices.push(Math.min(siblingIndex, layer.length - 1));
      index = Math.floor(index / 2);
    }

    return indices;
  }

  verifyTree(): boolean {
    if (!this.rootNode || this.leaves.length === 0) {
      return false;
    }

    try {
      const recomputedRoot = this.computeRootFromLeaves();
      return recomputedRoot === this.rootNode.hash;
    } catch {
      return false;
    }
  }

  private ensureTreeBuilt(): void {
    if (!this.rootNode) {
      throw new MerkleTreeError('Tree not built yet');
    }
  }

  private computeRootFromLeaves(): string {
    let level = this.leaves.map(leaf => this.hashLeaf(leaf));

    while (level.length > 1) {
      const nextLevel: Buffer[] = [];

      for (let index = 0; index < level.length; index += 2) {
        const left = level[index];
        const right = level[index + 1] ?? left;
        const [orderedLeft, orderedRight] = this.orderPair(left, right);
        nextLevel.push(this.hashPair(orderedLeft, orderedRight));
      }

      level = nextLevel;
    }

    return level[0].toString('hex');
  }

  private hashLeaf(leaf: string): Buffer {
    const payload = this.encodeLeaf(leaf);
    return crypto.createHash(this.config.algorithm).update(payload).digest();
  }

  private hashPair(left: Buffer, right: Buffer): Buffer {
    return crypto.createHash(this.config.algorithm).update(Buffer.concat([left, right])).digest();
  }

  private orderPair(left: Buffer, right: Buffer): [Buffer, Buffer] {
    if (!this.config.sortPairs || Buffer.compare(left, right) <= 0) {
      return [left, right];
    }
    return [right, left];
  }

  private encodeLeaf(leaf: string): Buffer {
    if (this.config.leafEncoding === 'hex') {
      return this.isHexString(leaf) ? Buffer.from(leaf, 'hex') : Buffer.from(leaf, 'utf8');
    }
    return Buffer.from(leaf, this.config.leafEncoding);
  }

  private isHexString(value: string): boolean {
    return /^[0-9a-fA-F]+$/.test(value) && value.length % 2 === 0;
  }
}
