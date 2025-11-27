import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const mockCharts = [
  {
    title: 'Impressions vs Clicks',
    description: 'Placeholder chart – will connect to seo.getMetrics once available.',
  },
  {
    title: 'Top Queries',
    description: 'List of top performing queries with CTR and position. Populated from analytics loop.',
  },
  {
    title: 'Underperforming Pages',
    description: 'Pages flagged for low CTR despite high impressions. Powered by seo.identifyUnderperformers.',
  },
];

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Performance Analytics</h1>
        <p className="text-sm text-gray-400">
          Monitor impressions, clicks, CTR, and identify optimisation targets. This view will automatically update once analytics endpoints are live.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {mockCharts.map((chart) => (
          <Card key={chart.title} className="border-dashed border-slate-700/60">
            <CardHeader>
              <CardTitle>{chart.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-400">
              {chart.description}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
