#!/usr/bin/env bash
# === Neon(FT) Safe Move + Backup to /devssd ==================================
# What it does (in order):
# 1) Detect repo root, create timestamped backup + new active workspace on /devssd
# 2) Export dev context (conda env, venv, Python/Node/Docker versions, lockfiles)
# 3) Rsync all valuable source + .git, include venvs, exclude heavy caches
# 4) (Optional) Recreate conda env + venv on /devssd
# 5) Write RESTORE script & integrity manifests
# 6) Print next-steps to continue development from /devssd
# =============================================================================

set -euo pipefail

# --- Config (edit if needed) ---
DEST_MOUNT="${DEST_MOUNT:-/Volumes/devssd}"  # macOS default, override with env var
PROJECT_NAME="$(basename "$(pwd)")"
TIMESTAMP="$(date +'%Y%m%d-%H%M%S')"
DEST_BASE="${DEST_MOUNT}/${PROJECT_NAME}"
BACKUP_DIR="${DEST_BASE}/backup-${TIMESTAMP}"
ACTIVE_DIR="${DEST_BASE}/active"
MANIFEST_EXCLUDES=( "node_modules" ".next" "out" "dist" "build" "coverage" ".turbo" ".cache" ".pytest_cache" "__pycache__" ".pnpm-store" )
INCLUDE_VENVS=( ".venv" )   # add other venv folders if you have them
DRY_RUN="${DRY_RUN:-false}" # set DRY_RUN=true to simulate

# --- Sanity checks ---
command -v rsync >/dev/null || { echo "rsync is required."; exit 1; }
command -v git   >/dev/null || { echo "git is required.";   exit 1; }
[ -d "$DEST_MOUNT" ] || { echo "Destination mount ${DEST_MOUNT} not found."; exit 1; }

# Repo root
REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [ -z "${REPO_ROOT}" ]; then
  echo "Not inside a git repo. Move to your project root and re-run."
  exit 1
fi
cd "$REPO_ROOT"

# Disk space check
NEEDED_KB="$(du -sk . | awk '{print $1}')"
FREE_KB="$(df -k "${DEST_MOUNT}" | awk 'NR==2 {print $4}')"
if [ "$FREE_KB" -lt "$NEEDED_KB" ]; then
  echo "Not enough free space on ${DEST_MOUNT}. Needed: ${NEEDED_KB} KB, Free: ${FREE_KB} KB."
  exit 1
fi

echo "==> Preparing destinations:"
echo "Backup: ${BACKUP_DIR}"
echo "Active: ${ACTIVE_DIR}"
$DRY_RUN || mkdir -p "${BACKUP_DIR}" "${ACTIVE_DIR}"

# --- Capture development context ---
echo "==> Capturing development context"
CONTEXT_DIR="${BACKUP_DIR}/_context"
if ! $DRY_RUN; then
  mkdir -p "${CONTEXT_DIR}"
  
  # Versions & tools
  {
    echo "# Versions @ ${TIMESTAMP}"
    (command -v python && python -V) || true
    (command -v pyenv  && pyenv -v) || true
    (command -v conda  && conda --version) || true
    (command -v pip    && pip -V) || true
    (command -v node   && node -v) || true
    (command -v pnpm   && pnpm -v) || true
    (command -v npm    && npm -v) || true
    (command -v bun    && bun -v) || true
    (command -v docker && docker -v) || true
  } > "${CONTEXT_DIR}/VERSIONS.txt" 2>&1 || true
  
  # Lockfiles & package manifests
  for f in package.json pnpm-lock.yaml package-lock.json bun.lockb requirements.txt pyproject.toml poetry.lock Pipfile Pipfile.lock environment.yml; do
    [ -f "$f" ] && cp -p "$f" "${CONTEXT_DIR}/" || true
  done
else
  echo "   (Skipped in dry-run mode)"
fi

# Export conda env if active
if ! $DRY_RUN && command -v conda >/dev/null 2>&1; then
  echo "   -> Detecting conda environment..."
  # Detect current env name (suppress all output, handle errors gracefully)
  CONDA_ENV_NAME="$(conda info --json 2>/dev/null | python -c 'import json,sys,os; info=json.load(sys.stdin) if sys.stdin else {}; print(os.path.basename(info.get("active_prefix","")) if info.get("active_prefix") else "")' 2>/dev/null || echo "")"
  # Skip base and anaconda3 environments (too large, system-managed)
  if [ -n "$CONDA_ENV_NAME" ] && [ "$CONDA_ENV_NAME" != "base" ] && [ "$CONDA_ENV_NAME" != "anaconda3" ]; then
    echo "   -> Exporting conda env: $CONDA_ENV_NAME (with 30s timeout)"
    ( timeout 30 conda env export --no-builds -n "$CONDA_ENV_NAME" > "${CONTEXT_DIR}/conda-${CONDA_ENV_NAME}.yml" 2>/dev/null || echo "   -> (conda export timed out, skipping)" )
  else
    echo "   -> System conda env detected ($CONDA_ENV_NAME), skipping export"
  fi
fi

# Export pip freeze (current interpreter)
if ! $DRY_RUN && command -v pip >/dev/null 2>&1; then
  echo "   -> Capturing pip packages..."
  pip freeze > "${CONTEXT_DIR}/pip-freeze.txt" 2>/dev/null || true
fi

# Docker inventories (lists only; images not saved to tar by default)  
if ! $DRY_RUN && command -v docker >/dev/null 2>&1; then
  echo "   -> Skipping Docker state (optional, can hang if daemon not running)"
  # Docker commands can hang indefinitely if daemon not responding
  # Users can manually export if needed: docker ps -a, docker images, docker volume ls
fi

# --- Build rsync filters ---
echo "==> Building rsync filters"
RSYNC_EXCLUDES=()
for e in "${MANIFEST_EXCLUDES[@]}"; do RSYNC_EXCLUDES+=( "--exclude=${e}" ); done

# Always include .git and venvs
RSYNC_INCLUDES=( "--include=.git/**" )
for v in "${INCLUDE_VENVS[@]}"; do RSYNC_INCLUDES+=( "--include=${v}/**" ); done
RSYNC_INCLUDES+=( "--include=*/" "--exclude=*" )

# --- Perform backup snapshot (exact copy with excludes) ---
echo "==> Creating backup snapshot"
echo "    This will take 2-5 minutes depending on repo size..."
echo "    Progress will update as files transfer."
# macOS rsync is older, use compatible flags: -a (archive), -H (hard links), --delete
RSYNC_BASE=( rsync -aH --numeric-ids --delete )
# Check if rsync supports progress info (newer versions)
if rsync --help 2>&1 | grep -q -- --info; then
  RSYNC_BASE+=( --info=progress2 )
else
  RSYNC_BASE+=( --progress )
fi
$DRY_RUN && RSYNC_BASE+=( -n )
"${RSYNC_BASE[@]}" "${RSYNC_EXCLUDES[@]}" "$REPO_ROOT/" "${BACKUP_DIR}/"

# --- Promote to active workspace on /devssd ---
echo "==> Promoting to active workspace"
echo "    Syncing to active directory (2-5 minutes)..."
# Clear ACTIVE_DIR (safe: only inside DEST_BASE)
if [ -d "${ACTIVE_DIR}" ]; then
  $DRY_RUN || find "${ACTIVE_DIR}" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
fi
# Copy from backup to active but prioritize includes (.git, venvs, source)
"${RSYNC_BASE[@]}" "${RSYNC_EXCLUDES[@]}" "$REPO_ROOT/" "${ACTIVE_DIR}/"

# --- Integrity manifests (exclude heavy caches) ---
echo "==> Writing integrity manifests"
echo "    Calculating SHA-256 checksums (30-60 seconds)..."
MANIFEST() {
  local root="$1"; local out="$2"
  local -a find_cmd=( find "$root" -type f )
  for e in "${MANIFEST_EXCLUDES[@]}"; do find_cmd+=( -not -path "*/${e}/*" ); done
  "${find_cmd[@]}" -print0 | xargs -0 shasum -a 256 > "$out" || true
}
$DRY_RUN || MANIFEST "${BACKUP_DIR}" "${BACKUP_DIR}/MANIFEST.sha256"
$DRY_RUN || MANIFEST "${ACTIVE_DIR}" "${ACTIVE_DIR}/MANIFEST.sha256"

# --- Optional: Recreate conda env & venv on /devssd ---
echo "==> (Optional) Recreating envs on /devssd"
# Conda
if command -v conda >/dev/null 2>&1 && [ -n "${CONDA_ENV_NAME:-}" ] && [ -f "${CONTEXT_DIR}/conda-${CONDA_ENV_NAME}.yml" ]; then
  echo "   -> conda env: ${CONDA_ENV_NAME}-devssd"
  $DRY_RUN || conda env remove -n "${CONDA_ENV_NAME}-devssd" -y >/dev/null 2>&1 || true
  $DRY_RUN || conda env create -n "${CONDA_ENV_NAME}-devssd" -f "${CONTEXT_DIR}/conda-${CONDA_ENV_NAME}.yml" || true
fi
# Python venv
if [ -f "${CONTEXT_DIR}/pip-freeze.txt" ]; then
  echo "   -> python venv: ${ACTIVE_DIR}/.venv"
  if $DRY_RUN; then :
  else
    python -m venv "${ACTIVE_DIR}/.venv" || true
    # shellcheck disable=SC1091
    [ -f "${ACTIVE_DIR}/.venv/bin/activate" ] && source "${ACTIVE_DIR}/.venv/bin/activate"
    pip install --upgrade pip >/dev/null 2>&1 || true
    pip install -r "${CONTEXT_DIR}/pip-freeze.txt" || true
  fi
fi

# --- Create restore script ---
echo "==> Creating RESTORE_FROM_BACKUP.sh"
RESTORE="${BACKUP_DIR}/RESTORE_FROM_BACKUP.sh"
$DRY_RUN || cat > "${RESTORE}" <<'SH'
#!/usr/bin/env bash
set -euo pipefail
BACKUP_DIR="$(cd "$(dirname "$0")" && pwd)"
ACTIVE_DIR="$(dirname "$BACKUP_DIR")/active"
echo "Restoring from: $BACKUP_DIR -> $ACTIVE_DIR"
mkdir -p "$ACTIVE_DIR"
# macOS-compatible rsync flags
if rsync --help 2>&1 | grep -q -- --info; then
  rsync -aH --delete --info=progress2 "$BACKUP_DIR"/ "$ACTIVE_DIR"/
else
  rsync -aH --delete --progress "$BACKUP_DIR"/ "$ACTIVE_DIR"/
fi
echo "Restore complete."
SH
$DRY_RUN || chmod +x "${RESTORE}"

# --- Final summary & next steps ---
cat <<EOF

✅ Move completed.

• Backup snapshot:  ${BACKUP_DIR}
• Active workspace: ${ACTIVE_DIR}
• Context files:    ${BACKUP_DIR}/_context/*
• Restore script:   ${BACKUP_DIR}/RESTORE_FROM_BACKUP.sh

Next steps to continue work from /devssd:

1) cd "${ACTIVE_DIR}"
2) (Optional) Activate conda env created above:
   conda activate "${CONDA_ENV_NAME:-your-env}-devssd"  # if created
3) (Optional) Activate Python venv:
   source .venv/bin/activate
4) Verify tools:
   node -v && pnpm -v && python -V && pip -V
5) Run your usual commands (typecheck/lint/build/test, prisma, etc.)

Tip: Set DRY_RUN=true to simulate before executing.
EOF
