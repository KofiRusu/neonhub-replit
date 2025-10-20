/**
 * Global Orchestrator Module
 * Cross-datacenter orchestration and intelligent routing
 *
 * @module @neonhub/orchestrator-global
 */
export * from './types';
export { GlobalOrchestratorManager } from './core/GlobalOrchestratorManager';
export { NodeDiscoveryService } from './services/NodeDiscoveryService';
export { HealthMonitoringService } from './services/HealthMonitoringService';
export { IntelligentRoutingService } from './services/IntelligentRoutingService';
export { AutoScalingService } from './services/AutoScalingService';
export { FailoverService } from './services/FailoverService';
export { ConfigurationManager } from './services/ConfigurationManager';
export declare const VERSION = "1.0.0";
export declare const MODULE_NAME = "@neonhub/orchestrator-global";
//# sourceMappingURL=index.d.ts.map