import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { logger } from '../lib/logger.js';

export interface CreateTeamMemberInput {
  userId: string;
  organizationId?: string;
  role?: string;
  department?: string;
  status?: string;
  invitedBy?: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateTeamMemberInput {
  role?: string;
  department?: string;
  status?: string;
  metadata?: Record<string, unknown> | null;
}

async function resolveOrganizationId(userId: string): Promise<string | null> {
  const membership = await prisma.organizationMembership.findFirst({
    where: { userId },
    select: { organizationId: true },
  });

  return membership?.organizationId ?? null;
}

const toMetadataObject = (value: Prisma.JsonValue | null | undefined): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return { ...(value as Record<string, unknown>) };
};

const stripUndefined = (record: Record<string, unknown>): Record<string, unknown> => {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined));
};

const prepareMetadata = (input?: Record<string, unknown>): Prisma.JsonValue | undefined => {
  if (!input) {
    return undefined;
  }
  const cleaned = stripUndefined(input);
  return Object.keys(cleaned).length ? (cleaned as Prisma.JsonObject) : undefined;
};

const mergeMetadata = (
  current: Prisma.JsonValue | null | undefined,
  updates?: Record<string, unknown>,
): Prisma.JsonValue | undefined => {
  if (!updates || Object.keys(updates).length === 0) {
    return current ?? undefined;
  }
  const base = toMetadataObject(current);
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) {
      delete base[key];
    } else {
      base[key] = value;
    }
  }
  return Object.keys(base).length ? (base as Prisma.JsonObject) : undefined;
};

export async function getTeamMembers(filters?: { role?: string; status?: string }) {
  try {
    const where: Prisma.TeamMemberWhereInput = {};
    
    if (filters?.role) {
      where.role = filters.role;
    }
    
    if (filters?.status) {
      where.status = filters.status;
    }

    const members = await prisma.teamMember.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { joinedAt: 'desc' },
      ],
    });

    // Transform to match expected format
    return members.map(member => ({
      id: member.id,
      userId: member.userId,
      name: member.user.name || 'Unknown',
      email: member.user.email,
      avatar: member.user.image || '/placeholder-user.jpg',
      role: member.role,
      department: member.department || 'General',
      status: member.status,
      joinedAt: member.joinedAt.toISOString().split('T')[0],
      metadata: toMetadataObject(member.metadata ?? null),
    }));
  } catch (error) {
    logger.error({ error }, 'Failed to fetch team members');
    throw error;
  }
}

export async function getTeamMemberById(memberId: string) {
  try {
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            createdAt: true,
          },
        },
      },
    });

    if (!member) {
      throw new Error('Team member not found');
    }

    return {
      id: member.id,
      userId: member.userId,
      name: member.user.name || 'Unknown',
      email: member.user.email,
      avatar: member.user.image || '/placeholder-user.jpg',
      role: member.role,
      department: member.department || 'General',
      status: member.status,
      joinedAt: member.joinedAt,
      invitedAt: member.invitedAt,
      invitedBy: member.invitedBy,
      metadata: toMetadataObject(member.metadata),
    };
  } catch (error) {
    logger.error({ error, memberId }, 'Failed to fetch team member');
    throw error;
  }
}

export async function createTeamMember(input: CreateTeamMemberInput) {
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const organizationId =
      input.organizationId ?? (input.invitedBy ? await resolveOrganizationId(input.invitedBy) : await resolveOrganizationId(input.userId));

    if (!organizationId) {
      throw new Error('Organization context not found');
    }

    // Check if already a team member
    const existing = await prisma.teamMember.findUnique({
      where: {
        userId_organizationId: {
          userId: input.userId,
          organizationId,
        },
      },
    });

    if (existing) {
      throw new Error('User is already a team member');
    }

    const metadata = prepareMetadata(input.metadata);

    const member = await prisma.teamMember.create({
      data: {
        userId: input.userId,
        organizationId,
        role: input.role || 'Member',
        department: input.department,
        status: input.status || 'active',
        invitedBy: input.invitedBy,
        invitedAt: input.invitedBy ? new Date() : undefined,
        ...(metadata ? { metadata } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    logger.info({ memberId: member.id, userId: input.userId, organizationId, role: member.role }, 'Team member created');
    return member;
  } catch (error) {
    logger.error({ error, userId: input.userId }, 'Failed to create team member');
    throw error;
  }
}

export async function updateTeamMember(memberId: string, input: UpdateTeamMemberInput) {
  try {
    const existing = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!existing) {
      throw new Error('Team member not found');
    }

    const data: Prisma.TeamMemberUpdateInput = {
      ...(input.role ? { role: input.role } : {}),
      ...(input.department ? { department: input.department } : {}),
      ...(input.status ? { status: input.status } : {}),
    };

    if (input.metadata !== undefined) {
      if (input.metadata === null) {
        data.metadata = Prisma.JsonNull;
      } else {
        const merged = mergeMetadata(existing.metadata, stripUndefined(input.metadata));
        data.metadata = merged ?? Prisma.JsonNull;
      }
    }

    const member = await prisma.teamMember.update({
      where: { id: memberId },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    logger.info({ memberId, updates: input }, 'Team member updated');
    return member;
  } catch (error) {
    logger.error({ error, memberId }, 'Failed to update team member');
    throw error;
  }
}

export async function removeTeamMember(memberId: string) {
  try {
    const member = await prisma.teamMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new Error('Team member not found');
    }

    // Don't allow removing the owner
    if (member.role === 'Owner') {
      throw new Error('Cannot remove team owner');
    }

    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    logger.info({ memberId }, 'Team member removed');
    return { success: true };
  } catch (error) {
    logger.error({ error, memberId }, 'Failed to remove team member');
    throw error;
  }
}

export async function getTeamStats() {
  try {
    const [total, byRole, byStatus] = await Promise.all([
      prisma.teamMember.count(),
      prisma.teamMember.groupBy({
        by: ['role'],
        _count: true,
      }),
      prisma.teamMember.groupBy({
        by: ['status'],
        _count: true,
      }),
    ]);

    return {
      total,
      byRole: byRole.reduce((acc, item) => ({ ...acc, [item.role]: item._count }), {}),
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
    };
  } catch (error) {
    logger.error({ error }, 'Failed to fetch team stats');
    throw error;
  }
}
