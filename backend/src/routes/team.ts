import { Router } from "express";
import { z } from "zod";
import { ok, fail } from "../lib/http";
import { ValidationError } from "../lib/errors";

export const teamRouter = Router();

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

    const { email, role, message } = result.data;

    // TODO: 
    // 1. Create invitation in database
    // 2. Send invitation email
    // 3. Return invitation object
    
    const newInvitation = {
      id: `inv_${Date.now()}`,
      email,
      role,
      invitedBy: "Current User", // TODO: Get from authenticated user
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
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

export default teamRouter;

