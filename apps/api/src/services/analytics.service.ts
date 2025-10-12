export function brandVoiceKpis() {
  return { toneConsistency: 92, readability: 72, recentWins: 3, alerts: 0 };
}

export function executiveSummary(notes?: string) {
  return {
    summary: "Executive summary: Brand voice stable, SEO growth steady, campaigns aligned.",
    notes: notes ?? "",
    highlights: ["Tone consistency >90%", "Content cadence on target", "No compliance alerts"],
  };
}



