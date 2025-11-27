"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Twitter, Linkedin, Instagram, Facebook, Calendar, Sparkles } from "lucide-react"

interface SocialComposerProps {
  open: boolean
  onClose: () => void
  onPost: (data: { platform: string; text: string; scheduledFor?: string }) => void
}

export function SocialComposer({ open, onClose, onPost }: SocialComposerProps) {
  const [platform, setPlatform] = useState("twitter")
  const [text, setText] = useState("")
  const [scheduleType, setScheduleType] = useState("now")

  const handlePost = () => {
    onPost({
      platform,
      text,
      scheduledFor: scheduleType === "now" ? undefined : "2024-11-01T14:00:00",
    })
    setText("")
    onClose()
  }

  const platformIcons = {
    twitter: <Twitter className="w-4 h-4" />,
    linkedin: <Linkedin className="w-4 h-4" />,
    instagram: <Instagram className="w-4 h-4" />,
    facebook: <Facebook className="w-4 h-4" />,
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0F1120] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-[#E6E8FF]">Create Social Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#8A8FB2] mb-2 block">Platform</label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger className="bg-white/5 border-white/10 text-[#E6E8FF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#13152A] border-white/10">
                <SelectItem value="twitter">
                  <div className="flex items-center space-x-2">
                    {platformIcons.twitter}
                    <span>Twitter</span>
                  </div>
                </SelectItem>
                <SelectItem value="linkedin">
                  <div className="flex items-center space-x-2">
                    {platformIcons.linkedin}
                    <span>LinkedIn</span>
                  </div>
                </SelectItem>
                <SelectItem value="instagram">
                  <div className="flex items-center space-x-2">
                    {platformIcons.instagram}
                    <span>Instagram</span>
                  </div>
                </SelectItem>
                <SelectItem value="facebook">
                  <div className="flex items-center space-x-2">
                    {platformIcons.facebook}
                    <span>Facebook</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm text-[#8A8FB2] mb-2 block">Content</label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's on your mind?"
              className="bg-white/5 border-white/10 text-[#E6E8FF] placeholder-[#8A8FB2] min-h-[120px] resize-none"
            />
            <p className="text-xs text-[#8A8FB2] mt-1">{text.length} characters</p>
          </div>

          <div>
            <label className="text-sm text-[#8A8FB2] mb-2 block">Schedule</label>
            <div className="flex space-x-2">
              <Button
                onClick={() => setScheduleType("now")}
                variant={scheduleType === "now" ? "default" : "outline"}
                className={scheduleType === "now" ? "bg-[#2B26FE] hover:bg-[#2B26FE]/90" : "bg-white/5 border-white/10 hover:bg-white/10"}
              >
                Post Now
              </Button>
              <Button
                onClick={() => setScheduleType("schedule")}
                variant={scheduleType === "schedule" ? "default" : "outline"}
                className={scheduleType === "schedule" ? "bg-[#2B26FE] hover:bg-[#2B26FE]/90" : "bg-white/5 border-white/10 hover:bg-white/10"}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Schedule
              </Button>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="bg-white/5 border-white/10 hover:bg-white/10"
            >
              Cancel
            </Button>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="bg-white/5 border-white/10 hover:bg-white/10"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                AI Optimize
              </Button>
              <Button
                onClick={handlePost}
                disabled={!text.trim()}
                className="bg-gradient-to-r from-[#2B26FE] to-[#7A78FF] hover:opacity-90"
              >
                {scheduleType === "now" ? "Post Now" : "Schedule Post"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
