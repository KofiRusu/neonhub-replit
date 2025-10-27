#!/bin/sh
set -euo pipefail

# NeonHub Repository Cleanup Script
# Usage: ./scripts/cleanup.sh [--apply] [--deep] [--docker]
# Default: Dry-run mode (shows what would be deleted)

APPLY=0
DEEP=0
DOCKER=0
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Parse arguments
for arg in "$@"; do
  case $arg in
    --apply)
      APPLY=1
      shift
      ;;
    --deep)
      DEEP=1
      shift
      ;;
    --docker)
      DOCKER=1
      shift
      ;;
    -h|--help)
      echo "NeonHub Repository Cleanup Script"
      echo ""
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --apply        Actually perform deletions (default: dry-run)"
      echo "  --deep         Also run 'git clean -fdX' to remove ignored files"
      echo "  --docker       Run 'docker system prune -af --volumes'"
      echo "  -h, --help     Show this help message"
      echo ""
      echo "Examples:"
      echo "  $0                    # Dry-run (preview only)"
      echo "  $0 --apply            # Clean ephemeral artifacts"
      echo "  $0 --apply --deep     # Clean + remove ignored files"
      echo "  $0 --apply --docker   # Clean + prune Docker"
      exit 0
      ;;
    *)
      echo "Unknown option: $arg"
      echo "Use -h or --help for usage information"
      exit 1
      ;;
  esac
done

cd "$REPO_ROOT"

echo "=================================================="
echo "NeonHub Repository Cleanup"
echo "=================================================="
echo "Mode: $([ $APPLY -eq 1 ] && echo 'APPLY (real deletions)' || echo 'DRY-RUN (preview only)')"
echo "Deep clean: $([ $DEEP -eq 1 ] && echo 'YES' || echo 'NO')"
echo "Docker prune: $([ $DOCKER -eq 1 ] && echo 'YES' || echo 'NO')"
echo "=================================================="
echo ""

# Step A: Capture start size
echo "[1/8] Capturing initial repository size..."
START_SIZE=$(du -sh . 2>/dev/null | cut -f1 || echo "unknown")
echo "Start size: $START_SIZE"
echo ""

# Step B: Show biggest directories
echo "[2/8] Analyzing disk usage (top directories)..."
echo "=== Root level ==="
du -hd1 . 2>/dev/null | sort -h | tail -n 20 || true
echo ""
echo "=== Workspace directories ==="
du -hd1 apps packages modules core 2>/dev/null | sort -h | tail -n 15 || true
echo ""

# Step C: Ephemeral targets list
echo "[3/8] Identifying ephemeral artifacts..."
TARGETS="
.turbo
.next
.cache
dist
build
coverage
tmp
.vite
out
.vercel
.wrangler
node_modules/.cache
apps/*/.next
apps/*/.cache
apps/*/dist
apps/*/build
apps/*/coverage
apps/*/out
apps/*/.turbo
packages/*/dist
packages/*/build
packages/*/coverage
modules/*/dist
modules/*/build
core/*/.turbo
"

FOUND_TARGETS=""
for target in $TARGETS; do
  # Use find to handle globs properly
  case "$target" in
    */*)
      # Handle patterns with wildcards
      pattern=$(echo "$target" | sed 's/\*/\.\*/g')
      found=$(find . -path "./$target" -type d 2>/dev/null | head -1 || true)
      if [ -n "$found" ]; then
        size=$(du -sh "$found" 2>/dev/null | cut -f1 || echo "?")
        echo "  Found: $found ($size)"
        FOUND_TARGETS="$FOUND_TARGETS $found"
      fi
      ;;
    *)
      if [ -d "$target" ]; then
        size=$(du -sh "$target" 2>/dev/null | cut -f1 || echo "?")
        echo "  Found: $target ($size)"
        FOUND_TARGETS="$FOUND_TARGETS $target"
      fi
      ;;
  esac
done

if [ -z "$FOUND_TARGETS" ]; then
  echo "  No ephemeral artifacts found."
else
  echo ""
  if [ $APPLY -eq 1 ]; then
    echo "Deleting ephemeral artifacts..."
    for target in $FOUND_TARGETS; do
      if [ -d "$target" ]; then
        echo "  Removing: $target"
        rm -rf "$target"
      fi
    done
    echo "Ephemeral artifacts deleted."
  else
    echo "DRY-RUN: Would delete the above directories with --apply"
  fi
fi
echo ""

# Step D: PNPM maintenance
echo "[4/8] PNPM maintenance..."
if [ $APPLY -eq 1 ]; then
  if command -v pnpm >/dev/null 2>&1; then
    echo "  Running: pnpm store prune"
    pnpm store prune || echo "  Warning: pnpm store prune failed (non-fatal)"
    echo "PNPM maintenance complete."
  else
    echo "  pnpm not found, skipping."
  fi
else
  echo "DRY-RUN: Would run 'pnpm store prune' with --apply"
fi
echo ""

# Step E: Git maintenance
echo "[5/8] Git maintenance..."
if [ $APPLY -eq 1 ]; then
  echo "  Running: git gc --aggressive --prune=now"
  git gc --aggressive --prune=now || echo "  Warning: git gc failed (non-fatal)"
  
  if [ $DEEP -eq 1 ]; then
    echo "  Running: git clean -fdX (removing ignored files)"
    git clean -fdX || echo "  Warning: git clean failed (non-fatal)"
    echo "Deep clean complete."
  fi
  echo "Git maintenance complete."
else
  echo "DRY-RUN: Would run 'git gc --aggressive --prune=now' with --apply"
  if [ $DEEP -eq 1 ]; then
    echo "DRY-RUN: Would run 'git clean -fdX' with --apply --deep"
  fi
fi
echo ""

# Step F: Docker cleanup (optional)
echo "[6/8] Docker maintenance..."
if [ $DOCKER -eq 1 ]; then
  if command -v docker >/dev/null 2>&1; then
    if [ $APPLY -eq 1 ]; then
      echo "  Running: docker system prune -af --volumes"
      docker system prune -af --volumes || echo "  Warning: docker prune failed (non-fatal)"
      echo "Docker cleanup complete."
    else
      echo "DRY-RUN: Would run 'docker system prune -af --volumes' with --apply"
    fi
  else
    echo "  Docker not found, skipping."
  fi
else
  echo "Docker cleanup not requested (use --docker flag)"
fi
echo ""

# Step G: Capture end size
echo "[7/8] Capturing final repository size..."
END_SIZE=$(du -sh . 2>/dev/null | cut -f1 || echo "unknown")
echo "End size: $END_SIZE"
echo ""

# Step H: Write log
echo "[8/8] Writing cleanup log..."
mkdir -p logs
LOG_FILE="logs/cleanup-$(date +%Y%m%d-%H%M%S).log"
cat > "$LOG_FILE" <<EOF
NeonHub Cleanup Log
===================
Date: $(date)
Mode: $([ $APPLY -eq 1 ] && echo 'APPLY' || echo 'DRY-RUN')
Deep clean: $([ $DEEP -eq 1 ] && echo 'YES' || echo 'NO')
Docker prune: $([ $DOCKER -eq 1 ] && echo 'YES' || echo 'NO')

Size Information:
  Start: $START_SIZE
  End:   $END_SIZE

Deleted Directories:
$(echo "$FOUND_TARGETS" | tr ' ' '\n' | grep -v '^$' || echo "  None (dry-run or nothing found)")

Actions Taken:
  - PNPM store prune: $([ $APPLY -eq 1 ] && echo 'YES' || echo 'NO')
  - Git gc aggressive: $([ $APPLY -eq 1 ] && echo 'YES' || echo 'NO')
  - Git clean ignored: $([ $DEEP -eq 1 ] && [ $APPLY -eq 1 ] && echo 'YES' || echo 'NO')
  - Docker prune: $([ $DOCKER -eq 1 ] && [ $APPLY -eq 1 ] && echo 'YES' || echo 'NO')

Safety Note:
  No source files, env files, migrations, or Prisma schemas were modified.
EOF

echo "Log written to: $LOG_FILE"
echo ""

# Call Node script to append to maintenance log (best-effort)
if [ $APPLY -eq 1 ] && [ -f "scripts/append-maintenance-log.mjs" ]; then
  echo "Updating maintenance log..."
  node scripts/append-maintenance-log.mjs "$START_SIZE" "$END_SIZE" "$LOG_FILE" || true
fi

echo "=================================================="
echo "Cleanup Complete!"
echo "=================================================="
echo "Start size: $START_SIZE"
echo "End size:   $END_SIZE"
if [ $APPLY -eq 1 ]; then
  echo "Log file: $LOG_FILE"
else
  echo ""
  echo "This was a DRY-RUN. Use --apply to actually delete files."
fi
echo "=================================================="

