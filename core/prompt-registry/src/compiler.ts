import Handlebars from 'handlebars';
import crypto from 'crypto';
import pino from 'pino';
import { PromptTemplate, CompiledPrompt } from './types.js';

const logger = pino({ name: 'prompt-compiler' });

/**
 * Prompt compiler using Handlebars templates
 */
export class PromptCompiler {
  private handlebars: typeof Handlebars;

  constructor() {
    this.handlebars = Handlebars.create();
    this.registerHelpers();
  }

  /**
   * Register custom Handlebars helpers
   */
  private registerHelpers(): void {
    // Uppercase helper
    this.handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : '';
    });

    // Lowercase helper
    this.handlebars.registerHelper('lowercase', (str: string) => {
      return str ? str.toLowerCase() : '';
    });

    // Capitalize helper
    this.handlebars.registerHelper('capitalize', (str: string) => {
      return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    });

    // Truncate helper
    this.handlebars.registerHelper('truncate', (str: string, length: number) => {
      if (!str) return '';
      return str.length > length ? str.substring(0, length) + '...' : str;
    });

    // JSON stringify helper
    this.handlebars.registerHelper('json', (obj: unknown) => {
      return JSON.stringify(obj, null, 2);
    });

    // Join array helper
    this.handlebars.registerHelper('join', (arr: string[], separator = ', ') => {
      return arr ? arr.join(separator) : '';
    });

    // Conditional helpers
    this.handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);
    this.handlebars.registerHelper('ne', (a: unknown, b: unknown) => a !== b);
    this.handlebars.registerHelper('gt', (a: number, b: number) => a > b);
    this.handlebars.registerHelper('lt', (a: number, b: number) => a < b);
    this.handlebars.registerHelper('gte', (a: number, b: number) => a >= b);
    this.handlebars.registerHelper('lte', (a: number, b: number) => a <= b);
  }

  /**
   * Compile a prompt template with variables
   */
  compile(
    template: PromptTemplate,
    variables: Record<string, unknown> = {}
  ): CompiledPrompt {
    logger.info({ promptId: template.metadata.id, version: template.metadata.version }, 'Compiling prompt');

    // Validate required variables
    const missingVars = template.metadata.variables.filter((v) => !(v in variables));
    if (missingVars.length > 0) {
      logger.warn({ promptId: template.metadata.id, missingVars }, 'Missing required variables');
    }

    try {
      // Compile system prompt if provided
      const system = template.system
        ? this.handlebars.compile(template.system)(variables)
        : undefined;

      // Compile user prompt
      const user = this.handlebars.compile(template.template)(variables);

      // Compile examples if provided
      const examples = template.examples?.map((example) => ({
        user: this.handlebars.compile(example.user)(variables),
        assistant: this.handlebars.compile(example.assistant)(variables),
      }));

      logger.info({ promptId: template.metadata.id }, 'Prompt compiled successfully');

      return {
        id: template.metadata.id,
        version: template.metadata.version,
        system,
        user,
        examples,
        metadata: template.metadata,
      };
    } catch (error) {
      logger.error({ error: (error as Error).message, promptId: template.metadata.id }, 'Failed to compile prompt');
      throw new Error(`Failed to compile prompt ${template.metadata.id}: ${(error as Error).message}`);
    }
  }

  /**
   * Compute hash of compiled prompt for snapshot testing
   */
  hash(prompt: CompiledPrompt): string {
    const content = [
      prompt.system || '',
      prompt.user,
      JSON.stringify(prompt.examples || []),
    ].join('|||');

    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Validate that all required variables are present
   */
  validateVariables(
    template: PromptTemplate,
    variables: Record<string, unknown>
  ): { valid: boolean; missing: string[] } {
    const missing = template.metadata.variables.filter((v) => !(v in variables));
    return {
      valid: missing.length === 0,
      missing,
    };
  }

  /**
   * Extract variables from template
   */
  extractVariables(templateString: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(templateString)) !== null) {
      // Extract variable name, removing helpers and whitespace
      const varName = match[1].trim().split(/\s+/)[0].replace(/^[@#~]/, '');
      if (varName) {
        variables.add(varName);
      }
    }

    return Array.from(variables);
  }
}

