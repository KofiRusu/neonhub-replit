import { Router } from "express";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { ok, fail } from "../lib/http";
import { ValidationError } from "../lib/errors";
import { sendInviteEmail, isEmailServiceConfigured } from "../services/team/invite.js";
import { logger } from "../lib/logger.js";

export const teamRouter = Router();

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

// Mock team data (until database integration)
const mockMembers = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah@company.com",
    avatar: "/placeholder-user.jpg",
    role: "Owner",
    department: "Leadership",
    status: "online",
    joinedAt: "2023-01-15",
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "michael@company.com",
    avatar: "/placeholder-user.jpg",
    role: "Admin",
    department: "Engineering",
    status: "online",
    joinedAt: "2023-02-20",
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily@company.com",
    avatar: "/placeholder-user.jpg",
    role: "Member",
    department: "Marketing",
    status: "away",
    joinedAt: "2023-03-10",
  },
  {
    id: "4",
    name: "David Kim",
    email: "david@company.com",
    avatar: "/placeholder-user.jpg",
    role: "Member",
    department: "Sales",
    status: "offline",
    joinedAt: "2023-04-05",
  },
];

const mockInvitations = [
  {
    id: "1",
    email: "newuser@company.com",
    role: "Member",
    invitedBy: "Sarah Johnson",
    sentAt: "2024-01-10",
    expiresAt: "2024-01-17",
  },
];

// GET /team/members
teamRouter.get("/team/members", async (req, res) => {
  try {
    // TODO: Replace with actual database query
    // const members = await prisma.user.findMany({ where: { teamId: req.user.teamId } });
    
    return res.json(ok(mockMembers));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
  }
});

// GET /team/invitations
teamRouter.get("/team/invitations", async (req, res) => {
  try {
    // TODO: Replace with actual database query
    // const invitations = await prisma.invitation.findMany({ where: { status: 'pending' } });
    
    return res.json(ok(mockInvitations));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return res.status(500).json(fail(message).body);
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

