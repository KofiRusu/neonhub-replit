/**
 * Team Invitation Service
 * Handles email invitations via Resend (or fallback to mock)
 */

import { Resend } from "resend";
import { logger } from "../../lib/logger.js";

// Initialize Resend (only if API key present)
const resendKey = process.env.RESEND_API_KEY;
const isEmailConfigured = !!resendKey;

let resend: Resend | null = null;

if (isEmailConfigured) {
  resend = new Resend(resendKey!);
  logger.info("Resend email service initialized");
} else {
  logger.warn("RESEND_API_KEY not found - email invites will use mock mode");
}

export interface InviteEmailParams {
  to: string;
  token: string;
  role: string;
  fromName?: string;
  redirectUrl?: string;
}

/**
 * Send team invitation email
 */
export async function sendInviteEmail(params: InviteEmailParams): Promise<{
  success: boolean;
  messageId?: string;
  previewUrl?: string;
}> {
  const { to, token, role, fromName = "NeonHub Team", redirectUrl } = params;

  const baseUrl = process.env.APP_BASE_URL || "http://127.0.0.1:3000";
  const acceptUrl = `${baseUrl}/team/accept?token=${token}`;
  const finalRedirect = redirectUrl || `${baseUrl}/auth/signin`;

  // If Resend configured, send real email
  if (resend && isEmailConfigured) {
    try {
      const result = await resend.emails.send({
        from: "NeonHub <invites@neonhub.ai>", // TODO: Configure verified domain
        to,
        subject: `You've been invited to join ${fromName}'s team on NeonHub`,
        html: generateInviteEmail({
          role,
          fromName,
          acceptUrl,
          expiresIn: "7 days",
        }),
      });

      logger.info({ to, messageId: result.data?.id, token }, "Invitation email sent");

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      logger.error({ error, to }, "Failed to send invitation email");
      throw new Error("Failed to send invitation email");
    }
  } else {
    // Mock mode: log and return preview link
    logger.info({ to, token, acceptUrl }, "Mock invitation email (RESEND_API_KEY not configured)");

    return {
      success: true,
      previewUrl: acceptUrl,
    };
  }
}

/**
 * Generate HTML email template
 */
function generateInviteEmail(params: {
  role: string;
  fromName: string;
  acceptUrl: string;
  expiresIn: string;
}): string {
  const { role, fromName, acceptUrl, expiresIn } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Team Invitation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #00D9FF 0%, #B14BFF 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">NeonHub</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">AI-Powered Marketing Platform</p>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 8px 8px;">
    <h2 style="color: #0E0F1A; margin-top: 0;">You've Been Invited! 🎉</h2>
    
    <p>Hi there,</p>
    
    <p><strong>${fromName}</strong> has invited you to join their team on NeonHub as a <strong>${role}</strong>.</p>
    
    <p>NeonHub is an advanced AI-powered marketing automation platform that helps teams create content, analyze trends, and collaborate effectively.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #00D9FF 0%, #B14BFF 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Accept Invitation →</a>
    </div>
    
    <p style="font-size: 14px; color: #666;">
      This invitation expires in <strong>${expiresIn}</strong>. If you didn't expect this invitation, you can safely ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
    
    <p style="font-size: 12px; color: #999; text-align: center;">
      NeonHub - AI Marketing Platform<br>
      <a href="https://neonhubecosystem.com" style="color: #00D9FF;">neonhubecosystem.com</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Check if email service is configured
 */
export function isEmailServiceConfigured(): boolean {
  return isEmailConfigured;
}

