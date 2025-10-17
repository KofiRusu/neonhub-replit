# NeonHub Compliance & Consent Layer v4.0

A comprehensive compliance and consent management system for NeonHub v4.0, ensuring regulatory compliance while enabling secure federated operations.

## Features

- **Regulatory Compliance Frameworks**: GDPR, CCPA, HIPAA, and other privacy regulations
- **Consent Management**: Granular consent tracking and management
- **Data Governance**: Data classification, labeling, and retention policies
- **Audit Trails**: Comprehensive logging and audit capabilities
- **Data Subject Rights**: Access, rectification, erasure, and portability rights
- **Cross-border Controls**: Data transfer controls for international operations
- **Federation Integration**: Seamless integration with federated learning operations
- **Compliance Monitoring**: Real-time compliance monitoring and reporting

## Architecture

```
┌─────────────────┐    ┌─────────────────┐
│ Compliance      │    │ Federation      │
│ Manager         │◄──►│ Manager         │
│                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Consent     │ │    │ │ Privacy      │ │
│ │ Manager     │ │    │ │ Controls     │ │
│ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ Data         │ │    │ │ Cross-border │ │
│ │ Governance   │ │    │ │ Transfers    │ │
│ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘
```

## Installation

```bash
npm install @neonhub/compliance-consent
```

## Quick Start

```typescript
import { ComplianceManager, ConsentManager, DataGovernance } from '@neonhub/compliance-consent';

const complianceManager = new ComplianceManager({
  regulations: ['GDPR', 'CCPA'],
  federationEnabled: true,
  auditEnabled: true
});

// Initialize consent management
const consentManager = new ConsentManager({
  storage: 'encrypted',
  retentionPeriod: 365 * 24 * 60 * 60 * 1000 // 1 year
});

// Set up data governance
const dataGovernance = new DataGovernance({
  classificationLevels: ['public', 'internal', 'confidential', 'restricted'],
  retentionPolicies: {
    'public': 30 * 24 * 60 * 60 * 1000,
    'internal': 365 * 24 * 60 * 60 * 1000,
    'confidential': 7 * 365 * 24 * 60 * 60 * 1000,
    'restricted': -1 // Never delete
  }
});

// Start compliance monitoring
await complianceManager.initialize();
```

## Configuration

### Compliance Configuration

```typescript
interface ComplianceConfig {
  regulations: string[];
  federationEnabled: boolean;
  auditEnabled: boolean;
  monitoringInterval: number;
  alertThresholds: {
    violations: number;
    consentExpiry: number;
  };
}
```

### Consent Configuration

```typescript
interface ConsentConfig {
  storage: 'encrypted' | 'database';
  retentionPeriod: number;
  requiredPurposes: string[];
  consentTypes: string[];
}
```

### Data Governance Configuration

```typescript
interface DataGovernanceConfig {
  classificationLevels: string[];
  retentionPolicies: Record<string, number>;
  encryptionRequired: boolean;
  crossBorderControls: boolean;
}
```

## Regulatory Frameworks

### GDPR Compliance
- Data subject rights management
- Consent tracking and validation
- Data processing records
- Breach notification system
- Data protection impact assessments

### CCPA Compliance
- Consumer rights management
- Data sale opt-out tracking
- Privacy notice requirements
- Data minimization controls

### HIPAA Compliance
- Protected health information (PHI) handling
- Business associate agreements
- Security risk assessments
- Audit controls

## Data Subject Rights

The system supports all major data subject rights:

- **Right to Access**: Data subjects can request access to their data
- **Right to Rectification**: Data correction and updates
- **Right to Erasure**: Data deletion (right to be forgotten)
- **Right to Portability**: Data export in machine-readable format
- **Right to Restriction**: Processing limitations
- **Right to Object**: Objection to processing

## Cross-border Data Transfers

- **Adequacy Decisions**: EU adequacy framework support
- **Standard Contractual Clauses**: SCC implementation
- **Binding Corporate Rules**: BCR support
- **Data Transfer Impact Assessments**: DTIA automation

## Federation Integration

Seamless integration with NeonHub federation:

- **Federated Consent**: Cross-node consent synchronization
- **Privacy-preserving Computation**: Differential privacy integration
- **Secure Aggregation**: Compliant federated learning
- **Audit Trails**: Distributed audit logging

## Monitoring & Reporting

Comprehensive compliance monitoring:

```typescript
const metrics = complianceManager.getMetrics();
console.log(metrics);
// {
//   totalConsents: 15420,
//   activeConsents: 12890,
//   expiredConsents: 2530,
//   violations: 12,
//   dataTransfers: 456,
//   auditEvents: 8920,
//   complianceScore: 98.5
// }
```

## Development

```bash
# Install dependencies
npm install

# Build the module
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## License

This module is part of the NeonHub v4.0 ecosystem and follows the same licensing terms.