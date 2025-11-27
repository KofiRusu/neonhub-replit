/* Run: node scripts/wire-buttons.ts */
const fs = require("fs")
const path = require("path")

const ROOT = process.cwd()
const TARGET_DIRS = ["src/app", "src/components"]
const ROUTE_MAP = {
  Dashboard: "/dashboard",
  Campaigns: "/campaigns",
  "Create campaign": "/campaigns",
  Content: "/content",
  Agents: "/agents",
  Analytics: "/analytics",
  Trends: "/trends",
  Support: "/support",
  Settings: "/settings",
  Admin: "/admin",
}
const EXTS = new Set([".tsx", ".jsx"])

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry)
    const stat = fs.statSync(full)
    if (stat.isDirectory()) {
      walk(full, files)
      continue
    }
    if (EXTS.has(path.extname(full))) {
      files.push(full)
    }
  }
  return files
}

function replaceInFile(file) {
  let src = fs.readFileSync(file, "utf8")
  for (const [label, route] of Object.entries(ROUTE_MAP)) {
    const labelEsc = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    const reLink = new RegExp(`(<Link[^>]*href=["']#["'][^>]*>\\s*)(${labelEsc})(\\s*</Link>)`, "g")
    src = src.replace(reLink, (match, before, text, after) => {
      if (match.includes(`href="${route}"`)) return match
      return `${before.replace('href="#"', `href="${route}"`)}${text}${after}`
    })

    const reButton = new RegExp(`(<Button[^>]*>\\s*)(${labelEsc})(\\s*</Button>)`, "g")
    src = src.replace(reButton, (match, before, text, after) => {
      if (before.includes("asChild") || match.includes(`href="${route}"`)) {
        return match
      }
      return `${before.replace("<Button", "<Button asChild")}<a href="${route}">${text}</a>${after}`
    })
  }
  fs.writeFileSync(file, src)
}

const files = walk(path.join(ROOT, "src"))
files.forEach(replaceInFile)
console.log(`Wired ${files.length} files for routes/buttons`)

