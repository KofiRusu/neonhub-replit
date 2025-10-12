export async function brief({ notes }: { notes?: string }) {
  return {
    timeframe: "last 30 days",
    keyTrends: ["Short-form video ads", "UGC-driven campaigns", "AI copy iteration"],
    relevance: ["Content cadence", "SEO pillar pages", "Creator partnerships"],
    notes,
  };
}



