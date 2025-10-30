import { z } from "zod";
import { reply } from "../services/support.service.js";
import { logger } from "../lib/logger.js";
import type { OrchestratorRequest, OrchestratorResponse } from "../services/orchestration/types.js";
import { validateAgentContext } from "./_shared/normalize.js";
import { executeAgentRun, type AgentExecutionContext } from "./utils/agent-run.js";

type Sentiment = "positive" | "neutral" | "negative";
type Priority = "low" | "medium" | "high";

const SupportRequestSchema = z
  .object({
    notes: z.string().optional(),
    subject: z.string().optional(),
    sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
    createdById: z.string().optional(),
  })
  .refine(
    data => Boolean((data.notes && data.notes.trim()) || (data.subject && data.subject.trim())),
    { message: "notes or subject is required" },
  );

const TriageRequestSchema = z.object({
  content: z.string().min(1, "content is required"),
  channel: z.enum(["email", "chat", "phone"]).optional(),
  metadata: z.record(z.unknown()).optional(),
  createdById: z.string().optional(),
});

const MacroSuggestRequestSchema = z.object({
  content: z.string().min(1, "content is required"),
  channel: z.enum(["email", "chat", "phone"]).optional(),
  createdById: z.string().optional(),
});

type SupportRequest = z.infer<typeof SupportRequestSchema>;
type TriageRequest = z.infer<typeof TriageRequestSchema>;
type MacroSuggestRequest = z.infer<typeof MacroSuggestRequestSchema>;

interface SupportReplyOutput {
  reply: string;
  tone: string;
  summary: string;
  suggestedSubject: string;
  sentiment: Sentiment;
}

interface TriageOutput {
  category: string;
  priority: Priority;
  sentiment: Sentiment;
  recommendedActions: string[];
  channel?: string;
}

interface MacroSuggestion {
  title: string;
  body: string;
  tags: string[];
}

interface MacroSuggestionOutput {
  macros: MacroSuggestion[];
  context: {
    category: string;
    priority: Priority;
    sentiment: Sentiment;
  };
}

const NEGATIVE_KEYWORDS = [
  "angry",
  "frustrated",
  "urgent",
  "immediately",
  "not working",
  "broken",
  "error",
  "fail",
  "failure",
  "down",
  "refund",
  "cancel",
  "complaint",
  "escalate",
  "critical",
];
const POSITIVE_KEYWORDS = ["love", "great", "thanks", "appreciate", "awesome", "amazing", "happy", "excellent"];
const BILLING_KEYWORDS = ["invoice", "billing", "charge", "payment", "refund", "price", "pricing", "subscription"];
const ACCOUNT_KEYWORDS = ["password", "login", "account", "access", "credentials", "reset"];
const BUG_KEYWORDS = ["bug", "error", "issue", "broken", "crash", "fail", "failure", "glitch", "not working"];

export class SupportAgent {
  private readonly orchestratorAgentId = "SupportAgent";

  private buildReplySummary(text: string): string {
    const sentences = text.match(/[^.!?]+[.!?]?/g) ?? [text];
    const firstSentence = sentences[0]?.trim() ?? "";
    return firstSentence.length > 0 ? firstSentence : text.slice(0, 120).trim();
  }

  private detectSentiment(content: string): Sentiment {
    const lower = content.toLowerCase();
    const hasNegative = NEGATIVE_KEYWORDS.some(keyword => lower.includes(keyword));
    const hasPositive = POSITIVE_KEYWORDS.some(keyword => lower.includes(keyword));

    if (hasNegative && !hasPositive) {
      return "negative";
    }
    if (hasPositive && !hasNegative) {
      return "positive";
    }
    return "neutral";
  }

  private inferCategory(content: string): string {
    const lower = content.toLowerCase();
    if (BILLING_KEYWORDS.some(keyword => lower.includes(keyword))) {
      return "billing";
    }
    if (ACCOUNT_KEYWORDS.some(keyword => lower.includes(keyword))) {
      return "account_access";
    }
    if (BUG_KEYWORDS.some(keyword => lower.includes(keyword))) {
      return "bug_report";
    }
    return "general_question";
  }

  private inferPriority(content: string): Priority {
    const lower = content.toLowerCase();
    if (lower.includes("outage") || lower.includes("down") || lower.includes("urgent") || lower.includes("immediately")) {
      return "high";
    }
    if (BUG_KEYWORDS.some(keyword => lower.includes(keyword)) || lower.includes("issue") || lower.includes("problem")) {
      return "medium";
    }
    return "low";
  }

  private buildRecommendedActions(category: string, priority: Priority): string[] {
    const actions: string[] = [];

    if (priority === "high") {
      actions.push("Escalate to on-call specialist");
      actions.push("Send acknowledgment within 10 minutes");
    } else if (priority === "medium") {
      actions.push("Confirm receipt and share expected response time");
    } else {
      actions.push("Respond with standard SLA");
    }

    switch (category) {
      case "billing":
        actions.push("Review latest invoice and payment history");
        actions.push("Check active promotions or credits");
        break;
      case "account_access":
        actions.push("Verify authentication logs and recent security events");
        actions.push("Prepare password reset or access restoration steps");
        break;
      case "bug_report":
        actions.push("Log incident in bug tracker with reproduction steps");
        actions.push("Collect console logs or screenshots if available");
        break;
      default:
        actions.push("Consult knowledge base for relevant guide");
        break;
    }

    return Array.from(new Set(actions));
  }

  private buildMacros(category: string, priority: Priority): MacroSuggestion[] {
    const macros: MacroSuggestion[] = [];

    if (category === "billing") {
      macros.push({
        title: "Billing clarification",
        body:
          "Hi there! I’m happy to help clarify your recent charges. Could you confirm the invoice number or billing cycle you’re seeing the issue on? I’ll review it right away.",
        tags: ["billing", "clarification"],
      });
      macros.push({
        title: "Refund acknowledgment",
        body:
          "Thanks for flagging this. I’ve logged your refund request and will update you within one business day once finance completes the review.",
        tags: ["billing", "refund"],
      });
    } else if (category === "account_access") {
      macros.push({
        title: "Password reset steps",
        body:
          "Let’s get you back in. You can reset your password here: https://app.neonhub.dev/reset. If that doesn’t work, reply and I’ll generate a temporary passcode.",
        tags: ["access", "password"],
      });
      macros.push({
        title: "2FA recovery",
        body:
          "If you’re locked out due to two-factor authentication, I can help. Please confirm the last four digits of your phone number and I’ll send a verification link.",
        tags: ["access", "2fa"],
      });
    } else if (category === "bug_report") {
      macros.push({
        title: "Bug acknowledgment",
        body:
          "Appreciate the heads up. I’ve recorded this for engineering with your description. If you have steps to reproduce or screenshots, send them over so we can speed up the fix.",
        tags: ["bug", "acknowledge"],
      });
      macros.push({
        title: "Workaround suggestion",
        body:
          "While our team investigates, a quick workaround is to clear cache and refresh the workspace. Let me know if the issue persists afterward.",
        tags: ["bug", "workaround"],
      });
    } else {
      macros.push({
        title: "General greeting",
        body:
          "Thanks for reaching out! I’m reviewing this now and will follow up with the next steps shortly. Let me know if there’s anything else I should know.",
        tags: ["general"],
      });
    }

    if (priority === "high") {
      macros.unshift({
        title: "Urgent escalation acknowledgment",
        body:
          "I’m escalating this to our on-call specialist right now. You’ll hear back from us shortly with a detailed update—thanks for your patience.",
        tags: ["escalation", "urgent"],
      });
    }

    return macros;
  }

  private attachUser<T extends { createdById?: string | undefined }>(
    input: T,
    context: AgentExecutionContext,
  ): T {
    if (input.createdById || !context.userId) {
      return input;
    }

    return {
      ...input,
      createdById: context.userId ?? undefined,
    } as T;
  }

  private resolveExecutionContext(context: unknown): AgentExecutionContext {
    const validated = validateAgentContext(context);
    return {
      organizationId: validated.organizationId,
      prisma: validated.prisma,
      logger: validated.logger,
      userId: validated.userId ?? null,
    };
  }

  private invalidInput(error: unknown): OrchestratorResponse {
    const message = error instanceof Error ? error.message : "Invalid input";
    return { ok: false, error: message, code: "INVALID_INPUT" };
  }

  private executionError(error: unknown): OrchestratorResponse {
    const message = error instanceof Error ? error.message : "Agent execution failed";
    return { ok: false, error: message, code: "AGENT_EXECUTION_FAILED" };
  }

  private async draftSupportReply(input: SupportRequest): Promise<SupportReplyOutput> {
    const message = input.notes ?? input.subject ?? "";
    const sentiment = input.sentiment ?? this.detectSentiment(message);
    const generated = await reply({ notes: message });
    const summary = this.buildReplySummary(generated.reply);
    return {
      reply: generated.reply,
      tone: generated.tone,
      summary,
      suggestedSubject: input.subject ?? summary.slice(0, 72),
      sentiment,
    };
  }

  private triageTicket(input: TriageRequest): TriageOutput {
    const sentiment = this.detectSentiment(input.content);
    const category = this.inferCategory(input.content);
    const priority = this.inferPriority(input.content);

    return {
      category,
      priority,
      sentiment,
      recommendedActions: this.buildRecommendedActions(category, priority),
      channel: input.channel,
    };
  }

  private suggestMacros(input: MacroSuggestRequest): MacroSuggestionOutput {
    const triage = this.triageTicket({
      content: input.content,
      channel: input.channel,
      metadata: undefined,
      createdById: input.createdById,
    });
    return {
      macros: this.buildMacros(triage.category, triage.priority),
      context: {
        category: triage.category,
        priority: triage.priority,
        sentiment: triage.sentiment,
      },
    };
  }

  private async handleSupportIntent(
    payload: unknown,
    context: AgentExecutionContext,
    intent: string,
  ): Promise<OrchestratorResponse> {
    let parsed: SupportRequest;
    try {
      parsed = SupportRequestSchema.parse(payload);
    } catch (error) {
      return this.invalidInput(error);
    }

    const augmented = this.attachUser(parsed, context);

    try {
      const { result } = await executeAgentRun(
        this.orchestratorAgentId,
        context,
        augmented,
        () => this.draftSupportReply(augmented),
        {
          intent,
          buildMetrics: (output) => ({
            tone: output.tone,
            sentiment: output.sentiment,
            replyLength: output.reply.length,
          }),
        },
      );

      return { ok: true, data: result };
    } catch (error) {
      return this.executionError(error);
    }
  }

  private async handleTriageIntent(
    payload: unknown,
    context: AgentExecutionContext,
    intent: string,
  ): Promise<OrchestratorResponse> {
    let parsed: TriageRequest;
    try {
      parsed = TriageRequestSchema.parse(payload);
    } catch (error) {
      return this.invalidInput(error);
    }

    const augmented = this.attachUser(parsed, context);

    try {
      const { result } = await executeAgentRun(
        this.orchestratorAgentId,
        context,
        augmented,
        async () => this.triageTicket(augmented),
        {
          intent,
          buildMetrics: (output) => ({
            category: output.category,
            priority: output.priority,
          }),
        },
      );

      return { ok: true, data: result };
    } catch (error) {
      return this.executionError(error);
    }
  }

  private async handleMacroSuggestIntent(
    payload: unknown,
    context: AgentExecutionContext,
    intent: string,
  ): Promise<OrchestratorResponse> {
    let parsed: MacroSuggestRequest;
    try {
      parsed = MacroSuggestRequestSchema.parse(payload);
    } catch (error) {
      return this.invalidInput(error);
    }

    const augmented = this.attachUser(parsed, context);

    try {
      const { result } = await executeAgentRun(
        this.orchestratorAgentId,
        context,
        augmented,
        () => Promise.resolve(this.suggestMacros(augmented)),
        {
          intent,
          buildMetrics: (output) => ({
            macros: output.macros.length,
            category: output.context.category,
          }),
        },
      );

      return { ok: true, data: result };
    } catch (error) {
      return this.executionError(error);
    }
  }

  async handle(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    let executionContext: AgentExecutionContext;

    try {
      executionContext = this.resolveExecutionContext(request.context);
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid context",
        code: "INVALID_CONTEXT",
      };
    }

    switch (request.intent) {
      case "support":
        logger.info({ intent: request.intent }, "SupportAgent drafting reply");
        return this.handleSupportIntent(request.payload, executionContext, request.intent);
      case "triage":
        logger.info({ intent: request.intent }, "SupportAgent triaging request");
        return this.handleTriageIntent(request.payload, executionContext, request.intent);
      case "macro-suggest":
        logger.info({ intent: request.intent }, "SupportAgent suggesting macros");
        return this.handleMacroSuggestIntent(request.payload, executionContext, request.intent);
      default:
        return {
          ok: false,
          error: `Unsupported intent: ${request.intent}`,
          code: "UNSUPPORTED_INTENT",
        };
    }
  }
}

export const supportAgent = new SupportAgent();

