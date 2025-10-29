/**
 * Next.js 15 Server Action Example
 * Use in app/actions/email.ts
 */

'use server';

import { NeonHubClient } from '@neonhub/sdk';

// Initialize client with server-side API key
const nh = new NeonHubClient({
  baseURL: process.env.NH_API_URL || 'http://localhost:4000',
  apiKey: process.env.NH_API_KEY!,
});

/**
 * Compose personalized email for a contact
 */
export async function composeEmailFor(personId: string, objective: string = 'demo_book') {
  try {
    // Get person's memory for context
    const memories = await nh.person.getMemory(personId, {
      limit: 5,
    });

    // Compose with brand voice
    const draft = await nh.voice.compose({
      channel: 'email',
      objective,
      personId,
      brandId: process.env.NH_BRAND_ID || 'brand_default',
      constraints: {
        maxLength: 500,
        tone: 'professional',
      },
    });

    // Run guardrail check
    const check = await nh.voice.guardrail(
      draft.body,
      'email',
      process.env.NH_BRAND_ID || 'brand_default'
    );

    return {
      success: true,
      draft: {
        subject: draft.subject,
        body: check.safe ? draft.body : check.redacted,
        variants: draft.variants,
        cta: draft.cta,
      },
      memories: memories.map((m) => ({
        text: m.text,
        confidence: m.confidence,
      })),
      guardrail: {
        safe: check.safe,
        violations: check.violations,
      },
    };
  } catch (error: any) {
    console.error('Failed to compose email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send email and track in timeline
 */
export async function sendPersonalizedEmail(
  personId: string,
  objective: string,
  utmCampaign?: string
) {
  try {
    const result = await nh.send.email({
      personId,
      brandId: process.env.NH_BRAND_ID || 'brand_default',
      objective,
      utmParams: {
        source: 'nextjs',
        medium: 'email',
        campaign: utmCampaign || 'default',
      },
    });

    return {
      success: true,
      sendId: result.id,
      status: result.status,
    };
  } catch (error: any) {
    console.error('Failed to send email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

