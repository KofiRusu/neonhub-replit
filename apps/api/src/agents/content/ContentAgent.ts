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

  /**
   * Generate a content draft using AI
   * Creates a job, generates content, and stores in database
   */
  async generateDraft(input: GenerateDraftInput): Promise<GenerateDraftOutput> {
    const startTime = Date.now();
    
    // Create job
    const jobId = await agentJobManager.createJob({
      agent: this.agentName,
      input,
      createdById: input.createdById,
    });

    try {
      // Mark job as running
      await agentJobManager.startJob(jobId);

      // Build prompt for AI
      const prompt = this.buildPrompt(input);
      
      logger.info({ jobId, topic: input.topic }, "Generating content with AI");

      // Generate content using OpenAI
      const result = await generateText({
        prompt,
        temperature: input.tone === "casual" ? 0.8 : 0.7,
        maxTokens: 1500,
        systemPrompt: this.getSystemPrompt(input.tone),
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
          createdById: input.createdById || "demo-user-id", // TODO: Get from auth
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
  private buildPrompt(input: GenerateDraftInput): string {
    let prompt = `Create engaging marketing content about: ${input.topic}\n\n`;
    
    if (input.audience) {
      prompt += `Target Audience: ${input.audience}\n`;
    }
    
    prompt += `Tone: ${input.tone}\n`;
    
    if (input.notes) {
      prompt += `Additional Notes: ${input.notes}\n`;
    }

    prompt += `\nPlease create a well-structured piece of content that includes:
1. An engaging title
2. A compelling introduction
3. 3-5 key points or sections
4. A strong call-to-action

Format the content in Markdown. Make it actionable and valuable for the target audience.`;

    return prompt;
  }

  /**
   * Get system prompt based on tone
   */
  private getSystemPrompt(tone: string): string {
    const basePrompt = "You are an expert marketing content writer.";
    
    const tonePrompts = {
      professional: " Write in a professional, authoritative tone suitable for business audiences.",
      casual: " Write in a casual, conversational tone that feels friendly and approachable.",
      friendly: " Write in a warm, friendly tone that builds connection with readers.",
      authoritative: " Write in an authoritative, expert tone that establishes credibility.",
    };

    return basePrompt + (tonePrompts[tone as keyof typeof tonePrompts] || "");
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

    return { title, body };
  }
}

export const contentAgent = new ContentAgent();
