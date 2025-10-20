/**
 * AI Governance Integration Service
 * Provides API integration layer for the @neonhub/ai-governance module
 */

import { AIGovernanceManager, AIGovernanceConfig, defaultAIGovernanceConfig } from '@neonhub/ai-governance';
import { logger } from '../../lib/logger.js';

let governanceManager: AIGovernanceManager | null = null;

/**
 * Initialize the AI Governance Manager
 */
export async function initializeGovernance(config?: Partial<AIGovernanceConfig>): Promise<AIGovernanceManager> {
  if (governanceManager) {
    return governanceManager;
  }

  try {
    const fullConfig = {
      ...defaultAIGovernanceConfig,
      ...config
    };

    governanceManager = new AIGovernanceManager(fullConfig);
    await governanceManager.initialize();
    
    logger.info('AI Governance Manager initialized successfully');
    return governanceManager;
  } catch (error) {
    logger.error({ error }, 'Failed to initialize AI Governance Manager');
    throw error;
  }
}

/**
 * Get the AI Governance Manager instance
 */
export async function getGovernanceManager(): Promise<AIGovernanceManager> {
  if (!governanceManager) {
    return await initializeGovernance();
  }
  return governanceManager;
}

/**
 * Evaluate an action against AI governance policies
 */
export async function evaluateAction(action: {
  action: string;
  context: Record<string, any>;
}): Promise<{
  allowed: boolean;
  violations: string[];
  recommendations: string[];
}> {
  try {
    const manager = await getGovernanceManager();
    const subject = {
      type: 'REQUEST' as any,
      id: `request-${Date.now()}`,
      attributes: { action: action.action, ...action.context }
    };
    
    const evaluation = await manager.policyEnforcer.enforce(subject, action.action, action.context);
    
    return {
      allowed: evaluation.allowed,
      violations: evaluation.reason ? [evaluation.reason] : [],
      recommendations: evaluation.recommendations || []
    };
  } catch (error) {
    logger.error({ error, action }, 'Failed to evaluate action');
    throw new Error('Failed to evaluate action against governance policies');
  }
}

/**
 * Add a new policy to the policy engine
 */
export async function addPolicy(policy: {
  id: string;
  name: string;
  description: string;
  rules: any[];
  enabled: boolean;
}): Promise<void> {
  try {
    const manager = await getGovernanceManager();
    const fullPolicy = {
      ...policy,
      version: '1.0.0',
      jurisdiction: ['GLOBAL'],
      category: 'COMPLIANCE' as any,
      metadata: {
        author: 'system',
        tags: [],
        complianceFrameworks: [],
        riskLevel: 'MEDIUM' as any,
        reviewCycle: 30
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      status: policy.enabled ? 'ACTIVE' as any : 'DRAFT' as any
    };
    await manager.policyEngine.loadPolicy(fullPolicy);
    logger.info({ policyId: policy.id }, 'Policy added successfully');
  } catch (error) {
    logger.error({ error, policy }, 'Failed to add policy');
    throw new Error('Failed to add policy');
  }
}

/**
 * Get all active policies
 */
export async function getPolicies(): Promise<any[]> {
  try {
    const manager = await getGovernanceManager();
    return manager.policyEngine.getPolicies();
  } catch (error) {
    logger.error({ error }, 'Failed to get policies');
    throw new Error('Failed to retrieve policies');
  }
}

/**
 * Perform ethical assessment
 */
export async function assessEthics(assessment: {
  scenario: string;
  stakeholders: string[];
  potentialImpacts: string[];
}): Promise<{
  score: number;
  concerns: string[];
  recommendations: string[];
}> {
  try {
    const manager = await getGovernanceManager();
    const subject = {
      type: 'SYSTEM' as any,
      id: `assessment-${Date.now()}`,
      attributes: {
        scenario: assessment.scenario,
        stakeholders: assessment.stakeholders,
        potentialImpacts: assessment.potentialImpacts
      }
    };
    
    const result = await manager.ethicalFramework.assessEthicalImpact(subject);
    
    return {
      score: result.score,
      concerns: result.concerns.map(c => c.description),
      recommendations: result.recommendations
    };
  } catch (error) {
    logger.error({ error, assessment }, 'Failed to assess ethics');
    throw new Error('Failed to perform ethical assessment');
  }
}

/**
 * Get governance health status
 */
export async function getHealthStatus(): Promise<{
  policyEngine: boolean;
  ethicalFramework: boolean;
  legalCompliance: boolean;
  auditLogger: boolean;
}> {
  try {
    const manager = await getGovernanceManager();
    return manager.getHealthStatus();
  } catch (error) {
    logger.error({ error }, 'Failed to get health status');
    throw new Error('Failed to get governance health status');
  }
}

/**
 * Get audit logs
 */
export async function getAuditLogs(filter?: {
  startDate?: Date;
  endDate?: Date;
  level?: string;
  category?: string;
}): Promise<any[]> {
  try {
    const manager = await getGovernanceManager();
    return await manager.auditLogger.getRecentLogs(100);
  } catch (error) {
    logger.error({ error, filter }, 'Failed to get audit logs');
    throw new Error('Failed to retrieve audit logs');
  }
}

/**
 * Shutdown the governance manager
 */
export async function shutdownGovernance(): Promise<void> {
  if (governanceManager) {
    await governanceManager.shutdown();
    governanceManager = null;
    logger.info('AI Governance Manager shut down');
  }
}