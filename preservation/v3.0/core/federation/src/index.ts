// Main exports
export { FederationManager, FederationConfig } from './FederationManager';

// Types and interfaces
export * from './types';

// WebSocket components
export { WebSocketServer } from './websocket/WebSocketServer';
export { WebSocketClient } from './websocket/WebSocketClient';

// gRPC components
export { GRPCServer } from './grpc/GRPCServer';
export { GRPCClient } from './grpc/GRPCClient';

// Authentication
export { AuthManager, AuthResult } from './auth/AuthManager';

// Federated Learning components
export { FederatedLearningCoordinator } from './federated-learning/FederatedLearningCoordinator';
export { SecureAggregation } from './federated-learning/SecureAggregation';
export { ModelValidation } from './federated-learning/ModelValidation';
export { ParticipantManager } from './federated-learning/ParticipantManager';

// Privacy components
export { DifferentialPrivacy } from './privacy/DifferentialPrivacy';
export { PrivacyBudgetManager } from './privacy/PrivacyBudgetManager';

// Cryptographic components
export { HomomorphicEncryption } from './crypto/HomomorphicEncryption';
export { SecureMultiPartyComputation } from './crypto/SecureMultiPartyComputation';
export { KeyManager } from './crypto/KeyManager';

// Utilities
export { Logger } from './utils/Logger';
export { ConsoleLogger } from './utils/Logger';
export { ConnectionPool } from './utils/ConnectionPool';
export { LoadBalancer, LoadBalancingStrategy } from './utils/LoadBalancer';
export { HealthChecker } from './utils/HealthChecker';

// AI Intelligence Exchange (AIX) components
export { AIXProtocolManager, AIXConfig } from './aix/AIXProtocolManager';
export { ModelCompression } from './aix/ModelCompression';
export { IntelligenceAggregator } from './aix/IntelligenceAggregator';
export { ModelEvaluator } from './aix/ModelEvaluator';

// ============================================================================
// V6.0 GOVERNANCE INTEGRATIONS
// ============================================================================

/**
 * Federated Governance Integration Manager
 * Integrates global orchestration, AI governance, and eco-optimization into federation workflows
 */
export class FederatedGovernanceIntegration {
  private federationManager: any;
  private orchestrator?: any;
  private aiGovernance?: any;
  private ecoOptimizer?: any;

  constructor(config: {
    federationManager: any;
    orchestrator?: any;
    aiGovernance?: any;
    ecoOptimizer?: any;
  }) {
    this.federationManager = config.federationManager;
    this.orchestrator = config.orchestrator;
    this.aiGovernance = config.aiGovernance;
    this.ecoOptimizer = config.ecoOptimizer;
  }

  /**
   * Route federated learning task to optimal nodes with governance checks
   */
  async routeFederatedTask(task: {
    modelId: string;
    participants: string[];
    priority: 'low' | 'medium' | 'high';
  }): Promise<{
    route: any;
    governance?: any;
    energyImpact?: any;
  }> {
    const result: any = { route: null };

    // Use global orchestrator for intelligent routing
    if (this.orchestrator) {
      try {
        const routing = await this.orchestrator.routingService.routeRequest({
          requestId: task.modelId,
          sourceRegion: 'global',
          payload: task,
          priority: task.priority
        });
        result.route = routing;
      } catch (error) {
        console.warn('Orchestrator routing failed:', error);
      }
    }

    // Check AI governance policies
    if (this.aiGovernance) {
      try {
        const evaluation = await this.aiGovernance.policyEnforcer.evaluateAction({
          action: 'federated_learning',
          context: {
            modelId: task.modelId,
            participants: task.participants
          }
        });
        result.governance = evaluation;
      } catch (error) {
        console.warn('AI governance check failed:', error);
      }
    }

    // Assess environmental impact
    if (this.ecoOptimizer) {
      try {
        const resources = task.participants.map((p: string) => ({
          type: 'compute' as const,
          provider: 'aws' as const,
          instanceType: 't3.large',
          region: 'us-east-1',
          utilizationPercent: 75
        }));

        const optimization = await this.ecoOptimizer.resourceOptimizer.optimizeResourceAllocation(resources);
        result.energyImpact = optimization;
      } catch (error) {
        console.warn('Eco optimization failed:', error);
      }
    }

    return result;
  }

  /**
   * Monitor federated learning session with integrated governance
   */
  async monitorFederatedSession(sessionId: string): Promise<{
    health: any;
    governance: any;
    sustainability: any;
  }> {
    const status: any = {
      health: {},
      governance: {},
      sustainability: {}
    };

    // Get orchestration health
    if (this.orchestrator) {
      try {
        status.health = await this.orchestrator.healthMonitoring.getSystemHealth();
      } catch (error) {
        status.health = { error: String(error) };
      }
    }

    // Get governance status
    if (this.aiGovernance) {
      try {
        status.governance = this.aiGovernance.getHealthStatus();
      } catch (error) {
        status.governance = { error: String(error) };
      }
    }

    // Get sustainability metrics
    if (this.ecoOptimizer) {
      try {
        const metrics = await this.ecoOptimizer.energyMonitor.getCurrentMetrics();
        status.sustainability = metrics;
      } catch (error) {
        status.sustainability = { error: String(error) };
      }
    }

    return status;
  }

  /**
   * Optimize federated learning round with sustainability considerations
   */
  async optimizeFederatedRound(round: {
    roundNumber: number;
    participants: string[];
    modelSize: number;
  }): Promise<{
    optimized: boolean;
    recommendations: string[];
    energySavings?: number;
  }> {
    const recommendations: string[] = [];
    let energySavings = 0;

    // Get eco-optimization recommendations
    if (this.ecoOptimizer) {
      try {
        const advice = await this.ecoOptimizer.greenAIAdvisor.analyzeModel({
          modelName: `federation-round-${round.roundNumber}`,
          parameters: round.modelSize,
          trainingData: round.participants.length * 1000,
          framework: 'pytorch',
          accelerator: 'gpu'
        });

        recommendations.push(...advice.recommendations.map((r: any) => r.action));
        energySavings = advice.metrics.estimatedEnergySavings || 0;
      } catch (error) {
        console.warn('Green AI analysis failed:', error);
      }
    }

    return {
      optimized: recommendations.length > 0,
      recommendations,
      energySavings
    };
  }

  /**
   * Get integrated system status
   */
  getSystemStatus(): {
    federation: boolean;
    orchestration: boolean;
    governance: boolean;
    sustainability: boolean;
  } {
    return {
      federation: !!this.federationManager,
      orchestration: !!this.orchestrator,
      governance: !!this.aiGovernance,
      sustainability: !!this.ecoOptimizer
    };
  }
}