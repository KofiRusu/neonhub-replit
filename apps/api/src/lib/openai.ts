import OpenAI from "openai";
import { getEnv } from "../config/env.js";
import { logger } from "./logger.js";

export type { GenerateTextOptions, GenerateTextResult } from "../ai/openai.js";
export { generateText } from "../ai/openai.js";

const env = getEnv();

type ChatMessage = {
  role: string;
  content?: string | null;
};

type ChatCompletionChoice = {
  index: number;
  message: {
    role: string;
    content: string | null;
  };
  finish_reason?: string | null;
};

type ChatCompletionResult = {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: ChatCompletionChoice[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

type EmbeddingEntry = {
  object: string;
  index: number;
  embedding: number[];
};

type EmbeddingResult = {
  object: string;
  data: EmbeddingEntry[];
  model: string;
  usage?: {
    prompt_tokens?: number;
    total_tokens?: number;
  };
};

export interface OpenAIClient {
  chat: {
    completions: {
      create: (params: {
        model?: string;
        messages: ChatMessage[];
        temperature?: number;
        max_tokens?: number;
        response_format?: unknown;
      }) => Promise<ChatCompletionResult>;
    };
  };
  embeddings: {
    create: (params: { model?: string; input: string | string[] }) => Promise<EmbeddingResult>;
  };
}

const summarizeMessages = (messages: ChatMessage[]): string => {
  const joined = messages
    .map((message) => (message.content ?? ""))
    .join("\n")
    .trim();
  return joined.slice(0, 400) || "No content provided.";
};

const createMockOpenAI = (): OpenAIClient => {
  logger.warn("OPENAI_API_KEY missing. Using mock OpenAI client.");

  return {
    chat: {
      completions: {
        async create({ model, messages }) {
          const promptPreview = summarizeMessages(messages);
          const content = `Mock response (${model ?? "mock-gpt-4"}): ${promptPreview}`;
          const promptTokens = promptPreview.length;
          const completionTokens = content.length;
          return {
            id: "mock-chat-completion",
            object: "chat.completion",
            created: Math.floor(Date.now() / 1000),
            model: model ?? "mock-gpt-4",
            choices: [
              {
                index: 0,
                message: {
                  role: "assistant",
                  content,
                },
                finish_reason: "stop",
              },
            ],
            usage: {
              prompt_tokens: promptTokens,
              completion_tokens: completionTokens,
              total_tokens: promptTokens + completionTokens,
            },
          };
        },
      },
    },
    embeddings: {
      async create({ model, input }) {
        const texts = Array.isArray(input) ? input : [input];
        const data: EmbeddingEntry[] = texts.map((text, index) => ({
          object: "embedding",
          index,
          embedding: Array.from({ length: 8 }, (_, i) => {
            const seed = text.length + index + i * 7;
            return Number(((Math.sin(seed) + 1) / 2).toFixed(6));
          }),
        }));
        const tokenSum = texts.reduce((acc, text) => acc + text.length, 0);
        return {
          object: "list",
          data,
          model: model ?? "text-embedding-mock",
          usage: {
            prompt_tokens: tokenSum,
            total_tokens: tokenSum,
          },
        };
      },
    },
  };
};

const client: OpenAIClient = env.OPENAI_API_KEY
  ? (new OpenAI({ apiKey: env.OPENAI_API_KEY }) as unknown as OpenAIClient)
  : createMockOpenAI();

export const openai: OpenAIClient = client;
export const isOpenAIConfigured = Boolean(env.OPENAI_API_KEY);
