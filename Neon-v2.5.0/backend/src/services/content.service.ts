export async function generatePost({ topic, audience, notes }: { topic?: string; audience?: string; notes?: string }) {
  const t = topic?.trim() || "Untitled";
  const a = audience?.trim() || "General audience";
  return {
    title: `${t} — for ${a}`,
    outline: ["Hook", "Value", "CTA"],
    draft: `Intro about ${t}. Value points tailored to ${a}. CTA.${notes ? `\n\nConstraints: ${notes}` : ""}`,
    sources: [{ id: "brand-profile", title: "Brand Profile", url: "/brand-voice/profile" }],
  };
}



