# NeonHub v7.1 Cognitive Ethics & Alignment Extension

## Overview

The Cognitive Ethics & Alignment Extension operationalizes ethics-by-design across all NeonHub agents and federations with auditable, measurable guardrails. This framework ensures responsible AI through continuous monitoring, bias prevention, privacy protection, and transparent explainability.

## Architecture

```
core/cognitive-ethics/
├── src/
│   ├── types/                 # Comprehensive type definitions
│   ├── core/                  # Central orchestration
│   │   └── CognitiveEthicsManager.ts
│   ├── evaluators/            # Ethical evaluators
│   │   ├── FairnessEvaluator.ts
│   │   ├── SafetyToxicityEvaluator.ts
│   │   ├── PrivacyEvaluator.ts
│   │   ├── GroundingEvaluator.ts (planned)
│   │   └── ExplainabilityEngine.ts (planned)
│   ├── adapters/              # Agent integration wrappers
│   ├── policies/              # YAML policy definitions
│   ├── alignment-loop/        # Human-in-the-loop workflow
│   └── datasets/              # Test & validation datasets
└── package.json
```

## Core Components

### 1. CognitiveEthicsManager

Central orchestrator coordinating all ethics evaluations:

```typescript
import { CognitiveEthicsManager, EthicsPolicy } from '@neonhub/cognitive-ethics';

const policy: EthicsPolicy = {
  id: 'prod-policy-v1',
  version: '1.0.0',
  fairness: {
    enabled: true,
    demographicParityThreshold: 0.05,
    equalizedOddsThreshold: 0.05
  },
  safety: {
    enabled: true,
    toxicityThreshold: 0.3,
    hateSpeechThreshold: 0.2
  },
  privacy: {
    enabled: true,
    piiDetectionEnabled: true,
    autoRedactionEnabled: true
  }
};

const ethicsManager = new CognitiveEthicsManager(policy);

// Evaluate agent output
const result = await ethicsManager.evaluate(context, input, output);
console.log('Ethics Check:', result.overallPassed);
console.log('Critical Violations:', result.criticalViolations);
```

### 2. FairnessEvaluator

Implements demographic parity and equalized odds:

**Metrics:**
- Demographic Parity: `P(Ŷ=1|A=a) ≈ P(Ŷ=1|A=b)`
- Equalized Odds: Checks both TPR and FPR gaps
- False Positive/Negative Rate Gaps

**Usage:**
```typescript
const fairnessEval = new FairnessEvaluator(policy);
const metrics = await fairnessEval.evaluate(predictions);

if (!metrics.passed) {
  console.log('Fairness violations detected:', metrics.violations);
}
```

**Acceptance Criteria:**
- ✅ Fairness gaps ≤ 0.05 (configurable)
- ✅ Protected attributes: gender, race, age (configurable)
- ✅ Batch and single prediction evaluation

### 3. SafetyToxicityEvaluator

Multi-category harmful content detection:

**Categories:**
- Toxicity (profanity, insults)
- Hate Speech (discrimination against protected groups)
- Violence (threats, harmful intent)
- Self-Harm (suicide, self-injury)
- Harassment (bullying, intimidation)

**Usage:**
```typescript
const safetyEval = new SafetyToxicityEvaluator(policy);
const metrics = await safetyEval.evaluate({ text: output });

if (!metrics.passed) {
  const suggestions = safetyEval.getRemediationSuggestions(metrics);
  console.log('Remediation:', suggestions);
}
```

**Acceptance Criteria:**
- ✅ 0 critical safety leaks in production
- ✅ Pattern-based + ML-ready architecture
- ✅ Context-aware evaluation
- ✅ Severity classification (low/medium/high/critical)

### 4. PrivacyEvaluator

PII detection, redaction, and differential privacy:

**Features:**
- 11 PII types: email, phone, SSN, credit card, IP, passport, etc.
- Automatic redaction with configurable masks
- Differential privacy budget tracking
- Per-tenant/user privacy accounting

**Usage:**
```typescript
const privacyEval = new PrivacyEvaluator(policy);
const { metrics, redactedText } = await privacyEval.evaluateAndRedact({
  text: output,
  tenantId: 'tenant-123',
  userId: 'user-456'
});

// Check privacy budget
const budgetResult = privacyEval.consumePrivacyBudget('tenant-123:user-456', 0.1);
console.log('Budget remaining:', budgetResult.remaining);
```

**Acceptance Criteria:**
- ✅ 0 critical PII leaks
- ✅ Differential privacy budget management
- ✅ Laplace noise mechanism
- ✅ Privacy risk scoring

## Policy Definition (YAML)

Policies are defined in YAML for human readability and version control:

```yaml
# policies/production-policy.yml
id: prod-v1
version: 1.0.0
name: Production Ethics Policy
description: Default production policy for all agents
tenantId: global
jurisdiction: US
enabled: true

fairness:
  enabled: true
  demographicParityThreshold: 0.05
  equalizedOddsThreshold: 0.05
  protectedAttributes:
    - gender
    - race
    - age
    - disability

safety:
  enabled: true
  toxicityThreshold: 0.3
  hateSpeechThreshold: 0.2
  violenceThreshold: 0.3
  selfHarmThreshold: 0.1
  harassmentThreshold: 0.3

privacy:
  enabled: true
  piiDetectionEnabled: true
  autoRedactionEnabled: true
  differentialPrivacyEnabled: true
  privacyBudgetEpsilon: 1.0
  allowedPIITypes: []  # Empty = no PII allowed

grounding:
  enabled: true
  minConfidenceScore: 0.85
  requireCitations: true
  maxHallucinationScore: 0.15

explainability:
  enabled: true
  requireRationale: true
  captureShapValues: false
  generateCounterfactuals: false
```

## Agent Integration Pattern

All agents follow the pre-check → execute → post-check pattern:

```typescript
// Example: BrandVoiceAgent with Ethics
import { CognitiveEthicsManager } from '@neonhub/cognitive-ethics';

class EthicalBrandVoiceAgent {
  private ethics: CognitiveEthicsManager;
  
  async generate(input: string, context: AgentContext) {
    // Pre-check
    const preCheck = await this.ethics.preCheck(context, input);
    if (!preCheck.passed) {
      return this.handleViolation(preCheck.violations);
    }
    
    // Execute
    const output = await this.coreGenerate(input);
    
    // Post-check
    const postCheck = await this.ethics.postCheck(context, input, output);
    if (!postCheck.passed) {
      return this.applyMitigations(output, postCheck);
    }
    
    // Emit attestation
    await this.emitAttestation(postCheck.attestation);
    
    return {
      output,
      ethicsAttestation: postCheck.attestation
    };
  }
}
```

## Attestations & Provenance

Every ethics evaluation generates a cryptographic attestation:

```typescript
interface EthicsAttestation {
  hash: string;           // SHA-256 hash of evaluation data
  signature: string;      // HMAC signature
  merkleRoot: string;     // Merkle root for chain integrity
  timestamp: string;      // ISO timestamp
  policyVersion: string;  // Policy version used
}
```

**Verification:**
```typescript
// Verify attestation integrity
const isValid = verifyAttestation(attestation, publicKey);

// Trace provenance
const chain = await getAttestationChain(evaluationId);
console.log('Full audit trail:', chain);
```

## Risk Dashboard Metrics

```typescript
interface RiskScore {
  agentId: string;
  agentType: string;
  tenantId: string;
  jurisdiction: string;
  fairnessRisk: number;    // 0-1 scale
  safetyRisk: number;
  privacyRisk: number;
  overallRisk: number;
  trend: 'improving' | 'stable' | 'degrading';
  lastEvaluated: string;
}
```

**Dashboard Features:**
- Real-time risk scoring per agent/tenant/jurisdiction
- Trend analysis (7d, 30d, 90d windows)
- Violation heatmaps
- Comparative benchmarking

## Continuous Alignment Loop

Human-in-the-loop workflow for critical decisions:

```typescript
interface AlignmentTask {
  id: string;
  type: 'review' | 'approve' | 'override';
  agentId: string;
  evaluationId: string;
  violations: any[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'in_progress' | 'resolved' | 'escalated';
  slaDeadline: string;
}
```

**SLA Enforcement:**
- Critical: 15 minutes
- High: 1 hour
- Medium: 4 hours
- Low: 24 hours

**Escalation:**
Auto-escalates to next tier if SLA breached.

## Model & Data Cards

Auto-generated for compliance and transparency:

```typescript
interface ModelCard {
  modelId: string;
  modelName: string;
  version: string;
  intendedUse: string;
  limitations: string[];
  trainingData: {
    sources: string[];
    size: number;
    demographics: Record<string, any>;
  };
  evaluationMetrics: {
    fairness: Record<string, number>;
    safety: Record<string, number>;
    performance: Record<string, number>;
  };
  ethicalConsiderations: string[];
  createdAt: string;
  updatedAt: string;
}
```

**Export Formats:**
- Markdown
- PDF (with signed proofs)
- JSON (machine-readable)

## Testing Strategy

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### E2E Ethics Scenarios
```bash
npm run test:e2e:ethics
```

### Red Team Harness
```bash
npm run redteam -- --scenarios adversarial
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/ethics-ci.yml
name: Ethics CI Gates

on: [push, pull_request]

jobs:
  ethics-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Schema Validation
        run: npm run validate:schemas
      - name: Run Evaluators
        run: npm run test:evaluators
      - name: Red Team Tests
        run: npm run redteam
      - name: Generate Model Cards
        run: npm run generate:model-cards
      - name: Quality Gates
        run: npm run gates:check
```

### Quality Gates

**Must Pass:**
- Fairness gap ≤ 0.05
- 0 critical safety/privacy violations
- Grounding score ≥ 0.85 (p95)
- All policies pass schema validation
- 95% unit test coverage

## Deployment

### Install
```bash
npm install @neonhub/cognitive-ethics
```

### Environment Variables
```bash
ETHICS_POLICY_PATH=./policies/production.yml
ETHICS_ENABLE_ATTESTATIONS=true
ETHICS_MERKLE_CHAIN=true
ETHICS_PRIVACY_BUDGET_RESET=daily
```

### Monitoring
```typescript
// Prometheus metrics
ethics_evaluations_total{agent_id, status}
ethics_violations_total{category, severity}
ethics_latency_seconds{evaluator}
ethics_privacy_budget_remaining{tenant_id}
```

## Rollback Mechanism

Automatic rollback on policy violations:

```typescript
const rollbackConfig = {
  enabled: true,
  triggers: {
    criticalViolations: 3,      // Rollback after 3 critical violations
    failureRate: 0.1,            // Rollback if >10% fail
    timeWindow: '5m'             // Within 5 minute window
  },
  strategy: 'immediate',          // immediate | gradual
  notification: ['email', 'slack']
};
```

## Performance

- Pre-check latency: <10ms p95
- Post-check latency: <50ms p95
- Privacy evaluation: <20ms p95
- Safety evaluation: <30ms p95
- Fairness (batch): <100ms for 1000 predictions

## Security

- No secrets in repository
- Salted hashes only in telemetry
- Tenant-isolated privacy budgets
- Encrypted attestation storage
- Role-based access control for HITL queue

## Compliance Mappings

- **GDPR**: Privacy evaluator + consent tracking
- **CCPA**: PII detection + deletion workflows
- **AI Act (EU)**: Risk classification + documentation
- **NIST AI RMF**: Continuous measurement + governance

## Next Steps

1. Complete Grounding & Explainability evaluators
2. Implement agent adapters (BrandVoice, SEO, Support, Content, Trend)
3. Build Policy Console UI
4. Set up CI/CD pipelines
5. Generate comprehensive test suites
6. Create deployment runbooks

## Support

- Documentation: `/docs/v7.1/`
- Issues: GitHub Issues
- Slack: #cognitive-ethics
- Email: ethics@neonhub.ai

---

**Version:** 7.1.0  
**Last Updated:** 2025-10-17  
**Status:** Foundation Complete, Components In Progress