import { NeonHubClient } from '../index';
import { AuthenticationError, ValidationError, RateLimitError } from '../errors';

// Mock fetch globally
global.fetch = jest.fn();

describe('NeonHub SDK Client', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    it('should create a client with apiKey', () => {
      const client = new NeonHubClient({
        baseURL: 'https://api.test.com',
        apiKey: 'test-key'
      });
      expect(client).toBeInstanceOf(NeonHubClient);
      expect(client.agents).toBeDefined();
      expect(client.content).toBeDefined();
      expect(client.campaigns).toBeDefined();
    });

    it('should create a client with accessToken', () => {
      const client = new NeonHubClient({
        baseURL: 'https://api.test.com',
        accessToken: 'test-token'
      });
      expect(client).toBeInstanceOf(NeonHubClient);
    });

    it('should throw error if baseURL is missing', () => {
      expect(() => {
        new NeonHubClient({
          baseURL: '',
          apiKey: 'test-key'
        });
      }).toThrow('baseURL is required');
    });

    it('should throw error if no auth provided', () => {
      expect(() => {
        new NeonHubClient({
          baseURL: 'https://api.test.com'
        });
      }).toThrow('Either apiKey or accessToken is required. Set allowUnauthenticated to true when using mock transports.');
    });

    it('should allow unauthenticated usage when flag enabled', () => {
      const client = new NeonHubClient({
        baseURL: 'https://api.test.com',
        allowUnauthenticated: true
      });
      expect(client).toBeInstanceOf(NeonHubClient);
    });
  });

  describe('API Methods', () => {
    let client: NeonHubClient;

    beforeEach(() => {
      client = new NeonHubClient({
        baseURL: 'https://api.test.com',
        apiKey: 'test-key'
      });
    });

    it('should make GET request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => [{ id: '1', name: 'test-agent' }]
      });

      await client.agents.list();
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/agents'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-key'
          })
        })
      );
    });

    it('should make POST request', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '123', status: 'completed' })
      });

      await client.agents.execute({
        agent: 'test-agent',
        input: { test: true }
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/agents/execute'),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String)
        })
      );
    });

    it('should handle 401 authentication error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' })
      });

      await expect(client.agents.list()).rejects.toThrow(AuthenticationError);
    });

    it('should handle 400 validation error', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid input' })
      });

      await expect(client.agents.list()).rejects.toThrow(ValidationError);
    });

    it('should handle 429 rate limit error', async () => {
      jest.useRealTimers(); // Use real timers
      
      const noRetryClient = new NeonHubClient({
        baseURL: 'https://api.test.com',
        apiKey: 'test-key',
        maxRetries: 0
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: {
          get: (key: string) => key === 'Retry-After' ? '60' : null
        },
        json: async () => ({ message: 'Rate limit exceeded' })
      });

      await expect(noRetryClient.agents.list()).rejects.toThrow(RateLimitError);
    });

    it('should retry on network error', async () => {
      jest.useRealTimers(); // Use real timers for this test
      
      // First two attempts fail, third succeeds
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [{ data: 'success' }]
        });

      const testClient = new NeonHubClient({
        baseURL: 'https://api.test.com',
        apiKey: 'test-key',
        maxRetries: 2,
        timeout: 1000
      });

      await testClient.agents.list();
      expect(global.fetch).toHaveBeenCalledTimes(3);
    }, 10000);
  });

  describe('Ping method', () => {
    it('should test connectivity', async () => {
      const client = new NeonHubClient({
        baseURL: 'https://api.test.com',
        apiKey: 'test-key'
      });

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', version: '1.0.0' })
      });

      const result = await client.ping();
      expect(result).toEqual({ status: 'ok', version: '1.0.0' });
    });
  });

  describe('Static properties', () => {
    it('should return SDK version', () => {
      expect(NeonHubClient.version).toBe('1.0.0');
    });
  });
});
