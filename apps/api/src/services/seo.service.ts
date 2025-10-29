import { prisma } from "../db/prisma.js";

type AuditInput = { url?: string; notes?: string };
type OptimizationInput = { url?: string; personaId?: number };
type KeywordAnalysisInput = { personaId?: number };

const HTTPS_PATTERN = /^https?:\/\//i;

function scoreFromIssues(issueCount: number): number {
  const base = 92 - issueCount * 12;
  return Math.max(35, Math.min(100, base));
}

export async function audit({ url, notes }: AuditInput) {
  if (!url) throw new Error("url required");

  const normalizedUrl = url.trim();
  const issues: string[] = [];

  if (!HTTPS_PATTERN.test(normalizedUrl)) {
    issues.push("Include http:// or https:// in the target URL.");
  }
  if (!normalizedUrl.startsWith("https://")) {
    issues.push("Serve the page over HTTPS to avoid mixed content warnings.");
  }
  if (!/\/$/.test(normalizedUrl)) {
    issues.push("Consider adding a trailing slash for canonical consistency.");
  }

  const [topKeywords, upcomingArticles] = await Promise.all([
    prisma.keyword.findMany({
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 3,
      include: { persona: true },
    }),
    prisma.editorialCalendar.count({
      where: {
        publishAt: {
          gte: new Date(),
        },
      },
    }),
  ]);

  const recommendations = topKeywords.map((keyword) => {
    const persona = keyword.persona?.name ? ` for ${keyword.persona.name}` : "";
    return `Publish a ${keyword.intent} article focused on "${keyword.term}"${persona}.`;
  });

  if (upcomingArticles === 0) {
    recommendations.push("Schedule new articles in the editorial calendar to keep content fresh.");
  }

  return {
    url: normalizedUrl,
    score: scoreFromIssues(issues.length),
    issues,
    recommendations,
    notes,
    context: {
      totalKeywordOpportunities: topKeywords.length,
      upcomingScheduledArticles: upcomingArticles,
    },
  };
}

export async function optimize({ url, personaId }: OptimizationInput) {
  const keywordFilters = personaId ? { personaId } : {};
  const keywords = await prisma.keyword.findMany({
    where: keywordFilters,
    include: { persona: true },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    take: 5,
  });

  const fallbackTitle = "Improve on-page SEO with fresh copy and internal links";
  const primary = keywords.at(0);
  const secondary = keywords.slice(1, 3);

  const title = primary ? `${primary.term} | ${primary.intent} strategy guide` : fallbackTitle;
  const metaDescription = primary
    ? `Learn how to address ${primary.intent} needs with focused content targeting "${primary.term}".`
    : "Optimise this page with unique copy, descriptive meta tags, and internal links that reinforce your top topics.";

  const headings = secondary.map((keyword) => ({
    level: "h2",
    text: `${keyword.term} best practices`,
    persona: keyword.persona?.name ?? null,
  }));

  const internalLinkTargets = await prisma.editorialCalendar.findMany({
    where: personaId ? { personaId } : {},
    orderBy: { publishAt: "asc" },
    take: 3,
  });

  const recommendations = [
    "Add structured data (Article) so search engines understand the page content.",
    "Compress hero and gallery images to keep Largest Contentful Paint under 2.5s.",
    "Ensure the page has exactly one H1 that includes the primary keyword.",
    ...internalLinkTargets.map((entry) => `Link to the scheduled article "${entry.title}" once it goes live.`),
  ];

  return {
    url,
    title,
    metaDescription,
    headings,
    recommendations,
  };
}

export async function keywordAnalysis({ personaId }: KeywordAnalysisInput) {
  const keywords = await prisma.keyword.findMany({
    where: personaId ? { personaId } : {},
    include: { persona: true },
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
  });

  const primaryKeywords = keywords.slice(0, 5).map((keyword) => keyword.term);
  const secondaryKeywords = keywords.slice(5, 10).map((keyword) => keyword.term);

  const searchVolume = Object.fromEntries(
    keywords.map((keyword) => [
      keyword.term,
      400 + (keyword.priority ?? 50) * 18,
    ])
  );

  const competition = Object.fromEntries(
    keywords.map((keyword) => [
      keyword.term,
      (keyword.priority ?? 50) > 70 ? "high" : (keyword.priority ?? 50) > 40 ? "medium" : "low",
    ])
  );

  const suggestions = keywords.slice(0, 3).map((keyword) => {
    const persona = keyword.persona?.name ? ` for ${keyword.persona.name}` : "";
    return `Target "${keyword.term}" with a ${keyword.intent} article${persona}.`;
  });

  return {
    personaId,
    primaryKeywords,
    secondaryKeywords,
    searchVolume,
    competition,
    suggestions,
  };
}

// New endpoints for SEO Agent integration
type AnalyzeKeywordsInput = { terms: string[]; personaId?: string };
type OptimizeContentInput = { 
  html?: string; 
  markdown?: string; 
  personaId?: string; 
  targetKeyword?: string; 
};

export async function analyzeKeywords({ terms, personaId }: AnalyzeKeywordsInput) {
  // Deterministic keyword scoring based on term characteristics
  const analyzed = terms.map((term) => {
    const termLower = term.toLowerCase();
    const wordCount = termLower.split(/\s+/).length;
    
    // Score calculation: longer tail = higher score
    const baseScore = Math.min(100, 50 + wordCount * 15);
    
    // Determine intent based on keyword patterns
    let intent: "info" | "comm" | "nav" | "tran" = "info";
    if (termLower.match(/buy|purchase|price|shop|order/)) intent = "tran";
    else if (termLower.match(/how|what|why|guide|tutorial/)) intent = "info";
    else if (termLower.match(/^[a-z\s]+\.(com|org|io)$/)) intent = "nav";
    else if (termLower.match(/review|best|vs|compare|top/)) intent = "comm";
    
    return {
      term: termLower,
      score: baseScore,
      intent,
    };
  });

  // Sort by score descending
  return {
    terms: analyzed.sort((a, b) => b.score - a.score),
    personaId,
    analyzedAt: new Date().toISOString(),
  };
}

export async function optimizeContent({
  html,
  markdown,
  personaId,
  targetKeyword,
}: OptimizeContentInput) {
  // Fetch relevant keywords for context
  const keywords = await prisma.keyword.findMany({
    where: personaId ? { personaId: Number(personaId) } : {},
    orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
    take: 5,
    include: { persona: true },
  });

  const primary = targetKeyword || keywords[0]?.term || "your topic";
  const content = markdown || html || "";
  
  // Generate optimized metadata
  const title = `${primary.charAt(0).toUpperCase() + primary.slice(1)} | Comprehensive Guide`;
  const metaDescription = `Discover everything about ${primary}. Expert insights, actionable tips, and detailed analysis to help you succeed.`;
  const h1 = `Complete Guide to ${primary.charAt(0).toUpperCase() + primary.slice(1)}`;

  // Content suggestions based on analysis
  const suggestions: string[] = [
    `Ensure canonical URL is set to avoid duplicate content issues.`,
    `Include internal links to related articles for better site architecture.`,
    `Use schema.org Article markup for rich snippets in search results.`,
    `Target keyword "${primary}" should appear in the first 100 words.`,
    `Add alt text to all images with relevant keywords.`,
  ];

  // Check content length
  const wordCount = content.split(/\s+/).length;
  if (wordCount < 300) {
    suggestions.push(`Expand content to at least 800 words for better search visibility.`);
  }

  // Generate JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: metaDescription,
    author: {
      "@type": "Organization",
      name: keywords[0]?.persona?.name || "NeonHub",
    },
    publisher: {
      "@type": "Organization",
      name: "NeonHub",
      logo: {
        "@type": "ImageObject",
        url: "https://neonhub.com/logo.png",
      },
    },
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": "https://neonhub.com/content",
    },
    keywords: keywords.map((k) => k.term).join(", "),
  };

  return {
    title,
    metaDescription,
    h1,
    suggestions,
    jsonLd,
    keywords: keywords.map((k) => k.term),
    optimizedAt: new Date().toISOString(),
  };
}

