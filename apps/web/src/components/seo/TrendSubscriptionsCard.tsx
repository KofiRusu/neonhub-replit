'use client';

import { Loader2, MailPlus } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface TrendSubscriptionsCardProps {
  className?: string;
}

export function TrendSubscriptionsCard({ className }: TrendSubscriptionsCardProps) {
  const { toast } = useToast();
  const {
    data: subscriptions,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = trpc.trends.listSubscriptions.useQuery(undefined, { retry: 1 });

  const handleRefresh = async () => {
    try {
      await refetch();
    } catch (refreshError) {
      toast({
        title: 'Unable to refresh subscriptions',
        description:
          refreshError instanceof Error ? refreshError.message : 'Please try again shortly.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className={className ?? 'border-slate-700/60 bg-slate-900/60'}>
      <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MailPlus className="h-4 w-4 text-gray-400" />
            Trend subscriptions
          </CardTitle>
          <CardDescription>Active alerts created from the TrendAgent.</CardDescription>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleRefresh}
          disabled={isLoading || isRefetching}
          className="w-full gap-2 sm:w-auto"
        >
          <Loader2
            className={`h-3.5 w-3.5 ${isLoading || isRefetching ? 'animate-spin' : 'hidden'}`}
          />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading && (
          <div className="flex items-center gap-2 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading subscriptions…
          </div>
        )}
        {error && (
          <p className="text-sm text-red-400">
            Unable to load subscriptions: {error.message}
          </p>
        )}
        {!isLoading && !error && (!subscriptions || subscriptions.length === 0) && (
          <p className="text-sm text-gray-400">
            You have not created any trend alerts yet. Subscribe to keywords from the discovery
            panel to receive notifications when growth spikes.
          </p>
        )}
        {subscriptions?.map((subscription) => {
          const rawInput = (subscription.input ?? {}) as Record<string, unknown>;
          const keywords = Array.isArray(rawInput.keywords)
            ? (rawInput.keywords as string[])
            : [];
          const threshold =
            typeof rawInput.threshold === 'number' ? (rawInput.threshold as number) : undefined;

          return (
            <div
              key={subscription.id}
              className="rounded border border-slate-700/50 bg-slate-900/60 p-3 text-sm text-gray-400"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <p className="font-medium text-white">#{subscription.id.slice(0, 8)}</p>
                  <div className="flex flex-wrap gap-2">
                    {keywords.length
                      ? keywords.map((keyword) => (
                          <Badge key={keyword} variant="outline">
                            {keyword}
                          </Badge>
                        ))
                      : (
                        <span>No keywords recorded.</span>
                      )}
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  <p>Created {new Date(subscription.createdAt).toLocaleString()}</p>
                  {threshold ? <p>Threshold: {threshold}% velocity</p> : null}
                  <p>Status: {subscription.status}</p>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
