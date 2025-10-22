/**
 * Team Data Adapter
 * Connects to backend team API (or fixtures if not available)
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001"
const USE_FIXTURES = process.env.NEXT_PUBLIC_TEAM_FIXTURES === "true"

export interface TeamMember {
  id: string
  name: string
  email: string
  avatar: string
  role: "Owner" | "Admin" | "Member" | "Guest"
  department: string
  status: "online" | "away" | "offline"
  joinedAt: string
}

export interface PendingInvitation {
  id: string
  email: string
  role: string
  invitedBy: string
  sentAt: string
  expiresAt: string
  previewUrl?: string
}

export interface InviteMemberInput {
  email: string
  role: "Admin" | "Member" | "Guest"
  message?: string
}

/**
 * Fetch team members
 */
export async function listMembers(): Promise<TeamMember[]> {
  if (USE_FIXTURES) {
    return mockMembers
  }

  try {
    const response = await fetch(`${API_URL}/team/members`, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.warn("Team API not available, falling back to fixtures")
      return mockMembers
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.warn("Team API error, falling back to fixtures:", error)
    return mockMembers
  }
}

/**
 * Fetch pending invitations
 */
export async function listInvitations(): Promise<PendingInvitation[]> {
  if (USE_FIXTURES) {
    return mockInvitations
  }

  try {
    const response = await fetch(`${API_URL}/team/invitations`, {
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      console.warn("Invitations API not available, falling back to fixtures")
      return mockInvitations
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.warn("Invitations API error, falling back to fixtures:", error)
    return mockInvitations
  }
}

/**
 * Invite a new team member
 */
export async function inviteMember(input: InviteMemberInput): Promise<PendingInvitation> {
  if (USE_FIXTURES) {
    // Simulate successful invitation
    return {
      id: `inv_${Date.now()}`,
      email: input.email,
      role: input.role,
      invitedBy: "Current User",
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }
  }

  try {
    const response = await fetch(`${API_URL}/team/invite`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    })

    if (!response.ok) {
      throw new Error(`Failed to invite member: ${response.statusText}`)
    }

    const result = await response.json()
    return result.data || result
  } catch (error) {
    console.error("Invite API error:", error)
    throw error
  }
}

/**
 * Remove a team member
 */
export async function removeMember(memberId: string): Promise<void> {
  if (USE_FIXTURES) {
    // Simulate successful removal
    return
  }

  try {
    const response = await fetch(`${API_URL}/team/members/${memberId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to remove member: ${response.statusText}`)
    }
  } catch (error) {
    console.error("Remove member API error:", error)
    throw error
  }
}

/**
 * Cancel a pending invitation
 */
export async function cancelInvitation(invitationId: string): Promise<void> {
  if (USE_FIXTURES) {
    return
  }

  try {
    const response = await fetch(`${API_URL}/team/invitations/${invitationId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to cancel invitation: ${response.statusText}`)
    }
  } catch (error) {
    console.error("Cancel invitation API error:", error)
    throw error
  }
}

// Mock data fixtures
const mockMembers: TeamMember[] = [
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
]

const mockInvitations: PendingInvitation[] = [
  {
    id: "1",
    email: "newuser@company.com",
    role: "Member",
    invitedBy: "Sarah Johnson",
    sentAt: "2024-01-10",
    expiresAt: "2024-01-17",
  },
]

