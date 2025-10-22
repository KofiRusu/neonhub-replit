"use client"

export const dynamic = 'force-dynamic'

import { useState, useEffect } from "react"
import PageLayout from "@/components/page-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/src/components/ui/skeleton"
import { TrendingUp, TrendingDown, AlertTriangle, Sparkles, Download, RefreshCw } from "lucide-react"
import { motion } from "framer-motion"
import { useTrendMetrics, useSignals } from "@/src/hooks/useTrends"
import { useQueryClient } from "@tanstack/react-query"

export default function TrendsPage() {
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("30d")
  const queryClient = useQueryClient()

  // Fetch real data from backend
  const { data: metrics = [], isLoading: metricsLoading, error: metricsError } = useTrendMetrics(timeRange)
  const { data: signals = [], isLoading: signalsLoading, error: signalsError } = useSignals(timeRange)

  // Listen to WebSocket for live updates
  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:3001"
    let ws: WebSocket | null = null

    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log("WebSocket connected for trends")
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          
          // Listen for metrics:delta events
          if (message.type === "metrics:delta" || message.type === "metric:event") {
            console.log("Metrics updated, invalidating cache")
            // Invalidate React Query cache to trigger refetch
            queryClient.invalidateQueries({ queryKey: ["metrics"] })
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err)
        }
      }

      ws.onerror = (error) => {
        console.warn("WebSocket error (non-critical):", error)
      }

      ws.onclose = () => {
        console.log("WebSocket disconnected")
      }
    } catch (err) {
      console.warn("WebSocket not available (non-critical):", err)
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    }
  }, [queryClient])

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["metrics"] })
  }

  const handleRangeChange = (newRange: "24h" | "7d" | "30d") => {
    setTimeRange(newRange)
  }

  const isLoading = metricsLoading || signalsLoading

  return (
    <PageLayout title="Trends & Predictions" subtitle="AI-powered predictive analytics and emerging signals">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="gap-2 bg-transparent"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <select
              value={timeRange}
              onChange={(e) => handleRangeChange(e.target.value as "24h" | "7d" | "30d")}
              className="gap-2 bg-transparent border border-white/10 rounded-md px-3 py-1.5 text-sm hover:border-blue-500/50 transition"
            >
              <option value="24h" className="bg-[#0E0F1A]">Last 24 Hours</option>
              <option value="7d" className="bg-[#0E0F1A]">Last 7 Days</option>
              <option value="30d" className="bg-[#0E0F1A]">Last 30 Days</option>
            </select>
          </div>
          <Button className="gap-2 bg-gradient-to-r from-blue-500 to-purple-500">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>

        {/* Error States */}
        {(metricsError || signalsError) && (
          <Card className="bg-red-500/10 backdrop-blur-xl border-red-500/20">
            <CardContent className="p-4">
              <p className="text-red-400">
                {metricsError?.message || signalsError?.message || "Failed to load data"}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Key Metrics Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-black/40 backdrop-blur-xl border-white/10">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-24 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            metrics.map((metric, i) => (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
              <Card className="bg-black/40 backdrop-blur-xl border-white/10 hover:border-blue-500/50 transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-400">{metric.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        {metric.value}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        {metric.trend === "up" ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={metric.change > 0 ? "text-green-500" : "text-red-500"}>
                          {metric.change > 0 ? "+" : ""}
                          {metric.change}%
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">Forecast</div>
                      <div className="text-sm font-semibold text-blue-400">{metric.forecast}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Signals Detection */}
        <Card className="bg-black/40 backdrop-blur-xl border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  AI Signal Detection
                </CardTitle>
                <CardDescription>Real-time anomalies and emerging opportunities</CardDescription>
              </div>
              <Badge variant="outline" className="gap-1">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                Live
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              // Loading skeletons for signals
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/10">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))
            ) : (
              signals.map((signal, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-lg bg-white/5 border border-white/10 hover:border-blue-500/30 transition-all"
              >
                <div
                  className={`p-2 rounded-lg ${
                    signal.type === "opportunity"
                      ? "bg-green-500/10 text-green-500"
                      : signal.type === "warning"
                        ? "bg-red-500/10 text-red-500"
                        : "bg-blue-500/10 text-blue-500"
                  }`}
                >
                  {signal.type === "opportunity" ? (
                    <TrendingUp className="h-5 w-5" />
                  ) : signal.type === "warning" ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <Sparkles className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-semibold">{signal.title}</h4>
                    <Badge variant={signal.impact === "high" ? "destructive" : "secondary"} className="text-xs">
                      {signal.impact}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">{signal.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{signal.timestamp}</span>
                    <Button variant="ghost" size="sm" className="h-7 text-blue-400">
                      View Details →
                    </Button>
                  </div>
                </div>
              </motion.div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Trend Visualization Tabs */}
        <Tabs defaultValue="forecast" className="space-y-4">
          <TabsList className="bg-black/40 backdrop-blur-xl border border-white/10">
            <TabsTrigger value="forecast">Forecasts</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="forecast" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {["Engagement Growth", "Content Performance", "Audience Reach", "Conversion Trends"].map((title, i) => (
                <Card key={title} className="bg-black/40 backdrop-blur-xl border-white/10">
                  <CardHeader>
                    <CardTitle className="text-lg">{title}</CardTitle>
                    <CardDescription>30-day ML-powered prediction</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 flex items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-lg">
                      Chart Component: {title}
                      <br />
                      <span className="text-xs">(Integrate with recharts/chart.js)</span>
                    </div>
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="text-gray-400">Confidence</span>
                      <Badge variant="outline" className="bg-green-500/10 text-green-500">
                        {92 - i * 3}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle>Period Comparison</CardTitle>
                <CardDescription>Compare performance across time periods</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { metric: "Social Media", current: "24.5K", previous: "21.2K", change: 15.6 },
                    { metric: "Email Campaigns", current: "8.3K", previous: "9.1K", change: -8.8 },
                    { metric: "Content Views", current: "142K", previous: "128K", change: 10.9 },
                    { metric: "Conversions", current: "1.2K", previous: "0.9K", change: 33.3 },
                  ].map((item) => (
                    <div
                      key={item.metric}
                      className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/10"
                    >
                      <span className="font-medium">{item.metric}</span>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Previous</div>
                          <div className="text-sm text-gray-400">{item.previous}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Current</div>
                          <div className="text-sm font-semibold">{item.current}</div>
                        </div>
                        <div
                          className={`flex items-center gap-1 ${item.change > 0 ? "text-green-500" : "text-red-500"}`}
                        >
                          {item.change > 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          {item.change > 0 ? "+" : ""}
                          {item.change}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card className="bg-black/40 backdrop-blur-xl border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  AI-Generated Insights
                </CardTitle>
                <CardDescription>Automated analysis and recommendations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    title: "Content Strategy Recommendation",
                    insight:
                      "Your video content is outperforming static posts by 3.2x. Consider allocating 60% of resources to video production.",
                    confidence: 94,
                  },
                  {
                    title: "Audience Behavior Pattern",
                    insight:
                      "User engagement peaks on Tuesday and Thursday evenings. Schedule high-priority content for these windows.",
                    confidence: 88,
                  },
                  {
                    title: "Campaign Optimization",
                    insight: "Email subject lines with emojis show 23% higher open rates in your audience segment.",
                    confidence: 91,
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-purple-400">{item.title}</h4>
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-400">
                        {item.confidence}% confidence
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-300">{item.insight}</p>
                    <Button variant="ghost" size="sm" className="mt-2 text-purple-400 hover:text-purple-300">
                      Apply Recommendation →
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}
