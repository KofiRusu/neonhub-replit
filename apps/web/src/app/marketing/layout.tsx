"use client"

import type { ReactNode } from "react"
import PageLayout from "@/components/page-layout"

interface MarketingLayoutProps {
  children: ReactNode
}

export default function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <PageLayout
      title="Marketing Analytics"
      subtitle="Comprehensive campaign performance and ROI tracking"
    >
      {children}
    </PageLayout>
  )
}
