'use client';

import { useMemo, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { GeoPerformanceMap } from './GeoPerformanceMap';

interface SEODashboardProps {
  organizationId: string;
  siteUrl?: string;
}

interface SummaryMetric {
  label: string;
  value: number;
  delta: number;
  positive: boolean;
  format?: 'number' | 'percentage' | 'position';
}

const DEFAULT_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://neonhubecosystem.com';

function isCuid(value?: string): boolean {
  return typeof value === 'string' && /^c[a-z0-9]{24}$/i.test(value);
}

function formatMetricValue(metric: SummaryMetric) {
  switch (metric.format) {
    case 'percentage':
      return `${metric.value.toFixed(1)}%`;
    case 'position':
      return metric.value.toFixed(1);
    default:
      return metric.value.toLocaleString();
  }
}

export function SEODashboard({ organizationId, siteUrl = DEFAULT_SITE_URL }: SEODashboardProps) {
  const today = new Date();
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [refreshing, setRefreshing] = useState(false);
  const organizationReady = isCuid(organizationId);

  const organizationInput = organizationReady ? organizationId : 'c00000000000000000000000';

  const {
    data: metrics,
    isLoading: metricsLoading,
    error: metricsError,
    refetch: refetchMetrics,
    isRefetching,
  } = trpc.seo.getMetrics.useQuery(
    {
      organizationId: organizationInput,
      siteUrl,
      startDate: thirtyDaysAgo.toISOString(),
      endDate: today.toISOString(),
      refresh: false,
    },
    {
      retry: 1,
      enabled: organizationReady,
    },
  );

  const {
    data: trends,
    isLoading: trendsLoading,
    error: trendsError,
  } = trpc.seo.getTrends.useQuery(
    {
      organizationId: organizationInput,
      lookbackDays: 30,
    },
    {
      retry: 1,
      enabled: organizationReady,
    },
  );

  const {
    data: underperformers,
    isLoading: underperformersLoading,
    error: underperformersError,
  } = trpc.seo.identifyUnderperformers.useQuery(
    {
      organizationId: organizationInput,
      lookbackDays: 30,
    },
    {
      retry: 1,
      enabled: organizationReady,
    },
  );

  const {
    data: geoPerformance,
    isLoading: geoLoading,
    error: geoError,
  } = trpc.seo.getGeoPerformance.useQuery(
    {
      organizationId: organizationInput,
      dateRange: {
        start: thirtyDaysAgo.toISOString(),
        end: today.toISOString(),
      },
    },
    {
      enabled: organizationReady,
      retry: 1,
    },
  );

  interface MetricAggregate {
    impressions: number;
    clicks: number;
    weightedCtr: number;
    weightedPosition: number;
    weight: number;
  }

  const summaryMetrics = useMemo<SummaryMetric[]>(() => {
    if (!metrics?.length) {
      return [
        { label: 'Total impressions', value: 0, delta: 0, positive: true },
        { label: 'Total clicks', value: 0, delta: 0, positive: true },
        { label: 'Average CTR', value: 0, delta: 0, positive: true, format: 'percentage' },
        { label: 'Average position', value: 0, delta: 0, positive: false, format: 'position' },
      ];
    }

    const sorted = [...metrics].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
    const midPoint = Math.max(1, Math.floor(sorted.length / 2));
    const firstHalf = sorted.slice(0, midPoint);
    const secondHalf = sorted.slice(midPoint);

    const aggregate = (data: typeof sorted) =>
      data.reduce<MetricAggregate>(
        (acc, item) => {
          const weight = item.impressions ?? 0;
          acc.impressions += item.impressions ?? 0;
          acc.clicks += item.clicks ?? 0;
          acc.weightedCtr += (item.ctr ?? 0) * weight;
          acc.weightedPosition += (item.avgPosition ?? 0) * weight;
          acc.weight += weight || 1;
          return acc;
        },
        {
          impressions: 0,
          clicks: 0,
          weightedCtr: 0,
          weightedPosition: 0,
          weight: 0,
        },
      );

    const totals = aggregate(sorted);
    const prev = aggregate(firstHalf);
    const current = aggregate(secondHalf.length ? secondHalf : sorted);

    const totalImpressions = totals.impressions;
    const totalClicks = totals.clicks;
    const averageCtr = totalImpressions ? (totalClicks / totalImpressions) * 100 : 0;
    const averagePosition = totals.weight
      ? totals.weightedPosition / totals.weight
      : 0;

    const delta = (currentValue: number, prevValue: number) => {
      if (!prevValue) {
        return currentValue === 0 ? 0 : 100;
      }
      return ((currentValue - prevValue) / prevValue) * 100;
    };

    const impressionsDelta = delta(current.impressions, prev.impressions);
    const clicksDelta = delta(current.clicks, prev.clicks);
    const ctrPrev = prev.weight ? (prev.clicks / prev.impressions) * 100 : 0;
    const ctrDelta = delta(averageCtr, ctrPrev);
    const positionPrev = prev.weight
      ? prev.weightedPosition / prev.weight
      : averagePosition;
    const positionDelta = delta(positionPrev, averagePosition);

    return [
      {
        label: 'Total impressions',
        value: totalImpressions,
        delta: impressionsDelta,
        positive: impressionsDelta >= 0,
      },
      {
        label: 'Total clicks',
        value: totalClicks,
        delta: clicksDelta,
        positive: clicksDelta >= 0,
      },
      {
        label: 'Average CTR',
        value: Number.isFinite(averageCtr) ? averageCtr : 0,
        delta: ctrDelta,
        positive: ctrDelta >= 0,
        format: 'percentage',
      },
      {
        label: 'Average position',
        value: Number.isFinite(averagePosition) ? averagePosition : 0,
        delta: positionDelta,
        positive: positionDelta <= 0,
        format: 'position',
      },
    ];
  }, [metrics]);

  const geoSummary = useMemo(() => {
    if (!geoPerformance?.length) return null;
    const impressions = geoPerformance.reduce((acc, geo) => acc + geo.impressions, 0);
    const clicks = geoPerformance.reduce((acc, geo) => acc + geo.clicks, 0);
    return { impressions, clicks };
  }, [geoPerformance]);

  const handleRefresh = async () => {
    if (!organizationReady) return;
    setRefreshing(true);
    try {
      await refetchMetrics({ throwOnError: true, cancelRefetch: false });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Performance overview</h2>
          <p className="text-sm text-gray-400">
            Google Search Console insights for the last 30 days. Metrics refresh from the latest sync.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={!organizationReady || metricsLoading || refreshing || isRefetching}
          className="w-full gap-2 sm:w-auto"
        >
          <RefreshCw
            className={`h-4 w-4 ${
              metricsLoading || refreshing || isRefetching ? 'animate-spin' : ''
            } ${organizationReady ? '' : 'opacity-40'}`}
          />
          Refresh metrics
        </Button>
      </div>

      {!organizationReady && (
        <Card className="border-slate-700/60 bg-slate-900/60">
          <CardHeader>
            <CardTitle>Connect your organization</CardTitle>
            <CardDescription>
              Add <code>NEXT_PUBLIC_ORGANIZATION_ID</code> to your environment or select an active
              workspace to unlock Search Console metrics.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {metricsError && (
        <Card className="border-destructive/40 bg-destructive/10 text-destructive">
          <CardHeader>
            <CardTitle>Unable to load metrics</CardTitle>
            <CardDescription>{metricsError.message}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryMetrics.map((metric) => {
          const formattedValue = formatMetricValue(metric);
          const deltaIcon =
            metric.positive || metric.delta === 0 ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-rose-500" />
            );

          return (
            <Card key={metric.label} className="border-slate-700/60 bg-slate-900/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {metric.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-white">
                  {metricsLoading ? (
                    <span className="text-gray-400">—</span>
                  ) : (
                    formattedValue
                  )}
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  {deltaIcon}
                  <span
                    className={
                      metric.positive || metric.delta === 0 ? 'text-emerald-500' : 'text-rose-500'
                    }
                  >
                    {metric.delta >= 0 ? '+' : ''}
                    {Number.isFinite(metric.delta) ? metric.delta.toFixed(1) : '0'}
                    {metric.label === 'Average position' ? '' : '%'}
                  </span>
                  <span className="text-gray-400">vs previous period</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-slate-700/60 bg-slate-900/60">
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Traffic distribution (30 days)</CardTitle>
              <CardDescription>Geographic breakdown of impressions and clicks.</CardDescription>
            </div>
            {geoSummary && (
              <div className="text-xs text-gray-400">
                {geoSummary.impressions.toLocaleString()} impressions •{' '}
                {geoSummary.clicks.toLocaleString()} clicks
              </div>
            )}
          </CardHeader>
          <CardContent>
            {geoLoading ? (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading geo performance…
              </div>
            ) : geoError ? (
              <p className="text-sm text-destructive">Unable to load geo performance: {geoError.message}</p>
            ) : (
              <GeoPerformanceMap organizationId={organizationReady ? organizationId : undefined} />
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-700/60 bg-slate-900/60">
          <CardHeader>
            <CardTitle>Top search trends</CardTitle>
            <CardDescription>Keywords with the highest visibility over the last 30 days.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {trendsLoading && (
              <div className="flex items-center gap-2 text-gray-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analysing search demand…
              </div>
            )}
            {trendsError && (
              <p className="text-sm text-destructive">Unable to load trends: {trendsError.message}</p>
            )}
            {!trendsLoading && !trendsError && (!trends || trends.length === 0) && (
              <p className="text-sm text-gray-400">
                No trend data available yet. Connect Google Search Console to start tracking.
              </p>
            )}
            {trends?.slice(0, 5).map((trend) => (
              <div
                key={trend.keyword}
                className="flex flex-col gap-1 rounded border border-slate-700/50 bg-slate-900/60 p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{trend.keyword}</span>
                  <span className="text-xs text-gray-400">
                    {trend.impressions.toLocaleString()} impressions
                  </span>
                </div>
                <div className="text-xs text-gray-400">
                  Clicks: {trend.clicks.toLocaleString()} • CTR:{' '}
                  {(trend.ctr * 100).toFixed(1)}% • Avg position: {trend.avgPosition.toFixed(1)}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-700/60 bg-slate-900/60">
        <CardHeader>
          <CardTitle>Underperforming content</CardTitle>
          <CardDescription>
            Pages with high impressions but low click-through rate. Optimise metadata and on-page intent alignment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {underperformersLoading && (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Auditing performance…
            </div>
          )}
          {underperformersError && (
            <p className="text-sm text-destructive">
              Unable to load underperforming content: {underperformersError.message}
            </p>
          )}
          {!underperformersLoading && !underperformersError && (!underperformers || underperformers.length === 0) && (
            <p className="text-sm text-gray-400">
              No underperforming content detected in the last 30 days. Keep monitoring to maintain momentum.
            </p>
          )}
          {underperformers?.map((item) => (
            <div
              key={item.contentId ?? item.url}
              className="rounded border border-slate-700/50 bg-slate-900/60 p-4"
            >
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-white">
                    {item.url ?? item.keyword}
                  </p>
                  <p className="text-xs text-gray-400">
                    {item.keyword}
                  </p>
                </div>
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>Impressions: {item.impressions.toLocaleString()}</span>
                  <span>CTR: {(item.ctr * 100).toFixed(1)}%</span>
                  <span>Avg position: {item.avgPosition.toFixed(1)}</span>
                </div>
              </div>
              {item.recommendation ? (
                <>
                  <div className="my-3 border-t border-border/40" />
                  <p className="text-xs text-gray-400">{item.recommendation}</p>
                </>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
