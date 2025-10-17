"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react"

interface ComparisonViewProps {
  timeRange: string
}

export function ComparisonView({ timeRange: _timeRange }: ComparisonViewProps) {
  const comparisons = [
    {
      category: "Content Performance",
      items: [
        { label: "Blog Posts", current: 12.4, previous: 10.2, unit: "k views" },
        { label: "Videos", current: 24.8, previous: 18.3, unit: "k views" },
        { label: "Infographics", current: 8.1, previous: 9.4, unit: "k views" },
      ],
    },
    {
      category: "Channel Performance",
      items: [
        { label: "Email", current: 18.6, previous: 16.2, unit: "% open rate" },
        { label: "Social Media", current: 31.2, previous: 28.7, unit: "% engagement" },
        { label: "Website", current: 42.3, previous: 38.9, unit: "k visitors" },
      ],
    },
    {
      category: "Conversion Metrics",
      items: [
        { label: "Lead Generation", current: 234, previous: 198, unit: "leads" },
        { label: "Sales", current: 1847, previous: 1623, unit: "USD" },
        { label: "ROI", current: 3.2, previous: 2.8, unit: "x" },
      ],
    },
  ]

  const getChangePercent = (current: number, previous: number) => {
    return ((current - previous) / previous) * 100
  }

  const getChangeIcon = (current: number, previous: number) => {
    const change = current - previous
    if (change > 0) return ArrowUpRight
    if (change < 0) return ArrowDownRight
    return Minus
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {comparisons.map((comparison) => (
        <Card
          key={comparison.category}
          className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-border transition-all duration-300"
        >
          <CardHeader>
            <CardTitle className="text-base">{comparison.category}</CardTitle>
            <CardDescription>Period-over-period comparison</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {comparison.items.map((item) => {
              const change = getChangePercent(item.current, item.previous)
              const ChangeIcon = getChangeIcon(item.current, item.previous)
              const isPositive = change > 0
              const isNeutral = change === 0

              return (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-border/30 bg-card/30 p-3"
                >
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-lg font-bold">{item.current}</span>
                      <span className="text-xs text-muted-foreground">{item.unit}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      className={`gap-1 ${
                        isPositive
                          ? "border-neon-green/50 text-neon-green"
                          : isNeutral
                            ? "border-muted text-muted-foreground"
                            : "border-neon-pink/50 text-neon-pink"
                      }`}
                    >
                      <ChangeIcon className="h-3 w-3" />
                      {Math.abs(change).toFixed(1)}%
                    </Badge>
                    <span className="text-xs text-muted-foreground">vs {item.previous}</span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
