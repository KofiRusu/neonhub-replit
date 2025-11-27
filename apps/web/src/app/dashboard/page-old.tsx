"use client"

import type React from "react"

import { motion } from "framer-motion"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Activity, Bot, Cpu, FileText, RefreshCw, TrendingUp, Zap } from "lucide-react"
import PageLayout from "@/components/page-layout"
import { useQueryClient } from "@tanstack/react-query"
import type { AgentStatusSummary } from "@/src/hooks/useAgents"

// Stub hooks - no real data
const useSummary = (_period: string) => ({ data: null, isLoading: false, isError: false })
const useTrendMetrics = (_period: string) => ({ data: null, isLoading: false, isError: false })
const useAgentStatuses = (_limit: number) => ({ data: null, isLoading: false, isError: false })
const useMetricsLive = (_period: string) => {}


interface KPIMetricCardProps {
  title: string
  value: number
  change: number
  format?: "currency" | "number" | "percentage"
  icon: React.ReactNode
  color: "blue" | "purple" | "pink" | "green"
  isTopPerformer?: boolean
}

function KPIMetricCard({
  title,
  value,
  change,
  format = "number",
  icon,
  color,
  isTopPerformer = false,
}: KPIMetricCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayValue(value)
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [value])

  const formatValue = (val: number) => {
    switch (format) {
      case "currency":
        return `$${val.toLocaleString()}`
      case "percentage":
        return `${val}%`
      default:
        return val.toLocaleString()
    }
  }

  const colorClasses = {
    blue: "text-neon-blue border-neon-blue/30",
    purple: "text-neon-purple border-neon-purple/30",
    pink: "text-neon-pink border-neon-pink/30",
    green: "text-neon-green border-neon-green/30",
  }

  const glowClasses = {
    blue: "shadow-neon-blue/20",
    purple: "shadow-neon-purple/20",
    pink: "shadow-neon-pink/20",
    green: "shadow-neon-green/20",
  }

  const isPositive = change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, scale: 1.02 }}
      className={`glass-strong p-6 rounded-lg border transition-all duration-300 ${
        colorClasses[color]
      } ${glowClasses[color]} ${isTopPerformer ? "glow-border animate-pulse" : ""} hover:border-opacity-50`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-white/5 ${colorClasses[color].split(" ")[0]}`}>
          {isLoading ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            >
              <RefreshCw className="w-6 h-6" />
            </motion.div>
          ) : (
            icon
          )}
        </div>
        <div className={`flex items-center space-x-1 text-sm ${isPositive ? "text-neon-green" : "text-neon-pink"}`}>
          <TrendingUp className={`w-4 h-4 ${!isPositive ? "rotate-180" : ""}`} />
          <span>
            {isPositive ? "+" : ""}
            {change}%
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-gray-400">{title}</p>
        <motion.p
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-3xl font-bold ${colorClasses[color].split(" ")[0]} counter-animate`}
        >
          {isLoading ? "..." : formatValue(displayValue)}
        </motion.p>
      </div>

      {isTopPerformer && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3 px-2 py-1 bg-neon-green/20 text-neon-green text-xs font-medium rounded-full border border-neon-green/30 w-fit"
        >
          Top Performer
        </motion.div>
      )}
    </motion.div>
  )
}

interface AgentStatusCardProps {
  agent: AgentStatusSummary
  index: number
}

function AgentStatusCard({ agent, index }: AgentStatusCardProps) {
  const statusConfig = {
    active: {
      color: "text-neon-green",
      bg: "bg-neon-green/20",
      border: "border-neon-green/30",
      pulse: "agent-status-active",
    },
    idle: {
      color: "text-gray-400",
      bg: "bg-gray-500/20",
      border: "border-gray-500/30",
      pulse: "agent-status-idle",
    },
    training: {
      color: "text-neon-blue",
      bg: "bg-neon-blue/20",
      border: "border-neon-blue/30",
      pulse: "agent-status-training",
    },
    error: {
      color: "text-neon-pink",
      bg: "bg-neon-pink/20",
      border: "border-neon-pink/30",
      pulse: "agent-status-error",
    },
  }

  const config = statusConfig[agent.status]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      className="glass p-4 rounded-lg border border-white/10 hover:border-neon-blue/30 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="p-2 rounded-lg bg-white/5 text-neon-blue">
              <Bot className="w-5 h-5" />
            </div>
            <div
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${config.bg} ${config.border} border ${config.pulse}`}
            ></div>
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">{agent.name}</h3>
            <p className="text-xs text-gray-400">{agent.description}</p>
          </div>
        </div>

        <span
          className={`px-2 py-1 text-xs font-medium rounded-full border ${config.bg} ${config.border} ${config.color}`}
        >
          {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
        </span>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Performance</span>
          <span className="text-neon-green font-semibold">{agent.performance}%</span>
        </div>

        <div className="neon-progress h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${agent.performance}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: index * 0.1 }}
            className="neon-progress-bar"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="text-gray-400">Tasks</p>
            <p className="font-semibold text-white">{agent.tasksCompleted.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-400">Last Active</p>
            <p className="font-semibold text-neon-blue">{agent.lastActive}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)
  const queryClient = useQueryClient()

  const { data: summary, isLoading: summaryLoading } = useSummary("30d")
  const { data: agentStatuses = [], isLoading: agentsLoading } = useAgentStatuses(4)
  const { data: trendMetrics = [], isLoading: trendsLoading } = useTrendMetrics("30d")

  useMetricsLive("30d")

  // Mock data for stub mode
  const mockSummary = useMemo(() => summary || {
    totalEvents: 12450,
    draftsCreated: 245,
    jobs: { successRate: 94, avgLatencyMs: 234, total: 1890, completed: 1780 },
    events: { pageViews: 8900, clicks: 4230, conversions: 567 }
  }, [summary])
  
  const mockAgentStatuses: AgentStatusSummary[] = useMemo(() => agentStatuses && agentStatuses.length > 0 ? agentStatuses : [
    { id: "1", name: "Content Agent", description: "AI content generation", status: "active" as const, performance: 94, tasksCompleted: 1247, lastActive: "2 min ago" },
    { id: "2", name: "SEO Agent", description: "SEO optimization", status: "active" as const, performance: 89, tasksCompleted: 892, lastActive: "5 min ago" },
    { id: "3", name: "Social Agent", description: "Social media automation", status: "idle" as const, performance: 87, tasksCompleted: 634, lastActive: "1 hour ago" },
    { id: "4", name: "Email Agent", description: "Email campaigns", status: "active" as const, performance: 91, tasksCompleted: 456, lastActive: "30 sec ago" },
  ], [agentStatuses])
  
  const mockTrendMetrics = useMemo(() => trendMetrics && trendMetrics.length > 0 ? trendMetrics : [
    { title: "Conversion Rate", value: "+12%", trend: "up" as const },
    { title: "Response Time", value: "234ms", trend: "down" as const },
    { title: "User Engagement", value: "+8%", trend: "up" as const },
    { title: "Error Rate", value: "0.02%", trend: "flat" as const },
  ], [trendMetrics])

  const computeChange = useCallback((current: number, baseline: number) => {
    if (!Number.isFinite(baseline) || baseline === 0) {
      return current > 0 ? 100 : 0
    }
    return Math.round(((current - baseline) / baseline) * 100)
  }, [])

  const kpiData = useMemo(() => {
    const summaryData = mockSummary
    if (!summaryData) {
      return []
    }
    const totalEvents = summaryData.totalEvents ?? 0
    const draftsCreated = summaryData.draftsCreated ?? 0
    const successRate = summaryData.jobs.successRate ?? 0
    const avgLatency = summaryData.jobs.avgLatencyMs ?? 0

    return [
      {
        title: "Total Events",
        value: totalEvents,
        change: computeChange(totalEvents, Math.max(totalEvents - (summaryData.events.pageViews || 1), 1)),
        format: "number" as const,
        icon: <Activity className="w-6 h-6" />,
        color: "green" as const,
        top: true,
      },
      {
        title: "Job Success Rate",
        value: successRate,
        change: computeChange(successRate, Math.max(successRate - 5, 1)),
        format: "percentage" as const,
        icon: <Bot className="w-6 h-6" />,
        color: "blue" as const,
        top: false,
      },
      {
        title: "Drafts Created",
        value: draftsCreated,
        change: computeChange(draftsCreated, Math.max(draftsCreated - 3, 1)),
        format: "number" as const,
        icon: <FileText className="w-6 h-6" />,
        color: "purple" as const,
        top: false,
      },
      {
        title: "Avg Latency (ms)",
        value: avgLatency,
        change: -computeChange(avgLatency, Math.max(avgLatency * 1.1, avgLatency + 1)),
        format: "number" as const,
        icon: <Cpu className="w-6 h-6" />,
        color: "pink" as const,
        top: false,
      },
    ]
  }, [mockSummary, computeChange])

  const healthMetrics = useMemo(() => {
    const summaryData = mockSummary
    if (!summaryData) {
      return { cpu: 0, memory: 0, network: 0 }
    }
    const totalEvents = summaryData.totalEvents || 1
    const cpu = Math.min(100, Math.round((summaryData.jobs.total || 0) / totalEvents * 100))
    const memory = Math.min(100, Math.round((summaryData.draftsCreated || 0) / totalEvents * 100))
    const network = Math.min(100, Math.round(((summaryData.events.clicks || 0) + (summaryData.events.pageViews || 0)) / totalEvents * 100))
    return { cpu, memory, network }
  }, [mockSummary])

  const quickStats = useMemo(() => {
    const summaryData = mockSummary
    if (!summaryData) {
      return []
    }
    return [
      { label: "Events Tracked", value: summaryData.totalEvents.toLocaleString(), tone: "text-neon-blue" },
      { label: "Jobs Processed", value: (summaryData.jobs.total || 0).toLocaleString(), tone: "text-neon-purple" },
      { label: "Conversions", value: (summaryData.events.conversions || 0).toLocaleString(), tone: "text-neon-green" },
      { label: "Success Rate", value: `${summaryData.jobs.successRate}%`, tone: "text-neon-pink" },
    ]
  }, [mockSummary])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["metrics"] }),
      queryClient.invalidateQueries({ queryKey: ["agents", "status"] }),
    ])
    setIsRefreshing(false)
  }

  const actions = (
    <div className="flex items-center space-x-3">
      <div className="text-sm text-gray-400 hidden md:block">{currentTime.toLocaleTimeString()}</div>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleRefresh}
        disabled={isRefreshing}
        className="btn-neon text-sm flex items-center space-x-2 disabled:opacity-50"
      >
        <motion.div
          animate={isRefreshing ? { rotate: 360 } : {}}
          transition={{ duration: 1, repeat: isRefreshing ? Number.POSITIVE_INFINITY : 0, ease: "linear" }}
        >
          <RefreshCw className="w-4 h-4" />
        </motion.div>
        <span>Refresh</span>
      </motion.button>
    </div>
  )

  return (
    <PageLayout
      title="AI Command Center"
      subtitle="Real-time agent orchestration and performance analytics"
      actions={actions}
    >
      <div className="space-y-8">
        {/* KPI Metrics Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {summaryLoading && kpiData.length === 0 ? (
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="glass-strong p-6 rounded-lg border border-white/10 animate-pulse">
                <div className="h-4 w-24 bg-white/10 rounded mb-4" />
                <div className="h-8 w-32 bg-white/10 rounded mb-3" />
                <div className="h-3 w-16 bg-white/10 rounded" />
              </div>
            ))
          ) : (
            kpiData.map((metric, index) => (
              <KPIMetricCard
                key={`${metric.title}-${index}`}
                title={metric.title}
                value={metric.value}
                change={metric.change}
                format={metric.format}
                icon={metric.icon}
                color={metric.color}
                isTopPerformer={metric.top}
              />
            ))
          )}
        </motion.section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Live Agent Status Panel */}
          <motion.section
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="glass-strong p-6 rounded-lg">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gradient">Live Agent Fleet</h2>
                  <p className="text-gray-400 text-sm">Real-time agent monitoring and control</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-neon-green rounded-full status-pulse"></div>
                  <span className="text-xs text-neon-green">All Systems Online</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {agentsLoading && agentStatuses.length === 0 ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="glass p-4 rounded-lg border border-white/10 animate-pulse h-36" />
                  ))
                ) : mockAgentStatuses.length > 0 ? (
                  mockAgentStatuses.slice(0, 4).map((agent, index) => (
                    <AgentStatusCard key={agent.id} agent={agent} index={index} />
                  ))
                ) : (
                  <div className="text-sm text-gray-400">No recent agent activity.</div>
                )}
              </div>
            </div>
          </motion.section>

          {/* Performance Summary & Trends */}
          <motion.section
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
            {/* System Health */}
            <div className="glass-strong p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">System Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-neon-blue" />
                    <span className="text-gray-400">CPU Usage</span>
                  </div>
                  <span className="text-neon-blue font-semibold">{healthMetrics.cpu}%</span>
                </div>
                <div className="neon-progress h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${healthMetrics.cpu}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                    className="bg-gradient-to-r from-neon-blue to-neon-purple h-2 rounded-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-neon-green" />
                    <span className="text-gray-400">Memory</span>
                  </div>
                  <span className="text-neon-green font-semibold">{healthMetrics.memory}%</span>
                </div>
                <div className="neon-progress h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${healthMetrics.memory}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.7 }}
                    className="bg-gradient-to-r from-neon-green to-neon-blue h-2 rounded-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-neon-purple" />
                    <span className="text-gray-400">Network</span>
                  </div>
                  <span className="text-neon-purple font-semibold">{healthMetrics.network}%</span>
                </div>
                <div className="neon-progress h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${healthMetrics.network}%` }}
                    transition={{ duration: 1, ease: "easeOut", delay: 0.9 }}
                    className="bg-gradient-to-r from-neon-purple to-neon-pink h-2 rounded-full"
                  />
                </div>
              </div>
            </div>

            {/* Trend Analyzer */}
            <div className="glass-strong p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">Performance Trends</h3>
              <div className="space-y-3">
                {trendsLoading && mockTrendMetrics.length === 0 ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="glass p-3 rounded-lg border border-white/10 animate-pulse h-16" />
                  ))
                ) : mockTrendMetrics.map((trend, index) => {
                  const tone = trend.trend === "up" ? "text-neon-green" : trend.trend === "down" ? "text-neon-pink" : "text-gray-300";
                  return (
                    <motion.div
                      key={`${trend.title}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0 + index * 0.1 }}
                      className="flex items-center justify-between p-3 glass rounded-lg"
                    >
                      <span className="text-gray-300 text-sm">{trend.title}</span>
                      <div className="flex items-center space-x-2">
                        <span className={`${tone} font-semibold text-sm`}>{trend.value}</span>
                        <TrendingUp
                          className={`w-4 h-4 ${tone} ${trend.trend === "down" ? "rotate-180" : trend.trend === "flat" ? "opacity-50" : ""}`}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="glass-strong p-6 rounded-lg">
              <h3 className="text-xl font-bold text-white mb-4">Quick Stats</h3>
              <div className="grid grid-cols-2 gap-4 text-center">
                {quickStats.length === 0 ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="space-y-2 animate-pulse">
                      <div className="h-6 w-20 mx-auto bg-white/10 rounded" />
                      <div className="h-3 w-24 mx-auto bg-white/10 rounded" />
                    </div>
                  ))
                ) : (
                  quickStats.map((stat) => (
                    <div key={stat.label}>
                      <p className={`text-2xl font-bold ${stat.tone}`}>{stat.value}</p>
                      <p className="text-xs text-gray-400">{stat.label}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.section>
        </div>
      </div>
    </PageLayout>
  )
}
