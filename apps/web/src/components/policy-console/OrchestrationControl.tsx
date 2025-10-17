/**
 * Orchestration Control - Global Node Orchestration Management
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { fetchAPI, getStatusColor, formatNumber } from './utils';
import type { SystemHealth, OrchestratorNode } from './types';

export function OrchestrationControl() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [nodes, setNodes] = useState<OrchestratorNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [healthData, nodesData] = await Promise.all([
          fetchAPI<SystemHealth>('/api/orchestration/health'),
          fetchAPI<{ nodes: OrchestratorNode[] }>('/api/orchestration/nodes'),
        ]);
        setHealth(healthData);
        setNodes(nodesData.nodes);
      } catch (err) {
        console.error('Failed to fetch orchestration data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-lg" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Orchestration Control</h2>
        <Badge className={`${getStatusColor(health?.overall || 'unknown')} text-white`}>
          {health?.overall?.toUpperCase()}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Total Nodes</h3>
          <p className="text-2xl font-bold mt-2">{health?.metrics.totalNodes || 0}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Healthy Nodes</h3>
          <p className="text-2xl font-bold mt-2 text-green-600">{health?.metrics.healthyNodes || 0}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Total Requests</h3>
          <p className="text-2xl font-bold mt-2">{formatNumber(health?.metrics.totalRequests || 0)}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Avg Latency</h3>
          <p className="text-2xl font-bold mt-2">{health?.metrics.averageLatency || 0}ms</p>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Active Nodes</h3>
        <div className="space-y-3">
          {nodes.map(node => (
            <div key={node.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">{node.id}</p>
                <p className="text-sm text-gray-600">{node.region} • {node.endpoint}</p>
              </div>
              <Badge className={`${getStatusColor(node.status || 'unknown')} text-white`}>
                {node.status?.toUpperCase()}
              </Badge>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}