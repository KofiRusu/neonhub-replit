import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import pino from 'pino';
import { PromptTemplate, PromptMetadata, PromptMetadataSchema } from './types.js';

const logger = pino({ name: 'prompt-registry' });

/**
 * Prompt registry for managing and loading prompt templates
 */
export class PromptRegistry {
  private prompts: Map<string, Map<string, PromptTemplate>> = new Map();
  private promptsDir: string;

  constructor(promptsDir: string) {
    this.promptsDir = promptsDir;
  }

  /**
   * Load all prompts from directory
   */
  async loadAll(): Promise<void> {
    logger.info({ dir: this.promptsDir }, 'Loading prompts from directory');

    try {
      const files = await this.findPromptFiles(this.promptsDir);
      
      for (const file of files) {
        try {
          await this.loadPrompt(file);
        } catch (error) {
          logger.error({ file, error: (error as Error).message }, 'Failed to load prompt file');
        }
      }

      logger.info({ count: this.prompts.size }, 'Prompts loaded successfully');
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Failed to load prompts');
      throw error;
    }
  }

  /**
   * Recursively find all prompt files
   */
  private async findPromptFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          files.push(...(await this.findPromptFiles(fullPath)));
        } else if (entry.isFile() && (entry.name.endsWith('.md') || entry.name.endsWith('.json'))) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Directory doesn't exist yet
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }

    return files;
  }

  /**
   * Load a single prompt file
   */
  private async loadPrompt(filePath: string): Promise<void> {
    const content = await fs.readFile(filePath, 'utf-8');
    const ext = path.extname(filePath);

    let template: PromptTemplate;

    if (ext === '.md') {
      // Parse markdown with frontmatter
      const parsed = matter(content);
      const metadata = PromptMetadataSchema.parse(parsed.data);
      
      template = {
        metadata,
        template: parsed.content.trim(),
        system: metadata.constraints?.model ? undefined : parsed.data.system,
        examples: parsed.data.examples,
      };
    } else if (ext === '.json') {
      // Parse JSON
      const data = JSON.parse(content);
      const metadata = PromptMetadataSchema.parse(data.metadata || data);
      
      template = {
        metadata,
        template: data.template,
        system: data.system,
        examples: data.examples,
      };
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    this.register(template);
  }

  /**
   * Register a prompt template
   */
  register(template: PromptTemplate): void {
    const { id, version } = template.metadata;

    if (!this.prompts.has(id)) {
      this.prompts.set(id, new Map());
    }

    this.prompts.get(id)!.set(version, template);
    logger.info({ id, version }, 'Prompt registered');
  }

  /**
   * Get a prompt by ID and version
   */
  get(id: string, version?: string): PromptTemplate | undefined {
    const versions = this.prompts.get(id);
    if (!versions) {
      logger.warn({ id }, 'Prompt not found');
      return undefined;
    }

    if (version) {
      return versions.get(version);
    }

    // Return latest version
    const latestVersion = Array.from(versions.keys()).sort().reverse()[0];
    return versions.get(latestVersion);
  }

  /**
   * Get all versions of a prompt
   */
  getVersions(id: string): PromptTemplate[] {
    const versions = this.prompts.get(id);
    if (!versions) return [];
    return Array.from(versions.values());
  }

  /**
   * Get all prompts for an agent
   */
  getByAgent(agent: string): PromptTemplate[] {
    const results: PromptTemplate[] = [];
    
    for (const versions of this.prompts.values()) {
      for (const template of versions.values()) {
        if (template.metadata.agent === agent) {
          results.push(template);
        }
      }
    }

    return results;
  }

  /**
   * Get all prompts with a specific tag
   */
  getByTag(tag: string): PromptTemplate[] {
    const results: PromptTemplate[] = [];
    
    for (const versions of this.prompts.values()) {
      for (const template of versions.values()) {
        if (template.metadata.tags.includes(tag)) {
          results.push(template);
        }
      }
    }

    return results;
  }

  /**
   * List all prompt IDs
   */
  list(): string[] {
    return Array.from(this.prompts.keys());
  }

  /**
   * Get metadata for all prompts
   */
  getAllMetadata(): PromptMetadata[] {
    const results: PromptMetadata[] = [];
    
    for (const versions of this.prompts.values()) {
      for (const template of versions.values()) {
        results.push(template.metadata);
      }
    }

    return results;
  }

  /**
   * Search prompts by description or tags
   */
  search(query: string): PromptTemplate[] {
    const lowerQuery = query.toLowerCase();
    const results: PromptTemplate[] = [];
    
    for (const versions of this.prompts.values()) {
      for (const template of versions.values()) {
        const description = template.metadata.description?.toLowerCase() || '';
        const tags = template.metadata.tags.map((t) => t.toLowerCase());
        
        if (
          description.includes(lowerQuery) ||
          tags.some((t) => t.includes(lowerQuery)) ||
          template.metadata.id.toLowerCase().includes(lowerQuery)
        ) {
          results.push(template);
        }
      }
    }

    return results;
  }

  /**
   * Clear all registered prompts
   */
  clear(): void {
    this.prompts.clear();
    logger.info('Registry cleared');
  }

  /**
   * Get statistics
   */
  getStats(): { totalPrompts: number; totalVersions: number; agents: string[] } {
    let totalVersions = 0;
    const agents = new Set<string>();

    for (const versions of this.prompts.values()) {
      totalVersions += versions.size;
      for (const template of versions.values()) {
        agents.add(template.metadata.agent);
      }
    }

    return {
      totalPrompts: this.prompts.size,
      totalVersions,
      agents: Array.from(agents),
    };
  }
}

