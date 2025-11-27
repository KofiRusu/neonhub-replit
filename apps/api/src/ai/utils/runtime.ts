export function useLiveModel() {
  return process.env.USE_MOCK_ADAPTERS === "false" && Boolean(process.env.OPENAI_API_KEY);
}

export function useLiveLLM() {
  return useLiveModel();
}

export function getModel() {
  return process.env.OPENAI_MODEL || "gpt-4o-mini";
}

export function getTemp() {
  const raw = Number(process.env.OPENAI_TEMPERATURE ?? "0.3");
  if (!Number.isFinite(raw)) return 0.3;
  return Math.min(1, Math.max(0, raw));
}

export function getModelConfig() {
  return {
    model: getModel(),
    temperature: getTemp(),
    maxTokens: Number(process.env.OPENAI_MAX_TOKENS ?? "800"),
  };
}
