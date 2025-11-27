'use client';

import { useMemo, useState } from 'react';
import { Loader2, Link2 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';

interface InternalLinkSuggestionsProps {
  contentId: string;
  initialContent?: string;
}

export function InternalLinkSuggestions({
  contentId,
  initialContent = '',
}: InternalLinkSuggestionsProps) {
  const [content, setContent] = useState(initialContent);
  const [limit, setLimit] = useState(5);

  const {
    data,
    isLoading,
    refetch,
    error,
    isRefetching,
  } = trpc.content.suggestInternalLinks.useQuery(
    { contentId, content, limit },
    { enabled: false },
  );

  const suggestions = useMemo(
    () =>
      (data ?? []).map((suggestion) => {
        const similarity = suggestion.similarity ?? 0;
        const priority = similarity > 0.75 ? 'high' : similarity > 0.55 ? 'medium' : 'low';
        return {
          targetContentId: suggestion.targetContentId,
          title: suggestion.title ?? 'Related article',
          similarity,
          anchorText: suggestion.anchorText,
          reason: suggestion.reason,
          priority,
        };
      }),
    [data],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-neon-blue" />
          Internal Link Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Paste your draft content here…"
            rows={6}
          />
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <label className="flex items-center gap-2">
              Suggestions:
              <select
                value={limit}
                onChange={(event) => setLimit(Number(event.target.value))}
                className="rounded border border-border bg-background px-2 py-1 text-sm"
              >
                {[3, 5, 7, 10].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
            <Button
              size="sm"
              onClick={() => refetch()}
              disabled={content.trim().length < 200 || isLoading || isRefetching}
            >
              {(isLoading || isRefetching) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate suggestions
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive">
            Unable to fetch suggestions: {error.message}
          </p>
        )}

        {suggestions.length > 0 && (
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.targetContentId}-${index}`}
                className="rounded-lg border border-border/60 bg-muted/20 p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-primary">
                    {suggestion.title}
                  </span>
                  <Badge variant={suggestion.priority === 'high' ? 'secondary' : 'outline'}>
                    {suggestion.priority} priority
                  </Badge>
                  <Badge variant="outline">
                    Similarity {(suggestion.similarity * 100).toFixed(0)}%
                  </Badge>
                </div>
                <p className="mt-2 text-sm">
                  Suggested anchor: <span className="font-medium">{suggestion.anchorText}</span>
                </p>
                {suggestion.reason && (
                  <p className="mt-2 text-xs text-muted-foreground">{suggestion.reason}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {!isLoading && suggestions.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No strong internal link opportunities detected yet. Try adding more context to your draft.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
