import { MemoryRagService } from "./memory.service.js";
import { KnowledgeBaseService } from "./knowledge.service.js";
import { searchSimilarBrandVoice } from "../brand-voice-ingestion.js";

type BuildContextInput = {
  organizationId: string;
  brandId?: string;
  query: string;
  categories?: Array<"content" | "seo" | "support" | "trend" | "email">;
  personId?: string;
  limit?: number;
};

export type RagContext = {
  brandVoice: Array<{ summary: string; similarity?: number }>;
  knowledge: Array<{ text: string; title: string; similarity: number }>;
  memories: Array<{ label: string | null; similarity: number }>;
};

const DATASET_SLUGS: Record<string, (organizationId: string) => { slug: string; name: string }> = {
  content: (organizationId) => ({ slug: `content-${organizationId}`, name: "Content Knowledge" }),
  seo: (organizationId) => ({ slug: `seo-${organizationId}`, name: "SEO Knowledge" }),
  support: (organizationId) => ({ slug: `support-${organizationId}`, name: "Support Knowledge" }),
  trend: (organizationId) => ({ slug: `trend-${organizationId}`, name: "Trend Knowledge" }),
  email: (organizationId) => ({ slug: `email-${organizationId}`, name: "Email Knowledge" }),
};

export class RagContextService {
  constructor(
    private readonly memory = new MemoryRagService(),
    private readonly knowledge = new KnowledgeBaseService(),
  ) {}

  async build(input: BuildContextInput): Promise<RagContext> {
    const categories = input.categories?.length ? input.categories : ["content"];
    const limit = input.limit ?? 3;

    const memoryPromise = this.memory.searchSnippets({
      organizationId: input.organizationId,
      personId: input.personId,
      query: input.query,
      limit,
    });

    const knowledgePromises = categories.map(async (category) => {
      const dataset = DATASET_SLUGS[category]?.(input.organizationId);
      if (!dataset) return [];
      return this.knowledge.retrieveSnippets({
        organizationId: input.organizationId,
        datasetSlug: dataset.slug,
        query: input.query,
        limit,
      });
    });

    const [memories, ...knowledgeResults] = await Promise.all([memoryPromise, ...knowledgePromises]);

    const brandVoiceResults =
      input.brandId
        ? await searchSimilarBrandVoice({
            brandId: input.brandId,
            query: input.query,
            limit,
          })
        : [];

    return {
      brandVoice: brandVoiceResults.map((item) => ({
        summary: item.summary,
        similarity: item.similarity,
      })),
      knowledge: knowledgeResults.flat().map((item) => ({
        text: item.text,
        title: item.title,
        similarity: item.similarity,
      })),
      memories: memories.map((item) => ({
        label: item.label,
        similarity: item.similarity,
      })),
    };
  }

  formatForPrompt(context: RagContext): string {
    const sections: string[] = [];

    if (context.brandVoice.length) {
      sections.push(
        "Brand voice directives:",
        ...context.brandVoice.map(
          (entry, index) => `  (${(entry.similarity ?? 0).toFixed(2)}) BV${index + 1}: ${entry.summary}`,
        ),
      );
    }

    if (context.knowledge.length) {
      sections.push(
        "Knowledge base highlights:",
        ...context.knowledge.map(
          (entry, index) => `  (${entry.similarity.toFixed(2)}) KB${index + 1} [${entry.title}]: ${entry.text}`,
        ),
      );
    }

    if (context.memories.length) {
      sections.push(
        "Recent interactions:",
        ...context.memories.map(
          (entry, index) => `  (${entry.similarity.toFixed(2)}) MEM${index + 1}: ${entry.label ?? "untitled memory"}`,
        ),
      );
    }

    return sections.join("\n");
  }
}
