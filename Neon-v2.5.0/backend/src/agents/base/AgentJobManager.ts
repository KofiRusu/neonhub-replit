import { prisma } from "../../db/prisma.js";
import { logger } from "../../lib/logger.js";
import { broadcast } from "../../ws/index.js";

export type JobStatus = "queued" | "running" | "success" | "error";

export interface AgentJobInput {
  agent: string;
  input: Record<string, any>;
  createdById?: string;
}

export interface AgentJobUpdate {
  status: JobStatus;
  output?: Record<string, any>;
  error?: string;
  metrics?: Record<string, any>;
}

/**
 * Simple in-memory job manager
 * In production, use BullMQ or similar job queue
 */
class JobManager {
  private runningJobs: Map<string, boolean> = new Map();

  /**
   * Create a new job in the database
   */
  async createJob(input: AgentJobInput): Promise<string> {
    const job = await prisma.agentJob.create({
      data: {
        agent: input.agent,
        input: input.input,
        status: "queued",
        createdById: input.createdById || null,
      },
    });

    logger.info({ jobId: job.id, agent: input.agent }, "Job created");

    // Broadcast job creation
    broadcast("agent:job:created", {
      jobId: job.id,
      agent: input.agent,
      status: "queued",
    });

    return job.id;
  }

  /**
   * Update job status and details
   */
  async updateJob(jobId: string, update: AgentJobUpdate): Promise<void> {
    await prisma.agentJob.update({
      where: { id: jobId },
      data: {
        status: update.status,
        output: update.output || undefined,
        error: update.error || undefined,
        metrics: update.metrics || undefined,
      },
    });

    logger.info({ jobId, status: update.status }, "Job updated");

    // Broadcast job update
    broadcast("agent:job:update", {
      jobId,
      status: update.status,
      output: update.output,
      error: update.error,
    });
  }

  /**
   * Mark job as running
   */
  async startJob(jobId: string): Promise<void> {
    this.runningJobs.set(jobId, true);
    await this.updateJob(jobId, { status: "running" });
  }

  /**
   * Mark job as successful
   */
  async completeJob(
    jobId: string,
    output: Record<string, any>,
    metrics?: Record<string, any>
  ): Promise<void> {
    this.runningJobs.delete(jobId);
    await this.updateJob(jobId, {
      status: "success",
      output,
      metrics,
    });
  }

  /**
   * Mark job as failed
   */
  async failJob(jobId: string, error: string): Promise<void> {
    this.runningJobs.delete(jobId);
    await this.updateJob(jobId, {
      status: "error",
      error,
    });
  }

  /**
   * Check if job is running
   */
  isJobRunning(jobId: string): boolean {
    return this.runningJobs.has(jobId);
  }

  /**
   * Get job details
   */
  async getJob(jobId: string) {
    return prisma.agentJob.findUnique({
      where: { id: jobId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}

export const agentJobManager = new JobManager();
