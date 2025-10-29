/**
 * Next.js 15 Route Handler Example
 * Use in app/api/sms/send/route.ts
 */

import { NextRequest, NextResponse } from 'next/server';
import { NeonHubClient } from '@neonhub/sdk';
import { z } from 'zod';

const nh = new NeonHubClient({
  baseURL: process.env.NH_API_URL || 'http://localhost:4000',
  apiKey: process.env.NH_API_KEY!,
});

const SendSMSSchema = z.object({
  personId: z.string(),
  objective: z.string().default('nurture'),
});

/**
 * POST /api/sms/send
 * Send personalized SMS to a contact
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { personId, objective } = SendSMSSchema.parse(body);

    // Check consent first
    const consents = await nh.person.getConsent(personId, 'sms');
    const hasConsent = consents.some((c) => c.status === 'granted');

    if (!hasConsent) {
      return NextResponse.json(
        {
          success: false,
          error: 'No SMS consent granted',
        },
        { status: 403 }
      );
    }

    // Compose SMS (max 160 chars)
    const composition = await nh.voice.compose({
      channel: 'sms',
      objective,
      personId,
      brandId: process.env.NH_BRAND_ID || 'brand_default',
      constraints: {
        maxLength: 160,
      },
    });

    // Send SMS
    const result = await nh.send.sms({
      personId,
      brandId: process.env.NH_BRAND_ID || 'brand_default',
      objective,
    });

    return NextResponse.json({
      success: true,
      sendId: result.id,
      preview: composition.body.substring(0, 50) + '...',
      status: result.status,
    });
  } catch (error: any) {
    console.error('SMS send error:', error);

    if (error.name === 'ZodError') {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send SMS',
      },
      { status: 500 }
    );
  }
}

