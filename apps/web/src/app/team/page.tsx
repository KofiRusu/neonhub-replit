"use client"

import Image from "next/image"
import { useState } from "react"
import PageLayout from "@/components/page-layout"
// import { Skeleton } from "@/src/components/ui/skeleton" // Unused
import { useTeamMembers, useInvitations, useInviteMember, useRemoveMember, useCancelInvitation } from "@/src/hooks/useTeam"
import type { InviteMemberInput } from "@/src/lib/adapters/team"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus, MoreVertical, Mail, Shield, Clock, Crown, CheckCircle2, XCircle, MessageSquare } from "lucide-react"
import { motion } from "framer-motion"

const rolePermissions = {
  Owner: ["Full access", "Billing", "Delete workspace", "Manage admins"],
  Admin: ["Manage users", "View analytics", "Configure settings", "Manage agents"],
  Member: ["View content", "Create content", "Run agents", "View analytics"],
  Guest: ["View content", "Limited access"],
}

const activityFeed = [
  { user: "Sarah Johnson", action: "upgraded the plan", time: "2 hours ago", type: "upgrade" },
  { user: "Michael Chen", action: "invited newuser@company.com", time: "5 hours ago", type: "invite" },
  { user: "Emily Rodriguez", action: "updated team settings", time: "1 day ago", type: "settings" },
  { user: "David Kim", action: "joined the team", time: "2 days ago", type: "join" },
]

export default function TeamPage() {
  const [isInviteOpen, setIsInviteOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<"Admin" | "Member" | "Guest">("Member")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteMessage, setInviteMessage] = useState("")
  const [lastInvitePreview, setLastInvitePreview] = useState<string | null>(null)

  // Fetch real data
  const { data: teamMembers = [], isLoading: membersLoading } = useTeamMembers()
  const { data: pendingInvitations = [], isLoading: invitationsLoading } = useInvitations()
  
  // Mutations
  const inviteMutation = useInviteMember()
  const removeMutation = useRemoveMember()
  const cancelMutation = useCancelInvitation()

  const handleInvite = async () => {
    if (!inviteEmail) return
    
    const input: InviteMemberInput = {
      email: inviteEmail,
      role: selectedRole,
      message: inviteMessage || undefined,
    }

    try {
      const result = await inviteMutation.mutateAsync(input)
      if (result.previewUrl) {
        setLastInvitePreview(result.previewUrl)
      } else {
        setLastInvitePreview(undefined)
      }

      setInviteEmail("")
      setInviteMessage("")
      setIsInviteOpen(false)
    } catch (error) {
      console.error("Failed to invite member:", error)
      alert(`Failed to send invitation: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this team member?")) return
    
    try {
      await removeMutation.mutateAsync(memberId)
    } catch (error) {
      console.error("Failed to remove member:", error)
    }
  }

  const handleCancelInvite = async (invitationId: string) => {
    try {
      await cancelMutation.mutateAsync(invitationId)
    } catch (error) {
      console.error("Failed to cancel invitation:", error)
    }
  }

  const _isLoading = membersLoading || invitationsLoading

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Owner":
        return "bg-gradient-to-r from-[#FF006B] to-[#B14BFF] text-white"
      case "Admin":
        return "bg-[#00D9FF]/20 text-[#00D9FF] border-[#00D9FF]/30"
      case "Member":
        return "bg-[#00FF94]/20 text-[#00FF94] border-[#00FF94]/30"
      case "Guest":
        return "bg-white/10 text-gray-400 border-white/20"
      default:
        return "bg-white/10 text-gray-400"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-[#00FF94]"
      case "away":
        return "bg-[#FF006B]"
      case "offline":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <PageLayout
      title="Team Management"
      subtitle="Manage team members, roles, and permissions"
      actions={
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-gradient-to-r from-[#00D9FF] to-[#B14BFF] hover:opacity-90">
              <UserPlus className="h-4 w-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0E0F1A] border-white/10 max-w-md">
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>Send an invitation to join your workspace</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="bg-white/5 border-white/10 focus:border-[#00D9FF]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as "Admin" | "Member" | "Guest")}>
                  <SelectTrigger className="bg-white/5 border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0E0F1A] border-white/10">
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Member">Member</SelectItem>
                    <SelectItem value="Guest">Guest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Permissions Preview</Label>
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
                  {rolePermissions[selectedRole as keyof typeof rolePermissions]?.map((permission) => (
                    <div key={permission} className="flex items-center gap-2 text-sm text-gray-400">
                      <CheckCircle2 className="h-3 w-3 text-[#00FF94]" />
                      <span>{permission}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Personal Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={inviteMessage}
                  onChange={(e) => setInviteMessage(e.target.value)}
                  placeholder="Welcome to the team! Looking forward to working with you."
                  className="bg-white/5 border-white/10 focus:border-[#00D9FF] resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleInvite}
                disabled={!inviteEmail || inviteMutation.isPending}
                className="bg-gradient-to-r from-[#00D9FF] to-[#B14BFF]"
              >
                {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      }
    >
      <div className="space-y-6">
        {/* Email Preview Link (Mock Mode) */}
        {lastInvitePreview && (
          <Card className="bg-yellow-500/10 backdrop-blur-xl border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-yellow-500 mb-1">Email Service Not Configured</h4>
                  <p className="text-sm text-gray-400 mb-2">
                    Invitation created but email not sent. Use this link to test the accept flow:
                  </p>
                  <code className="text-xs bg-black/40 px-2 py-1 rounded border border-yellow-500/30 text-yellow-400">
                    {lastInvitePreview}
                  </code>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setLastInvitePreview(null)}
                  className="text-yellow-500"
                >
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
            <Card className="bg-gradient-to-br from-[#00D9FF]/20 to-[#B14BFF]/20 backdrop-blur-xl border-white/10 hover:border-[#00D9FF]/50 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Total Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{teamMembers.length}</div>
                <p className="text-sm text-gray-400">of 20 seats used</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10 hover:border-[#00FF94]/30 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Active Now</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#00FF94]">
                  {teamMembers.filter((m) => m.status === "online").length}
                </div>
                <p className="text-sm text-gray-400">members online</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10 hover:border-[#FF006B]/30 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Pending Invites</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-[#FF006B]">{pendingInvitations.length}</div>
                <p className="text-sm text-gray-400">awaiting response</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10 hover:border-[#B14BFF]/30 transition-all">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Seats Available</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{20 - teamMembers.length}</div>
                <p className="text-sm text-gray-400">upgrade for more</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Team Members */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>Manage your team and their roles</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search members..."
                      className="w-64 bg-white/5 border-white/10 focus:border-[#00D9FF]"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {teamMembers.map((member, i) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10 hover:border-[#00D9FF]/30 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Image
                            src={member.avatar || "/placeholder.svg"}
                            alt={member.name}
                            width={48}
                            height={48}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white/20"
                            unoptimized
                          />
                          <div
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0E0F1A] ${getStatusColor(
                              member.status,
                            )}`}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{member.name}</span>
                            {member.role === "Owner" && <Crown className="h-4 w-4 text-[#FF006B]" />}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Mail className="h-3 w-3" />
                            <span>{member.email}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={getRoleColor(member.role)}>
                              {member.role}
                            </Badge>
                            <span className="text-xs text-gray-500">{member.department}</span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0E0F1A] border-white/10">
                          <DropdownMenuItem className="hover:bg-white/10">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem className="hover:bg-white/10">
                            <Shield className="h-4 w-4 mr-2" />
                            Change Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/10" />
                          <DropdownMenuItem 
                            onClick={() => handleRemoveMember(member.id)}
                            className="hover:bg-[#FF006B]/10 text-[#FF006B]"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Remove from Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Pending Invitations */}
            <Card className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle>Pending Invitations</CardTitle>
                <CardDescription>Manage sent invitations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pendingInvitations.map((invite, i) => (
                    <motion.div
                      key={invite.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-[#00D9FF]" />
                          <span className="font-medium">{invite.email}</span>
                          <Badge variant="outline" className="bg-[#FF006B]/20 text-[#FF006B] border-[#FF006B]/30">
                            {invite.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Invited by {invite.invitedBy}</span>
                          <span>•</span>
                          <span>Sent {new Date(invite.sentAt).toLocaleDateString()}</span>
                          <span>•</span>
                          <span>Expires {new Date(invite.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="bg-transparent border-white/10">
                          Resend
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelInvite(invite.id)}
                          disabled={cancelMutation.isPending}
                          className="bg-transparent border-[#FF006B]/30 text-[#FF006B]"
                        >
                          {cancelMutation.isPending ? "Canceling..." : "Cancel"}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar: Permissions & Activity */}
          <div className="space-y-4">
            {/* Role Permissions */}
            <Card className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#00D9FF]" />
                  Role Permissions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(rolePermissions).map(([role, permissions]) => (
                  <div key={role} className="space-y-2">
                    <Badge variant="outline" className={getRoleColor(role)}>
                      {role}
                    </Badge>
                    <ul className="space-y-1 text-sm">
                      {permissions.map((permission) => (
                        <li key={permission} className="flex items-center gap-2 text-gray-400">
                          <CheckCircle2 className="h-3 w-3 text-[#00FF94]" />
                          {permission}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Activity Feed */}
            <Card className="bg-[#0E0F1A]/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-[#B14BFF]" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activityFeed.map((activity, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex gap-3"
                    >
                      <div className="w-2 h-2 rounded-full bg-[#00D9FF] mt-2 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium text-white">{activity.user}</span>
                          <span className="text-gray-400"> {activity.action}</span>
                        </p>
                        <p className="text-xs text-gray-500">{activity.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
