'use client';

import { useMemo, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface KeywordDiscoveryPanelProps {
  personaId?: number;
}

export function KeywordDiscoveryPanel({ personaId }: KeywordDiscoveryPanelProps) {
  const [seedKeywords, setSeedKeywords] = useState('');
  const seeds = useMemo(
    () =>
      seedKeywords
        .split(',')
        .map((kw) => kw.trim())
        .filter(Boolean),
    [seedKeywords],
  );

  const {
    data,
    isLoading,
    error,
    refetch: discover,
    isRefetching,
  } = trpc.seo.discoverOpportunities.useQuery(
    {
      personaId,
      limit: 20,
      includeSeeds: seeds,
    },
    { enabled: false },
  );

  const opportunities = data?.opportunities ?? [];
  const summary = data?.summary;

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-xl">Keyword Discovery</CardTitle>
        <p className="text-sm text-muted-foreground">
          Explore high-opportunity topics tailored to your personas. Seed with existing ideas to refine the graph.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <Input
            value={seedKeywords}
            onChange={(event) => setSeedKeywords(event.target.value)}
            placeholder="Seed keywords (comma-separated, e.g. ai marketing, workflow automation)"
            className="flex-1"
          />
          <Button
            onClick={() => discover()}
            disabled={seeds.length === 0 || isLoading || isRefetching}
            className="md:w-auto"
          >
            {(isLoading || isRefetching) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Discover
          </Button>
        </div>

        {error && (
          <Alert className="border-destructive/60 bg-destructive/10 text-destructive-foreground">
            <p className="font-semibold">Unable to analyse keywords</p>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Analysing keyword graph…
            </div>
          )}

          {summary && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-4">
              <Badge variant="outline">Keywords analysed: {opportunities.length}</Badge>
              <Badge variant="outline">Avg opportunity: {summary.averageOpportunity.toFixed(1)}%</Badge>
              {summary.dominantIntent && (
                <Badge variant="secondary" className="capitalize">
                  Dominant intent: {summary.dominantIntent}
                </Badge>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => discover()}
                disabled={isLoading || isRefetching}
                className="ml-auto"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            {opportunities.map((kw) => (
              <div key={kw.normalizedKeyword} className="rounded-lg border border-border/60 bg-background/60 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{kw.keyword}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{kw.intent} intent • source {kw.source}</p>
                  </div>
                  <Badge variant="outline">{kw.opportunityScore}%</Badge>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Difficulty: {kw.difficulty}/100</span>
                  <span>Persona fit: {(kw.personaRelevance * 100).toFixed(0)}%</span>
                  <span>Search volume: {kw.searchVolume.toLocaleString()}</span>
                  <span>Competition: {kw.competitionScore}/100</span>
                </div>
                {kw.insights?.length ? (
                  <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-muted-foreground">
                    {kw.insights.slice(0, 2).map((insight, index) => (
                      <li key={index}>{insight}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>

          {!isLoading && opportunities.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Add a few seed keywords above to receive personalised opportunity suggestions.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
