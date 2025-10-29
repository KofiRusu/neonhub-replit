/**
 * SEO Services - Main Export
 * 
 * Centralized export for all SEO services
 * 
 * @module services/seo
 */

export { KeywordResearchService, GoogleKeywordPlannerService } from './keyword-research.service';
export type {
  SearchIntent,
  KeywordMetrics,
  KeywordIntent,
  KeywordSuggestion,
  CompetitorKeyword
} from './keyword-research.service';

export { MetaGenerationService } from './meta-generation.service';
export type {
  MetaTagRequirements,
  GeneratedTitle,
  GeneratedDescription,
  MetaTags,
  MetaValidation
} from './meta-generation.service';

export { ContentOptimizerService } from './content-optimizer.service';
export type {
  ContentAnalysis,
  ReadabilityScore,
  KeywordAnalysis,
  HeadingAnalysis,
  LinkAnalysis,
  ImageAnalysis,
  EEATAnalysis,
  Recommendation
} from './content-optimizer.service';

export { InternalLinkingService, LinkGraphAnalyzer } from './internal-linking.service';
export type {
  LinkSuggestion,
  LinkPosition,
  RelatedPage,
  TopicCluster,
  LinkAnalytics
} from './internal-linking.service';

export { SEORecommendationsService, SEOLearningSystem } from './recommendations.service';
export type {
  SEORecommendation,
  RecommendationType,
  CompetitiveInsight,
  ContentGap,
  TrendingKeyword,
  PerformanceAlert
} from './recommendations.service';

