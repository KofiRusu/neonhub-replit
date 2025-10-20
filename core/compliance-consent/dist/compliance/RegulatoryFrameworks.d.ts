import { RegulationType, RegulationFramework } from '../types';
export declare class RegulatoryFrameworks {
    private static frameworks;
    static initialize(): void;
    static getFramework(type: RegulationType): RegulationFramework | undefined;
    static getAllFrameworks(): RegulationFramework[];
    static validateCompliance(data: any, regulations: RegulationType[]): {
        compliant: boolean;
        violations: string[];
        recommendations: string[];
    };
    private static validateConsent;
    private static validateRetention;
    private static validateDataSubjectRights;
}
//# sourceMappingURL=RegulatoryFrameworks.d.ts.map