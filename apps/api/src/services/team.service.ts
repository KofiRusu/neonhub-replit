import { prisma } from '../db/prisma.js';
import { logger } from '../lib/logger.js';

export interface CreateTeamMemberInput {
  userId: string;
  role?: string;
  department?: string;
  status?: string;
  invitedBy?: string;
}

export interface UpdateTeamMemberInput {
  role?: string;
  department?: string;
  status?: string;
}

export async function getTeamMembers(filters?: { role?: string; status?: string }) {
  try {
    const where: any = {};
    
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
      metadata: member.metadata,
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

    // Check if already a team member
    const existing = await prisma.teamMember.findUnique({
      where: { userId: input.userId },
    });

    if (existing) {
      throw new Error('User is already a team member');
    }

    const member = await prisma.teamMember.create({
      data: {
        userId: input.userId,
        role: input.role || 'Member',
        department: input.department,
        status: input.status || 'active',
        invitedBy: input.invitedBy,
        invitedAt: input.invitedBy ? new Date() : undefined,
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

    logger.info({ memberId: member.id, userId: input.userId, role: member.role }, 'Team member created');
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

    const member = await prisma.teamMember.update({
      where: { id: memberId },
      data: {
        ...(input.role && { role: input.role }),
        ...(input.department && { department: input.department }),
        ...(input.status && { status: input.status }),
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
