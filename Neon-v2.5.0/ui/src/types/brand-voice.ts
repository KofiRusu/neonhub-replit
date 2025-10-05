export type Intent =
  | "generate-post"
  | "seo-audit"
  | "email-seq"
  | "support-reply"
  | "trend-brief"
  | "analytics-summarize";

export type SourceRef = {
  id: string;
  title: string;
  url?: string;
  type?: string;
  updatedAt?: string;
};

export type ActionResult = {
  ok: boolean;
  data?: unknown;
  error?: string;
  sources?: SourceRef[];
};

export type NotImplementedError = {
  kind: "NotImplementedError";
  message: string;
  todo?: string;
};

export type BrandProfile = {
  name: string;
  mission: string;
  tone: string[];
  pillars: string[];
  dos: string[];
  donts: string[];
  examplePhrases: string[];
  personas: { name: string; description: string }[];
  valueProps: string[];
};

export type KnowledgeItem = {
  id: string;
  title: string;
  ref: string;
  type: string;
  agent?: string;
  updatedAt: string;
};


