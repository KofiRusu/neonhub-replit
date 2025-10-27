import type { Prisma } from "@prisma/client";
import { generateText } from "../../ai/openai.js";
import { prisma } from "../../db/prisma.js";
import { agentJobManager } from "../base/AgentJobManager.js";
import { logger } from "../../lib/logger.js";
import { broadcast } from "../../ws/index.js";

export interface GenerateDraftInput {
  topic: string;
  tone: "professional" | "casual" | "friendly" | "authoritative";
  audience?: string;
  notes?: string;
  createdById?: string;
  brandId?: string;
  brandVoiceId?: string;
  campaignGoal?: "awareness" | "engagement" | "conversion" | "retention";
  callToAction?: string;
}

export interface GenerateDraftOutput {
  jobId: string;
  draftId: string;
  title: string;
  preview: string;
}

/**
 * ContentAgent - Generates marketing content using AI
 */
export class ContentAgent {
  private readonly agentName = "content";

  private async resolveOrganizationId(userId?: string | null): Promise<string | undefined> {
    if (!userId) {
      return undefined;
    }

    const membership = await prisma.organizationMembership.findFirst({
      where: { userId },
      select: { organizationId: true },
    });

    return membership?.organizationId ?? undefined;
  }

  private toRecord(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return {};
    }
    return { ...value } as Record<string, unknown>;
  }

  private formatStyleRules(value: Prisma.JsonValue | null | undefined): string {
    if (!value) {
      return "";
    }
    if (Array.isArray(value)) {
      return value.map(rule => `- ${String(rule)}`).join("\n");
    }
    if (typeof value === "object") {
      return Object.entries(value as Record<string, unknown>)
        .map(([key, v]) => {
          if (Array.isArray(v)) {
            return `- ${key}: ${(v as unknown[]).map(item => String(item)).join(", ")}`;
          }
          return `- ${key}: ${String(v)}`;
        })
        .join("\n");
    }
    return `- ${String(value)}`;
  }

  private formatMetadata(value: Prisma.JsonValue | null | undefined): string {
    const record = this.toRecord(value);
    if (Object.keys(record).length === 0) {
      return "";
    }
    return Object.entries(record)
      .map(([key, raw]) => {
        if (Array.isArray(raw)) {
          return `- ${key}: ${(raw as unknown[]).map(item => String(item)).join(", ")}`;
        }
        if (typeof raw === "object" && raw) {
          return `- ${key}: ${JSON.stringify(raw)}`;
        }
        return `- ${key}: ${String(raw)}`;
      })
      .join("\n");
  }

  private async resolveBrandContext(input: GenerateDraftInput) {
    if (!input.brandVoiceId && !input.brandId) {
      return null;
    }

    const brandVoice = input.brandVoiceId
      ? await prisma.brandVoice.findUnique({
          where: { id: input.brandVoiceId },
          select: {
            id: true,
            promptTemplate: true,
            styleRulesJson: true,
            brand: {
              select: {
                id: true,
                name: true,
                slogan: true,
                metadata: true,
              },
            },
          },
        })
      : null;

    const brand = brandVoice?.brand
      ? brandVoice.brand
      : input.brandId
      ? await prisma.brand.findUnique({
          where: { id: input.brandId },
          select: {
            id: true,
            name: true,
            slogan: true,
            metadata: true,
          },
        })
      : null;

    if (!brand) {
      return null;
    }

    return {
      brandId: brand.id,
      brandName: brand.name,
      slogan: brand.slogan ?? undefined,
      promptTemplate: brandVoice?.promptTemplate,
      styleGuide: this.formatStyleRules(brandVoice?.styleRulesJson),
      metadataSummary: this.formatMetadata(brand.metadata),
    } as const;
  }

  /**
   * Generate a content draft using AI
   * Creates a job, generates content, and stores in database
   */
  async generateDraft(input: GenerateDraftInput): Promise<GenerateDraftOutput> {
    const startTime = Date.now();
    
    if (!input.createdById) {
      throw new Error("Missing user context for content generation");
    }
    
    // Create job
    const jobId = await agentJobManager.createJob({
      agent: this.agentName,
      input,
      createdById: input.createdById,
    });

    try {
      // Mark job as running
      await agentJobManager.startJob(jobId);

      const [brandContext, organizationId] = await Promise.all([
        this.resolveBrandContext(input),
        this.resolveOrganizationId(input.createdById),
      ]);

      // Build prompt for AI
      const prompt = this.buildPrompt(input, brandContext);
      
      logger.info({ jobId, topic: input.topic }, "Generating content with AI");

      // Generate content using OpenAI
      const result = await generateText({
        prompt,
        temperature: input.tone === "casual" ? 0.8 : 0.7,
        maxTokens: 1500,
        systemPrompt: this.getSystemPrompt(input.tone, brandContext, input.campaignGoal),
      });

      // Parse and structure the content
      const content = this.parseContent(result.text, input);

      // Save to database
      const draft = await prisma.contentDraft.create({
        data: {
          title: content.title,
          topic: input.topic,
          body: content.body,
          tone: input.tone,
          audience: input.audience,
          status: "generated",
          createdById: input.createdById,
          ...(organizationId ? { organizationId } : {}),
        },
      });

      const duration = Date.now() - startTime;

      // Mark job as complete
      await agentJobManager.completeJob(
        jobId,
        {
          draftId: draft.id,
          title: content.title,
          wordCount: content.body.split(/\s+/).length,
          preview: content.body.substring(0, 200) + "...",
          mock: result.mock,
          brandId: brandContext?.brandId,
          campaignGoal: input.campaignGoal ?? "awareness",
          callToAction: input.callToAction,
        },
        {
          duration,
          tokens: result.usage?.totalTokens || 0,
          model: result.model,
        }
      );

      logger.info({
        jobId,
        draftId: draft.id,
        duration,
        mock: result.mock,
      }, "Content generation complete");

      // Broadcast metrics delta for live updates
      broadcast("metrics:delta", {
        type: "draft_created",
        increment: 1,
        timestamp: new Date(),
      });

      return {
        jobId,
        draftId: draft.id,
        title: content.title,
        preview: content.body.substring(0, 200) + "...",
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error({ jobId, error: errorMessage }, "Content generation failed");
      
      await agentJobManager.failJob(jobId, errorMessage);
      
      throw error;
    }
  }

  /**
   * Build AI prompt from input
   */
  private buildPrompt(input: GenerateDraftInput, brand: Awaited<ReturnType<typeof this.resolveBrandContext>>): string {
    const goal = input.campaignGoal ?? "awareness";
    const headline = brand?.brandName
      ? `Develop ${goal} content for ${brand.brandName}.`
      : `Develop ${goal} marketing content.`;

    const segments: string[] = [headline, `Topic: ${input.topic}`];

    if (brand?.slogan) {
      segments.push(`Brand Promise: ${brand.slogan}`);
    }

    if (input.audience) {
      segments.push(`Target Audience: ${input.audience}`);
    }

    segments.push(`Tone: ${input.tone}`);

    if (input.callToAction) {
      segments.push(`Primary Call To Action: ${input.callToAction}`);
    }

    if (input.notes) {
      segments.push(`Notes from requester: ${input.notes}`);
    }

    if (brand?.styleGuide) {
      segments.push(`Brand Voice Guardrails:\n${brand.styleGuide}`);
    }

    if (brand?.promptTemplate) {
      segments.push(`Messaging Pillars:\n${brand.promptTemplate}`);
    }

    if (brand?.metadataSummary) {
      segments.push(`Additional Brand Context:\n${brand.metadataSummary}`);
    }

    segments.push(`\nCreate a well-structured Markdown draft that includes:
1. An attention-grabbing title
2. A compelling introduction tied to the campaign goal (${goal})
3. 3-5 thematic sections with clear transitions
4. A closing paragraph that reinforces the value proposition
5. A call-to-action matching the provided CTA or recommend one if missing

Each section should include actionable insights, relevant data points when possible, and maintain factual accuracy. Avoid generic fluff.`);

    return segments.join("\n");
  }

  /**
   * Get system prompt based on tone
   */
  private getSystemPrompt(
    tone: string,
    brand: Awaited<ReturnType<typeof this.resolveBrandContext>>,
    goal?: GenerateDraftInput["campaignGoal"],
  ): string {
    const tonePrompts = {
      professional: "Maintain an informed, executive-friendly tone.",
      casual: "Keep the writing approachable with light conversational touches.",
      friendly: "Write warmly and emphasize relationship-building language.",
      authoritative: "Project expertise with confident, data-backed statements.",
    } as const;

    const lines: string[] = [];
    lines.push(
      brand?.brandName
        ? `You are the lead marketing copywriter for ${brand.brandName}, responsible for producing on-brand assets that drive ${goal ?? "awareness"}.`
        : `You are an expert marketing content writer focused on producing ${goal ?? "awareness"} assets.`,
    );

    if (brand?.slogan) {
      lines.push(`Keep messaging consistent with the brand promise: "${brand.slogan}".`);
    }

    if (tone in tonePrompts) {
      lines.push(tonePrompts[tone as keyof typeof tonePrompts]);
    }

    lines.push(
      "Ensure the copy is specific, factually accurate, and avoids hallucinated product claims. Provide helpful subheadings and keyword-rich phrasing without sacrificing readability.",
    );

    return lines.join(" ");
  }

  /**
   * Parse AI-generated content into structured format
   */
  private parseContent(text: string, input: GenerateDraftInput): { title: string; body: string } {
    // Try to extract title from markdown
    const titleMatch = text.match(/^#\s+(.+)$/m);
    let title = titleMatch ? titleMatch[1].trim() : `${input.topic} - Marketing Content`;
    
    // Remove the title from body if it was extracted
    let body = titleMatch ? text.replace(/^#\s+.+$/m, "").trim() : text;
    
    // Ensure body has some structure
    if (!body.includes("#") && !body.includes("\n\n")) {
      // Add some basic structure if AI didn't provide it
      body = `## Overview\n\n${body}`;
    }

    if (input.callToAction) {
      const callToAction = input.callToAction.trim();
      const hasCta = body.toLowerCase().includes(callToAction.toLowerCase());
      if (!hasCta) {
        body = `${body}\n\n**Call to Action:** ${callToAction}`;
      }
    }

    return { title, body };
  }
}

export const contentAgent = new ContentAgent();
