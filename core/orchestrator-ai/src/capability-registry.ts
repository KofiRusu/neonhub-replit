import pino from 'pino';
import { Capability } from './types.js';

const logger = pino({ name: 'capability-registry' });

/**
 * Registry for agent capabilities, tools, and services
 */
export class CapabilityRegistry {
  private capabilities: Map<string, Capability> = new Map();

  /**
   * Register a capability
   */
  register(capability: Capability): void {
    if (this.capabilities.has(capability.name)) {
      logger.warn({ name: capability.name }, 'Capability already registered, overwriting');
    }

    this.capabilities.set(capability.name, capability);
    logger.info({ name: capability.name, type: capability.type }, 'Capability registered');
  }

  /**
   * Unregister a capability
   */
  unregister(name: string): boolean {
    const deleted = this.capabilities.delete(name);
    if (deleted) {
      logger.info({ name }, 'Capability unregistered');
    }
    return deleted;
  }

  /**
   * Get a capability
   */
  get(name: string): Capability | undefined {
    return this.capabilities.get(name);
  }

  /**
   * Check if capability exists
   */
  has(name: string): boolean {
    return this.capabilities.has(name);
  }

  /**
   * Enable a capability
   */
  enable(name: string): boolean {
    const capability = this.capabilities.get(name);
    if (capability) {
      capability.enabled = true;
      logger.info({ name }, 'Capability enabled');
      return true;
    }
    return false;
  }

  /**
   * Disable a capability
   */
  disable(name: string): boolean {
    const capability = this.capabilities.get(name);
    if (capability) {
      capability.enabled = false;
      logger.info({ name }, 'Capability disabled');
      return true;
    }
    return false;
  }

  /**
   * List all capabilities
   */
  list(): Capability[] {
    return Array.from(this.capabilities.values());
  }

  /**
   * List enabled capabilities
   */
  listEnabled(): Capability[] {
    return Array.from(this.capabilities.values()).filter((c) => c.enabled);
  }

  /**
   * Get capabilities by type
   */
  getByType(type: 'tool' | 'agent' | 'service'): Capability[] {
    return Array.from(this.capabilities.values()).filter(
      (c) => c.enabled && c.type === type
    );
  }

  /**
   * Search capabilities
   */
  search(query: string): Capability[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.capabilities.values()).filter(
      (c) =>
        c.enabled &&
        (c.name.toLowerCase().includes(lowerQuery) ||
          c.description.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Clear all capabilities
   */
  clear(): void {
    this.capabilities.clear();
    logger.info('Registry cleared');
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    enabled: number;
    disabled: number;
    byType: Record<string, number>;
  } {
    let enabled = 0;
    let disabled = 0;
    const byType: Record<string, number> = {};

    for (const capability of this.capabilities.values()) {
      if (capability.enabled) {
        enabled++;
      } else {
        disabled++;
      }

      byType[capability.type] = (byType[capability.type] || 0) + 1;
    }

    return {
      total: this.capabilities.size,
      enabled,
      disabled,
      byType,
    };
  }

  /**
   * Export capability definitions for LLM
   */
  exportForLLM(): Array<{
    name: string;
    description: string;
    type: string;
    parameters?: any;
  }> {
    return Array.from(this.capabilities.values())
      .filter((c) => c.enabled)
      .map((c) => ({
        name: c.name,
        description: c.description,
        type: c.type,
        parameters: c.inputSchema,
      }));
  }

  /**
   * Bulk register capabilities
   */
  registerMany(capabilities: Capability[]): void {
    for (const capability of capabilities) {
      this.register(capability);
    }
    logger.info({ count: capabilities.length }, 'Bulk capabilities registered');
  }
}

