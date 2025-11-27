type CostRow = {
  model: string;
  inputUsdPer1k?: number;
  outputUsdPer1k?: number;
};

const table: Record<string, CostRow> = {
  "gpt-4o-mini": { model: "gpt-4o-mini", inputUsdPer1k: 0.15, outputUsdPer1k: 0.6 },
  "gpt-4o": { model: "gpt-4o", inputUsdPer1k: 5.0, outputUsdPer1k: 15.0 },
};

export function estimateCostUSD(model: string, inputTokens: number, outputTokens: number) {
  const row = table[model] || table["gpt-4o-mini"];
  const safeInput = Number.isFinite(inputTokens) ? Math.max(0, inputTokens) : 0;
  const safeOutput = Number.isFinite(outputTokens) ? Math.max(0, outputTokens) : 0;
  const input = (safeInput / 1000) * (row.inputUsdPer1k ?? 0);
  const output = (safeOutput / 1000) * (row.outputUsdPer1k ?? 0);
  return Number((input + output).toFixed(6));
}
