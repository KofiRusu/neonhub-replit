"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Mail, Users, FileText, Send } from "lucide-react"

interface CampaignWizardProps {
  open: boolean
  onClose: () => void
  onCreate?: (campaign: any) => void
  onComplete?: (campaign: any) => void
}

export function CampaignWizard({ open, onClose, onCreate, onComplete }: CampaignWizardProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [template, setTemplate] = useState("modern-newsletter")
  const [segment, setSegment] = useState("all")

  const handleCreate = () => {
    const campaign = { name, subject, template, segment }
    if (onCreate) onCreate(campaign)
    if (onComplete) onComplete(campaign)
    setStep(1)
    setName("")
    setSubject("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0F1120] border-white/10 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[#E6E8FF]">Create Email Campaign</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Step indicator */}
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s ? "bg-[#2B26FE] text-white" : "bg-white/10 text-[#8A8FB2]"
                }`}>
                  {s}
                </div>
                {s < 3 && <div className={`flex-1 h-0.5 mx-2 ${step > s ? "bg-[#2B26FE]" : "bg-white/10"}`} />}
              </div>
            ))}
          </div>

          {/* Step content */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#8A8FB2] mb-2 block flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Campaign Name</span>
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Summer Product Launch"
                  className="bg-white/5 border-white/10 text-[#E6E8FF]"
                />
              </div>
              <div>
                <label className="text-sm text-[#8A8FB2] mb-2 block flex items-center space-x-2">
                  <Mail className="w-4 h-4" />
                  <span>Email Subject</span>
                </label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Discover our new collection"
                  className="bg-white/5 border-white/10 text-[#E6E8FF]"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#8A8FB2] mb-2 block">Template</label>
                <Select value={template} onValueChange={setTemplate}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-[#E6E8FF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#13152A] border-white/10">
                    <SelectItem value="modern-newsletter">Modern Newsletter</SelectItem>
                    <SelectItem value="product-launch">Product Launch</SelectItem>
                    <SelectItem value="welcome-series">Welcome Series</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#8A8FB2] mb-2 block flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Audience Segment</span>
                </label>
                <Select value={segment} onValueChange={setSegment}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-[#E6E8FF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#13152A] border-white/10">
                    <SelectItem value="all">All Subscribers</SelectItem>
                    <SelectItem value="vip">VIP Customers</SelectItem>
                    <SelectItem value="new">New Subscribers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <Button
              onClick={() => setStep(Math.max(1, step - 1))}
              disabled={step === 1}
              variant="outline"
              className="bg-white/5 border-white/10 hover:bg-white/10"
            >
              Back
            </Button>
            <div className="flex space-x-2">
              <Button
                onClick={onClose}
                variant="outline"
                className="bg-white/5 border-white/10 hover:bg-white/10"
              >
                Cancel
              </Button>
              {step < 3 ? (
                <Button
                  onClick={() => setStep(step + 1)}
                  disabled={step === 1 && (!name || !subject)}
                  className="bg-gradient-to-r from-[#2B26FE] to-[#7A78FF] hover:opacity-90"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleCreate}
                  className="bg-gradient-to-r from-[#2B26FE] to-[#7A78FF] hover:opacity-90"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
