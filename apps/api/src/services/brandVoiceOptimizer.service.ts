/**
 * Brand Voice Optimizer Service
 */

import { prisma } from '../db/prisma.js';
import { logger } from '../lib/logger.js';
import { subDays } from 'date-fns';
import { getState } from './brandVoiceLearning.service.js';

/**
 * Check for drift
 */
export async function checkDrift(config?: {
  windowDays?: number;
  kpiThreshold?: number;
}) {
  const windowDays = config?.windowDays || 14;
  const kpiThreshold = config?.kpiThreshold || 15;

  logger.info({ windowDays, kpiThreshold }, 'Checking for drift');

  try {
    const currentState = await getState();
    
    // Get baseline (first state or state from windowDays ago)
    const baselineDate = subDays(new Date(), windowDays);
    
    // For now, simulate drift detection
    // In production, compare actual historical metrics
    const detections = await prisma.driftDetection.findMany({
      where: {
        createdAt: { gte: baselineDate },
        acknowledged: false,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasCritical = detections.some((d: any) => d.severity === 'critical');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasHigh = detections.some((d: any) => d.severity === 'high');

    return {
      hasDrift: detections.length > 0,
      detections,
      severity: hasCritical ? 'critical' : hasHigh ? 'high' : detections.length > 0 ? 'medium' : 'none',
      requiresAction: hasCritical || hasHigh,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recommendations: detections.map((d: any) => d.recommendation),
    };
  } catch (error) {
    logger.error({ error }, 'Drift check failed');
    throw error;
  }
}

/**
 * Start optimization job
 */
export async function startOptimization(input: {
  jobType: 'scheduled' | 'manual' | 'drift-triggered';
  config?: any;
  triggeredBy?: string;
}) {
  logger.info({ jobType: input.jobType }, 'Starting optimization job');

  try {
    // Create optimization job
    const job = await prisma.optimizationJob.create({
      data: {
        jobType: input.jobType,
        status: 'queued',
        config: input.config || {},
        triggeredBy: input.triggeredBy,
      },
    });

    // Start job asynchronously
    setImmediate(async () => {
      try {
        await prisma.optimizationJob.update({
          where: { id: job.id },
          data: { status: 'running' },
        });

        // Get current state and feedback
        const currentState = await getState(); // Load state (used for version increment)
        if (!currentState) {
          throw new Error('Failed to load current brand voice state');
        }

        const currentVersionMajor =
          Number(String((currentState as any).version ?? '0').split('.')[0]) || 0;
        const newVersion = `${currentVersionMajor + 1}.0.0`;
        const toneVector = (currentState as any).toneVector || {};
        const feedbacks = await prisma.brandFeedback.findMany({
          where: {
            createdAt: { gte: subDays(new Date(), 30) },
          },
          take: 1000,
        });

        logger.info({ jobId: job.id, feedbackCount: feedbacks.length }, 'Processing optimization');

        // Simulate training (in production, use actual trainer)
        const trainingMetrics = {
          loss: 0.45,
          accuracy: 0.82,
          epoch: 8,
          samples: feedbacks.length,
        };

        const baselineMetrics = {
          avgReward: 0.5,
          successRate: 0.75,
          userSatisfaction: 0.7,
          kpiPerformance: {},
        };

        const validationMetrics = {
          avgReward: 0.58,
          successRate: 0.80,
          userSatisfaction: 0.75,
          kpiPerformance: {},
        };

        // Create model weights
        const weights = await prisma.modelWeights.create({
          data: {
            version: newVersion,
            type: 'tone',
            weights: toneVector as any,
            trainingMetrics: trainingMetrics as any,
            baselineMetrics: baselineMetrics as any,
            validationMetrics: validationMetrics as any,
            sourceRunId: job.id,
            status: 'trained',
            isActive: false, // Not deployed yet
          },
        });

        // Update job as completed
        await prisma.optimizationJob.update({
          where: { id: job.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            resultWeightsId: weights.id,
            improvements: {
              avgReward: validationMetrics.avgReward - baselineMetrics.avgReward,
              successRate: validationMetrics.successRate - baselineMetrics.successRate,
            },
          },
        });

        logger.info({ jobId: job.id, weightsId: weights.id }, 'Optimization completed');
      } catch (error) {
        logger.error({ jobId: job.id, error }, 'Optimization failed');
        await prisma.optimizationJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            completedAt: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        });
      }
    });

    return job;
  } catch (error) {
    logger.error({ error }, 'Failed to start optimization');
    throw error;
  }
}

/**
 * Get optimization jobs
 */
export async function getOptimizationJobs(limit: number = 20) {
  const jobs = await prisma.optimizationJob.findMany({
    orderBy: { startedAt: 'desc' },
    take: limit,
  });

  return jobs;
}

/**
 * Get model weights
 */
export async function getModelWeights(filters?: {
  type?: string;
  status?: string;
  isActive?: boolean;
  limit?: number;
}) {
  const where: any = {};

  if (filters?.type) where.type = filters.type;
  if (filters?.status) where.status = filters.status;
  if (filters?.isActive !== undefined) where.isActive = filters.isActive;

  const weights = await prisma.modelWeights.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 10,
  });

  return weights;
}

/**
 * Get active model weights
 */
export async function getActiveWeights() {
  const weights = await prisma.modelWeights.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  return weights;
}

/**
 * Deploy model weights
 */
export async function deployWeights(weightsId: string) {
  logger.info({ weightsId }, 'Deploying model weights');

  try {
    // Deactivate all current weights
    await prisma.modelWeights.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Activate new weights
    const weights = await prisma.modelWeights.update({
      where: { id: weightsId },
      data: {
        isActive: true,
        status: 'active',
      },
    });

    logger.info({ weightsId, version: weights.version }, 'Weights deployed');

    return weights;
  } catch (error) {
    logger.error({ weightsId, error }, 'Deployment failed');
    throw error;
  }
}

/**
 * Rollback to previous weights
 */
export async function rollbackModel(currentWeightsId: string) {
  logger.info({ currentWeightsId }, 'Rolling back model');

  try {
    // Get current weights
    const currentWeights = await prisma.modelWeights.findUnique({
      where: { id: currentWeightsId },
    });

    if (!currentWeights) {
      throw new Error('Current weights not found');
    }

    // Find previous active weights
    const previousWeights = await prisma.modelWeights.findFirst({
      where: {
        type: currentWeights.type,
        createdAt: { lt: currentWeights.createdAt },
        status: { in: ['active', 'archived'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!previousWeights) {
      throw new Error('No previous weights found for rollback');
    }

    // Deactivate current
    await prisma.modelWeights.update({
      where: { id: currentWeightsId },
      data: {
        isActive: false,
        status: 'rollback',
      },
    });

    // Activate previous
    await prisma.modelWeights.update({
      where: { id: previousWeights.id },
      data: {
        isActive: true,
        status: 'active',
      },
    });

    logger.info(
      {
        from: currentWeights.version,
        to: previousWeights.version,
      },
      'Rollback completed'
    );

    return {
      success: true,
      previousVersion: currentWeights.version,
      currentVersion: previousWeights.version,
      message: `Rolled back from ${currentWeights.version} to ${previousWeights.version}`,
    };
  } catch (error) {
    logger.error({ error }, 'Rollback failed');
    throw error;
  }
}

/**
 * Get drift detections
 */
export async function getDriftDetections(filters?: {
  severity?: string;
  acknowledged?: boolean;
  limit?: number;
}) {
  const where: any = {};

  if (filters?.severity) where.severity = filters.severity;
  if (filters?.acknowledged !== undefined) where.acknowledged = filters.acknowledged;

  const detections = await prisma.driftDetection.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: filters?.limit || 20,
  });

  return detections;
}

/**
 * Acknowledge drift detection
 */
export async function acknowledgeDrift(detectionId: string) {
  const detection = await prisma.driftDetection.update({
    where: { id: detectionId },
    data: {
      acknowledged: true,
      acknowledgedAt: new Date(),
    },
  });

  return detection;
}

/**
 * Get training epochs for a model
 */
export async function getTrainingEpochs(modelWeightsId: string) {
  const epochs = await prisma.trainingEpoch.findMany({
    where: { modelWeightsId },
    orderBy: { epoch: 'asc' },
  });

  return epochs;
}

/**
 * Get optimizer statistics
 */
export async function getOptimizerStats() {
  const [
    totalJobs,
    completedJobs,
    activeWeights,
    totalWeights,
    unacknowledgedDrift,
  ] = await Promise.all([
    prisma.optimizationJob.count(),
    prisma.optimizationJob.count({ where: { status: 'completed' } }),
    prisma.modelWeights.count({ where: { isActive: true } }),
    prisma.modelWeights.count(),
    prisma.driftDetection.count({ where: { acknowledged: false } }),
  ]);

  return {
    totalJobs,
    completedJobs,
    runningJobs: await prisma.optimizationJob.count({ where: { status: 'running' } }),
    activeWeights,
    totalWeights,
    unacknowledgedDrift,
  };
}
