import { TaskSpecSchema, type TaskSpecInput } from "./schemas";

export type RoutingConstraint = {
  agent: string;
  maxTokens: number;
  allowedMarkets?: string[];
  tone?: string[];
};

export const DEFAULT_CONSTRAINTS: RoutingConstraint[] = [
  { agent: "ContentAgent", maxTokens: 1500, tone: ["informative", "friendly"] },
  { agent: "SEOAgent", maxTokens: 1200 },
  { agent: "EmailAgent", maxTokens: 600 },
  { agent: "SocialAgent", maxTokens: 300 },
];

export function selectConstraint(task: TaskSpecInput) {
  const data = TaskSpecSchema.parse(task);
  const byTone = DEFAULT_CONSTRAINTS.find((constraint) =>
    data.tone && constraint.tone?.includes(data.tone)
  );
  if (byTone) return byTone;

  if (data.channel === "email") return DEFAULT_CONSTRAINTS.find((c) => c.agent === "EmailAgent");
  if (data.channel === "social") return DEFAULT_CONSTRAINTS.find((c) => c.agent === "SocialAgent");
  if (data.channel === "blog") return DEFAULT_CONSTRAINTS.find((c) => c.agent === "SEOAgent");

  return DEFAULT_CONSTRAINTS[0];
}

export function shouldFallback(score: number, constraint: RoutingConstraint) {
  if (score >= 0.65) return false;
  if (constraint.agent === "SocialAgent") return score < 0.55;
  return true;
}
