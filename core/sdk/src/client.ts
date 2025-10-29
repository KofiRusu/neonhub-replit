/**
 * HTTP Client for NeonHub SDK
 * Supports pluggable transport for mocking
 */

import type { NeonHubConfig } from './types';

export type Transport = (input: {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  body?: any;
  headers?: Record<string, string>;
}) => Promise<any>;

// Default fetch-based transport
const defaultTransport: Transport = async ({ method, url, body, headers = {} }) => {
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  }

  return res.json();
};

let transport: Transport = defaultTransport;

/**
 * Set a custom transport (useful for mocking)
 */
export function setTransport(t: Transport) {
  transport = t;
}

/**
 * Reset to default fetch transport
 */
export function resetTransport() {
  transport = defaultTransport;
}

/**
 * Direct transport call helper (used by lightweight adapters)
 */
export function call(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  body?: any,
  headers?: Record<string, string>
) {
  return transport({
    method,
    url,
    body,
    headers,
  });
}

/**
 * HTTP Client with retry logic and error handling
 */
export class HTTPClient {
  private baseURL: string;
  private apiKey?: string;
  private accessToken?: string;
  private timeout: number;
  private maxRetries: number;
  private debug: boolean;
  private customHeaders: Record<string, string>;

  constructor(config: NeonHubConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
    this.accessToken = config.accessToken;
    this.timeout = config.timeout || 30000;
    this.maxRetries = config.maxRetries || 3;
    this.debug = config.debug || false;
    this.customHeaders = config.headers || {};
  }

  private getAuthHeaders(): Record<string, string> {
    if (this.apiKey) {
      return { Authorization: `Bearer ${this.apiKey}` };
    }
    if (this.accessToken) {
      return { Authorization: `Bearer ${this.accessToken}` };
    }
    return {};
  }

  private log(...args: any[]) {
    if (this.debug) {
      console.log('[NeonHub SDK]', ...args);
    }
  }

  async request<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    path: string,
    options: {
      body?: any;
      query?: Record<string, any>;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const url = this.buildURL(path, options.query);
    const headers = {
      ...this.customHeaders,
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    this.log(`${method} ${url}`);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const result = await transport({
          method,
          url,
          body: options.body,
          headers,
        });

        clearTimeout(timeoutId);
        this.log(`${method} ${url} - Success`);
        return result;
      } catch (error: any) {
        lastError = error;
        this.log(`${method} ${url} - Attempt ${attempt + 1} failed:`, error.message);

        // Don't retry on client errors (4xx)
        if (error.message?.includes('HTTP 4')) {
          throw error;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < this.maxRetries) {
          await this.sleep(Math.pow(2, attempt) * 1000);
        }
      }
    }

    throw lastError || new Error('Request failed after retries');
  }

  private buildURL(path: string, query?: Record<string, any>): string {
    let url = `${this.baseURL}${path}`;

    if (query) {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(key, String(v)));
          } else if (value instanceof Date) {
            params.append(key, value.toISOString());
          } else {
            params.append(key, String(value));
          }
        }
      });
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    return url;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Convenience methods
  async get<T = any>(path: string, options?: { query?: Record<string, any> }): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  async post<T = any>(
    path: string,
    options?: { body?: any; query?: Record<string, any> }
  ): Promise<T> {
    return this.request<T>('POST', path, options);
  }

  async put<T = any>(
    path: string,
    options?: { body?: any; query?: Record<string, any> }
  ): Promise<T> {
    return this.request<T>('PUT', path, options);
  }

  async patch<T = any>(
    path: string,
    options?: { body?: any; query?: Record<string, any> }
  ): Promise<T> {
    return this.request<T>('PATCH', path, options);
  }

  async delete<T = any>(path: string, options?: { query?: Record<string, any> }): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }
}
