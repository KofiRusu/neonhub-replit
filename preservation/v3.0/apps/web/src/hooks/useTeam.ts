/**
 * React Query hooks for Team data
 */

import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query"
import {
  listMembers,
  listInvitations,
  inviteMember,
  removeMember,
  cancelInvitation,
  type TeamMember,
  type PendingInvitation,
  type InviteMemberInput,
} from "@/src/lib/adapters/team"

/**
 * Hook to fetch team members
 */
export function useTeamMembers(): UseQueryResult<TeamMember[], Error> {
  return useQuery({
    queryKey: ["team", "members"],
    queryFn: listMembers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/**
 * Hook to fetch pending invitations
 */
export function useInvitations(): UseQueryResult<PendingInvitation[], Error> {
  return useQuery({
    queryKey: ["team", "invitations"],
    queryFn: listInvitations,
    staleTime: 5 * 60 * 1000,
  })
}

/**
 * Hook to invite a new member (with optimistic update)
 */
export function useInviteMember(): UseMutationResult<PendingInvitation, Error, InviteMemberInput> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: inviteMember,
    onMutate: async (newInvite) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["team", "invitations"] })

      // Snapshot previous value
      const previousInvitations = queryClient.getQueryData<PendingInvitation[]>(["team", "invitations"])

      // Optimistically update
      const optimisticInvite: PendingInvitation = {
        id: `temp_${Date.now()}`,
        email: newInvite.email,
        role: newInvite.role,
        invitedBy: "You",
        sentAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }

      queryClient.setQueryData<PendingInvitation[]>(["team", "invitations"], (old = []) => [optimisticInvite, ...old])

      return { previousInvitations }
    },
    onError: (_err, _newInvite, context) => {
      // Rollback on error
      if (context?.previousInvitations) {
        queryClient.setQueryData(["team", "invitations"], context.previousInvitations)
      }
    },
    onSettled: () => {
      // Refetch to get server state
      queryClient.invalidateQueries({ queryKey: ["team", "invitations"] })
    },
  })
}

/**
 * Hook to remove a team member (with optimistic update)
 */
export function useRemoveMember(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: removeMember,
    onMutate: async (memberId) => {
      await queryClient.cancelQueries({ queryKey: ["team", "members"] })

      const previousMembers = queryClient.getQueryData<TeamMember[]>(["team", "members"])

      // Optimistically remove
      queryClient.setQueryData<TeamMember[]>(["team", "members"], (old = []) => old.filter((m) => m.id !== memberId))

      return { previousMembers }
    },
    onError: (_err, _memberId, context) => {
      if (context?.previousMembers) {
        queryClient.setQueryData(["team", "members"], context.previousMembers)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "members"] })
    },
  })
}

/**
 * Hook to cancel an invitation (with optimistic update)
 */
export function useCancelInvitation(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: cancelInvitation,
    onMutate: async (invitationId) => {
      await queryClient.cancelQueries({ queryKey: ["team", "invitations"] })

      const previousInvitations = queryClient.getQueryData<PendingInvitation[]>(["team", "invitations"])

      // Optimistically remove
      queryClient.setQueryData<PendingInvitation[]>(["team", "invitations"], (old = []) =>
        old.filter((inv) => inv.id !== invitationId),
      )

      return { previousInvitations }
    },
    onError: (_err, _invitationId, context) => {
      if (context?.previousInvitations) {
        queryClient.setQueryData(["team", "invitations"], context.previousInvitations)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["team", "invitations"] })
    },
  })
}

