'use client';

import { useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';

interface ContentGeneratorFormProps {
  brandId?: string;
  brandVoiceId?: string;
  personaId?: number;
}

export function ContentGeneratorForm({
  brandId,
  brandVoiceId,
  personaId,
}: ContentGeneratorFormProps) {
  const [topic, setTopic] = useState('');
  const [keyword, setKeyword] = useState('');
  const [callToAction, setCallToAction] = useState('');
  const [outline, setOutline] = useState('');
  const { toast } = useToast();

  const generateMutation = trpc.content.generateArticle.useMutation({
    onSuccess: (data) => {
      toast({
        title: 'Draft generated',
        description: `New draft created with title “${data.title}”.`,
      });
    },
    onError: (err) => {
      toast({
        title: 'Unable to generate content',
        description: err.message,
        variant: 'destructive',
      });
    },
  });

  const handleGenerate = () => {
    const outlineItems = outline
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean);

    generateMutation.mutate({
      topic,
      primaryKeyword: keyword,
      outline: outlineItems.length ? outlineItems : undefined,
      callToAction: callToAction || undefined,
      brandId,
      brandVoiceId,
      personaId,
    });
  };

  const isGenerating = generateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-neon-blue" />
          AI Content Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="content-topic">Topic</Label>
            <Input
              id="content-topic"
              placeholder="e.g. How AI is transforming marketing automation"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content-keyword">Primary keyword</Label>
            <Input
              id="content-keyword"
              placeholder="e.g. ai marketing automation"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="content-outline">Outline (optional)</Label>
          <Textarea
            id="content-outline"
            placeholder={'Section 1: ...\nSection 2: ...'}
            value={outline}
            onChange={(event) => setOutline(event.target.value)}
            rows={4}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="content-cta">Call to action (optional)</Label>
          <Input
            id="content-cta"
            placeholder="Invite readers to book a demo..."
            value={callToAction}
            onChange={(event) => setCallToAction(event.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            size="lg"
            onClick={handleGenerate}
            disabled={!topic || !keyword || isGenerating}
          >
            {isGenerating && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Generate Draft
          </Button>
        </div>

        {generateMutation.data && (
          <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-4">
            <div>
              <h3 className="text-lg font-semibold">{generateMutation.data.title}</h3>
              <p className="text-sm text-muted-foreground">{generateMutation.data.summary}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline">Draft ID: {generateMutation.data.draftId}</Badge>
              <Badge variant="outline">
                Opportunity Score: {Math.round(generateMutation.data.quality.overall)}
              </Badge>
            </div>
            <div className="rounded-md border border-border/50 bg-background/60 p-3 text-sm text-muted-foreground">
              {generateMutation.data.meta.description}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
