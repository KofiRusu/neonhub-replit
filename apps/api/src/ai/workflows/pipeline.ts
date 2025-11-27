import { plan, reflect, verify, type TaskSpec } from "../core/reason";
import { computeScorecard } from "../scoring/scorecard";
import { appendSession, getSession } from "../memory/sessions";
import { recent } from "../memory/docs";
import { emitMetric, emitCostUSD } from "../utils/metrics";
import { useLiveLLM, getModel, getTemp } from "../utils/runtime";
import { generateText } from "../adapters/openai";
import { estimateCostUSD } from "../utils/cost";

export type PipelineResult = {
  steps: ReturnType<typeof plan>;
  draft: string;
  score: ReturnType<typeof computeScorecard>;
  suggestions: ReturnType<typeof reflect>;
  verify: { ok: boolean; issues: string[] };
  context: {
    docs: Array<{ id: string; score: number }>;
    session: string[];
    llm: { used: boolean; model?: string; costUsd?: number; inputTokens?: number; outputTokens?: number };
  };
};

export async function runPipeline(task: TaskSpec): Promise<PipelineResult> {
  const start = Date.now();
  const steps = plan(task);
  const docs = recent(5).map((item, idx) => ({ id: item.id ?? `doc_${idx}`, score: 0.9 - idx * 0.1 }));
  const session = getSession(task.objective).messages;

  const live = useLiveLLM();
  const model = getModel();
  const temperature = getTemp();
  let draft = [
    `# ${task.objective}`,
    "",
    `Audience: ${task.audience ?? "general"}`,
    `Tone: ${task.tone ?? "neutral"}`,
    "",
    "Intro...",
  ].join("\n");

  let inputTokens = Math.ceil(draft.length / 4);
  let outputTokens = Math.ceil(draft.length / 4);
  let costUsd = 0;

  if (live) {
    const prompt = `Write a ${task.channel ?? "blog"} piece for ${task.audience ?? "general"} in a ${task.tone ?? "neutral"} tone about: ${task.objective}. Include an introduction and a clear call to action.`;
    const generation = await generateText({
      prompt,
      model,
      temperature,
      maxTokens: 800,
    });
    draft = generation.text;
    inputTokens = generation.inputTokens;
    outputTokens = generation.outputTokens;
    costUsd = estimateCostUSD(model, inputTokens, outputTokens);
    (globalThis as any).__LLM_COST__ = costUsd;
  }

  const score = computeScorecard(draft);
  const suggestions = reflect(draft, score.breakdown as Record<string, number>);
  const verifyResult = verify(draft, undefined);
  appendSession(task.objective, JSON.stringify({ score: score.total, costUsd }));
  const duration = Date.now() - start;

  emitMetric({ name: "ai_pipeline_invocations_total", value: 1, labels: { agent: task.channel ?? "content" } });
  emitMetric({ name: "ai_pipeline_duration_ms", value: duration, labels: { agent: task.channel ?? "content" } });
  emitMetric({
    name: "ai_pipeline_score_bucket",
    value: score.total,
    labels: { agent: task.channel ?? "content", bucket: score.total >= 0.65 ? "pass" : "improve" },
  });
  if (live && costUsd > 0) {
    emitCostUSD(costUsd, { objective: task.objective, channel: task.channel ?? "content" });
  }

  return {
    steps,
    draft,
    score,
    suggestions,
    verify: verifyResult,
    context: {
      docs,
      session,
      llm: {
        used: live,
        model: live ? model : undefined,
        costUsd: live ? costUsd : undefined,
        inputTokens: live ? inputTokens : undefined,
        outputTokens: live ? outputTokens : undefined,
      },
    },
  };
}
