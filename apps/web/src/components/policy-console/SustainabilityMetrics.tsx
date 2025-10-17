/**
 * Sustainability Metrics - Energy and Carbon Footprint Metrics
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { fetchAPI, formatNumber, formatPercent } from './utils';
import type { EnergyMetrics, CarbonFootprint, EfficiencyAnalysis } from './types';

export function SustainabilityMetrics() {
  const [energy, setEnergy] = useState<EnergyMetrics | null>(null);
  const [carbon, setCarbon] = useState<CarbonFootprint | null>(null);
  const [efficiency, setEfficiency] = useState<EfficiencyAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [energyData, efficiencyData] = await Promise.all([
          fetchAPI<EnergyMetrics>('/api/eco-metrics/energy'),
          fetchAPI<EfficiencyAnalysis>('/api/eco-metrics/efficiency?startDate=2024-01-01&endDate=2024-12-31'),
        ]);
        setEnergy(energyData);
        setEfficiency(efficiencyData);
        
        const carbonData = await fetchAPI<CarbonFootprint>('/api/eco-metrics/carbon', {
          method: 'POST',
          body: JSON.stringify({ resources: [] }),
        });
        setCarbon(carbonData);
      } catch (err) {
        console.error('Failed to fetch sustainability metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="animate-pulse h-96 bg-gray-100 rounded-lg" />;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Sustainability Dashboard</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Total Energy</h3>
          <p className="text-3xl font-bold">{formatNumber(energy?.totalEnergy || 0)} kWh</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Carbon Emissions</h3>
          <p className="text-3xl font-bold">{formatNumber(carbon?.totalCarbon || 0)} kg CO₂</p>
        </Card>
        
        <Card className="p-6">
          <h3 className="text-sm font-medium text-gray-600 mb-2">Efficiency Score</h3>
          <p className="text-3xl font-bold">{formatPercent(efficiency?.overallScore || 0)}</p>
        </Card>
      </div>

      {carbon?.recommendations && carbon.recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Optimization Recommendations</h3>
          <ul className="space-y-2">
            {carbon.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}