'use client';

import { useMemo } from 'react';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface TrendingTopicsProps {
  niche: string;
  region?: string;
  limit?: number;
}

export function TrendingTopics({ niche, region = 'US', limit = 10 }: TrendingTopicsProps) {
  const { data, isLoading, error } = trpc.trends.discover.useQuery({ niche, region, limit });
  const utils = trpc.useContext();
  const { toast } = useToast();

  const subscribeMutation = trpc.trends.subscribe.useMutation({
    onSuccess: (_id, variables) => {
      const keywords =
        variables && typeof variables === 'object' && Array.isArray(variables.keywords)
          ? variables.keywords
          : [];
      toast({
        title: 'Subscribed to trend alerts',
        description: keywords.length
          ? `We will monitor ${keywords.join(', ')} for rapid growth.`
          : 'Trend alerts activated for your latest selection.',
      });
      utils.trends.listSubscriptions.invalidate();
    },
    onError: (mutationError) => {
      toast({
        title: 'Unable to subscribe',
        description: mutationError.message,
        variant: 'destructive',
      });
    },
  });

  const topTrend = useMemo(() => data?.[0], [data]);

  const handleSubscribe = (keyword: string) => {
    subscribeMutation.mutate({
      keywords: [keyword],
      threshold: 50,
    });
  };

  return (
    <Card className="border-border/60 bg-muted/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Trending Topics</CardTitle>
          <Badge variant="outline">{region}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Real-time discovery powered by TrendAgent. Subscribe to alerts once you find topics worth tracking.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Discovering trends…</p>}
        {error && (
          <p className="text-sm text-destructive">
            Unable to fetch trends: {error.message}
          </p>
        )}
        {data?.map((trend, index) => (
          <div
            key={`${trend.keyword}-${index}`}
            className="flex flex-col gap-2 rounded-lg border border-border/50 bg-background/60 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">{trend.keyword}</span>
                {index === 0 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3" />
                    Hot
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {trend.searchVolume.toLocaleString()} monthly searches •{' '}
                {(trend.trendVelocity ?? 0).toFixed(1)}% growth
              </div>
              {trend.relatedKeywords?.length ? (
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {trend.relatedKeywords.slice(0, 3).map((kw) => (
                    <Badge key={kw} variant="outline">
                      {kw}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSubscribe(trend.keyword)}
              disabled={subscribeMutation.isPending}
              className="w-full sm:w-auto"
            >
              {subscribeMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  Subscribing…
                </>
              ) : (
                'Alert me'
              )}
            </Button>
          </div>
        ))}
        {!isLoading && data?.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Add TrendAgent subscriptions to stay ahead of emerging topics.
          </p>
        )}
        {topTrend && (
          <p className="text-xs text-muted-foreground">
            Highest velocity topic: <span className="font-medium">{topTrend.keyword}</span> (
            {(topTrend.trendVelocity ?? 0).toFixed(1)}% growth).
          </p>
        )}
      </CardContent>
    </Card>
  );
}
