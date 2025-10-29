import { ContentGeneratorForm } from '@/components/seo/ContentGeneratorForm';
import { InternalLinkSuggestions } from '@/components/seo/InternalLinkSuggestions';

const placeholderContent = `Artificial intelligence is rapidly transforming the marketing automation landscape.
Teams that connect behavioural signals to automated nurture flows are seeing dramatic improvements in lead velocity.
This draft explores a practical roadmap for instrumenting data, orchestrating omnichannel journeys, and measuring lift.`;

export default function ContentOperationsPage() {
  const contentId = 'content-demo';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Content Operations</h1>
        <p className="text-sm text-muted-foreground">
          Generate, optimise, and enrich content with brand guidelines and internal link coverage.
        </p>
      </div>
      <ContentGeneratorForm brandId="brand-demo" />
      <InternalLinkSuggestions contentId={contentId} initialContent={placeholderContent} />
    </div>
  );
}
