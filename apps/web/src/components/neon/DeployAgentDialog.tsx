"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Zap } from "lucide-react"

interface DeployAgentDialogProps {
  open: boolean
  onClose: () => void
  onDeploy: (agentType: string) => void
}

const agentTypes = [
  { value: "content", label: "Content Generator" },
  { value: "seo", label: "SEO Optimizer" },
  { value: "social", label: "Social Media Bot" },
  { value: "email", label: "Email Marketing Agent" },
  { value: "analytics", label: "Analytics Agent" },
]

export function DeployAgentDialog({ open, onClose, onDeploy }: DeployAgentDialogProps) {
  const [selectedAgent, setSelectedAgent] = useState("content")

  const handleDeploy = () => {
    onDeploy(selectedAgent)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0F1120] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-[#E6E8FF] flex items-center space-x-2">
            <Zap className="w-5 h-5 text-[#2B26FE]" />
            <span>Deploy AI Agent</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#8A8FB2] mb-2 block">Agent Type</label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger className="bg-white/5 border-white/10 text-[#E6E8FF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#13152A] border-white/10">
                {agentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="bg-white/5 border-white/10 hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeploy}
              className="bg-gradient-to-r from-[#2B26FE] to-[#7A78FF] hover:opacity-90"
            >
              <Zap className="w-4 h-4 mr-2" />
              Deploy Agent
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
