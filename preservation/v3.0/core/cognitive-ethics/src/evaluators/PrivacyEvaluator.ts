/**
 * PrivacyEvaluator - Protects user privacy through PII detection and differential privacy
 * Implements PII detection/redaction and differential privacy budget management
 */

import {
  EthicsPolicy,
  PrivacyMetrics,
  PIIDetection,
  PrivacyViolation,
} from '../types';

interface PrivacyContext {
  text: string;
  tenantId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export class PrivacyEvaluator {
  private policy: EthicsPolicy;
  
  // PII pattern matchers
  private readonly PII_PATTERNS = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    phone: /\b(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    ipAddress: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
    driverLicense: /\b[A-Z]{1,2}\d{5,8}\b/g,
    bankAccount: /\b\d{8,17}\b/g,
    postalCode: /\b\d{5}(-\d{4})?\b/g,
    name: /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, // Simple name pattern
    address: /\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct)\b/gi,
  };

  // Privacy budget tracker (per tenant/user)
  private privacyBudgets: Map<string, number> = new Map();

  constructor(policy: EthicsPolicy) {
    this.policy = policy;
  }

  /**
   * Evaluate privacy metrics for content
   */
  async evaluate(context: PrivacyContext): Promise<PrivacyMetrics> {
    if (!this.policy.privacy?.enabled) {
      return this.getPassingMetrics();
    }

    const piiDetected: PIIDetection[] = [];
    const violations: PrivacyViolation[] = [];

    // PII Detection
    if (this.policy.privacy.piiDetectionEnabled) {
      const detections = this.detectPII(context.text);
      piiDetected.push(...detections);

      // Check for unauthorized PII
      const allowedTypes = this.policy.privacy.allowedPIITypes || [];
      const unauthorizedPII = detections.filter(
        d => !allowedTypes.includes(d.type)
      );

      if (unauthorizedPII.length > 0) {
        violations.push({
          type: 'pii_leak',
          details: `Detected ${unauthorizedPII.length} unauthorized PII types: ${
            unauthorizedPII.map(p => p.type).join(', ')
          }`,
          severity: this.calculatePIISeverity(unauthorizedPII),
        });
      }
    }

    // Differential Privacy Budget Check
    let privacyBudgetRemaining = 1.0;
    if (this.policy.privacy.differentialPrivacyEnabled) {
      const budgetKey = this.getBudgetKey(context);
      const result = this.checkPrivacyBudget(
        budgetKey,
        this.policy.privacy.privacyBudgetEpsilon
      );
      
      privacyBudgetRemaining = result.remaining;
      
      if (!result.allowed) {
        violations.push({
          type: 'budget_exceeded',
          details: `Privacy budget exhausted for ${budgetKey}`,
          severity: 'critical',
        });
      }
    }

    return {
      piiDetected,
      privacyBudgetRemaining,
      passed: violations.length === 0,
      violations,
    };
  }

  /**
   * Detect PII in text using pattern matching
   */
  private detectPII(text: string): PIIDetection[] {
    const detections: PIIDetection[] = [];

    for (const [type, pattern] of Object.entries(this.PII_PATTERNS)) {
      const matches = Array.from(text.matchAll(pattern));
      
      for (const match of matches) {
        if (match.index !== undefined) {
          detections.push({
            type,
            value: match[0],
            location: {
              start: match.index,
              end: match.index + match[0].length,
            },
            confidence: this.calculateConfidence(type, match[0]),
            redacted: false,
          });
        }
      }
    }

    return detections;
  }

  /**
   * Calculate confidence score for PII detection
   */
  private calculateConfidence(type: string, value: string): number {
    // Higher confidence for well-defined patterns
    const highConfidenceTypes = ['email', 'ssn', 'creditCard', 'phone'];
    const mediumConfidenceTypes = ['ipAddress', 'postalCode'];
    
    if (highConfidenceTypes.includes(type)) {
      return 0.95;
    } else if (mediumConfidenceTypes.includes(type)) {
      return 0.80;
    }
    
    // Lower confidence for ambiguous patterns like names
    return 0.65;
  }

  /**
   * Calculate severity of PII violations
   */
  private calculatePIISeverity(
    detections: PIIDetection[]
  ): 'low' | 'medium' | 'high' | 'critical' {
    const criticalTypes = ['ssn', 'creditCard', 'bankAccount', 'passport'];
    const highTypes = ['driverLicense', 'phone', 'email'];
    
    if (detections.some(d => criticalTypes.includes(d.type))) {
      return 'critical';
    } else if (detections.some(d => highTypes.includes(d.type))) {
      return 'high';
    } else if (detections.length > 5) {
      return 'high';
    } else if (detections.length > 2) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Redact PII from text
   */
  redactPII(text: string, detections: PIIDetection[]): string {
    if (!this.policy.privacy?.autoRedactionEnabled) {
      return text;
    }

    let redactedText = text;
    
    // Sort detections by position (descending) to avoid offset issues
    const sortedDetections = [...detections].sort(
      (a, b) => b.location.start - a.location.start
    );

    for (const detection of sortedDetections) {
      const redactionMask = this.getRedactionMask(detection.type);
      redactedText = 
        redactedText.slice(0, detection.location.start) +
        redactionMask +
        redactedText.slice(detection.location.end);
      
      detection.redacted = true;
    }

    return redactedText;
  }

  /**
   * Get redaction mask for PII type
   */
  private getRedactionMask(type: string): string {
    const masks: Record<string, string> = {
      email: '[EMAIL_REDACTED]',
      phone: '[PHONE_REDACTED]',
      ssn: '[SSN_REDACTED]',
      creditCard: '[CARD_REDACTED]',
      ipAddress: '[IP_REDACTED]',
      passport: '[PASSPORT_REDACTED]',
      driverLicense: '[LICENSE_REDACTED]',
      bankAccount: '[ACCOUNT_REDACTED]',
      postalCode: '[ZIP_REDACTED]',
      name: '[NAME_REDACTED]',
      address: '[ADDRESS_REDACTED]',
    };
    
    return masks[type] || '[PII_REDACTED]';
  }

  /**
   * Check differential privacy budget
   */
  private checkPrivacyBudget(
    key: string,
    epsilon: number
  ): { allowed: boolean; remaining: number } {
    const currentBudget = this.privacyBudgets.get(key) || 0;
    const remaining = Math.max(0, epsilon - currentBudget);
    
    return {
      allowed: remaining > 0,
      remaining: remaining / epsilon, // Normalized to 0-1
    };
  }

  /**
   * Consume privacy budget for a query
   */
  consumePrivacyBudget(
    key: string,
    cost: number
  ): { success: boolean; remaining: number } {
    const currentBudget = this.privacyBudgets.get(key) || 0;
    const newBudget = currentBudget + cost;
    const epsilon = this.policy.privacy?.privacyBudgetEpsilon || 1.0;
    
    if (newBudget <= epsilon) {
      this.privacyBudgets.set(key, newBudget);
      return {
        success: true,
        remaining: (epsilon - newBudget) / epsilon,
      };
    }
    
    return {
      success: false,
      remaining: Math.max(0, (epsilon - currentBudget) / epsilon),
    };
  }

  /**
   * Reset privacy budget for a key
   */
  resetPrivacyBudget(key: string): void {
    this.privacyBudgets.delete(key);
  }

  /**
   * Get budget key from context
   */
  private getBudgetKey(context: PrivacyContext): string {
    // Use tenant + user for granular privacy tracking
    if (context.userId) {
      return `${context.tenantId || 'default'}:${context.userId}`;
    }
    return context.tenantId || 'default';
  }

  /**
   * Return passing metrics when privacy is disabled
   */
  private getPassingMetrics(): PrivacyMetrics {
    return {
      piiDetected: [],
      privacyBudgetRemaining: 1.0,
      passed: true,
      violations: [],
    };
  }

  /**
   * Evaluate and auto-redact in one operation
   */
  async evaluateAndRedact(
    context: PrivacyContext
  ): Promise<{ metrics: PrivacyMetrics; redactedText: string }> {
    const metrics = await this.evaluate(context);
    const redactedText = this.redactPII(context.text, metrics.piiDetected);
    
    return { metrics, redactedText };
  }

  /**
   * Batch evaluate multiple contexts
   */
  async evaluateBatch(
    contexts: PrivacyContext[]
  ): Promise<PrivacyMetrics[]> {
    return Promise.all(contexts.map(ctx => this.evaluate(ctx)));
  }

  /**
   * Add noise for differential privacy (Laplace mechanism)
   */
  addNoise(value: number, sensitivity: number, epsilon: number): number {
    const scale = sensitivity / epsilon;
    // Laplace noise: sample from Laplace(0, scale)
    const u = Math.random() - 0.5;
    const noise = -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
    return value + noise;
  }

  /**
   * Check if text contains sensitive information
   */
  containsSensitiveInfo(text: string): boolean {
    const detections = this.detectPII(text);
    return detections.length > 0;
  }

  /**
   * Get privacy risk score for text
   */
  getPrivacyRiskScore(text: string): number {
    const detections = this.detectPII(text);
    
    if (detections.length === 0) return 0;
    
    // Weight by PII type severity
    const criticalWeight = 0.4;
    const highWeight = 0.25;
    const mediumWeight = 0.15;
    const lowWeight = 0.05;
    
    const criticalTypes = ['ssn', 'creditCard', 'bankAccount', 'passport'];
    const highTypes = ['driverLicense', 'phone', 'email'];
    const mediumTypes = ['ipAddress', 'postalCode', 'address'];
    
    let score = 0;
    for (const detection of detections) {
      if (criticalTypes.includes(detection.type)) {
        score += criticalWeight;
      } else if (highTypes.includes(detection.type)) {
        score += highWeight;
      } else if (mediumTypes.includes(detection.type)) {
        score += mediumWeight;
      } else {
        score += lowWeight;
      }
    }
    
    return Math.min(score, 1.0);
  }
}