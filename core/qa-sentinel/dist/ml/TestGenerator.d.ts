import { TestCase, FailurePattern, TelemetryData, QASentinelConfig } from '../types';
export declare class MLTestGenerator {
    private model;
    private config;
    private trainingData;
    private featureStats;
    constructor(config: QASentinelConfig);
    initialize(): Promise<void>;
    train(telemetryData: TelemetryData[], failurePatterns: FailurePattern[]): Promise<void>;
    private calculateFeatureStats;
    private extractFeatures;
    private generateNormalPatterns;
    private prepareTrainingData;
    generateTest(component: string, telemetryData: TelemetryData[]): Promise<TestCase | null>;
    private createTestFromPrediction;
    predictTestNeed(component: string, currentMetrics: Record<string, number>): Promise<number>;
    private createFeaturesFromMetrics;
    getModelStats(): {
        accuracy?: number;
        loss?: number;
        trained: boolean;
    };
    saveModel(path: string): Promise<void>;
    loadModel(path: string): Promise<void>;
}
//# sourceMappingURL=TestGenerator.d.ts.map