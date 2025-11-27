"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bot,
  BarChart3,
  Target,
  Mail,
  Settings,
  Users,
  CreditCard,
  Zap,
  Menu,
  X,
  Home,
  Brain,
  Megaphone,
  FileText,
  LineChart,
  Search,
} from "lucide-react"
import { HealthBadge } from "./health-badge"
import AuthButton from "./AuthButton"

const navigationItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Marketing", href: "/marketing", icon: LineChart },
  { name: "AI Agents", href: "/agents", icon: Bot },
  { name: "Campaigns", href: "/campaigns", icon: Target },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "SEO", href: "/seo", icon: Search },
  { name: "Content", href: "/content", icon: FileText },
  { name: "Email", href: "/email", icon: Mail },
  { name: "Social Media", href: "/social-media", icon: Megaphone },
  { name: "Brand Voice", href: "/brand-voice", icon: Brain },
  { name: "Billing", href: "/billing", icon: CreditCard },
  { name: "Team", href: "/team", icon: Users },
  { name: "Settings", href: "/settings", icon: Settings },
]

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-slate-700/50 backdrop-blur-sm shadow-xl border-r border-white/10">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-6 py-4">
            <div className="w-8 h-8 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h1 className="ml-3 text-xl font-bold text-gradient">NeonHub</h1>
            <span className="ml-2 px-2 py-1 text-xs bg-neon-blue/20 text-neon-blue rounded-full border border-neon-blue/30">
              v2.2.0
            </span>
            <div className="ml-auto flex items-center space-x-4">
              <HealthBadge />
              <AuthButton />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 pb-4 space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neon-blue/50"
                      : "text-gray-300 hover:bg-white/5 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/40"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? "text-neon-blue" : "text-gray-400 group-hover:text-gray-300"
                    }`}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="flex-shrink-0 p-4 border-t border-white/10">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-neon-pink to-neon-purple rounded-full"></div>
              <div className="ml-3">
                <p className="text-sm font-medium text-white">Admin User</p>
                <p className="text-xs text-gray-400">admin@neonhub.ai</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="nav-glass border-b border-white/10">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-r from-neon-blue to-neon-purple rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-gradient">NeonHub</h1>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-2 border-slate-700/50 backdrop-blur-sm shadow-xl border-b border-white/10">
            <nav className="px-4 py-2 space-y-1">
              {navigationItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-neon-blue/20 text-neon-blue border border-neon-blue/30"
                        : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <item.icon
                      className={`mr-3 h-5 w-5 ${
                        isActive ? "text-neon-blue" : "text-gray-400 group-hover:text-gray-300"
                      }`}
                    />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </div>
    </>
  )
}
