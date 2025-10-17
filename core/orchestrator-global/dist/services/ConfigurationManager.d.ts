import { EventEmitter } from 'events';
import { GlobalOrchestratorConfig, Logger } from '../types';
export declare class ConfigurationManager extends EventEmitter {
    private config;
    private logger;
    private configFilePath;
    private configWatchers;
    private isInitialized;
    constructor(configFilePath: string, logger: Logger);
    private getDefaultConfig;
    initialize(): Promise<void>;
    private loadConfiguration;
    private saveConfiguration;
    private setupConfigWatching;
    getConfig(): GlobalOrchestratorConfig;
    updateConfig(updates: Partial<GlobalOrchestratorConfig>): Promise<void>;
    private validateConfigUpdates;
    private deepMerge;
    resetToDefaults(): Promise<void>;
    getConfigValue<T>(path: string): T | undefined;
    private getNestedValue;
    setConfigValue(path: string, value: any): Promise<void>;
    getConfigSummary(): any;
    destroy(): void;
}
//# sourceMappingURL=ConfigurationManager.d.ts.map