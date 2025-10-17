import { MerkleTree } from '../core/MerkleTree.js';

describe('MerkleTree', () => {
  let tree: MerkleTree;

  beforeEach(() => {
    tree = new MerkleTree();
  });

  describe('build', () => {
    it('should build tree with single leaf', async () => {
      await tree.build(['leaf1']);
      const root = tree.getRoot();
      expect(root).toBeDefined();
      expect(typeof root).toBe('string');
    });

    it('should build tree with multiple leaves', async () => {
      await tree.build(['leaf1', 'leaf2', 'leaf3', 'leaf4']);
      const root = tree.getRoot();
      expect(root).toBeDefined();
    });

    it('should handle odd number of leaves', async () => {
      await tree.build(['leaf1', 'leaf2', 'leaf3']);
      const root = tree.getRoot();
      expect(root).toBeDefined();
    });
  });

  describe('generateProof', () => {
    it('should generate proof for existing leaf', async () => {
      await tree.build(['leaf1', 'leaf2', 'leaf3', 'leaf4']);
      const proof = tree.generateProof('leaf2');
      expect(proof).toBeDefined();
      expect(proof.leaf).toBe('leaf2');
      expect(proof.proof).toBeDefined();
      expect(proof.root).toBe(tree.getRoot());
    });

    it('should throw error for non-existing leaf', async () => {
      await tree.build(['leaf1', 'leaf2']);
      expect(() => tree.generateProof('nonexistent')).toThrow();
    });
  });

  describe('verifyProof', () => {
    it('should verify correct proof', async () => {
      await tree.build(['leaf1', 'leaf2', 'leaf3', 'leaf4']);
      const proof = tree.generateProof('leaf2');
      const isValid = tree.verifyProof('leaf2', proof);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect proof', async () => {
      await tree.build(['leaf1', 'leaf2']);
      const proof = tree.generateProof('leaf1');
      const isValid = tree.verifyProof('leaf2', proof);
      expect(isValid).toBe(false);
    });
  });

  describe('getLeaves', () => {
    it('should return all leaves', async () => {
      const leaves = ['leaf1', 'leaf2', 'leaf3'];
      await tree.build(leaves);
      expect(tree.getLeaves()).toEqual(leaves);
    });
  });

  describe('getTree', () => {
    it('should return tree structure', async () => {
      await tree.build(['leaf1', 'leaf2']);
      const treeStructure = tree.getTree();
      expect(treeStructure).toBeDefined();
      expect(treeStructure.hash).toBeDefined();
    });
  });

  describe('verifyTree', () => {
    it('should verify tree consistency', async () => {
      await tree.build(['leaf1', 'leaf2', 'leaf3', 'leaf4']);
      const isValid = tree.verifyTree();
      expect(isValid).toBe(true);
    });
  });

  describe('configuration', () => {
    it('should use custom configuration', () => {
      const customTree = new MerkleTree({
        algorithm: 'sha3-256',
        sortLeaves: true,
        sortPairs: true
      });
      expect(customTree).toBeDefined();
    });
  });
});