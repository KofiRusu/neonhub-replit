import { logger } from "../lib/logger.js";

interface DriftDetection {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  createdAt: Date;
  acknowledged: boolean;
  recommendation: string;
}

interface OptimizationJob {
  id: string;
  jobType: "scheduled" | "manual" | "drift-triggered";
  status: "queued" | "running" | "completed" | "failed";
  createdAt: Date;
  updatedAt: Date;
  triggeredBy?: string;
  config: Record<string, unknown>;
}

interface ModelWeights {
  id: string;
  version: string;
  type: string;
  status: "trained" | "active" | "archived" | "rollback";
  isActive: boolean;
  createdAt: Date;
  metadata: Record<string, unknown>;
}

const stubDriftDetections: DriftDetection[] = [];
const stubJobs: OptimizationJob[] = [];
const stubWeights: ModelWeights[] = [];

export async function checkDrift(config?: { windowDays?: number; kpiThreshold?: number }) {
  logger.info({ config }, "Brand voice drift check (stub)");
  return {
    hasDrift: false,
    detections: stubDriftDetections,
    severity: "none" as const,
    requiresAction: false,
    recommendations: ["Collect additional feedback samples", "Review tone presets"] as string[],
  };
}

export async function startOptimization(input: {
  jobType: "scheduled" | "manual" | "drift-triggered";
  config?: Record<string, unknown>;
  triggeredBy?: string;
}) {
  const job: OptimizationJob = {
    id: `stub-job-${Date.now()}`,
    jobType: input.jobType,
    status: "queued",
    createdAt: new Date(),
    updatedAt: new Date(),
    triggeredBy: input.triggeredBy,
    config: input.config ?? {},
  };
  stubJobs.unshift(job);
  logger.info({ jobId: job.id, jobType: job.jobType }, "Optimization job queued (stub)");
  return job;
}

export async function getOptimizationJobs(limit = 20) {
  return stubJobs.slice(0, limit);
}

export async function getModelWeights(filters?: { type?: string; status?: string; isActive?: boolean; limit?: number }) {
  let weights = [...stubWeights];
  if (filters?.type) weights = weights.filter(w => w.type === filters.type);
  if (filters?.status) weights = weights.filter(w => w.status === filters.status);
  if (filters?.isActive !== undefined) weights = weights.filter(w => w.isActive === filters.isActive);
  return weights.slice(0, filters?.limit ?? 10);
}

export async function getActiveWeights() {
  return stubWeights.filter(w => w.isActive);
}

export async function deployWeights(weightsId: string) {
  logger.info({ weightsId }, "Deploying model weights (stub)");
  const weights = stubWeights.find(w => w.id === weightsId);
  if (!weights) {
    throw new Error("Weights not found");
  }
  stubWeights.forEach(w => {
    w.isActive = w.id === weightsId;
    w.status = w.id === weightsId ? "active" : w.status;
  });
  return weights;
}

export async function rollbackModel(currentWeightsId: string) {
  logger.info({ currentWeightsId }, "Rolling back model weights (stub)");
  const current = stubWeights.find(w => w.id === currentWeightsId);
  if (!current) {
    throw new Error("Current weights not found");
  }
  const previous = stubWeights.find(w => w.id !== currentWeightsId && w.type === current.type);
  if (!previous) {
    throw new Error("No previous weights to rollback to");
  }
  current.isActive = false;
  current.status = "archived";
  previous.isActive = true;
  previous.status = "active";
  return {
    success: true,
    previousVersion: current.version,
    currentVersion: previous.version,
    message: `Rolled back to ${previous.version}`,
  };
}

export async function getDriftDetections(filters?: { severity?: string; acknowledged?: boolean; limit?: number }) {
  let detections = [...stubDriftDetections];
  if (filters?.severity) detections = detections.filter(d => d.severity === filters.severity);
  if (filters?.acknowledged !== undefined) detections = detections.filter(d => d.acknowledged === filters.acknowledged);
  return detections.slice(0, filters?.limit ?? 20);
}

export async function acknowledgeDrift(detectionId: string) {
  const detection = stubDriftDetections.find(d => d.id === detectionId);
  if (!detection) {
    throw new Error("Drift detection not found");
  }
  detection.acknowledged = true;
  detection.createdAt = new Date(detection.createdAt);
  return detection;
}

export async function getTrainingEpochs(_modelWeightsId: string) {
  return [
    { epoch: 1, loss: 0.52, reward: 0.48 },
    { epoch: 2, loss: 0.44, reward: 0.56 },
  ];
}

export async function getOptimizerStats() {
  return {
    totalJobs: stubJobs.length,
    completedJobs: stubJobs.filter(job => job.status === "completed").length,
    runningJobs: stubJobs.filter(job => job.status === "running").length,
    activeWeights: stubWeights.filter(w => w.isActive).length,
    totalWeights: stubWeights.length,
    unacknowledgedDrift: stubDriftDetections.filter(d => !d.acknowledged).length,
  };
}
