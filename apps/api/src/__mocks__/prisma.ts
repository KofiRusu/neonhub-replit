// @ts-nocheck
/**
 * Prisma Client Mock for Tests
 * Provides in-memory test data and deterministic responses
 */

// Use require for Jest compatibility (avoid ESM hoisting issues)
import { jest } from '@jest/globals';

// In-memory data stores
const agents = new Map();
const agentRuns = new Map();
const toolExecutions = new Map();
const runSteps = new Map();
const tools = new Map();
const organizations = new Map();
const users = new Map();
const contentDrafts = new Map();

// Add default test data
organizations.set('test-org-id', {
  id: 'test-org-id',
  name: 'Test Organization',
  slug: 'test-org',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

users.set('test-user-id', {
  id: 'test-user-id',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

agents.set('test-agent-id', {
  id: 'test-agent-id',
  organizationId: 'test-org-id',
  name: 'ContentAgent',
  slug: 'content',
  kind: 'COPILOT',
  status: 'ACTIVE',
  description: 'Test content agent',
  config: {},
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
});

// Generate unique IDs
let idCounter = 1000;
const generateId = () => `test-id-${idCounter++}`;

// Mock Prisma Client
export const mockPrismaClient: any = {
  // Connection methods
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  $transaction: jest.fn((callback) => {
    if (typeof callback === 'function') {
      return callback(mockPrismaClient);
    }
    return Promise.all(callback);
  }),
  $executeRaw: jest.fn().mockResolvedValue(1),
  $queryRaw: jest.fn().mockResolvedValue([]),

  // Agent model
  agent: {
    findFirst: jest.fn((args) => {
      const where = args?.where || {};
      for (const [, agent] of agents.entries()) {
        if (where.id && agent.id !== where.id) continue;
        if (where.organizationId && agent.organizationId !== where.organizationId) continue;
        if (where.name && agent.name !== where.name) continue;
        return Promise.resolve(agent);
      }
      return Promise.resolve(null);
    }),
    findUnique: jest.fn((args) => {
      const id = args?.where?.id;
      return Promise.resolve(agents.get(id) || null);
    }),
    findMany: jest.fn((args) => {
      const where = args?.where || {};
      const results = Array.from(agents.values()).filter((agent) => {
        if (where.organizationId && agent.organizationId !== where.organizationId) return false;
        if (where.status && agent.status !== where.status) return false;
        return true;
      });
      return Promise.resolve(results);
    }),
    create: jest.fn((args) => {
      const id = generateId();
      const connectOrgId =
        args.data?.organizationId ??
        args.data?.organization?.connect?.id ??
        args.data?.organization?.id;
      const agent = {
        id,
        ...args.data,
        organizationId: connectOrgId ?? 'test-org-id',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      delete (agent as any).organization;
      agents.set(id, agent);
      return Promise.resolve(agent);
    }),
    update: jest.fn((args) => {
      const id = args.where.id;
      const existing = agents.get(id);
      if (!existing) throw new Error(`Agent ${id} not found`);
      const updated = {
        ...existing,
        ...args.data,
        updatedAt: new Date(),
      };
      agents.set(id, updated);
      return Promise.resolve(updated);
    }),
    delete: jest.fn((args) => {
      const id = args.where.id;
      const agent = agents.get(id);
      agents.delete(id);
      return Promise.resolve(agent);
    }),
    deleteMany: jest.fn((args) => {
      const where = args?.where || {};
      let count = 0;
      for (const [id, agent] of agents.entries()) {
        if (where.organizationId && agent.organizationId !== where.organizationId) continue;
        agents.delete(id);
        count += 1;
      }
      return Promise.resolve({ count });
    }),
  },

  // AgentRun model
  agentRun: {
    create: jest.fn((args) => {
      const id = generateId();
      const run = {
        id,
        ...args.data,
        agentId: args.data.agentId,
        organizationId: args.data.organizationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      agentRuns.set(id, run);
      return Promise.resolve(run);
    }),
    findUnique: jest.fn((args) => {
      const id = args?.where?.id;
      const includeAgent = args?.include?.agent ?? false;
      const run = agentRuns.get(id);
      if (!run) {
        return Promise.resolve(null);
      }
      if (!includeAgent) {
        return Promise.resolve(run);
      }
      return Promise.resolve({
        ...run,
        agent: agents.get(run.agentId) || null,
      });
    }),
    findMany: jest.fn((args) => {
      const where = args?.where || {};
      const includeAgent = args?.include?.agent ?? false;
      const results = Array.from(agentRuns.values()).filter((run) => {
        if (where.agentId && run.agentId !== where.agentId) return false;
        if (where.status && run.status !== where.status) return false;
        return true;
      });
      const mapped = includeAgent
        ? results.map((run) => ({
            ...run,
            agent: agents.get(run.agentId) || null,
          }))
        : results;
      return Promise.resolve(mapped);
    }),
    update: jest.fn((args) => {
      const id = args.where.id;
      const existing = agentRuns.get(id);
      if (!existing) throw new Error(`AgentRun ${id} not found`);
      const updated = {
        ...existing,
        ...args.data,
        updatedAt: new Date(),
      };
      agentRuns.set(id, updated);
      return Promise.resolve(updated);
    }),
    deleteMany: jest.fn((args) => {
      const where = args?.where || {};
      let count = 0;
      for (const [id, run] of agentRuns.entries()) {
        if (where.organizationId && run.organizationId !== where.organizationId) continue;
        agentRuns.delete(id);
        count += 1;
      }
      return Promise.resolve({ count });
    }),
  },

  // RunStep model
  runStep: {
    create: jest.fn((args) => {
      const id = generateId();
      const step = {
        id,
        ...args.data,
        createdAt: new Date(),
      };
      runSteps.set(id, step);
      return Promise.resolve(step);
    }),
    update: jest.fn((args) => {
      const id = args.where.id;
      const existing = runSteps.get(id);
      if (!existing) {
        throw new Error(`RunStep ${id} not found`);
      }
      const updated = {
        ...existing,
        ...args.data,
      };
      runSteps.set(id, updated);
      return Promise.resolve(updated);
    }),
    findMany: jest.fn((args) => {
      const where = args?.where || {};
      const results = Array.from(runSteps.values()).filter((step) => {
        if (where.runId && step.runId !== where.runId) return false;
        return true;
      });
      return Promise.resolve(results);
    }),
  },

  // ToolExecution model
  toolExecution: {
    create: jest.fn((args) => {
      const id = generateId();
      const execution = {
        id,
        ...args.data,
        createdAt: new Date(),
      };
      toolExecutions.set(id, execution);
      return Promise.resolve(execution);
    }),
    findMany: jest.fn((args) => {
      const where = args?.where || {};
      const results = Array.from(toolExecutions.values()).filter((exec) => {
        if (where.runId && exec.runId !== where.runId) return false;
        return true;
      });
      return Promise.resolve(results);
    }),
    update: jest.fn((args) => {
      const id = args?.where?.id;
      const existing = id ? toolExecutions.get(id) : undefined;
      if (!existing) {
        throw new Error(`ToolExecution ${id} not found`);
      }
      const updated = {
        ...existing,
        ...args.data,
      };
      toolExecutions.set(id, updated);
      return Promise.resolve(updated);
    }),
  },

  // Tool model
  tool: {
    upsert: jest.fn((args) => {
      const orgId = args?.where?.organizationId_slug?.organizationId;
      const slug = args?.where?.organizationId_slug?.slug;
      const key = `${orgId}:${slug}`;
      const existing = tools.get(key);
      if (existing) {
        const updated = {
          ...existing,
          ...args.update,
          updatedAt: new Date(),
        };
        tools.set(key, updated);
        return Promise.resolve(updated);
      }

      const id = generateId();
      const record = {
        id,
        organizationId: orgId,
        slug,
        ...args.create,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      tools.set(key, record);
      return Promise.resolve(record);
    }),
  },

  // AgentRunMetric model
  agentRunMetric: {
    create: jest.fn((args) => {
      const id = generateId();
      const metric = {
        id,
        ...args.data,
        createdAt: new Date(),
      };
      return Promise.resolve(metric);
    }),
  },

  // Organization model
  organization: {
    findUnique: jest.fn((args) => {
      const id = args?.where?.id;
      return Promise.resolve(organizations.get(id) || null);
    }),
    findFirst: jest.fn(() => {
      return Promise.resolve(Array.from(organizations.values())[0] || null);
    }),
    findMany: jest.fn(() => {
      return Promise.resolve(Array.from(organizations.values()));
    }),
    create: jest.fn((args) => {
      const id = generateId();
      const org = {
        id,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      organizations.set(id, org);
      return Promise.resolve(org);
    }),
    deleteMany: jest.fn((args) => {
      const where = args?.where || {};
      let count = 0;
      for (const [id, org] of organizations.entries()) {
        if (where.id && org.id !== where.id) continue;
        if (where.slug && org.slug !== where.slug) continue;
        organizations.delete(id);
        count += 1;
      }
      return Promise.resolve({ count });
    }),
  },

  // User model
  user: {
    findUnique: jest.fn((args) => {
      const id = args?.where?.id;
      return Promise.resolve(users.get(id) || null);
    }),
    findFirst: jest.fn(() => {
      return Promise.resolve(Array.from(users.values())[0] || null);
    }),
    findMany: jest.fn(() => {
      return Promise.resolve(Array.from(users.values()));
    }),
    create: jest.fn((args) => {
      const id = generateId();
      const user = {
        id,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      users.set(id, user);
      return Promise.resolve(user);
    }),
    deleteMany: jest.fn((args) => {
      const where = args?.where || {};
      let count = 0;
      for (const [id, user] of users.entries()) {
        if (where.id && user.id !== where.id) continue;
        if (where.email && user.email !== where.email) continue;
        users.delete(id);
        count += 1;
      }
      return Promise.resolve({ count });
    }),
  },

  // ContentDraft model
  contentDraft: {
    create: jest.fn((args) => {
      const id = generateId();
      const draft = {
        id,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      contentDrafts.set(id, draft);
      return Promise.resolve(draft);
    }),
    findUnique: jest.fn((args) => {
      const id = args?.where?.id;
      return Promise.resolve(contentDrafts.get(id) || null);
    }),
    findMany: jest.fn(() => {
      return Promise.resolve(Array.from(contentDrafts.values()));
    }),
    update: jest.fn((args) => {
      const id = args.where.id;
      const existing = contentDrafts.get(id);
      if (!existing) throw new Error(`ContentDraft ${id} not found`);
      const updated = {
        ...existing,
        ...args.data,
        updatedAt: new Date(),
      };
      contentDrafts.set(id, updated);
      return Promise.resolve(updated);
    }),
    delete: jest.fn((args) => {
      const id = args.where.id;
      const draft = contentDrafts.get(id);
      contentDrafts.delete(id);
      return Promise.resolve(draft);
    }),
  },

  // Person model
  person: {
    findFirst: jest.fn().mockResolvedValue(null),
    findMany: jest.fn().mockResolvedValue([]),
    create: jest.fn((args) => {
      const id = generateId();
      return Promise.resolve({
        id,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }),
    upsert: jest.fn((args) => {
      const id = generateId();
      return Promise.resolve({
        id,
        ...args.create,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }),
  },

  // Event model
  event: {
    create: jest.fn((args) => {
      const id = generateId();
      return Promise.resolve({
        id,
        ...args.data,
        createdAt: new Date(),
      });
    }),
    findMany: jest.fn().mockResolvedValue([]),
  },

  // BrandVoice model
  brandVoice: {
    findFirst: jest.fn().mockResolvedValue({
      id: 'test-brand-voice-id',
      brandId: 'test-brand-id',
      embeddingSpaceId: 'test-space-id',
      promptTemplate: 'Test prompt template',
      styleRulesJson: { tone: 'professional', style: 'concise' },
      createdAt: new Date(),
      updatedAt: new Date(),
    }),
    findMany: jest.fn().mockResolvedValue([]),
  },

  // Connector model
  connector: {
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn((args) => {
      const id = generateId();
      return Promise.resolve({
        id,
        ...args.data,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }),
  },
};

// Export for tests (CommonJS for Jest compatibility)
module.exports = {
  mockPrismaClient,
  prisma: mockPrismaClient,
  resetMockData,
};

// Helper to reset all data between tests
function resetMockData() {
  agents.clear();
  agentRuns.clear();
  toolExecutions.clear();
  runSteps.clear();
  tools.clear();
  contentDrafts.clear();
  
  // Restore default test data
  organizations.set('test-org-id', {
    id: 'test-org-id',
    name: 'Test Organization',
    slug: 'test-org',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

  users.set('test-user-id', {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });

  agents.set('test-agent-id', {
    id: 'test-agent-id',
    organizationId: 'test-org-id',
    name: 'ContentAgent',
    slug: 'content',
    kind: 'COPILOT',
    status: 'ACTIVE',
    description: 'Test content agent',
    config: {},
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  });
}
