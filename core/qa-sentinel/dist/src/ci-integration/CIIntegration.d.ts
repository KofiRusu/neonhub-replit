import { CIDIntegration } from '../types';
export declare class CIIntegration {
    private ciProvider;
    private repository;
    private branch;
    constructor(ciProvider?: string, repository?: string, branch?: string);
    runPreMergeValidation(pipelineId: string, prNumber: number): Promise<CIDIntegration>;
    private runQAValidation;
    private runUnitTests;
    private runIntegrationTests;
    private runE2ETests;
    private parseTestOutput;
    private calculateCoverage;
    private runPerformanceTests;
    private detectAnomalies;
    private executeTestSuite;
    private runBenchmarkComparison;
    private runSecurityChecks;
    private combineResults;
    private evaluateGateStatus;
    postResultsToCI(integration: CIDIntegration): Promise<void>;
    private postToGitHub;
    private postToGitLab;
    private postToJenkins;
    private generateSummary;
    private generateDetailedReport;
    runScheduledValidation(): Promise<CIDIntegration>;
}
//# sourceMappingURL=CIIntegration.d.ts.map