"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle } from "lucide-react"

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: (note?: string) => void
  title: string
  description: string
  confirmText?: string
  confirmVariant?: "danger" | "default"
  showNoteField?: boolean
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  confirmVariant = "default",
  showNoteField = false,
}: ConfirmDialogProps) {
  const [note, setNote] = useState("")

  const handleConfirm = () => {
    onConfirm(showNoteField ? note : undefined)
    setNote("")
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#0F1120] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-[#E6E8FF] flex items-center space-x-2">
            {confirmVariant === "danger" && <AlertCircle className="w-5 h-5 text-rose-400" />}
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription className="text-[#8A8FB2]">
            {description}
          </DialogDescription>
        </DialogHeader>
        
        {showNoteField && (
          <div className="mt-4">
            <label className="text-sm text-[#8A8FB2] mb-2 block">Note (optional)</label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note..."
              className="bg-white/5 border-white/10 text-[#E6E8FF] placeholder-[#8A8FB2] resize-none"
              rows={3}
            />
          </div>
        )}
        
        <div className="flex justify-end space-x-2 mt-4">
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-white/5 border-white/10 hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            className={
              confirmVariant === "danger"
                ? "bg-rose-500 hover:bg-rose-600"
                : "bg-gradient-to-r from-[#2B26FE] to-[#7A78FF] hover:opacity-90"
            }
          >
            {confirmText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
