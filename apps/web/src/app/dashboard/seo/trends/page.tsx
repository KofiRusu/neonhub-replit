import { TrendingTopics } from '@/components/seo/TrendingTopics';
import { TrendSubscriptionsCard } from '@/components/seo/TrendSubscriptionsCard';

export default function TrendsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Trend Intelligence</h1>
        <p className="text-sm text-gray-400">
          Surface rising search demand, trigger alerts, and feed the content team before competitors react.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <TrendingTopics niche="marketing automation" />
        <TrendSubscriptionsCard />
      </div>
    </div>
  );
}
