"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"
import { TrendingUp } from "lucide-react"

type MetricValue = number | string

type MetricFormat = "number" | "currency" | "percentage"
type MetricTrend = "up" | "down" | "neutral"
type MetricColor = "blue" | "purple" | "pink" | "green"

interface MarketingMetricCardProps {
  title: string
  value: MetricValue
  change?: number
  changeLabel?: string
  icon: ReactNode
  format?: MetricFormat
  trend?: MetricTrend
  colorScheme?: MetricColor
  isLoading?: boolean
  onClick?: () => void
}

const colorClasses: Record<MetricColor, string> = {
  blue: "text-neon-blue border-neon-blue/30",
  purple: "text-neon-purple border-neon-purple/30",
  pink: "text-neon-pink border-neon-pink/30",
  green: "text-neon-green border-neon-green/30",
}

const trendColors: Record<MetricTrend, string> = {
  up: "text-neon-green",
  down: "text-neon-pink",
  neutral: "text-gray-400",
}

function formatMetricValue(value: MetricValue, format: MetricFormat) {
  if (typeof value === "string") {
    return value
  }

  switch (format) {
    case "currency":
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value)
    case "percentage":
      return `${value.toFixed(1)}%`
    default:
      return value.toLocaleString()
  }
}

export function MarketingMetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  format = "number",
  trend = "neutral",
  colorScheme = "blue",
  isLoading = false,
  onClick,
}: MarketingMetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      onClick={onClick}
      className={`marketing-metric-card ${onClick ? "cursor-pointer" : ""}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-white/5 ${colorClasses[colorScheme]}`}>
          {icon}
        </div>

        {change !== undefined && (
          <div className={`flex items-center space-x-1 text-sm ${trendColors[trend]}`}>
            <TrendingUp className={`w-4 h-4 ${trend === "down" ? "rotate-180" : ""}`} />
            <span>
              {change > 0 ? "+" : ""}
              {change}%
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-sm text-gray-400">{title}</p>
        {isLoading ? (
          <div className="h-8 w-32 bg-white/10 rounded animate-pulse" />
        ) : (
          <p className={`text-3xl font-bold ${colorClasses[colorScheme].split(" ")[0]}`}>
            {formatMetricValue(value, format)}
          </p>
        )}
        {changeLabel && <p className="text-xs text-gray-500 mt-1">{changeLabel}</p>}
      </div>
    </motion.div>
  )
}
