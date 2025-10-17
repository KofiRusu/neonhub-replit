export async function sequence({ topic, audience, notes }: { topic?: string; audience?: string; notes?: string }) {
  const base = topic || "Welcome";
  return {
    steps: [
      { day: 0, subject: `${base} — welcome`, body: `Intro for ${audience || "subscribers"}.` },
      { day: 3, subject: `${base}: value`, body: `Share value props.` },
      { day: 7, subject: `${base}: CTA`, body: `Clear CTA.` },
    ],
    notes,
  };
}



