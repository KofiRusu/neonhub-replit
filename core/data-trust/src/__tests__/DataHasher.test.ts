import { DataHasher } from '../core/DataHasher.js';

describe('DataHasher', () => {
  let hasher: DataHasher;

  beforeEach(() => {
    hasher = new DataHasher();
  });

  describe('hash', () => {
    it('should hash a string using default algorithm', async () => {
      const result = await hasher.hash('test data');
      expect(result).toBeDefined();
      expect(result.hash).toBeDefined();
      expect(result.algorithm).toBe('sha256');
      expect(result.dataSize).toBe(9);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should hash a buffer', async () => {
      const buffer = Buffer.from('test data');
      const result = await hasher.hash(buffer);
      expect(result).toBeDefined();
      expect(result.hash).toMatch(/^[a-f0-9]+$/);
    });

    it('should use specified algorithm', async () => {
      const result = await hasher.hash('test data', 'sha3-256');
      expect(result.algorithm).toBe('sha3-256');
    });

    it('should produce consistent hashes', async () => {
      const result1 = await hasher.hash('test data');
      const result2 = await hasher.hash('test data');
      expect(result1.hash).toBe(result2.hash);
    });

    it('should produce different hashes for different data', async () => {
      const result1 = await hasher.hash('test data 1');
      const result2 = await hasher.hash('test data 2');
      expect(result1.hash).not.toBe(result2.hash);
    });
  });

  describe('verify', () => {
    it('should verify correct hash', async () => {
      const result = await hasher.hash('test data');
      const isValid = await hasher.verify('test data', result.hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect hash', async () => {
      const isValid = await hasher.verify('test data', 'invalidhash');
      expect(isValid).toBe(false);
    });
  });

  describe('hashMultiple', () => {
    it('should hash multiple data items', async () => {
      const result = await hasher.hashMultiple(['item1', 'item2', 'item3']);
      expect(result).toBeDefined();
      expect(result.hash).toBeDefined();
      expect(result.dataSize).toBe(15); // Combined length: 5+5+5
    });
  });

  describe('doubleHash', () => {
    it('should perform double hashing', async () => {
      const result = await hasher.doubleHash('test data');
      expect(result).toBeDefined();
      expect(result.hash).toBeDefined();
    });
  });

  describe('getAvailableAlgorithms', () => {
    it('should return available algorithms', () => {
      const algorithms = hasher.getAvailableAlgorithms();
      expect(algorithms).toContain('sha256');
      expect(algorithms).toContain('sha3-256');
      expect(algorithms).toContain('blake2b-256');
    });
  });

  describe('getHashLength', () => {
    it('should return correct hash lengths', () => {
      expect(hasher.getHashLength('sha256')).toBe(32);
      expect(hasher.getHashLength('sha3-512')).toBe(64);
      expect(hasher.getHashLength('blake2b-256')).toBe(32);
    });
  });
});