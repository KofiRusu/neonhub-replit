/**
 * Policy Dashboard - Main Governance Overview
 * Real-time monitoring and control center for v6.0 governance
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { fetchAPI, formatNumber, formatPercent, getStatusColor, getHealthStatus } from './utils';
import type {
  GovernanceHealthStatus,
  DataTrustStatus,
  EcoOptimizerStatus,
  UnifiedGovernanceStatus,
} from './types';

interface DashboardStats {
  governance: {
    policiesActive: number;
    evaluationsToday: number;
    violations: number;
    complianceScore: number;
  };
  dataTrust: {
    provenanceEvents: number;
    integrityChecks: number;
    verificationRate: number;
  };
  sustainability: {
    energyUsageToday: number;
    carbonEmissionsToday: number;
    efficiencyScore: number;
  };
  orchestration: {
    totalNodes: number;
    healthyNodes: number;
    activeRequests: number;
    averageLatency: number;
  };
}

export interface PolicyDashboardProps {
  refreshInterval?: number;
}

export function PolicyDashboard({ refreshInterval = 30000 }: PolicyDashboardProps) {
  const [status, setStatus] = useState<UnifiedGovernanceStatus | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      // Fetch unified status
      const [govHealth, dataTrustStatus, ecoStatus, orchMetrics] = await Promise.all([
        fetchAPI<GovernanceHealthStatus>('/api/governance/health'),
        fetchAPI<DataTrustStatus>('/api/data-trust/status'),
        fetchAPI<EcoOptimizerStatus>('/api/eco-metrics/status'),
        fetchAPI<{ totalNodes: number; healthyNodes: number }>('/api/orchestration/metrics'),
      ]);

      setStatus({
        governance: govHealth,
        dataTrust: dataTrustStatus,
        ecoOptimizer: ecoStatus,
        orchestration: {
          operational: orchMetrics.healthyNodes > 0,
          nodesActive: orchMetrics.healthyNodes,
        },
      });

      // Mock stats - in production, these would come from real API endpoints
      setStats({
        governance: {
          policiesActive: 24,
          evaluationsToday: 1547,
          violations: 3,
          complianceScore: 98.5,
        },
        dataTrust: {
          provenanceEvents: 4231,
          integrityChecks: 892,
          verificationRate: 99.8,
        },
        sustainability: {
          energyUsageToday: 145.2,
          carbonEmissionsToday: 67.3,
          efficiencyScore: 87.4,
        },
        orchestration: {
          totalNodes: orchMetrics.totalNodes,
          healthyNodes: orchMetrics.healthyNodes,
          activeRequests: 234,
          averageLatency: 45,
        },
      });

      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 border-red-200 bg-red-50">
        <p className="text-red-800">Error loading dashboard: {error}</p>
      </Card>
    );
  }

  const overallHealth = status
    ? getHealthStatus(
        Object.values(status.governance).filter(Boolean).length,
        Object.keys(status.governance).length
      )
    : 'unknown';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Policy Console</h1>
          <p className="text-gray-600 mt-1">NeonHub v6.0 Governance Control Center</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${getStatusColor(overallHealth)} text-white px-4 py-2`}>
            System {overallHealth.toUpperCase()}
          </Badge>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusCard
          title="AI Governance"
          healthy={Object.values(status?.governance || {}).filter(Boolean).length}
          total={Object.keys(status?.governance || {}).length}
        />
        <StatusCard
          title="Data Trust"
          healthy={Object.values(status?.dataTrust || {}).filter(Boolean).length}
          total={Object.keys(status?.dataTrust || {}).length}
        />
        <StatusCard
          title="Eco Optimizer"
          healthy={Object.values(status?.ecoOptimizer || {}).filter(Boolean).length}
          total={Object.keys(status?.ecoOptimizer || {}).length}
        />
        <StatusCard
          title="Orchestration"
          healthy={status?.orchestration.nodesActive || 0}
          total={stats?.orchestration.totalNodes || 0}
        />
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Policies"
          value={stats?.governance.policiesActive || 0}
          subtitle={`${stats?.governance.violations || 0} violations`}
          trend="stable"
        />
        <MetricCard
          title="Provenance Events"
          value={stats?.dataTrust.provenanceEvents || 0}
          subtitle={`${formatPercent(stats?.dataTrust.verificationRate || 0)} verified`}
          trend="up"
        />
        <MetricCard
          title="Energy Usage"
          value={`${stats?.sustainability.energyUsageToday || 0} kWh`}
          subtitle={`${stats?.sustainability.carbonEmissionsToday || 0} kg CO₂`}
          trend="down"
        />
        <MetricCard
          title="Active Nodes"
          value={`${stats?.orchestration.healthyNodes || 0}/${stats?.orchestration.totalNodes || 0}`}
          subtitle={`${stats?.orchestration.averageLatency || 0}ms latency`}
          trend="stable"
        />
      </div>

      {/* Detailed Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Governance Overview</h3>
          <div className="space-y-3">
            <StatRow label="Compliance Score" value={formatPercent(stats?.governance.complianceScore || 0)} />
            <StatRow label="Policy Evaluations Today" value={formatNumber(stats?.governance.evaluationsToday || 0)} />
            <StatRow label="Active Policies" value={formatNumber(stats?.governance.policiesActive || 0)} />
            <StatRow
              label="Violations"
              value={formatNumber(stats?.governance.violations || 0)}
              valueClass="text-red-600"
            />
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Sustainability Metrics</h3>
          <div className="space-y-3">
            <StatRow label="Efficiency Score" value={formatPercent(stats?.sustainability.efficiencyScore || 0)} />
            <StatRow label="Energy Usage Today" value={`${stats?.sustainability.energyUsageToday || 0} kWh`} />
            <StatRow label="Carbon Emissions" value={`${stats?.sustainability.carbonEmissionsToday || 0} kg CO₂`} />
            <StatRow label="Optimization Status" value="Active" valueClass="text-green-600" />
          </div>
        </Card>
      </div>
    </div>
  );
}

interface StatusCardProps {
  title: string;
  healthy: number;
  total: number;
}

function StatusCard({ title, healthy, total }: StatusCardProps) {
  const healthStatus = getHealthStatus(healthy, total);
  
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-700">{title}</h3>
        <div className={`w-3 h-3 rounded-full ${getStatusColor(healthStatus)}`} />
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {healthy}/{total}
      </div>
      <p className="text-sm text-gray-500 mt-1">Components Active</p>
    </Card>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend: 'up' | 'down' | 'stable';
}

function MetricCard({ title, value, subtitle, trend }: MetricCardProps) {
  const trendIcon = {
    up: '↗',
    down: '↘',
    stable: '→',
  };

  const trendColor = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-600',
  };

  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <span className={`text-sm ${trendColor[trend]}`}>{trendIcon[trend]}</span>
      </div>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
    </Card>
  );
}

interface StatRowProps {
  label: string;
  value: string | number;
  valueClass?: string;
}

function StatRow({ label, value, valueClass = 'text-gray-900' }: StatRowProps) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}