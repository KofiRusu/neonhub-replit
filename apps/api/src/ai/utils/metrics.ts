import fs from "fs";
import path from "path";

const METRIC_PATH = path.join(process.cwd(), "logs", "ai-metrics.jsonl");

function ensureFile() {
  const dir = path.dirname(METRIC_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export type PipelineMetric = {
  name: "ai_pipeline_invocations_total" | "ai_pipeline_duration_ms" | "ai_pipeline_score_bucket";
  value: number;
  labels?: Record<string, string | number>;
  ts?: number;
};

export function emitMetric(metric: PipelineMetric) {
  ensureFile();
  const record = { ...metric, ts: metric.ts ?? Date.now() };
  fs.appendFileSync(METRIC_PATH, `${JSON.stringify(record)}\n`);
}

export function emitCostUSD(cost: number, meta: Record<string, unknown> = {}) {
  try {
    if (typeof require === "function") {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const prom = require("prom-client");
      const globalKey = "__LLM_COST_GAUGE__";
      if (!(globalThis as any)[globalKey]) {
        (globalThis as any)[globalKey] = new prom.Gauge({
          name: "ai_llm_last_cost_usd",
          help: "Last LLM cost (USD)",
        });
      }
      (globalThis as any)[globalKey].set(cost);
      return;
    }
    throw new Error("require unavailable");
  } catch {
    ensureFile();
    const record = { t: Date.now(), cost, ...meta };
    fs.appendFileSync(METRIC_PATH, `${JSON.stringify(record)}\n`);
  }
}
