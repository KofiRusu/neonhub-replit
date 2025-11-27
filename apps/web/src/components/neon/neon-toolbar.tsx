"use client"

import { Search, Bell } from "lucide-react"
import { ReactNode } from "react"

interface NeonToolbarProps {
  title: string
  subtitle?: string
  onSearch?: (query: string) => void
  notifications?: number
  onNotificationClick?: () => void
  actions?: ReactNode
}

export function NeonToolbar({ title, subtitle, onSearch, notifications = 0, onNotificationClick, actions }: NeonToolbarProps) {
  return (
    <div className="border-b border-white/10 bg-[#13152A]/80 backdrop-blur-xl sticky top-0 z-30">
      <div className="px-8 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#E6E8FF]">{title}</h1>
          {subtitle && <p className="text-sm text-[#8A8FB2] mt-1">{subtitle}</p>}
        </div>
        
        <div className="flex items-center space-x-4">
          {onSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8FB2]" />
              <input
                type="text"
                placeholder="Search..."
                onChange={(e) => onSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-[#E6E8FF] placeholder-[#8A8FB2] focus:border-[#2B26FE] focus:outline-none w-64"
              />
            </div>
          )}
          
          {onNotificationClick && (
            <button
              onClick={onNotificationClick}
              className="relative p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
            >
              <Bell className="w-5 h-5 text-[#8A8FB2]" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#2B26FE] text-white text-xs rounded-full flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
          )}
          
          {actions}
        </div>
      </div>
    </div>
  )
}
