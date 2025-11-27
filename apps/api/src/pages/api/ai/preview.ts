import type { NextApiRequest, NextApiResponse } from "next";
import { runPipeline } from "../../../ai/workflows/pipeline";

type PreviewSource = {
  objective?: unknown;
  audience?: unknown;
  channel?: unknown;
  tone?: unknown;
};

function asString(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }
  if (Array.isArray(value) && value.length > 0 && typeof value[0] === "string") {
    return value[0]!;
  }
  return fallback;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const rawSource =
    (req.method === "POST" && typeof req.body === "object" ? req.body : req.query) ?? {};
  const source = rawSource as PreviewSource;

  const task = {
    objective: asString(source.objective, "Generate a short brand-aligned blurb"),
    audience: asString(source.audience, "general"),
    channel: asString(source.channel, "blog"),
    tone: asString(source.tone, "neutral"),
  };
  const result = await runPipeline(task as any);
  return res.status(200).json({ ok: true, task, ...result });
}
