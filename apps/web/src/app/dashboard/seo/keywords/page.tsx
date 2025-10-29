import { KeywordDiscoveryPanel } from '@/components/seo/KeywordDiscoveryPanel';

export default function KeywordResearchPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Keyword Discovery</h1>
        <p className="text-sm text-muted-foreground">
          Seed with existing terms to uncover related opportunities ranked by intent, difficulty, and impact.
        </p>
      </div>
      <KeywordDiscoveryPanel />
    </div>
  );
}
