import pino from 'pino';
import { ToolContract, ToolRegistration, ToolMetadata } from './types.js';

const logger = pino({ name: 'tool-registry' });

/**
 * Central registry for tool contracts
 */
export class ToolRegistry {
  private tools: Map<string, ToolRegistration> = new Map();

  /**
   * Register a tool
   */
  register<TInput, TOutput>(contract: ToolContract<TInput, TOutput>, enabled = true): void {
    const { name, version } = contract.metadata;
    const key = this.getKey(name, version);

    if (this.tools.has(key)) {
      logger.warn({ name, version }, 'Tool already registered, overwriting');
    }

    this.tools.set(key, {
      contract: contract as ToolContract,
      enabled,
    });

    logger.info({ name, version, enabled }, 'Tool registered');
  }

  /**
   * Unregister a tool
   */
  unregister(name: string, version = '1.0.0'): boolean {
    const key = this.getKey(name, version);
    const deleted = this.tools.delete(key);

    if (deleted) {
      logger.info({ name, version }, 'Tool unregistered');
    } else {
      logger.warn({ name, version }, 'Tool not found');
    }

    return deleted;
  }

  /**
   * Get a tool contract
   */
  get(name: string, version = '1.0.0'): ToolContract | undefined {
    const key = this.getKey(name, version);
    const registration = this.tools.get(key);

    if (!registration) {
      logger.warn({ name, version }, 'Tool not found');
      return undefined;
    }

    if (!registration.enabled) {
      logger.warn({ name, version }, 'Tool is disabled');
      return undefined;
    }

    return registration.contract;
  }

  /**
   * Check if tool exists
   */
  has(name: string, version = '1.0.0'): boolean {
    const key = this.getKey(name, version);
    return this.tools.has(key);
  }

  /**
   * Enable a tool
   */
  enable(name: string, version = '1.0.0'): boolean {
    const key = this.getKey(name, version);
    const registration = this.tools.get(key);

    if (!registration) {
      logger.warn({ name, version }, 'Tool not found');
      return false;
    }

    registration.enabled = true;
    logger.info({ name, version }, 'Tool enabled');
    return true;
  }

  /**
   * Disable a tool
   */
  disable(name: string, version = '1.0.0'): boolean {
    const key = this.getKey(name, version);
    const registration = this.tools.get(key);

    if (!registration) {
      logger.warn({ name, version }, 'Tool not found');
      return false;
    }

    registration.enabled = false;
    logger.info({ name, version }, 'Tool disabled');
    return true;
  }

  /**
   * List all registered tools
   */
  list(): ToolMetadata[] {
    return Array.from(this.tools.values()).map((reg) => reg.contract.metadata);
  }

  /**
   * List enabled tools
   */
  listEnabled(): ToolMetadata[] {
    return Array.from(this.tools.values())
      .filter((reg) => reg.enabled)
      .map((reg) => reg.contract.metadata);
  }

  /**
   * Get tools by category
   */
  getByCategory(category: string): ToolContract[] {
    return Array.from(this.tools.values())
      .filter((reg) => reg.enabled && reg.contract.metadata.category === category)
      .map((reg) => reg.contract);
  }

  /**
   * Get tools by tag
   */
  getByTag(tag: string): ToolContract[] {
    return Array.from(this.tools.values())
      .filter((reg) => reg.enabled && reg.contract.metadata.tags.includes(tag))
      .map((reg) => reg.contract);
  }

  /**
   * Search tools
   */
  search(query: string): ToolContract[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.tools.values())
      .filter((reg) => {
        const meta = reg.contract.metadata;
        return (
          reg.enabled &&
          (meta.name.toLowerCase().includes(lowerQuery) ||
            meta.description.toLowerCase().includes(lowerQuery) ||
            meta.tags.some((t) => t.toLowerCase().includes(lowerQuery)))
        );
      })
      .map((reg) => reg.contract);
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.tools.clear();
    logger.info('Registry cleared');
  }

  /**
   * Get statistics
   */
  getStats(): { total: number; enabled: number; disabled: number; categories: string[] } {
    let enabled = 0;
    let disabled = 0;
    const categories = new Set<string>();

    for (const reg of this.tools.values()) {
      if (reg.enabled) {
        enabled++;
      } else {
        disabled++;
      }

      if (reg.contract.metadata.category) {
        categories.add(reg.contract.metadata.category);
      }
    }

    return {
      total: this.tools.size,
      enabled,
      disabled,
      categories: Array.from(categories),
    };
  }

  /**
   * Generate key for tool lookup
   */
  private getKey(name: string, version: string): string {
    return `${name}@${version}`;
  }

  /**
   * Export OpenAI function calling format
   */
  exportOpenAIFunctions(): Array<{
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  }> {
    return Array.from(this.tools.values())
      .filter((reg) => reg.enabled)
      .map((reg) => {
        const { name, description } = reg.contract.metadata;
        
        // Convert Zod schema to JSON Schema
        // Note: In production, use zodToJsonSchema library
        const parameters = {
          type: 'object',
          properties: {},
          required: [],
        };

        return {
          name,
          description,
          parameters,
        };
      });
  }
}

