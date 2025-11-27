import { z } from 'zod';
import { ToolContract } from '../types.js';

/**
 * Sample tool: Web Search
 */
export const webSearchTool: ToolContract<
  { query: string; maxResults?: number },
  { results: Array<{ title: string; url: string; snippet: string }> }
> = {
  metadata: {
    name: 'web_search',
    description: 'Search the web for information',
    version: '1.0.0',
    category: 'research',
    tags: ['search', 'web', 'information'],
  },
  inputSchema: z.object({
    query: z.string().min(1),
    maxResults: z.number().min(1).max(10).default(5),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        title: z.string(),
        url: z.string().url(),
        snippet: z.string(),
      })
    ),
  }),
  async execute(input) {
    // Mock implementation
    return {
      results: [
        {
          title: `Result for: ${input.query}`,
          url: 'https://example.com',
          snippet: `This is a sample result for "${input.query}"`,
        },
      ],
    };
  },
};

/**
 * Sample tool: Send Email
 */
export const sendEmailTool: ToolContract<
  { to: string; subject: string; body: string },
  { messageId: string; sent: boolean }
> = {
  metadata: {
    name: 'send_email',
    description: 'Send an email message',
    version: '1.0.0',
    category: 'communication',
    tags: ['email', 'communication'],
    requiresAuth: true,
  },
  inputSchema: z.object({
    to: z.string().email(),
    subject: z.string().min(1),
    body: z.string().min(1),
  }),
  outputSchema: z.object({
    messageId: z.string(),
    sent: z.boolean(),
  }),
  async execute(input) {
    // Mock implementation
    return {
      messageId: `msg_${Date.now()}`,
      sent: true,
    };
  },
};

/**
 * Sample tool: Calculate
 */
export const calculateTool: ToolContract<
  { expression: string },
  { result: number }
> = {
  metadata: {
    name: 'calculate',
    description: 'Evaluate a mathematical expression',
    version: '1.0.0',
    category: 'utility',
    tags: ['math', 'calculation'],
  },
  inputSchema: z.object({
    expression: z.string().min(1),
  }),
  outputSchema: z.object({
    result: z.number(),
  }),
  async execute(input) {
    // Simple eval (unsafe in production, use math.js or similar)
    try {
      const result = eval(input.expression);
      return { result: Number(result) };
    } catch (error) {
      throw new Error(`Invalid expression: ${(error as Error).message}`);
    }
  },
};

/**
 * Sample tool: Fetch URL
 */
export const fetchUrlTool: ToolContract<
  { url: string; method?: string },
  { status: number; data: unknown }
> = {
  metadata: {
    name: 'fetch_url',
    description: 'Fetch data from a URL',
    version: '1.0.0',
    category: 'network',
    tags: ['http', 'fetch', 'api'],
  },
  inputSchema: z.object({
    url: z.string().url(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).default('GET'),
  }),
  outputSchema: z.object({
    status: z.number(),
    data: z.unknown(),
  }),
  async execute(input) {
    const response = await fetch(input.url, { method: input.method });
    const data = await response.json();
    return {
      status: response.status,
      data,
    };
  },
};

