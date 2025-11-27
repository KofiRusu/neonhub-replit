import { Suspense } from 'react';
import { SEODashboard } from '@/components/seo/SEODashboard';
import { TrendingTopics } from '@/components/seo/TrendingTopics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const organizationId = process.env.NEXT_PUBLIC_ORGANIZATION_ID ?? '';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://neonhubecosystem.com';

export default function SEODashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight">SEO Control Centre</h1>
        <p className="text-sm text-muted-foreground">
          Monitor performance, discover opportunities, and orchestrate optimisations from a single dashboard.
        </p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Loading dashboard…</CardTitle>
            </CardHeader>
            <CardContent>Just a moment while we prepare the latest metrics.</CardContent>
          </Card>
        }
      >
        <SEODashboard organizationId={organizationId} siteUrl={siteUrl} />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendingTopics niche="marketing automation" />
        <Card className="border-border/60 bg-muted/20">
          <CardHeader>
            <CardTitle>Workflow checklist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>• Review new keyword clusters and assign briefs.</p>
            <p>• Generate drafts for high-opportunity keywords and route for approval.</p>
            <p>• Run internal link pass on recently published content.</p>
            <p>• Monitor impressions/clicks and adjust metadata for underperforming content.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
