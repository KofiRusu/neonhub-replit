import { Resend } from "resend";
import { generateText } from "../ai/openai.js";
import { prisma } from "../db/prisma.js";
import { agentJobManager } from "./base/AgentJobManager.js";
import { logger } from "../lib/logger.js";
import { broadcast } from "../ws/index.js";
import { normalizeSequenceInput } from "./_shared/normalize.js";
import type { GenerateSequenceInput } from "./_shared/normalize.js";
import { env } from "../config/env.js";
import { BrandVoiceService } from "../services/brand-voice.service.js";
import { PersonService } from "../services/person.service.js";
import { EventIntakeService } from "../services/event-intake.service.js";
import { queues } from "../queues/index.js";
import type { ConsentStatus } from "../types/agentic.js";

export type { GenerateSequenceInput } from "./_shared/normalize.js";

export interface OptimizeSubjectLineInput {
  originalSubject: string;
  context?: string;
  createdById?: string;
}

export interface RunABTestInput {
  campaignId: string;
  variants: Array<{
    subject: string;
    body: string;
  }>;
  createdById?: string;
}

export interface GenerateSequenceOutput {
  jobId: string;
  sequence: Array<{
    day: number;
    subject: string;
    body: string;
  }>;
}

export interface OptimizeSubjectLineOutput {
  jobId: string;
  suggestions: string[];
}

export type SendPersonalizedArgs = {
  personId: string;
  objective: "nurture" | "winback" | "demo_book" | "upsell";
  brandId: string;
  operatorId?: string;
};

const BLOCKED_EMAIL_DOMAINS = new Set(["example.com", "test.com", "invalid.test"]);

let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
  if (resendClient) return resendClient;
  try {
    resendClient = new Resend(env.RESEND_API_KEY);
  } catch (error) {
    logger.warn({ error }, "Failed to initialise Resend client");
    resendClient = null;
  }
  return resendClient;
}

function ensureDeliverability(email: string) {
  const atIndex = email.indexOf("@");
  if (atIndex === -1) {
    throw new Error("Invalid email address");
  }
  const domain = email.slice(atIndex + 1).toLowerCase();
  if (BLOCKED_EMAIL_DOMAINS.has(domain)) {
    throw new Error(`Email domain ${domain} is not allowed for delivery`);
  }
}

function renderEmailHtml(body: string, cta?: string): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br/>")}</p>`)
    .join("\n");

  const action = cta ? `<p><strong>${cta}</strong></p>` : "";
  return `<div>${paragraphs}${action}</div>`;
}

async function enqueueEmailJob(queueName: "email.compose" | "email.send", payload: Record<string, unknown>) {
  try {
    await queues[queueName].add(queueName, payload, { removeOnComplete: 200, removeOnFail: 500 });
  } catch (error) {
    logger.warn({ error, queueName }, "Failed to enqueue email job");
  }
}

/**
 * EmailAgent - Generates email sequences and optimizes email content
 */
export class EmailAgent {
  private readonly agentName = "email";

  /**
   * Generate an email sequence for a campaign
   */
  async generateSequence(input: GenerateSequenceInput): Promise<GenerateSequenceOutput> {
    const startTime = Date.now();

    const normalized = normalizeSequenceInput(input);
    
    const jobId = await agentJobManager.createJob({
      agent: this.agentName,
      input: normalized,
      createdById: normalized.createdById,
    });

    try {
      await agentJobManager.startJob(jobId);

      const numEmails = normalized.numEmails;
      const tone = normalized.tone === "authoritative" ? "professional" : normalized.tone;
      
      const prompt = `Create an email sequence for a marketing campaign about: ${normalized.topic}
${normalized.audience ? `Target Audience: ${normalized.audience}\n` : ""}
Objective: ${normalized.objective}
Tone: ${tone}

Generate ${numEmails} emails for an automated sequence. Each email should:
- Have a compelling subject line
- Build on the previous email
- Include a clear call-to-action
- Be progressively more persuasive

Return the sequence as a JSON array with format:
[
  {
    "day": 0,
    "subject": "Subject line",
    "body": "Email body with proper formatting"
  }
]`;

      logger.info({ jobId, topic: normalized.topic }, "Generating email sequence with AI");

      const result = await generateText({
        prompt,
        temperature: 0.7,
        maxTokens: 2000,
        systemPrompt: `You are an expert email marketing specialist. Create engaging, conversion-focused email sequences that feel personal and valuable to recipients.`,
      });

      // Parse the sequence from AI response
      const sequence = this.parseSequence(result.text, numEmails);

      const duration = Date.now() - startTime;

      await agentJobManager.completeJob(
        jobId,
        {
          sequence,
          emailCount: sequence.length,
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
        emailCount: sequence.length,
        duration,
        mock: result.mock,
      }, "Email sequence generation complete");

      broadcast("metrics:delta", {
        type: "email_sequence_created",
        increment: 1,
        timestamp: new Date(),
      });

      return {
        jobId,
        sequence,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error({ jobId, error: errorMessage }, "Email sequence generation failed");
      
      await agentJobManager.failJob(jobId, errorMessage);
      
      throw error;
    }
  }

  /**
   * Optimize a subject line with AI suggestions
   */
  async optimizeSubjectLine(input: OptimizeSubjectLineInput): Promise<OptimizeSubjectLineOutput> {
    const startTime = Date.now();
    
    const jobId = await agentJobManager.createJob({
      agent: this.agentName,
      input,
      createdById: input.createdById,
    });

    try {
      await agentJobManager.startJob(jobId);

      const prompt = `Optimize this email subject line for better open rates:

Original: "${input.originalSubject}"
${input.context ? `Context: ${input.context}\n` : ""}

Provide 5 alternative subject lines that:
- Are more compelling and curiosity-driving
- Keep the core message
- Are between 30-60 characters
- Use proven email marketing techniques

Return as a JSON array of strings.`;

      logger.info({ jobId, originalSubject: input.originalSubject }, "Optimizing subject line");

      const result = await generateText({
        prompt,
        temperature: 0.8,
        maxTokens: 500,
        systemPrompt: "You are an expert email marketing copywriter specializing in subject line optimization.",
      });

      const suggestions = this.parseSuggestions(result.text);

      const duration = Date.now() - startTime;

      await agentJobManager.completeJob(
        jobId,
        {
          originalSubject: input.originalSubject,
          suggestions,
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
        suggestionCount: suggestions.length,
        duration,
        mock: result.mock,
      }, "Subject line optimization complete");

      return {
        jobId,
        suggestions,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error({ jobId, error: errorMessage }, "Subject line optimization failed");
      
      await agentJobManager.failJob(jobId, errorMessage);
      
      throw error;
    }
  }

  /**
   * Run A/B test on email variants
   */
  async runABTest(input: RunABTestInput): Promise<{ jobId: string; testId: string }> {
    const startTime = Date.now();
    
    const jobId = await agentJobManager.createJob({
      agent: this.agentName,
      input,
      createdById: input.createdById,
    });

    try {
      await agentJobManager.startJob(jobId);

      // Create A/B test record
      const abTest = await prisma.aBTest.create({
        data: {
          campaignId: input.campaignId,
          name: `Email A/B Test - ${new Date().toISOString()}`,
          variants: input.variants,
          metrics: {
            variants: input.variants.map((_, i) => ({
              variantId: `variant_${i}`,
              opens: 0,
              clicks: 0,
              conversions: 0,
            })),
          },
        },
      });

      const duration = Date.now() - startTime;

      await agentJobManager.completeJob(
        jobId,
        {
          testId: abTest.id,
          variantCount: input.variants.length,
        },
        {
          duration,
        }
      );

      logger.info({
        jobId,
        testId: abTest.id,
        duration,
      }, "A/B test created");

      broadcast("campaign:ab-test:created", {
        testId: abTest.id,
        campaignId: input.campaignId,
        variantCount: input.variants.length,
      });

      return {
        jobId,
        testId: abTest.id,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error({ jobId, error: errorMessage }, "A/B test creation failed");
      
      await agentJobManager.failJob(jobId, errorMessage);
      
      throw error;
    }
  }

  /**
   * Analyze email campaign performance
   */
  async analyzePerformance(campaignId: string): Promise<any> {
    const sequences = await prisma.emailSequence.findMany({
      where: { campaignId },
      select: {
        id: true,
        subject: true,
        sentAt: true,
        metrics: true,
      },
    });

    const totalSent = sequences.filter(s => s.sentAt).length;
    const metricsData = sequences
      .filter(s => s.metrics)
      .map(s => s.metrics as any);

    const aggregatedMetrics = {
      sent: totalSent,
      opened: metricsData.reduce((sum, m) => sum + (m.opened || 0), 0),
      clicked: metricsData.reduce((sum, m) => sum + (m.clicked || 0), 0),
      converted: metricsData.reduce((sum, m) => sum + (m.converted || 0), 0),
      openRate: 0,
      clickRate: 0,
      conversionRate: 0,
    };

    if (totalSent > 0) {
      aggregatedMetrics.openRate = (aggregatedMetrics.opened / totalSent) * 100;
      aggregatedMetrics.clickRate = (aggregatedMetrics.clicked / totalSent) * 100;
      aggregatedMetrics.conversionRate = (aggregatedMetrics.converted / totalSent) * 100;
    }

    return aggregatedMetrics;
  }

  /**
   * End-to-end personalized email send with brand voice orchestration
   */
  async sendPersonalized(args: SendPersonalizedArgs): Promise<void> {
    await enqueueEmailJob("email.compose", args);

    const person = await prisma.person.findUnique({
      where: { id: args.personId },
      select: {
        id: true,
        organizationId: true,
        displayName: true,
        primaryEmail: true,
      },
    });

    if (!person) {
      throw new Error(`Person not found for id ${args.personId}`);
    }

    const consent = (await PersonService.getConsent(args.personId, "email")) as ConsentStatus | null;
    if (consent && consent !== "granted") {
      throw new Error(`Person ${args.personId} has not granted email consent`);
    }

    const identity = await prisma.identity.findFirst({
      where: {
        personId: args.personId,
        type: "email",
      },
      orderBy: { verifiedAt: "desc" },
    });

    const emailAddress = identity?.value ?? person.primaryEmail;
    if (!emailAddress) {
      throw new Error(`Email identity not found for person ${args.personId}`);
    }

    ensureDeliverability(emailAddress);

    const composition = await BrandVoiceService.compose({
      channel: "email",
      objective: args.objective,
      personId: args.personId,
      brandId: args.brandId,
    });

    const variant = composition.variants[0] ?? {
      subject: composition.subject,
      body: composition.body,
      cta: composition.cta,
    };

    const subject = variant.subject ?? composition.subject ?? `Quick update on ${args.objective}`;
    const html = renderEmailHtml(variant.body ?? composition.body, variant.cta ?? composition.cta);

    const brand = await prisma.brand.findUnique({
      where: { id: args.brandId },
      select: { slug: true, name: true },
    });

    const fromEmail = `${brand?.slug ?? "neonhub"}@updates.neonhub.dev`;
    const fromName = brand?.name ?? "NeonHub";

    const resend = getResendClient();
    if (resend) {
      try {
        await resend.emails.send({
          from: `${fromName} <${fromEmail}>`,
          to: [emailAddress],
          subject,
          html,
        });
      } catch (error) {
        logger.error({ error, personId: args.personId }, "Failed to send email via Resend");
        throw error instanceof Error ? error : new Error("Email delivery failed");
      }
    } else {
      logger.info({ emailAddress, subject }, "Resend not configured. Email send skipped");
    }

    await enqueueEmailJob("email.send", {
      ...args,
      to: emailAddress,
      subject,
    });

    await EventIntakeService.ingest({
      organizationId: person.organizationId,
      personId: args.personId,
      channel: "email",
      type: "send",
      payload: {
        subject,
        variant,
      },
      metadata: {
        brandId: args.brandId,
        objective: args.objective,
        operatorId: args.operatorId ?? null,
      },
      source: "email-agent",
    });
  }

  /**
   * Parse email sequence from AI response
   */
  private parseSequence(text: string, expectedCount: number): Array<{ day: number; subject: string; body: string }> {
    try {
      // Try to extract JSON from response
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item, index) => ({
            day: item.day ?? index * 3,
            subject: item.subject || `Email ${index + 1}`,
            body: item.body || item.content || "Email content here",
          }));
        }
      }
    } catch (error) {
      logger.warn({ error }, "Failed to parse sequence as JSON, using fallback");
    }

    // Fallback: Create basic sequence from text
    return Array.from({ length: expectedCount }, (_, i) => ({
      day: i * 3,
      subject: `Follow-up ${i + 1}`,
      body: text.substring(0, 500) + "...",
    }));
  }

  /**
   * Parse suggestions from AI response
   */
  private parseSuggestions(text: string): string[] {
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed.filter(s => typeof s === "string");
        }
      }
    } catch (error) {
      logger.warn({ error }, "Failed to parse suggestions as JSON");
    }

    // Fallback: Split by line breaks
    return text
      .split("\n")
      .map(line => line.trim())
      .filter(line => line.length > 10 && line.length < 100)
      .slice(0, 5);
  }
}

export const emailAgent = new EmailAgent();
