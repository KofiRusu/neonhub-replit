// Main exports for the Global Orchestrator module
export { GlobalOrchestratorManager } from './core/GlobalOrchestratorManager';

// Service exports
export { NodeDiscoveryService } from './services/NodeDiscoveryService';
export { HealthMonitoringService } from './services/HealthMonitoringService';
export { IntelligentRoutingService } from './services/IntelligentRoutingService';
export { AutoScalingService } from './services/AutoScalingService';
export { FailoverService } from './services/FailoverService';
export { ConfigurationManager } from './services/ConfigurationManager';

// Utility exports
export { ConsoleLogger, RedisLogger } from './utils/Logger';

// Type exports
export * from './types';