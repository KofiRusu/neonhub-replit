import { logger } from '../../apps/api/src/lib/logger';
import { AgentIntelligenceBus, AgentMessage } from '../aib';

export interface SafetyFilter {
  id: string;
  name: string;
  type: 'content' | 'context' | 'ethical' | 'privacy';
  priority: number;
  validate: (message: AgentMessage) => Promise<SafetyResult>;
}

export interface SafetyResult {
  passed: boolean;
  score: number;
  violations: string[];
  recommendations: string[];
  metadata: Record<string, any>;
}

export interface EthicalBoundary {
  category: string;
  rules: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  fallbackAction: string;
}

export class SafetyManager {
  private aib: AgentIntelligenceBus;
  private filters: SafetyFilter[] = [];
  private ethicalBoundaries: EthicalBoundary[] = [];
  private isActive = false;

  constructor(aib: AgentIntelligenceBus) {
    this.aib = aib;
    this.setupDefaultFilters();
    this.setupEthicalBoundaries();
    this.setupMessageInterception();
  }

  private setupDefaultFilters() {
    // Content Safety Filter
    this.filters.push({
      id: 'content-safety',
      name: 'Content Safety Filter',
      type: 'content',
      priority: 10,
      validate: this.validateContentSafety.bind(this)
    });

    // Context Filter
    this.filters.push({
      id: 'context-filter',
      name: 'Context Validation Filter',
      type: 'context',
      priority: 8,
      validate: this.validateContext.bind(this)
    });

    // Ethical Filter
    this.filters.push({
      id: 'ethical-filter',
      name: 'Ethical Compliance Filter',
      type: 'ethical',
      priority: 9,
      validate: this.validateEthicalCompliance.bind(this)
    });

    // Privacy Filter
    this.filters.push({
      id: 'privacy-filter',
      name: 'Privacy Protection Filter',
      type: 'privacy',
      priority: 9,
      validate: this.validatePrivacy.bind(this)
    });
  }

  private setupEthicalBoundaries() {
    this.ethicalBoundaries = [
      {
        category: 'harm-prevention',
        rules: [
          'No promotion of violence or harm',
          'No discriminatory content',
          'No harmful stereotypes'
        ],
        severity: 'critical',
        fallbackAction: 'block-and-report'
      },
      {
        category: 'privacy-respect',
        rules: [
          'No unauthorized data collection',
          'Respect user consent',
          'Anonymize sensitive information'
        ],
        severity: 'high',
        fallbackAction: 'sanitize-content'
      },
      {
        category: 'truthfulness',
        rules: [
          'Provide accurate information',
          'Avoid misinformation',
          'Cite sources when appropriate'
        ],
        severity: 'medium',
        fallbackAction: 'add-disclaimer'
      },
      {
        category: 'fairness',
        rules: [
          'Ensure equitable treatment',
          'Avoid bias in recommendations',
          'Consider diverse perspectives'
        ],
        severity: 'medium',
        fallbackAction: 'balance-response'
      }
    ];
  }

  private setupMessageInterception() {
    // Intercept all messages before they reach agents
    const originalBroadcast = this.aib.broadcastMessage.bind(this.aib);
    const originalSend = this.aib.sendMessage.bind(this.aib);

    this.aib.broadcastMessage = this.safetyCheckBroadcast.bind(this, originalBroadcast);
    this.aib.sendMessage = this.safetyCheckSend.bind(this, originalSend);
  }

  async startSafetyMonitoring(): Promise<void> {
    this.isActive = true;
    logger.info('Safety monitoring activated');
  }

  async stopSafetyMonitoring(): Promise<void> {
    this.isActive = false;
    logger.info('Safety monitoring deactivated');
  }

  private async safetyCheckBroadcast(originalMethod: Function, message: AgentMessage): Promise<void> {
    if (!this.isActive) {
      return originalMethod(message);
    }

    const safetyResult = await this.runSafetyChecks(message);

    if (safetyResult.passed) {
      return originalMethod(message);
    } else {
      await this.handleSafetyViolation(message, safetyResult);
    }
  }

  private async safetyCheckSend(originalMethod: Function, targetAgentId: string, message: AgentMessage): Promise<void> {
    if (!this.isActive) {
      return originalMethod(targetAgentId, message);
    }

    const safetyResult = await this.runSafetyChecks(message);

    if (safetyResult.passed) {
      return originalMethod(targetAgentId, message);
    } else {
      await this.handleSafetyViolation(message, safetyResult);
    }
  }

  private async runSafetyChecks(message: AgentMessage): Promise<SafetyResult> {
    const allResults: SafetyResult[] = [];

    // Sort filters by priority (highest first)
    const sortedFilters = this.filters.sort((a, b) => b.priority - a.priority);

    for (const filter of sortedFilters) {
      try {
        const result = await filter.validate(message);
        allResults.push(result);

        // If critical filter fails, stop checking others
        if (!result.passed && filter.priority >= 9) {
          break;
        }
      } catch (error) {
        logger.error({ filterId: filter.id, error }, `Safety filter ${filter.id} failed`);
        allResults.push({
          passed: false,
          score: 0,
          violations: [`Filter ${filter.id} execution failed`],
          recommendations: ['Review filter implementation'],
          metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }

    return this.aggregateSafetyResults(allResults);
  }

  private aggregateSafetyResults(results: SafetyResult[]): SafetyResult {
    const passed = results.every(r => r.passed);
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

    const allViolations = results.flatMap(r => r.violations);
    const allRecommendations = results.flatMap(r => r.recommendations);

    return {
      passed,
      score: avgScore,
      violations: Array.from(new Set(allViolations)),
      recommendations: Array.from(new Set(allRecommendations)),
      metadata: {
        filterCount: results.length,
        passedCount: results.filter(r => r.passed).length
      }
    };
  }

  private async validateContentSafety(message: AgentMessage): Promise<SafetyResult> {
    const content = JSON.stringify(message.payload);
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check for harmful content patterns
    const harmfulPatterns = [
      /violence| harm | kill | injure /i,
      /discriminat| hate | bias /i,
      /illegal| criminal | fraud /i
    ];

    for (const pattern of harmfulPatterns) {
      if (pattern.test(content)) {
        violations.push(`Detected potentially harmful content matching pattern: ${pattern}`);
        recommendations.push('Review and sanitize content before processing');
      }
    }

    // Check content length
    if (content.length > 10000) {
      violations.push('Content exceeds maximum allowed length');
      recommendations.push('Break down large content into smaller chunks');
    }

    return {
      passed: violations.length === 0,
      score: violations.length === 0 ? 1.0 : 0.5,
      violations,
      recommendations,
      metadata: { contentLength: content.length }
    };
  }

  private async validateContext(message: AgentMessage): Promise<SafetyResult> {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Validate message structure
    if (!message.id || !message.type || !message.sender) {
      violations.push('Invalid message structure');
      recommendations.push('Ensure all required message fields are present');
    }

    // Check for suspicious sender patterns
    if (message.sender.includes('unknown') || message.sender.includes('test')) {
      violations.push('Untrusted sender detected');
      recommendations.push('Verify sender authenticity');
    }

    // Validate timestamp
    const messageAge = Date.now() - message.timestamp.getTime();
    if (messageAge > 300000) { // 5 minutes
      violations.push('Message timestamp is too old');
      recommendations.push('Check for message replay attacks');
    }

    return {
      passed: violations.length === 0,
      score: violations.length === 0 ? 1.0 : 0.7,
      violations,
      recommendations,
      metadata: { messageAge }
    };
  }

  private async validateEthicalCompliance(message: AgentMessage): Promise<SafetyResult> {
    const content = JSON.stringify(message.payload);
    const violations: string[] = [];
    const recommendations: string[] = [];

    for (const boundary of this.ethicalBoundaries) {
      for (const rule of boundary.rules) {
        // Simple pattern matching for rule violations
        const ruleWords = rule.toLowerCase().split(' ').filter(w => w.length > 3);
        const rulePattern = new RegExp(ruleWords.join('|'), 'i');

        if (rulePattern.test(content)) {
          violations.push(`Potential violation of ethical rule: ${rule}`);
          recommendations.push(`Review against ${boundary.category} guidelines`);
        }
      }
    }

    return {
      passed: violations.length === 0,
      score: violations.length === 0 ? 1.0 : 0.6,
      violations,
      recommendations,
      metadata: { checkedBoundaries: this.ethicalBoundaries.length }
    };
  }

  private async validatePrivacy(message: AgentMessage): Promise<SafetyResult> {
    const content = JSON.stringify(message.payload);
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check for PII patterns
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/ // Phone
    ];

    for (const pattern of piiPatterns) {
      if (pattern.test(content)) {
        violations.push('Potential personally identifiable information detected');
        recommendations.push('Anonymize or remove sensitive data');
      }
    }

    return {
      passed: violations.length === 0,
      score: violations.length === 0 ? 1.0 : 0.4,
      violations,
      recommendations,
      metadata: { patternsChecked: piiPatterns.length }
    };
  }

  private async handleSafetyViolation(message: AgentMessage, result: SafetyResult): Promise<void> {
    logger.warn({
      messageId: message.id,
      violations: result.violations,
      score: result.score
    }, 'Safety violation detected');

    // Determine appropriate fallback action
    const fallbackAction = this.determineFallbackAction(result);

    switch (fallbackAction) {
      case 'block':
        logger.info({ messageId: message.id }, 'Message blocked due to safety violation');
        break;
      case 'sanitize':
        await this.sanitizeAndForward(message, result);
        break;
      case 'escalate':
        await this.escalateViolation(message, result);
        break;
      case 'log-only':
        // Allow message to proceed but log the violation
        await this.aib.broadcastMessage(message);
        break;
    }
  }

  private determineFallbackAction(result: SafetyResult): string {
    if (result.score < 0.5) return 'block';
    if (result.score < 0.7) return 'sanitize';
    if (result.violations.some(v => v.includes('critical'))) return 'escalate';
    return 'log-only';
  }

  private async sanitizeAndForward(message: AgentMessage, result: SafetyResult): Promise<void> {
    // Create sanitized version of message
    const sanitizedPayload = this.sanitizeContent(message.payload, result.recommendations);

    const sanitizedMessage: AgentMessage = {
      ...message,
      payload: sanitizedPayload,
      metadata: {
        ...message.metadata,
        sanitized: true,
        originalViolations: result.violations
      }
    };

    await this.aib.broadcastMessage(sanitizedMessage);
    logger.info({ messageId: message.id }, 'Message sanitized and forwarded');
  }

  private sanitizeContent(payload: any, recommendations: string[]): any {
    let sanitized = JSON.stringify(payload);

    // Apply basic sanitization based on recommendations
    if (recommendations.some(r => r.includes('sensitive'))) {
      // Remove potential PII
      sanitized = sanitized.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED-SSN]');
      sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[REDACTED-EMAIL]');
    }

    return JSON.parse(sanitized);
  }

  private async escalateViolation(message: AgentMessage, result: SafetyResult): Promise<void> {
    // Send escalation message to meta-orchestrator
    const escalationMessage: AgentMessage = {
      id: `escalation-${Date.now()}`,
      type: 'safety:escalation',
      payload: {
        originalMessage: message,
        violations: result.violations,
        severity: 'high'
      },
      sender: 'safety-manager',
      timestamp: new Date(),
      priority: 'critical'
    };

    await this.aib.broadcastMessage(escalationMessage);
    logger.warn({ messageId: message.id }, 'Safety violation escalated');
  }

  addCustomFilter(filter: SafetyFilter): void {
    this.filters.push(filter);
    this.filters.sort((a, b) => b.priority - a.priority);
  }

  removeFilter(filterId: string): void {
    this.filters = this.filters.filter(f => f.id !== filterId);
  }

  getSafetyStats(): any {
    return {
      isActive: this.isActive,
      filterCount: this.filters.length,
      boundaryCount: this.ethicalBoundaries.length,
      filters: this.filters.map(f => ({ id: f.id, name: f.name, type: f.type, priority: f.priority }))
    };
  }
}