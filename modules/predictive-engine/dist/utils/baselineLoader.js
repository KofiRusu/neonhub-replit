import * as fs from 'fs';
import * as path from 'path';
import csv from 'csv-parser';
export class BaselineLoader {
    static async loadV31Baseline() {
        const jsonPath = path.join(this.BASELINE_DIR, 'performance_baseline_report.json');
        if (!fs.existsSync(jsonPath)) {
            throw new Error('v3.1 baseline report not found');
        }
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        return {
            traffic: {
                totalPageViews: data.traffic_volume.total_page_views,
                uniqueVisitors: data.traffic_volume.unique_visitors,
                dailyAveragePageViews: data.traffic_volume.daily_average_page_views,
                peakDailyPageViews: data.traffic_volume.peak_daily_page_views,
                bounceRate: data.traffic_volume.bounce_rate,
                sessionDurationAvg: data.traffic_volume.session_duration_avg_seconds
            },
            latency: {
                apiResponseTimeAvg: data.latency.api_response_time_avg_ms,
                apiResponseTimeP95: data.latency.api_response_time_p95_ms,
                pageLoadTimeAvg: data.latency.page_load_time_avg_ms,
                pageLoadTimeP95: data.latency.page_load_time_p95_ms,
                jobProcessingLatencyAvg: data.latency.job_processing_latency_avg_ms,
                jobProcessingLatencyP95: data.latency.job_processing_latency_p95_ms
            },
            errors: {
                apiErrorRate: data.error_rates.api_error_rate,
                jobFailureRate: data.error_rates.job_failure_rate,
                totalErrors: data.error_rates.total_errors,
                criticalErrors: data.error_rates.critical_errors,
                errorTrends: data.error_rates.error_trends
            },
            conversions: {
                totalConversions: data.conversion_metrics.total_conversions,
                conversionRate: data.conversion_metrics.conversion_rate,
                clickThroughRate: data.conversion_metrics.click_through_rate,
                openRate: data.conversion_metrics.open_rate,
                funnelDropOff: {
                    pageViewToClick: data.conversion_metrics.funnel_drop_off.page_view_to_click,
                    clickToConversion: data.conversion_metrics.funnel_drop_off.click_to_conversion
                }
            },
            kpis: data.v3_0_0_kpis,
            infrastructure: data.infrastructure_metrics,
            security: data.security_metrics
        };
    }
    static async loadV30Baseline() {
        // For v3.0, we'll use the same data structure but mark as v3.0
        const baseline = await this.loadV31Baseline();
        // In a real implementation, this would load from a separate v3.0 file
        return baseline;
    }
    static async loadCSVBaseline(filePath) {
        return new Promise((resolve, reject) => {
            const results = [];
            fs.createReadStream(filePath)
                .pipe(csv())
                .on('data', (data) => results.push(data))
                .on('end', () => resolve(results))
                .on('error', reject);
        });
    }
    static validateBaseline(metrics) {
        // Validate required fields and ranges
        const validations = [
            metrics.traffic.totalPageViews > 0,
            metrics.traffic.uniqueVisitors > 0,
            metrics.latency.apiResponseTimeAvg > 0,
            metrics.errors.apiErrorRate >= 0 && metrics.errors.apiErrorRate <= 1,
            metrics.conversions.conversionRate >= 0 && metrics.conversions.conversionRate <= 1,
            metrics.infrastructure.uptimePercentage >= 0 && metrics.infrastructure.uptimePercentage <= 100
        ];
        return validations.every(v => v);
    }
    static calculateBaselineAverages(baselines) {
        if (baselines.length === 0) {
            throw new Error('No baselines provided');
        }
        const sumMetrics = baselines.reduce((acc, curr) => ({
            traffic: {
                totalPageViews: acc.traffic.totalPageViews + curr.traffic.totalPageViews,
                uniqueVisitors: acc.traffic.uniqueVisitors + curr.traffic.uniqueVisitors,
                dailyAveragePageViews: acc.traffic.dailyAveragePageViews + curr.traffic.dailyAveragePageViews,
                peakDailyPageViews: acc.traffic.peakDailyPageViews + curr.traffic.peakDailyPageViews,
                bounceRate: acc.traffic.bounceRate + curr.traffic.bounceRate,
                sessionDurationAvg: acc.traffic.sessionDurationAvg + curr.traffic.sessionDurationAvg
            },
            latency: {
                apiResponseTimeAvg: acc.latency.apiResponseTimeAvg + curr.latency.apiResponseTimeAvg,
                apiResponseTimeP95: acc.latency.apiResponseTimeP95 + curr.latency.apiResponseTimeP95,
                pageLoadTimeAvg: acc.latency.pageLoadTimeAvg + curr.latency.pageLoadTimeAvg,
                pageLoadTimeP95: acc.latency.pageLoadTimeP95 + curr.latency.pageLoadTimeP95,
                jobProcessingLatencyAvg: acc.latency.jobProcessingLatencyAvg + curr.latency.jobProcessingLatencyAvg,
                jobProcessingLatencyP95: acc.latency.jobProcessingLatencyP95 + curr.latency.jobProcessingLatencyP95
            },
            errors: {
                apiErrorRate: acc.errors.apiErrorRate + curr.errors.apiErrorRate,
                jobFailureRate: acc.errors.jobFailureRate + curr.errors.jobFailureRate,
                totalErrors: acc.errors.totalErrors + curr.errors.totalErrors,
                criticalErrors: acc.errors.criticalErrors + curr.errors.criticalErrors,
                errorTrends: {} // Skip averaging trends for simplicity
            },
            conversions: {
                totalConversions: acc.conversions.totalConversions + curr.conversions.totalConversions,
                conversionRate: acc.conversions.conversionRate + curr.conversions.conversionRate,
                clickThroughRate: acc.conversions.clickThroughRate + curr.conversions.clickThroughRate,
                openRate: acc.conversions.openRate + curr.conversions.openRate,
                funnelDropOff: {
                    pageViewToClick: acc.conversions.funnelDropOff.pageViewToClick + curr.conversions.funnelDropOff.pageViewToClick,
                    clickToConversion: acc.conversions.funnelDropOff.clickToConversion + curr.conversions.funnelDropOff.clickToConversion
                }
            },
            kpis: {
                brandVoiceToneConsistency: acc.kpis.brandVoiceToneConsistency + curr.kpis.brandVoiceToneConsistency,
                contentReadabilityScore: acc.kpis.contentReadabilityScore + curr.kpis.contentReadabilityScore,
                recentCampaignWins: acc.kpis.recentCampaignWins + curr.kpis.recentCampaignWins,
                complianceAlerts: acc.kpis.complianceAlerts + curr.kpis.complianceAlerts,
                seoGrowthRate: acc.kpis.seoGrowthRate + curr.kpis.seoGrowthRate,
                contentCadenceTargetMet: acc.kpis.contentCadenceTargetMet && curr.kpis.contentCadenceTargetMet,
                agentJobSuccessRate: acc.kpis.agentJobSuccessRate + curr.kpis.agentJobSuccessRate,
                userSatisfactionScore: acc.kpis.userSatisfactionScore + curr.kpis.userSatisfactionScore
            },
            infrastructure: {
                uptimePercentage: acc.infrastructure.uptimePercentage + curr.infrastructure.uptimePercentage,
                cpuUtilizationAvg: acc.infrastructure.cpuUtilizationAvg + curr.infrastructure.cpuUtilizationAvg,
                memoryUtilizationAvg: acc.infrastructure.memoryUtilizationAvg + curr.infrastructure.memoryUtilizationAvg,
                databaseConnectionPoolUtilization: acc.infrastructure.databaseConnectionPoolUtilization + curr.infrastructure.databaseConnectionPoolUtilization,
                cdnHitRate: acc.infrastructure.cdnHitRate + curr.infrastructure.cdnHitRate
            },
            security: {
                sslRating: curr.security.sslRating, // Take last value
                failedLoginAttempts: acc.security.failedLoginAttempts + curr.security.failedLoginAttempts,
                rateLimitViolations: acc.security.rateLimitViolations + curr.security.rateLimitViolations,
                vulnerabilityScansPassed: acc.security.vulnerabilityScansPassed && curr.security.vulnerabilityScansPassed,
                dataEncryptionCompliance: acc.security.dataEncryptionCompliance && curr.security.dataEncryptionCompliance
            }
        }));
        const count = baselines.length;
        return {
            traffic: {
                totalPageViews: sumMetrics.traffic.totalPageViews / count,
                uniqueVisitors: sumMetrics.traffic.uniqueVisitors / count,
                dailyAveragePageViews: sumMetrics.traffic.dailyAveragePageViews / count,
                peakDailyPageViews: sumMetrics.traffic.peakDailyPageViews / count,
                bounceRate: sumMetrics.traffic.bounceRate / count,
                sessionDurationAvg: sumMetrics.traffic.sessionDurationAvg / count
            },
            latency: {
                apiResponseTimeAvg: sumMetrics.latency.apiResponseTimeAvg / count,
                apiResponseTimeP95: sumMetrics.latency.apiResponseTimeP95 / count,
                pageLoadTimeAvg: sumMetrics.latency.pageLoadTimeAvg / count,
                pageLoadTimeP95: sumMetrics.latency.pageLoadTimeP95 / count,
                jobProcessingLatencyAvg: sumMetrics.latency.jobProcessingLatencyAvg / count,
                jobProcessingLatencyP95: sumMetrics.latency.jobProcessingLatencyP95 / count
            },
            errors: {
                apiErrorRate: sumMetrics.errors.apiErrorRate / count,
                jobFailureRate: sumMetrics.errors.jobFailureRate / count,
                totalErrors: sumMetrics.errors.totalErrors / count,
                criticalErrors: sumMetrics.errors.criticalErrors / count,
                errorTrends: {}
            },
            conversions: {
                totalConversions: sumMetrics.conversions.totalConversions / count,
                conversionRate: sumMetrics.conversions.conversionRate / count,
                clickThroughRate: sumMetrics.conversions.clickThroughRate / count,
                openRate: sumMetrics.conversions.openRate / count,
                funnelDropOff: {
                    pageViewToClick: sumMetrics.conversions.funnelDropOff.pageViewToClick / count,
                    clickToConversion: sumMetrics.conversions.funnelDropOff.clickToConversion / count
                }
            },
            kpis: {
                brandVoiceToneConsistency: sumMetrics.kpis.brandVoiceToneConsistency / count,
                contentReadabilityScore: sumMetrics.kpis.contentReadabilityScore / count,
                recentCampaignWins: sumMetrics.kpis.recentCampaignWins / count,
                complianceAlerts: sumMetrics.kpis.complianceAlerts / count,
                seoGrowthRate: sumMetrics.kpis.seoGrowthRate / count,
                contentCadenceTargetMet: sumMetrics.kpis.contentCadenceTargetMet,
                agentJobSuccessRate: sumMetrics.kpis.agentJobSuccessRate / count,
                userSatisfactionScore: sumMetrics.kpis.userSatisfactionScore / count
            },
            infrastructure: {
                uptimePercentage: sumMetrics.infrastructure.uptimePercentage / count,
                cpuUtilizationAvg: sumMetrics.infrastructure.cpuUtilizationAvg / count,
                memoryUtilizationAvg: sumMetrics.infrastructure.memoryUtilizationAvg / count,
                databaseConnectionPoolUtilization: sumMetrics.infrastructure.databaseConnectionPoolUtilization / count,
                cdnHitRate: sumMetrics.infrastructure.cdnHitRate / count
            },
            security: sumMetrics.security
        };
    }
}
BaselineLoader.BASELINE_DIR = path.join(__dirname, '../../../');
//# sourceMappingURL=baselineLoader.js.map