import { IntegrityVerifier } from '../core/IntegrityVerifier.js';

describe('IntegrityVerifier', () => {
  let verifier: IntegrityVerifier;

  beforeEach(() => {
    verifier = new IntegrityVerifier();
  });

  describe('checkIntegrity', () => {
    it('should verify data integrity with expected hash', async () => {
      const data = 'test data';
      const hashResult = await verifier['hasher'].hash(data);
      
      const check = await verifier.checkIntegrity('data-1', data, hashResult.hash);
      expect(check.isValid).toBe(true);
      expect(check.dataId).toBe('data-1');
      expect(check.actualHash).toBe(hashResult.hash);
    });

    it('should detect invalid hash', async () => {
      const data = 'test data';
      const check = await verifier.checkIntegrity('data-1', data, 'wronghash');
      expect(check.isValid).toBe(false);
    });

    it('should work without expected hash', async () => {
      const data = 'test data';
      const check = await verifier.checkIntegrity('data-1', data);
      expect(check.isValid).toBe(true);
      expect(check.expectedHash).toBe(check.actualHash);
    });
  });

  describe('batchCheckIntegrity', () => {
    it('should check multiple data items', async () => {
      const checks = await verifier.batchCheckIntegrity([
        { dataId: 'data-1', data: 'test1' },
        { dataId: 'data-2', data: 'test2' },
        { dataId: 'data-3', data: 'test3' }
      ]);

      expect(checks).toHaveLength(3);
      checks.forEach(check => {
        expect(check.isValid).toBe(true);
      });
    });
  });

  describe('createMerkleTree', () => {
    it('should create Merkle tree for dataset', async () => {
      const root = await verifier.createMerkleTree('dataset-1', ['item1', 'item2', 'item3']);
      expect(root).toBeDefined();
      expect(typeof root).toBe('string');
    });
  });

  describe('generateMerkleProof', () => {
    it('should generate proof for data item', async () => {
      await verifier.createMerkleTree('dataset-1', ['item1', 'item2', 'item3']);
      const proof = verifier.generateMerkleProof('dataset-1', 'item1');
      
      expect(proof).toBeDefined();
      expect(proof.leaf).toBe('item1');
      expect(proof.proof).toBeDefined();
      expect(proof.root).toBeDefined();
    });

    it('should throw error for non-existing tree', () => {
      expect(() => verifier.generateMerkleProof('nonexistent', 'item1')).toThrow();
    });
  });

  describe('verifyMerkleProof', () => {
    it('should verify valid Merkle proof', async () => {
      await verifier.createMerkleTree('dataset-1', ['item1', 'item2', 'item3']);
      const proof = verifier.generateMerkleProof('dataset-1', 'item1');
      
      const isValid = await verifier.verifyMerkleProof('dataset-1', proof);
      expect(isValid).toBe(true);
    });
  });

  describe('comprehensiveIntegrityCheck', () => {
    it('should perform comprehensive integrity check', async () => {
      const data = 'test data';
      const hashResult = await verifier['hasher'].hash(data);
      
      const result = await verifier.comprehensiveIntegrityCheck('data-1', data, {
        expectedHash: hashResult.hash
      });

      expect(result.hashCheck.isValid).toBe(true);
      expect(result.overallValid).toBe(true);
    });
  });

  describe('validateDataFormat', () => {
    it('should validate JSON format', async () => {
      const isValid = await verifier.validateDataFormat('data-1', '{"key": "value"}', 'json');
      expect(isValid).toBe(true);
    });

    it('should reject invalid JSON format', async () => {
      const isValid = await verifier.validateDataFormat('data-1', 'not json', 'json');
      expect(isValid).toBe(false);
    });

    it('should validate CSV format', async () => {
      const isValid = await verifier.validateDataFormat('data-1', 'col1,col2\nval1,val2', 'csv');
      expect(isValid).toBe(true);
    });
  });

  describe('checkConsistency', () => {
    it('should check consistency across sources', async () => {
      const data = 'consistent data';
      const result = await verifier.checkConsistency('data-1', [
        { source: 'source1', data },
        { source: 'source2', data },
        { source: 'source3', data }
      ]);

      expect(result.consistent).toBe(true);
      expect(result.sourceResults).toHaveLength(3);
    });

    it('should detect inconsistency', async () => {
      const result = await verifier.checkConsistency('data-1', [
        { source: 'source1', data: 'data1' },
        { source: 'source2', data: 'data2' }
      ]);

      expect(result.consistent).toBe(false);
    });
  });
});