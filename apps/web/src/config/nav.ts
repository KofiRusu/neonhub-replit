export type AppRoute =
  | "dashboard"
  | "campaigns"
  | "content"
  | "agents"
  | "analytics"
  | "trends"
  | "support"
  | "settings"
  | "admin"

export const ROUTES: Record<AppRoute, string> = {
  dashboard: "/dashboard",
  campaigns: "/campaigns",
  content: "/content",
  agents: "/agents",
  analytics: "/analytics",
  trends: "/trends",
  support: "/support",
  settings: "/settings",
  admin: "/admin",
}

export const PRIMARY_NAV = [
  { label: "Dashboard", route: ROUTES.dashboard },
  { label: "Campaigns", route: ROUTES.campaigns },
  { label: "Content", route: ROUTES.content },
  { label: "Agents", route: ROUTES.agents },
  { label: "Analytics", route: ROUTES.analytics },
  { label: "Trends", route: ROUTES.trends },
  { label: "Support", route: ROUTES.support },
  { label: "Settings", route: ROUTES.settings },
  { label: "Admin", route: ROUTES.admin },
]

