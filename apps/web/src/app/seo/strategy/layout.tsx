import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "SEO Strategy Builder | NeonHub",
  description: "Research keywords, generate content clusters, audit pages, and create optimized metadata",
}

export default function SEOStrategyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}

