import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { ok, fail } from "../lib/http";
import { ValidationError } from "../lib/errors";
import { sendInviteEmail, isEmailServiceConfigured } from "../services/team/invite.js";
import { logger } from "../lib/logger.js";
import * as teamService from "../services/team.service.js";

export const teamRouter: Router = Router();

// In-memory token store (TODO: replace with database)
const inviteTokens = new Map<string, {
  email: string;
  role: string;
  createdAt: Date;
  expiresAt: Date;
  used: boolean;
}>();

// Validation schemas
const InviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["Admin", "Member", "Guest"]),
  message: z.string().optional(),
});

// GET /team/members - List all team members
teamRouter.get("/team/members", async (req, res) => {
  try {
    const { role, status } = req.query;
    const filters: any = {};
    
    if (role && typeof role === 'string') {
      filters.role = role;
    }
    
    if (status && typeof status === 'string') {
      filters.status = status;
    }
    
    const members = await teamService.getTeamMembers(filters);
    return res.json(ok(members));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

// GET /team/stats - Get team statistics
teamRouter.get("/team/stats", async (req, res) => {
  try {
    const stats = await teamService.getTeamStats();
    return res.json(ok(stats));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

// GET /team/members/:id - Get specific team member
teamRouter.get("/team/members/:id", async (req, res) => {
  try {
    const member = await teamService.getTeamMemberById(req.params.id);
    return res.json(ok(member));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    const status = message.includes('not found') ? 404 : 500;
    return res.status(status).json(fail(message).body);
  }
});

// PUT /team/members/:id - Update team member
teamRouter.put("/team/members/:id", async (req, res) => {
  try {
    const { role, department, status } = req.body;
    const member = await teamService.updateTeamMember(req.params.id, {
      role,
      department,
      status,
    });
    return res.json(ok(member));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    const status = message.includes('not found') ? 404 : 500;
    return res.status(status).json(fail(message).body);
  }
});

// DELETE /team/members/:id - Remove team member
teamRouter.delete("/team/members/:id", async (req, res) => {
  try {
    const result = await teamService.removeTeamMember(req.params.id);
    return res.json(ok(result));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    const status = message.includes('not found') || message.includes('Cannot remove') ? 404 : 500;
    return res.status(status).json(fail(message).body);
  }
});

// GET /team/invitations - Get pending invitations
teamRouter.get("/team/invitations", async (req, res) => {
  try {
    // Get pending invitations from tokens map
    const invitations = Array.from(inviteTokens.entries())
      .filter(([_, invite]) => !invite.used && invite.expiresAt > new Date())
      .map(([token, invite]) => ({
        id: token,
        email: invite.email,
        role: invite.role,
        invitedBy: "Current User", // TODO: Track who sent invite
        sentAt: invite.createdAt.toISOString().split('T')[0],
        expiresAt: invite.expiresAt.toISOString().split('T')[0],
      }));
    
    return res.json(ok(invitations));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message));
  }
});

// POST /team/invite
teamRouter.post("/team/invite", async (req, res) => {
  try {
    const result = InviteMemberSchema.safeParse(req.body);
    
    if (!result.success) {
      throw new ValidationError(result.error.errors[0].message);
    }

    const { email, role } = result.data;

    // Generate unique token
    const token = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store token (TODO: persist in database)
    inviteTokens.set(token, {
      email,
      role,
      createdAt: now,
      expiresAt,
      used: false,
    });

    // Send invitation email
    const emailResult = await sendInviteEmail({
      to: email,
      token,
      role,
      fromName: "NeonHub Team", // TODO: Get from authenticated user
      redirectUrl: process.env.INVITE_REDIRECT_URL || process.env.APP_BASE_URL,
    });

    logger.info({ email, role, token, emailConfigured: isEmailServiceConfigured() }, "Team invitation created");

    const newInvitation = {
      id: `inv_${Date.now()}`,
      email,
      role,
      invitedBy: "Current User", // TODO: Get from authenticated user
      sentAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      emailSent: emailResult.success,
      previewUrl: emailResult.previewUrl, // Only in mock mode
    };

    return res.json(ok(newInvitation));
  } catch (e: unknown) {
    if (e instanceof ValidationError) {
      return res.status(400).json(fail(e.message).body);
    }
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

// DELETE /team/members/:id
teamRouter.delete("/team/members/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError("Member ID is required");
    }

    // TODO: 
    // 1. Check permissions (only Owner/Admin can remove)
    // 2. Delete member from database
    // 3. Revoke access
    // 4. Send notification

    return res.json(ok({ success: true, memberId: id }));
  } catch (e: unknown) {
    if (e instanceof ValidationError) {
      return res.status(400).json(fail(e.message).body);
    }
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

// DELETE /team/invitations/:id
teamRouter.delete("/team/invitations/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      throw new ValidationError("Invitation ID is required");
    }

    // TODO: Delete invitation from database
    
    return res.json(ok({ success: true, invitationId: id }));
  } catch (e: unknown) {
    if (e instanceof ValidationError) {
      return res.status(400).json(fail(e.message).body);
    }
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

// GET /team/accept?token=xxx
teamRouter.get("/team/accept", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      throw new ValidationError("Invalid or missing token");
    }

    // Verify token exists and is valid
    const invite = inviteTokens.get(token);

    if (!invite) {
      return res.status(404).send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>❌ Invalid Invitation</h1>
            <p>This invitation link is invalid or has expired.</p>
          </body>
        </html>
      `);
    }

    // Check if already used
    if (invite.used) {
      return res.status(400).send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>⚠️ Invitation Already Used</h1>
            <p>This invitation has already been accepted.</p>
          </body>
        </html>
      `);
    }

    // Check if expired
    if (invite.expiresAt < new Date()) {
      return res.status(400).send(`
        <html>
          <body style="font-family: sans-serif; text-align: center; padding: 50px;">
            <h1>⏰ Invitation Expired</h1>
            <p>This invitation has expired. Please request a new one.</p>
          </body>
        </html>
      `);
    }

    // Mark as used
    invite.used = true;
    inviteTokens.set(token, invite);

    logger.info({ email: invite.email, role: invite.role, token }, "Invitation accepted");

    // TODO: 
    // 1. Create user account or link to existing
    // 2. Add to team with specified role
    // 3. Send welcome email

    // Redirect to signin/dashboard
    const redirectUrl = process.env.INVITE_REDIRECT_URL || process.env.APP_BASE_URL || "http://127.0.0.1:3000";
    
    res.send(`
      <html>
        <head>
          <meta http-equiv="refresh" content="2; url=${redirectUrl}">
        </head>
        <body style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h1>✅ Invitation Accepted!</h1>
          <p>Welcome to the team! Redirecting you to sign in...</p>
          <p style="color: #666; font-size: 14px;">If not redirected, <a href="${redirectUrl}">click here</a>.</p>
        </body>
      </html>
    `);
  } catch (e: unknown) {
    if (e instanceof ValidationError) {
      return res.status(400).json(fail(e.message).body);
    }
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

export default teamRouter;
