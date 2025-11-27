import fs from 'fs/promises';
import path from 'path';
import pino from 'pino';
import { PromptTemplate, SnapshotTest } from './types.js';
import { PromptCompiler } from './compiler.js';

const logger = pino({ name: 'snapshot-tester' });

export interface SnapshotTestResult {
  passed: boolean;
  expected?: string;
  actual?: string;
  diff?: string;
}

/**
 * Snapshot testing for prompts
 */
export class SnapshotTester {
  private snapshotsDir: string;
  private compiler: PromptCompiler;
  private snapshots: Map<string, SnapshotTest> = new Map();

  constructor(snapshotsDir: string) {
    this.snapshotsDir = snapshotsDir;
    this.compiler = new PromptCompiler();
  }

  /**
   * Load all snapshots
   */
  async loadAll(): Promise<void> {
    logger.info({ dir: this.snapshotsDir }, 'Loading snapshots');

    try {
      await fs.mkdir(this.snapshotsDir, { recursive: true });
      const files = await fs.readdir(this.snapshotsDir);

      for (const file of files) {
        if (file.endsWith('.snapshot.json')) {
          const filePath = path.join(this.snapshotsDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const snapshot = JSON.parse(content) as SnapshotTest;
          
          const key = this.getSnapshotKey(snapshot.promptId, snapshot.version, snapshot.variables);
          this.snapshots.set(key, snapshot);
        }
      }

      logger.info({ count: this.snapshots.size }, 'Snapshots loaded');
    } catch (error) {
      logger.error({ error: (error as Error).message }, 'Failed to load snapshots');
    }
  }

  /**
   * Generate snapshot key
   */
  private getSnapshotKey(promptId: string, version: string, variables: Record<string, unknown>): string {
    const varsStr = JSON.stringify(variables);
    return `${promptId}-${version}-${varsStr}`;
  }

  /**
   * Save a snapshot
   */
  async save(
    template: PromptTemplate,
    variables: Record<string, unknown>,
    output: string
  ): Promise<void> {
    const compiled = this.compiler.compile(template, variables);
    const hash = this.compiler.hash(compiled);

    const snapshot: SnapshotTest = {
      promptId: template.metadata.id,
      version: template.metadata.version,
      variables,
      expectedOutput: output,
      hash,
      createdAt: new Date().toISOString(),
    };

    const key = this.getSnapshotKey(snapshot.promptId, snapshot.version, snapshot.variables);
    this.snapshots.set(key, snapshot);

    // Save to file
    const fileName = `${snapshot.promptId}-${snapshot.version}-${hash.substring(0, 8)}.snapshot.json`;
    const filePath = path.join(this.snapshotsDir, fileName);

    await fs.mkdir(this.snapshotsDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');

    logger.info({ promptId: snapshot.promptId, version: snapshot.version }, 'Snapshot saved');
  }

  /**
   * Test a prompt against its snapshot
   */
  async test(
    template: PromptTemplate,
    variables: Record<string, unknown>
  ): Promise<SnapshotTestResult> {
    const key = this.getSnapshotKey(template.metadata.id, template.metadata.version, variables);
    const snapshot = this.snapshots.get(key);

    if (!snapshot) {
      logger.warn({ promptId: template.metadata.id, version: template.metadata.version }, 'No snapshot found');
      return { passed: false };
    }

    const compiled = this.compiler.compile(template, variables);
    const actualHash = this.compiler.hash(compiled);

    const passed = actualHash === snapshot.hash;

    if (!passed) {
      logger.warn({
        promptId: template.metadata.id,
        version: template.metadata.version,
        expectedHash: snapshot.hash,
        actualHash,
      }, 'Snapshot test failed');
    }

    return {
      passed,
      expected: snapshot.expectedOutput,
      actual: compiled.user,
    };
  }

  /**
   * Update a snapshot
   */
  async update(
    template: PromptTemplate,
    variables: Record<string, unknown>
  ): Promise<void> {
    const compiled = this.compiler.compile(template, variables);
    await this.save(template, variables, compiled.user);
    logger.info({ promptId: template.metadata.id }, 'Snapshot updated');
  }

  /**
   * Test all snapshots for a prompt
   */
  async testAll(promptId: string): Promise<Map<string, SnapshotTestResult>> {
    const results = new Map<string, SnapshotTestResult>();

    for (const [key, snapshot] of this.snapshots.entries()) {
      if (snapshot.promptId === promptId) {
        // We need the template to test, skip for now
        // This would require integration with PromptRegistry
        logger.info({ key }, 'Skipping snapshot test (requires template)');
      }
    }

    return results;
  }

  /**
   * Clean up old snapshots
   */
  async cleanup(olderThanDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    let removed = 0;

    for (const [key, snapshot] of this.snapshots.entries()) {
      const createdAt = new Date(snapshot.createdAt);
      
      if (createdAt < cutoffDate) {
        this.snapshots.delete(key);
        
        // Delete file
        const fileName = `${snapshot.promptId}-${snapshot.version}-${snapshot.hash.substring(0, 8)}.snapshot.json`;
        const filePath = path.join(this.snapshotsDir, fileName);
        
        try {
          await fs.unlink(filePath);
          removed++;
        } catch (error) {
          logger.warn({ file: fileName, error: (error as Error).message }, 'Failed to delete snapshot file');
        }
      }
    }

    logger.info({ removed, olderThanDays }, 'Cleaned up old snapshots');
    return removed;
  }

  /**
   * Get all snapshots
   */
  getAll(): SnapshotTest[] {
    return Array.from(this.snapshots.values());
  }

  /**
   * Get snapshots for a specific prompt
   */
  getByPromptId(promptId: string): SnapshotTest[] {
    return Array.from(this.snapshots.values()).filter((s) => s.promptId === promptId);
  }
}

