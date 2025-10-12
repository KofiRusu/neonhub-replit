"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock, Zap } from "lucide-react"

interface KPI {
  label: string
  value: string | number
  trend?: "up" | "down" | "flat"
  status?: "good" | "warning" | "error"
  change?: string
}

interface InsightsStripProps {
  kpis: KPI[]
}

export default function InsightsStrip({ kpis }: InsightsStripProps) {
  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case "up":
        return TrendingUp
      case "down":
        return TrendingDown
      case "flat":
        return Minus
      default:
        return Minus
    }
  }

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case "up":
        return "text-[#00FF88]"
      case "down":
        return "text-[#FF006B]"
      case "flat":
        return "text-gray-400"
      default:
        return "text-gray-400"
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "good":
        return "border-[#00FF88]/30 bg-[#00FF88]/10 text-[#00FF88]"
      case "warning":
        return "border-yellow-500/30 bg-yellow-500/10 text-yellow-500"
      case "error":
        return "border-[#FF006B]/30 bg-[#FF006B]/10 text-[#FF006B]"
      default:
        return "border-[#00D4FF]/30 bg-[#00D4FF]/10 text-[#00D4FF]"
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "good":
        return CheckCircle
      case "warning":
        return AlertTriangle
      case "error":
        return AlertTriangle
      default:
        return Zap
    }
  }

  return (
    <div className="flex items-center space-x-4 overflow-x-auto pb-2">
      {kpis.map((kpi, index) => {
        const TrendIcon = getTrendIcon(kpi.trend)
        const StatusIcon = getStatusIcon(kpi.status)

        return (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex-shrink-0"
          >
            <Card className="bg-[#2A2B35]/30 border-white/10 backdrop-blur-xl p-3 min-w-[140px]">
              <div className="flex items-center justify-between mb-2">
                <StatusIcon
                  className={`w-4 h-4 ${kpi.status ? getStatusColor(kpi.status).split(" ")[2] : "text-[#00D4FF]"}`}
                />
                {kpi.trend && <TrendIcon className={`w-3 h-3 ${getTrendColor(kpi.trend)}`} />}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-white">{kpi.value}</span>
                  {kpi.change && (
                    <span className={`text-xs font-medium ${getTrendColor(kpi.trend)}`}>{kpi.change}</span>
                  )}
                </div>
                <p className="text-xs text-gray-400 leading-tight">{kpi.label}</p>
              </div>
            </Card>
          </motion.div>
        )
      })}

      {/* Live Status Indicator */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: kpis.length * 0.1 }}
        className="flex-shrink-0"
      >
        <Card className="bg-[#2A2B35]/30 border-white/10 backdrop-blur-xl p-3 min-w-[120px]">
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse" />
            <Clock className="w-4 h-4 text-[#00FF88]" />
          </div>
          <div className="space-y-1">
            <span className="text-sm font-medium text-white">Live</span>
            <p className="text-xs text-gray-400">Real-time monitoring</p>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
