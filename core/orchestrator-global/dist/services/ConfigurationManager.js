"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigurationManager = void 0;
const events_1 = require("events");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const types_1 = require("../types");
class ConfigurationManager extends events_1.EventEmitter {
    constructor(configFilePath, logger) {
        super();
        this.configWatchers = new Map();
        this.isInitialized = false;
        this.configFilePath = configFilePath;
        this.logger = logger;
        this.config = this.getDefaultConfig();
    }
    getDefaultConfig() {
        return {
            orchestratorId: `orchestrator-${Date.now()}`,
            discovery: {
                enabled: true,
                discoveryInterval: 30000, // 30 seconds
                heartbeatInterval: 10000, // 10 seconds
                nodeTimeout: 60000, // 1 minute
                maxRetries: 3
            },
            healthMonitoring: {
                enabled: true,
                checkInterval: 15000, // 15 seconds
                timeout: 5000, // 5 seconds
                unhealthyThreshold: 3,
                healthyThreshold: 2,
                metricsCollectionInterval: 30000 // 30 seconds
            },
            routing: {
                algorithm: types_1.RoutingAlgorithm.ADAPTIVE,
                loadBalancingStrategy: types_1.LoadBalancingStrategy.WEIGHTED,
                geoRoutingEnabled: true,
                latencyThreshold: 100, // ms
                capacityThreshold: 80, // percent
                adaptiveRouting: true
            },
            scaling: {
                enabled: true,
                minNodes: 3,
                maxNodes: 50,
                scaleUpThreshold: 75, // percent
                scaleDownThreshold: 25, // percent
                cooldownPeriod: 300, // seconds
                predictiveScaling: false,
                metricsWindow: 300 // seconds
            },
            failover: {
                enabled: true,
                backupNodes: [],
                failoverTimeout: 30000, // 30 seconds
                autoRecovery: true,
                dataReplication: true
            },
            federation: {
                federationManagers: [],
                messageRoutingEnabled: true,
                crossFederationCommunication: true,
                sharedStateSync: true
            },
            logger: this.logger
        };
    }
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            this.logger.info('Initializing configuration manager');
            // Load configuration from file
            await this.loadConfiguration();
            // Set up configuration watching
            this.setupConfigWatching();
            this.isInitialized = true;
            this.logger.info('Configuration manager initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize configuration manager', error);
            throw new types_1.GlobalOrchestratorError(types_1.GlobalOrchestratorErrorCode.CONFIGURATION_ERROR, 'Failed to initialize configuration manager', undefined, undefined, { originalError: error.message });
        }
    }
    async loadConfiguration() {
        try {
            if (fs.existsSync(this.configFilePath)) {
                const configData = fs.readFileSync(this.configFilePath, 'utf-8');
                const loadedConfig = JSON.parse(configData);
                // Merge loaded config with defaults
                this.config = this.deepMerge(this.getDefaultConfig(), loadedConfig);
                this.logger.info(`Configuration loaded from ${this.configFilePath}`);
            }
            else {
                // Create default configuration file
                await this.saveConfiguration();
                this.logger.info(`Default configuration created at ${this.configFilePath}`);
            }
        }
        catch (error) {
            this.logger.warn(`Failed to load configuration from ${this.configFilePath}, using defaults`, { error: error.message });
            // Continue with default config
        }
    }
    async saveConfiguration() {
        try {
            const configDir = path.dirname(this.configFilePath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            const configData = JSON.stringify(this.config, null, 2);
            fs.writeFileSync(this.configFilePath, configData, 'utf-8');
            this.logger.debug('Configuration saved to file');
        }
        catch (error) {
            this.logger.error('Failed to save configuration', error);
            throw new types_1.GlobalOrchestratorError(types_1.GlobalOrchestratorErrorCode.CONFIGURATION_ERROR, 'Failed to save configuration', undefined, undefined, { originalError: error.message });
        }
    }
    setupConfigWatching() {
        try {
            const watcher = fs.watch(this.configFilePath, (eventType) => {
                if (eventType === 'change') {
                    this.logger.info('Configuration file changed, reloading...');
                    this.loadConfiguration().then(() => {
                        this.emit('configUpdated', this.config);
                    }).catch(error => {
                        this.logger.error('Failed to reload configuration', error);
                    });
                }
            });
            this.configWatchers.set(this.configFilePath, watcher);
            this.logger.debug('Configuration file watching enabled');
        }
        catch (error) {
            this.logger.warn('Failed to set up configuration watching', { error: error.message });
        }
    }
    getConfig() {
        return { ...this.config };
    }
    async updateConfig(updates) {
        try {
            // Validate updates
            await this.validateConfigUpdates(updates);
            // Apply updates
            this.config = this.deepMerge(this.config, updates);
            // Save to file
            await this.saveConfiguration();
            this.emit('configUpdated', this.config);
            this.logger.info('Configuration updated successfully');
        }
        catch (error) {
            this.logger.error('Failed to update configuration', error);
            throw new types_1.GlobalOrchestratorError(types_1.GlobalOrchestratorErrorCode.CONFIGURATION_ERROR, 'Failed to update configuration', undefined, undefined, { originalError: error.message });
        }
    }
    async validateConfigUpdates(updates) {
        // Basic validation - could be extended with more sophisticated checks
        if (updates.scaling) {
            const scaling = updates.scaling;
            if (scaling.minNodes && scaling.maxNodes && scaling.minNodes > scaling.maxNodes) {
                throw new Error('Minimum nodes cannot be greater than maximum nodes');
            }
            if (scaling.scaleUpThreshold && (scaling.scaleUpThreshold < 0 || scaling.scaleUpThreshold > 100)) {
                throw new Error('Scale up threshold must be between 0 and 100');
            }
            if (scaling.scaleDownThreshold && (scaling.scaleDownThreshold < 0 || scaling.scaleDownThreshold > 100)) {
                throw new Error('Scale down threshold must be between 0 and 100');
            }
        }
        if (updates.routing) {
            const routing = updates.routing;
            if (routing.latencyThreshold && routing.latencyThreshold < 0) {
                throw new Error('Latency threshold cannot be negative');
            }
            if (routing.capacityThreshold && (routing.capacityThreshold < 0 || routing.capacityThreshold > 100)) {
                throw new Error('Capacity threshold must be between 0 and 100');
            }
        }
    }
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            }
            else {
                result[key] = source[key];
            }
        }
        return result;
    }
    async resetToDefaults() {
        try {
            this.config = this.getDefaultConfig();
            await this.saveConfiguration();
            this.emit('configReset', this.config);
            this.logger.info('Configuration reset to defaults');
        }
        catch (error) {
            this.logger.error('Failed to reset configuration', error);
            throw new types_1.GlobalOrchestratorError(types_1.GlobalOrchestratorErrorCode.CONFIGURATION_ERROR, 'Failed to reset configuration', undefined, undefined, { originalError: error.message });
        }
    }
    getConfigValue(path) {
        return this.getNestedValue(this.config, path);
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    async setConfigValue(path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            return current[key];
        }, this.config);
        target[lastKey] = value;
        await this.saveConfiguration();
        this.emit('configValueUpdated', path, value);
    }
    getConfigSummary() {
        return {
            orchestratorId: this.config.orchestratorId,
            discoveryEnabled: this.config.discovery.enabled,
            healthMonitoringEnabled: this.config.healthMonitoring.enabled,
            routingAlgorithm: this.config.routing.algorithm,
            scalingEnabled: this.config.scaling.enabled,
            failoverEnabled: this.config.failover.enabled,
            federationManagersCount: this.config.federation.federationManagers.length,
            configFilePath: this.configFilePath,
            lastUpdated: Date.now()
        };
    }
    destroy() {
        // Clean up watchers
        for (const [filePath, watcher] of this.configWatchers) {
            watcher.close();
            this.logger.debug(`Stopped watching config file: ${filePath}`);
        }
        this.configWatchers.clear();
        this.logger.info('Configuration manager destroyed');
    }
}
exports.ConfigurationManager = ConfigurationManager;
//# sourceMappingURL=ConfigurationManager.js.map