"use client"

import type React from "react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface MetricCardProps {
  title: string
  value: string
  change: string
  icon: React.ReactNode
  theme: "blue" | "purple" | "green" | "pink"
}

interface AgentCardProps {
  name: string
  status: "active" | "idle"
  performance: number
  icon: React.ReactNode
  tasks: number
}

interface _ActivityItem {
  id: string
  message: string
  time: string
  type: "success" | "info" | "warning"
}

const _MetricCard = ({ title, value, change, icon, theme }: MetricCardProps) => {
  const themeClasses = {
    blue: "border-blue-500/30 hover:border-blue-500/50",
    purple: "border-purple-500/30 hover:border-purple-500/50",
    green: "border-green-500/30 hover:border-green-500/50",
    pink: "border-pink-500/30 hover:border-pink-500/50",
  }

  const iconThemes = {
    blue: "text-neon-blue",
    purple: "text-neon-purple",
    green: "text-neon-green",
    pink: "text-neon-pink",
  }

  return (
    <div className={`card-neon ${themeClasses[theme]} animate-fade-in-up`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-white/5 ${iconThemes[theme]}`}>{icon}</div>
        <span className="text-sm text-green-400 font-medium">{change}</span>
      </div>
      <div className="space-y-1">
        <p className="text-sm text-gray-400">{title}</p>
        <p className={`stat-number ${iconThemes[theme]}`}>{value}</p>
      </div>
    </div>
  )
}

const _AgentCard = ({ name, status, performance, icon, tasks }: AgentCardProps) => {
  return (
    <div className="card-glow animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-white/5 text-neon-blue">{icon}</div>
          <div>
            <h3 className="font-medium text-white">{name}</h3>
            <div className="flex items-center space-x-2">
              <div className={`status-indicator ${status}`}></div>
              <span className={status === "active" ? "agent-status-active" : "agent-status-idle"}>
                {status === "active" ? "Active" : "Idle"}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-neon-green">{performance}%</p>
          <p className="text-xs text-gray-400">{tasks} tasks</p>
        </div>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className="bg-gradient-to-r from-neon-blue to-neon-green h-2 rounded-full transition-all duration-500"
          style={{ width: `${performance}%` }}
        ></div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    router.push("/dashboard")
  }, [router])

  return null
}
