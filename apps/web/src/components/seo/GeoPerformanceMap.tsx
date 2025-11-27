'use client';

import { trpc } from '@/lib/trpc';

interface GeoPerformanceMapProps {
  organizationId?: string;
}

function isCuid(value?: string): boolean {
  return typeof value === 'string' && /^c[a-z0-9]{24}$/i.test(value);
}

export function GeoPerformanceMap({ organizationId }: GeoPerformanceMapProps) {
  const enabled = isCuid(organizationId);

  const { data, isLoading, error } = trpc.seo.getGeoPerformance.useQuery(
    {
      organizationId: organizationId ?? 'c00000000000000000000000',
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
    },
    {
      enabled,
      retry: 1,
    },
  );

  if (!enabled) {
    return (
      <div className="rounded border border-slate-700/50 bg-slate-900/60 p-4 text-sm text-gray-400">
        Connect an organization to view geographic performance insights.
      </div>
    );
  }

  if (isLoading) {
    return <div className="text-sm text-gray-400">Loading geographic performance…</div>;
  }

  if (error) {
    return (
      <div className="rounded border border-destructive/40 bg-destructive/10 p-4 text-sm text-red-400">
        Unable to load geographic performance: {error.message}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded border border-slate-700/50 bg-slate-900/60 p-4 text-sm text-gray-400">
        No geographic performance data available yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((geo) => (
        <div
          key={geo.countryCode}
          className="flex items-center justify-between rounded border border-slate-700/50 bg-slate-900/60 p-3 text-sm text-gray-400"
        >
          <div>
            <div className="font-medium text-white">{geo.country}</div>
            <div>{geo.countryCode}</div>
          </div>
          <div className="text-right">
            <div>{geo.impressions.toLocaleString()} impressions</div>
            <div>{geo.clicks.toLocaleString()} clicks</div>
            <div>
              CTR: {geo.ctr.toFixed(2)}% • Avg position: {geo.avgPosition.toFixed(1)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
