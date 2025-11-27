# 💾 DISK SPACE QUICK REFERENCE

**Last Updated:** October 31, 2025  
**Current Status:** ✅ HEALTHY (32% capacity)

---

## 🎯 CURRENT STATUS

```
Available Space: 23 GB (was 11 GB)
Disk Usage: 32% (was 96% - CRITICAL)
Space Recovered: +12 GB
```

---

## 🚀 QUICK ACTIONS

### If Disk Gets Full Again

#### 1. Clear Caches (2-3 GB)
```bash
# Clear pnpm cache
pnpm store prune

# Clear Homebrew cache
brew cleanup

# Clear system caches
rm -rf ~/Library/Caches/pnpm
rm -rf ~/Library/Caches/Homebrew
rm -rf ~/.cache
```

#### 2. Clean Old Downloads (2-4 GB)
```bash
cd ~/Downloads
ls -lhtr | tail -30  # View oldest files
rm old-file.pdf      # Delete individually
```

#### 3. Remove Old Backup (31 GB) - VERIFY FIRST
```bash
# ⚠️ WARNING: Contains 11 git repos - verify before deletion
du -sh ~/Documents/"Desktop - MacBook Air (2)"

# Check for uncommitted changes
cd ~/Documents/"Desktop - MacBook Air (2)"
find . -name ".git" -type d -exec sh -c 'cd $(dirname {}) && echo "\n=== {} ===" && git status --short' \;

# If safe to delete:
rm -rf ~/Documents/"Desktop - MacBook Air (2)"
```

#### 4. Remove Build Artifacts (1-2 GB)
```bash
# Find and remove .next builds
find ~/OFAuto -name ".next" -type d -exec rm -rf {} +

# Find and remove node_modules in old projects (BE CAREFUL)
find ~/old-projects -name "node_modules" -type d -exec rm -rf {} +
```

---

## 🛡️ PROTECTED LOCATIONS - NEVER DELETE

```
✅ /Users/kofirusu/Desktop/NeonHub        (3.1 GB)
✅ /Users/kofirusu/OFAuto                 (3.5 GB)
✅ /Users/kofirusu/CrptSys                (3.2 GB)
✅ /Users/kofirusu/PersLM                 (1.3 GB)
✅ Any folder with .git
✅ Any .env or .env.* files
✅ /System, /Library, /usr, /Applications
```

---

## 📊 CHECK DISK USAGE

```bash
# Quick check
df -h /

# Top 15 largest directories
du -sh ~/* | sort -hr | head -15

# Find large files
find ~ -type f -size +100M 2>/dev/null | xargs du -sh | sort -hr | head -20
```

---

## 🧹 WEEKLY MAINTENANCE

```bash
# All-in-one cleanup
pnpm store prune && npm cache clean --force && brew cleanup

# Check status
df -h / && echo "" && du -sh ~/* | sort -hr | head -10
```

---

## ⚠️ MANUAL REVIEW TARGETS

| Location | Size | Action |
|----------|------|--------|
| `~/Documents/Desktop - MacBook Air (2)` | 31 GB | Verify git repos, then delete |
| `~/Downloads` | 4.7 GB | Review and clean old files |
| `~/Library/Application Support/Cursor` | 2.2 GB | Optional: clear old extensions |

---

## 📋 WHAT WAS CLEANED (Oct 31, 2025)

- ✅ Caches (pnpm, Homebrew, system): 3 GB
- ✅ Old Neon versions (Neon-v0.2): 8.7 GB
- ✅ Archived projects (8 projects): 2 GB
- ✅ Build artifacts (.next): 600 MB
- **TOTAL: 12 GB freed**

---

## 🔧 USEFUL ALIASES

Add to `~/.zshrc`:

```bash
# Disk shortcuts
alias disk='df -h /'
alias large='du -sh ~/* | sort -hr | head -15'
alias clean-cache='pnpm store prune && brew cleanup'
alias find-node='find . -name "node_modules" -type d -prune -exec du -sh {} \;'
```

Then run: `source ~/.zshrc`

---

## 📞 NEED MORE SPACE?

See full report: `/Users/kofirusu/Desktop/NeonHub/DISK_CLEANUP_REPORT.md`

Current available actions for 35+ GB additional space:
1. Delete old backup (31 GB) - after verification
2. Clean Downloads (2-4 GB)
3. Optional: Clear app support caches (2 GB)

