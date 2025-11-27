import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { EmailAgent } from "../EmailAgent.js";
import { agentJobManager } from "../base/AgentJobManager.js";
import * as ws from "../../ws/index.js";

describe("EmailAgent RAG integration", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    jest.spyOn(agentJobManager, "createJob").mockResolvedValue("job-1");
    jest.spyOn(agentJobManager, "startJob").mockResolvedValue();
    jest.spyOn(agentJobManager, "completeJob").mockResolvedValue();
    jest.spyOn(agentJobManager, "failJob").mockResolvedValue();
    jest.spyOn(ws, "broadcast").mockImplementation(() => {});
  });

  it("injects RAG context into prompt and persists knowledge", async () => {
    const ragContextMock = {
      build: jest.fn(async () => ({
        brandVoice: [],
        knowledge: [{ text: "Use playful tone", title: "Brand playbook", similarity: 0.92 }],
        memories: [],
      })),
      formatForPrompt: jest.fn(() => "Use playful tone"),
    };
    const knowledgeBaseMock = {
      ingestSnippet: jest.fn(async () => {}),
    };
    const generateTextMock = jest.fn(async () => ({
      text: JSON.stringify([{ day: 0, subject: "Hello", body: "Body copy" }]),
      usage: { totalTokens: 50 },
      model: "test-model",
      mock: false,
    }));

    const agent = new EmailAgent({
      ragContext: ragContextMock as any,
      knowledgeBase: knowledgeBaseMock as any,
      generateText: generateTextMock as any,
    });

    const result = await agent.generateSequence(
      {
        brandId: "brand-1",
        topic: "Product launch",
        audience: "marketers",
        tone: "witty",
        objective: "awareness",
        numEmails: 1,
        createdById: "user-123",
      },
      { context: { organizationId: "org-1", userId: "user-123" } as any },
    );

    expect(result.sequence).toHaveLength(1);
    expect(ragContextMock.build).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1" }),
    );
    const prompt = generateTextMock.mock.calls[0][0].prompt as string;
    expect(prompt).toContain("Grounding context");
    expect(prompt).toContain("Use playful tone");
    expect(knowledgeBaseMock.ingestSnippet).toHaveBeenCalledWith(
      expect.objectContaining({
        datasetSlug: "email-org-1",
        ownerId: "user-123",
      }),
    );
  });
});
