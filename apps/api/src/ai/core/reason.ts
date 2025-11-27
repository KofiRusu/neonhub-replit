export type PlanStep = { id: string; title: string; detail: string };
export type TaskSpec = {
  objective: string;
  audience?: string;
  channel?: "blog" | "email" | "social";
  tone?: string;
};

type Signals = Record<string, number>;

export function plan(input: TaskSpec): PlanStep[] {
  const outline = input.channel === "email"
    ? "Hook • Value • CTA"
    : input.channel === "social"
      ? "Hook • Key point • CTA"
      : "Intro • Problem • Solution • CTA";

  return [
    { id: "1", title: "Understand objective", detail: input.objective.trim() },
    { id: "2", title: "Outline", detail: outline },
    { id: "3", title: "Draft", detail: "Compose first draft for the chosen channel" },
    { id: "4", title: "Review", detail: "Check SEO/brand/tone. Improve if needed." }
  ];
}

export function reflect(result: string, signals: Signals) {
  const sorted = Object.entries(signals)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({ change: `Improve ${key}`, impact: Number(value.toFixed(2)) }));

  if (!result.trim()) sorted.unshift({ change: "Draft content is empty", impact: 1 });

  return sorted.slice(0, 3);
}

export function verify<T>(output: T, policy?: { validator?: (item: T) => string[] }) {
  if (policy?.validator) {
    const issues = policy.validator(output);
    return { ok: issues.length === 0, issues };
  }

  return { ok: true, issues: [] as string[] };
}

export function route(task: TaskSpec, registry: Record<string, number>) {
  if (task.channel === "email" && registry.EmailAgent) return "EmailAgent";
  if (task.channel === "social" && registry.SocialAgent) return "SocialAgent";
  if (task.channel === "blog" && registry.SEOAgent) return "SEOAgent";
  return Object.entries(registry).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "ContentAgent";
}
