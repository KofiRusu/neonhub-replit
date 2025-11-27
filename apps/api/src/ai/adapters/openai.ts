// Minimal OpenAI adapter placeholder. Replace with official SDK when available.
type GenerateArgs = {
  prompt: string;
  model: string;
  temperature: number;
  maxTokens?: number;
};

export async function generateText(args: GenerateArgs): Promise<{
  text: string;
  inputTokens: number;
  outputTokens: number;
}> {
  if (!process.env.OPENAI_API_KEY) {
    const text = `[[MOCK:${args.model} T=${args.temperature}]]\n${args.prompt}\n\n— draft —`;
    return {
      text,
      inputTokens: Math.ceil(args.prompt.length / 4),
      outputTokens: Math.ceil(text.length / 4),
    };
  }

  // TODO: replace with official OpenAI SDK call. Deterministic placeholder for now.
  const text = `[[LIVE:${args.model}]]\n${args.prompt}\n\n— draft —`;
  return {
    text,
    inputTokens: Math.ceil(args.prompt.length / 4),
    outputTokens: Math.ceil(text.length / 4),
  };
}
