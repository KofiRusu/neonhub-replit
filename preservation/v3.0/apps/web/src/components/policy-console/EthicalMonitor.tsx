/**
 * Ethical Monitor - Real-time Ethical Compliance Monitoring
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { fetchAPI, formatPercent, getSeverityColor } from './utils';
import type { EthicalAssessment } from './types';

export interface EthicalMonitorProps {
  refreshInterval?: number;
}

export function EthicalMonitor({ refreshInterval = 30000 }: EthicalMonitorProps) {
  const [assessment, setAssessment] = useState<EthicalAssessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchAPI<{ assessment: EthicalAssessment }>('/api/governance/ethics/assess', {
          method: 'POST',
          body: JSON.stringify({
            scenario: 'system-operation',
            stakeholders: ['users', 'operators'],
            potentialImpacts: ['privacy', 'fairness'],
          }),
        });
        setAssessment(result.assessment);
      } catch (err) {
        console.error('Failed to fetch ethical assessment:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded-lg" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Ethical Compliance Monitor</h2>
        <Badge className={assessment && assessment.score >= 80 ? 'bg-green-500' : 'bg-yellow-500'}>
          Score: {assessment?.score || 0}/100
        </Badge>
      </div>

      {assessment?.concerns && assessment.concerns.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Ethical Concerns</h3>
          <div className="space-y-3">
            {assessment.concerns.map((concern, idx) => (
              <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm">{concern}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {assessment?.recommendations && assessment.recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
          <ul className="space-y-2">
            {assessment.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-blue-500 mr-2">→</span>
                <span className="text-sm">{rec}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}