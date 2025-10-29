/**
 * NeonHub SDK - Official TypeScript/JavaScript SDK for NeonHub AI Marketing Platform
 * @packageDocumentation
 */

import { HTTPClient } from './client';
import { AgentsModule } from './modules/agents';
import { ContentModule } from './modules/content';
import { CampaignsModule } from './modules/campaigns';
import { MarketingModule } from './modules/marketing';
import { OrchestrationModule } from './modules/orchestration';
import { PersonModule } from './modules/person';
import { VoiceModule } from './modules/voice';
import { SendModule } from './modules/send';
import { BudgetModule } from './modules/budget';
import { EventsModule } from './modules/events';
import type { NeonHubConfig } from './types';

const getEnv = (key: string): string | undefined => {
  if (typeof process === 'undefined' || !process?.env) {
    return undefined;
  }
  return process.env[key];
};

const resolveBaseURL = (provided?: string): string => {
  const candidate =
    provided ??
    getEnv('NEONHUB_API_URL') ??
    getEnv('NEXT_PUBLIC_NH_API_URL') ??
    getEnv('NH_API_URL') ??
    'http://localhost:4000';

  if (!candidate) {
    throw new Error('baseURL is required');
  }

  return candidate.replace(/\/$/, '');
};

// Re-export types
export * from './types';
export * from './errors';

// Re-export client utilities (for mocking)
export { setTransport, resetTransport, call } from './client';
export type { Transport } from './client';

/**
 * NeonHub SDK Client
 *
 * @example
 * ```typescript
 * import { NeonHubClient } from '@neonhub/sdk';
 *
 * const client = new NeonHubClient({
 *   baseURL: 'https://api.neonhubecosystem.com',
 *   apiKey: 'your-api-key'
 * });
 *
 * // Execute an agent
 * const result = await client.agents.execute({
 *   agent: 'content-agent',
 *   input: { topic: 'AI Marketing' }
 * });
 * ```
 */
export class NeonHubClient {
  private httpClient: HTTPClient;

  /** Agent operations */
  public readonly agents: AgentsModule;

  /** Content operations */
  public readonly content: ContentModule;

  /** Campaign operations */
  public readonly campaigns: CampaignsModule;

  /** Marketing operations */
  public readonly marketing: MarketingModule;

  /** Orchestration operations */
  public readonly orchestration: OrchestrationModule;

  /** Person graph operations (identity, memory, consent) */
  public readonly person: PersonModule;

  /** Brand voice operations (composition, guardrails) */
  public readonly voice: VoiceModule;

  /** Multi-channel sending (email, SMS, DM) */
  public readonly send: SendModule;

  /** Budget allocation and spend management */
  public readonly budget: BudgetModule;

  /** Event queries and timeline */
  public readonly events: EventsModule;

  /**
   * Create a new NeonHub SDK client
   *
   * @param config - Client configuration
   */
  constructor(config: NeonHubConfig) {
    const baseURL = resolveBaseURL(config.baseURL);
    const apiKey = config.apiKey ?? getEnv('NEONHUB_API_KEY');
    const accessToken = config.accessToken ?? getEnv('NEONHUB_ACCESS_TOKEN');

    if (!apiKey && !accessToken && !config.allowUnauthenticated) {
      throw new Error(
        'Either apiKey or accessToken is required. Set allowUnauthenticated to true when using mock transports.'
      );
    }

    // Initialize HTTP client
    this.httpClient = new HTTPClient({
      ...config,
      baseURL,
      apiKey,
      accessToken,
    });

    // Initialize modules
    this.agents = new AgentsModule(this.httpClient);
    this.content = new ContentModule(this.httpClient);
    this.campaigns = new CampaignsModule(this.httpClient);
    this.marketing = new MarketingModule(this.httpClient);
    this.orchestration = new OrchestrationModule(this.httpClient);
    this.person = new PersonModule(this.httpClient);
    this.voice = new VoiceModule(this.httpClient);
    this.send = new SendModule(this.httpClient);
    this.budget = new BudgetModule(this.httpClient);
    this.events = new EventsModule(this.httpClient);
  }

  /**
   * Test API connectivity
   */
  async ping(): Promise<{ status: string; version: string }> {
    return this.httpClient.get('/health');
  }

  /**
   * Get SDK version
   */
  static get version(): string {
    return '1.0.0';
  }
}

const defaultDebug =
  (getEnv('NEONHUB_SDK_DEBUG') ?? '').toLowerCase() === 'true' ||
  (getEnv('NODE_ENV') ?? '').toLowerCase() === 'development';

const defaultConfig: NeonHubConfig = {
  baseURL: resolveBaseURL(undefined),
  apiKey: getEnv('NEONHUB_API_KEY'),
  accessToken: getEnv('NEONHUB_ACCESS_TOKEN'),
  allowUnauthenticated: true,
  debug: defaultDebug,
};

let nhInstance = new NeonHubClient(defaultConfig);

/**
 * Default ready-to-use client instance.
 * UI can import this directly: `import { nh } from '@neonhub/sdk';`
 */
export let nh = nhInstance;

/**
 * Reconfigure the shared client instance at runtime.
 * Useful for tests or environment overrides.
 */
export const configureNH = (config: Partial<NeonHubConfig>): NeonHubClient => {
  nhInstance = new NeonHubClient({
    ...defaultConfig,
    ...config,
    baseURL: resolveBaseURL(config.baseURL ?? defaultConfig.baseURL),
    allowUnauthenticated: config.allowUnauthenticated ?? true,
  });
  nh = nhInstance;
  return nhInstance;
};

// Default export
export default NeonHubClient;
