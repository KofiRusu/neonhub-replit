import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Brand Voice Copilot | NeonHub",
  description: "AI-powered brand voice copilot for unified marketing intelligence",
}

export default function BrandVoiceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
