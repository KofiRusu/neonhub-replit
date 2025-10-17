import { PerformanceMetrics } from '../types';
export declare class BaselineLoader {
    private static readonly BASELINE_DIR;
    static loadV31Baseline(): Promise<PerformanceMetrics>;
    static loadV30Baseline(): Promise<PerformanceMetrics>;
    static loadCSVBaseline(filePath: string): Promise<any[]>;
    static validateBaseline(metrics: PerformanceMetrics): boolean;
    static calculateBaselineAverages(baselines: PerformanceMetrics[]): PerformanceMetrics;
}
//# sourceMappingURL=baselineLoader.d.ts.map