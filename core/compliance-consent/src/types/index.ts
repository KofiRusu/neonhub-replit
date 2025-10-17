export interface ComplianceConfig {
  regulations: string[];
  federationEnabled: boolean;
  auditEnabled: boolean;
  monitoringInterval: number;
  alertThresholds: {
    violations: number;
    consentExpiry: number;
  };
}

export interface ConsentRecord {
  id: string;
  userId: string;
  purposes: string[];
  consentTypes: string[];
  grantedAt: Date;
  expiresAt?: Date;
  revokedAt?: Date;
  source: string;
  metadata: Record<string, any>;
}

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  category: string;
  sensitivity: number;
  retentionPeriod: number;
  encryptionRequired: boolean;
  crossBorderAllowed: boolean;
}

export interface AuditEvent {
  id: string;
  timestamp: Date;
  action: string;
  userId?: string;
  resource: string;
  details: Record<string, any>;
  compliance?: {
    regulation: string;
    requirement: string;
    status: 'compliant' | 'violation' | 'warning';
  };
}

export interface DataSubjectRequest {
  id: string;
  userId: string;
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  requestedAt: Date;
  completedAt?: Date;
  data?: any;
  justification?: string;
}

export interface CrossBorderTransfer {
  id: string;
  sourceRegion: string;
  destinationRegion: string;
  dataClassification: DataClassification;
  legalBasis: string;
  safeguards: string[];
  timestamp: Date;
  status: 'approved' | 'denied' | 'pending';
}

export interface ComplianceMetrics {
  totalConsents: number;
  activeConsents: number;
  expiredConsents: number;
  violations: number;
  dataTransfers: number;
  auditEvents: number;
  complianceScore: number;
  lastAudit: Date;
}

export interface RetentionPolicy {
  dataType: string;
  retentionPeriod: number; // milliseconds, -1 for indefinite
  deletionMethod: 'hard' | 'soft';
  reviewRequired: boolean;
  legalHold: boolean;
}

export enum RegulationType {
  GDPR = 'GDPR',
  CCPA = 'CCPA',
  HIPAA = 'HIPAA',
  LGPD = 'LGPD',
  PIPEDA = 'PIPEDA'
}

export interface RegulationFramework {
  type: RegulationType;
  version: string;
  requirements: string[];
  dataSubjectRights: string[];
  consentRequirements: string[];
  retentionRules: Record<string, RetentionPolicy>;
}