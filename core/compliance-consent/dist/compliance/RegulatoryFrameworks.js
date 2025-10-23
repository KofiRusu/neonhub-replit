import { RegulationType } from '../types';
export class RegulatoryFrameworks {
    static initialize() {
        this.frameworks.set(RegulationType.GDPR, {
            type: RegulationType.GDPR,
            version: '2018',
            requirements: [
                'lawful_basis_processing',
                'data_minimization',
                'purpose_limitation',
                'accuracy',
                'storage_limitation',
                'integrity_confidentiality',
                'accountability'
            ],
            dataSubjectRights: [
                'right_to_access',
                'right_to_rectification',
                'right_to_erasure',
                'right_to_restriction',
                'right_to_portability',
                'right_to_object'
            ],
            consentRequirements: [
                'freely_given',
                'specific',
                'informed',
                'unambiguous',
                'withdrawable'
            ],
            retentionRules: {
                'personal_data': {
                    dataType: 'personal_data',
                    retentionPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year default
                    deletionMethod: 'hard',
                    reviewRequired: true,
                    legalHold: false
                },
                'sensitive_data': {
                    dataType: 'sensitive_data',
                    retentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
                    deletionMethod: 'hard',
                    reviewRequired: true,
                    legalHold: false
                }
            }
        });
        this.frameworks.set(RegulationType.CCPA, {
            type: RegulationType.CCPA,
            version: '2020',
            requirements: [
                'notice_at_collection',
                'right_to_know',
                'right_to_delete',
                'right_to_opt_out',
                'non_discrimination'
            ],
            dataSubjectRights: [
                'right_to_know',
                'right_to_delete',
                'right_to_opt_out_sale',
                'right_to_non_discrimination'
            ],
            consentRequirements: [
                'affirmative_opt_in',
                'clear_notice',
                'easy_withdrawal'
            ],
            retentionRules: {
                'personal_information': {
                    dataType: 'personal_information',
                    retentionPeriod: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
                    deletionMethod: 'hard',
                    reviewRequired: false,
                    legalHold: false
                }
            }
        });
        this.frameworks.set(RegulationType.HIPAA, {
            type: RegulationType.HIPAA,
            version: '1996',
            requirements: [
                'privacy_rule',
                'security_rule',
                'breach_notification',
                'business_associate_agreements',
                'minimum_necessary'
            ],
            dataSubjectRights: [
                'right_to_access',
                'right_to_amend',
                'right_to_accounting_disclosures',
                'right_to_request_restrictions'
            ],
            consentRequirements: [
                'informed_consent',
                'authorization_for_use_disclosure'
            ],
            retentionRules: {
                'protected_health_information': {
                    dataType: 'protected_health_information',
                    retentionPeriod: 6 * 365 * 24 * 60 * 60 * 1000, // 6 years
                    deletionMethod: 'hard',
                    reviewRequired: true,
                    legalHold: true
                }
            }
        });
    }
    static getFramework(type) {
        return this.frameworks.get(type);
    }
    static getAllFrameworks() {
        return Array.from(this.frameworks.values());
    }
    static validateCompliance(data, regulations) {
        const violations = [];
        const recommendations = [];
        for (const regulation of regulations) {
            const framework = this.getFramework(regulation);
            if (!framework)
                continue;
            // Check consent requirements
            if (!data.consent || !this.validateConsent(data.consent, framework)) {
                violations.push(`${regulation}: Invalid or missing consent`);
                recommendations.push(`${regulation}: Ensure consent meets all requirements`);
            }
            // Check retention compliance
            if (!this.validateRetention(data, framework)) {
                violations.push(`${regulation}: Retention policy violation`);
                recommendations.push(`${regulation}: Review data retention policies`);
            }
            // Check data subject rights
            if (!this.validateDataSubjectRights(data, framework)) {
                violations.push(`${regulation}: Data subject rights not properly implemented`);
                recommendations.push(`${regulation}: Implement required data subject rights`);
            }
        }
        return {
            compliant: violations.length === 0,
            violations,
            recommendations
        };
    }
    static validateConsent(consent, framework) {
        for (const requirement of framework.consentRequirements) {
            switch (requirement) {
                case 'freely_given':
                    if (!consent.freelyGiven)
                        return false;
                    break;
                case 'specific':
                    if (!consent.specific)
                        return false;
                    break;
                case 'informed':
                    if (!consent.informed)
                        return false;
                    break;
                case 'unambiguous':
                    if (!consent.unambiguous)
                        return false;
                    break;
                case 'withdrawable':
                    if (!consent.withdrawable)
                        return false;
                    break;
            }
        }
        return true;
    }
    static validateRetention(data, framework) {
        const now = Date.now();
        for (const [key, policy] of Object.entries(framework.retentionRules)) {
            const retentionPolicy = policy;
            if (data.createdAt && retentionPolicy.retentionPeriod > 0) {
                const age = now - data.createdAt.getTime();
                if (age > retentionPolicy.retentionPeriod) {
                    return false;
                }
            }
        }
        return true;
    }
    static validateDataSubjectRights(data, framework) {
        // Check if required rights are implemented
        const implementedRights = data.implementedRights || [];
        for (const right of framework.dataSubjectRights) {
            if (!implementedRights.includes(right)) {
                return false;
            }
        }
        return true;
    }
}
RegulatoryFrameworks.frameworks = new Map();
// Initialize frameworks on module load
RegulatoryFrameworks.initialize();
//# sourceMappingURL=RegulatoryFrameworks.js.map