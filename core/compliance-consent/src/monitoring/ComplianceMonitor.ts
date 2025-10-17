import { ComplianceMetrics } from '../types';

export interface ComplianceMonitorConfig {
  monitoringInterval: number;
  alertThresholds: {
    violations: number;
    consentExpiry: number;
  };
  reportRetention: number;
}

export class ComplianceMonitor {
  private config: ComplianceMonitorConfig;
  private metrics: ComplianceMetrics;
  private alerts: Array<{
    id: string;
    type: 'violation' | 'warning' | 'expiry';
    message: string;
    timestamp: Date;
    resolved: boolean;
  }> = [];
  private reports: Array<{
    id: string;
    period: { start: Date; end: Date };
    metrics: ComplianceMetrics;
    generatedAt: Date;
  }> = [];

  constructor(config: ComplianceMonitorConfig) {
    this.config = config;
    this.metrics = {
      totalConsents: 0,
      activeConsents: 0,
      expiredConsents: 0,
      violations: 0,
      dataTransfers: 0,
      auditEvents: 0,
      complianceScore: 100,
      lastAudit: new Date()
    };

    // Start monitoring
    setInterval(() => this.performMonitoring(), this.config.monitoringInterval);
  }

  updateMetrics(updates: Partial<ComplianceMetrics>): void {
    this.metrics = { ...this.metrics, ...updates, lastAudit: new Date() };
    this.checkThresholds();
  }

  private checkThresholds(): void {
    if (this.metrics.violations >= this.config.alertThresholds.violations) {
      this.createAlert('violation', `Compliance violations exceeded threshold: ${this.metrics.violations}`);
    }

    if (this.metrics.expiredConsents >= this.config.alertThresholds.consentExpiry) {
      this.createAlert('expiry', `Expired consents exceeded threshold: ${this.metrics.expiredConsents}`);
    }

    // Calculate compliance score
    const violationPenalty = Math.min(this.metrics.violations * 5, 50);
    const expiryPenalty = Math.min(this.metrics.expiredConsents * 2, 30);
    this.metrics.complianceScore = Math.max(0, 100 - violationPenalty - expiryPenalty);
  }

  private createAlert(type: 'violation' | 'warning' | 'expiry', message: string): void {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      message,
      timestamp: new Date(),
      resolved: false
    };

    this.alerts.push(alert);

    // In a real implementation, this would trigger notifications
    console.log(`[ALERT] ${type.toUpperCase()}: ${message}`);
  }

  getActiveAlerts(): Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
  }> {
    return this.alerts
      .filter(alert => !alert.resolved)
      .map(alert => ({
        id: alert.id,
        type: alert.type,
        message: alert.message,
        timestamp: alert.timestamp
      }));
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      return true;
    }
    return false;
  }

  generateComplianceReport(startDate: Date, endDate: Date): {
    id: string;
    period: { start: Date; end: Date };
    metrics: ComplianceMetrics;
    alerts: number;
    recommendations: string[];
  } {
    const report = {
      id: `report_${Date.now()}`,
      period: { start: startDate, end: endDate },
      metrics: { ...this.metrics },
      alerts: this.alerts.filter(a =>
        a.timestamp >= startDate && a.timestamp <= endDate
      ).length,
      recommendations: this.generateRecommendations(),
      generatedAt: new Date()
    };

    this.reports.push(report);
    return report;
  }

  getComplianceMetrics(): ComplianceMetrics {
    return { ...this.metrics };
  }

  getComplianceScore(): number {
    return this.metrics.complianceScore;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.metrics.violations > 0) {
      recommendations.push('Review and address compliance violations');
    }

    if (this.metrics.expiredConsents > 10) {
      recommendations.push('Renew or obtain new consents for expired records');
    }

    if (this.metrics.complianceScore < 80) {
      recommendations.push('Implement additional compliance controls');
    }

    if (this.metrics.dataTransfers > 100) {
      recommendations.push('Review cross-border data transfer safeguards');
    }

    return recommendations;
  }

  private performMonitoring(): void {
    // Clean up old reports
    const cutoffDate = new Date(Date.now() - this.config.reportRetention);
    this.reports = this.reports.filter(r => r.generatedAt >= cutoffDate);

    // Clean up old alerts (keep last 30 days)
    const alertCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.alerts = this.alerts.filter(a => a.timestamp >= alertCutoff);

    // Log monitoring status
    console.log(`[MONITORING] Compliance score: ${this.metrics.complianceScore}%, Active alerts: ${this.getActiveAlerts().length}`);
  }

  getMonitoringStatus(): {
    lastCheck: Date;
    activeAlerts: number;
    complianceScore: number;
    totalReports: number;
  } {
    return {
      lastCheck: new Date(),
      activeAlerts: this.getActiveAlerts().length,
      complianceScore: this.metrics.complianceScore,
      totalReports: this.reports.length
    };
  }
}