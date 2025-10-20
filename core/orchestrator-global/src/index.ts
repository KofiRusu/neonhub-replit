/**
 * Global Orchestrator Module
 * Cross-datacenter orchestration and intelligent routing
 * 
 * @module @neonhub/orchestrator-global
 */

// Export types
export * from './types';

// Export main manager
export { GlobalOrchestratorManager } from './core/GlobalOrchestratorManager';

// Export services
export { NodeDiscoveryService } from './services/NodeDiscoveryService';
export { HealthMonitoringService } from './services/HealthMonitoringService';
export { IntelligentRoutingService } from './services/IntelligentRoutingService';
export { AutoScalingService } from './services/AutoScalingService';
export { FailoverService } from './services/FailoverService';
export { ConfigurationManager } from './services/ConfigurationManager';

// Version information
export const VERSION = '1.0.0';
export const MODULE_NAME = '@neonhub/orchestrator-global';