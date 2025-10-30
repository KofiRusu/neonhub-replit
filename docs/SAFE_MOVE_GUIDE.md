# Safe Move to /devssd Guide

## Overview

The `scripts/safe-move-to-devssd.sh` script provides enterprise-grade workspace migration with zero data loss, full context preservation, and automated rollback capabilities.

## What It Does

1. **Smart Backup**: Creates timestamped snapshots with integrity manifests
2. **Context Preservation**: Exports all environment configs (conda, venv, Node, Docker)
3. **Selective Sync**: Includes source + .git + venvs, excludes heavy caches
4. **Environment Recreation**: Automatically rebuilds conda/venv on target location
5. **Rollback Safety**: Generates restore scripts for emergency recovery
6. **Disk Space Validation**: Pre-checks available space before any operations

## Prerequisites

- `rsync` (macOS ships with it)
- `git` (for repo detection)
- `/devssd` mount point must exist and be writable
- Sufficient disk space (script validates before proceeding)

## Usage

### Dry Run (Recommended First)

```bash
# Simulate the move without making any changes
DRY_RUN=true ./scripts/safe-move-to-devssd.sh
```

### Actual Move

```bash
# From NeonHub project root
cd /Users/kofirusu/Desktop/NeonHub
./scripts/safe-move-to-devssd.sh
```

## What Gets Preserved

### Always Included
- `.git/` (full history, branches, tags)
- `.venv/` (Python virtual environments)
- All source code (`apps/`, `core/`, `scripts/`, etc.)
- Configuration files (`.cursorrules`, `tsconfig.json`, etc.)
- Documentation (`.md` files)
- Environment templates (`ENV_TEMPLATE.example`)

### Always Excluded (Heavy Caches)
- `node_modules/`
- `.next/`, `out/`, `dist/`, `build/`
- `coverage/`, `.turbo/`, `.cache/`
- `.pytest_cache/`, `__pycache__/`
- `.pnpm-store/`

### Context Exported to `_context/`
- **Versions**: Node, pnpm, Python, pip, conda, Docker
- **Lockfiles**: `pnpm-lock.yaml`, `package.json`, `requirements.txt`, etc.
- **Conda env**: Full export with `--no-builds`
- **Python packages**: `pip freeze` snapshot
- **Docker state**: Container/image/volume listings

## Directory Structure After Move

```
/devssd/NeonHub/
├── backup-20251029-143022/          # Timestamped snapshot
│   ├── _context/                     # Env exports
│   │   ├── VERSIONS.txt
│   │   ├── conda-neonhub_env.yml
│   │   ├── pip-freeze.txt
│   │   ├── pnpm-lock.yaml
│   │   ├── docker-ps-a.txt
│   │   └── ...
│   ├── MANIFEST.sha256               # Integrity checksums
│   ├── RESTORE_FROM_BACKUP.sh        # Auto-generated restore script
│   └── [full repo contents]
└── active/                           # Current working directory
    ├── MANIFEST.sha256
    └── [full repo contents]
```

## Post-Move Workflow

After the script completes, continue development from `/devssd`:

```bash
# 1. Navigate to active workspace
cd /devssd/NeonHub/active

# 2. Activate Python environments (if recreated)
conda activate neonhub_env-devssd
source .venv/bin/activate

# 3. Verify toolchain
node -v && pnpm -v && python -V && pip -V

# 4. Reinstall Node dependencies (excluded from sync)
corepack enable
corepack prepare pnpm@9 --activate
pnpm install --frozen-lockfile

# 5. Regenerate Prisma client
pnpm --filter apps/api prisma generate

# 6. Run standard health checks
pnpm type-check
pnpm lint
pnpm build

# 7. Start development
pnpm dev
```

## Rollback / Restore

If you need to restore from a backup:

```bash
# Option 1: Use auto-generated restore script
cd /devssd/NeonHub/backup-20251029-143022
./RESTORE_FROM_BACKUP.sh

# Option 2: Manual rsync restore
rsync -aHAX --delete --info=progress2 \
  /devssd/NeonHub/backup-20251029-143022/ \
  /devssd/NeonHub/active/

# Option 3: Copy back to original location
rsync -aHAX --info=progress2 \
  /devssd/NeonHub/backup-20251029-143022/ \
  /Users/kofirusu/Desktop/NeonHub/
```

## Integrity Verification

Each backup includes SHA-256 checksums:

```bash
# Verify backup integrity
cd /devssd/NeonHub/backup-20251029-143022
shasum -a 256 -c MANIFEST.sha256

# Verify active workspace integrity
cd /devssd/NeonHub/active
shasum -a 256 -c MANIFEST.sha256
```

## Customization

Edit the script's config section to adjust behavior:

```bash
DEST_MOUNT="/devssd"                  # Change target mount
MANIFEST_EXCLUDES=(...)               # Add more cache dirs to exclude
INCLUDE_VENVS=( ".venv" "venv" )      # Add more venv dirs to include
```

## Safety Features

1. **Pre-flight Checks**: Validates rsync, git, mount point, disk space
2. **Atomic Operations**: Uses rsync's `--delete` safely within controlled paths
3. **Dry-Run Mode**: Test without touching filesystem
4. **Integrity Manifests**: SHA-256 checksums for every file
5. **Auto-Restore Scripts**: Rollback in seconds if needed
6. **No Destructive Defaults**: Original workspace remains untouched

## Troubleshooting

### "Destination mount /devssd not found"
- Ensure external SSD is connected and mounted
- Check `df -h` to verify mount point
- Adjust `DEST_MOUNT` in script if using different path

### "Not enough free space"
- Script calculates required space and fails early
- Free up space on target drive or exclude more directories
- Current repo size: ~1-2 GB without `node_modules`

### Environment recreation fails
- Manual fallback: copy `_context/*.yml` and run:
  ```bash
  conda env create -n neonhub_env-devssd -f _context/conda-neonhub_env.yml
  python -m venv .venv && source .venv/bin/activate
  pip install -r _context/pip-freeze.txt
  ```

### Rsync permission errors
- Ensure you own both source and destination
- May need to run with adjusted umask: `umask 022 && ./script.sh`

## Integration with NeonHub Workflows

After moving to `/devssd`, all existing workflows remain valid:

- **CI/CD**: GitHub Actions unaffected (based on remote repo)
- **Database**: Neon.tech connection works from any location
- **Docker**: Compose files remain valid, rebuild images if needed
- **Scripts**: All `scripts/*` work identically from new location

## Performance Considerations

- **SSD Target**: `/devssd` should be on SSD for optimal dev performance
- **Sync Time**: Initial move ~2-5 minutes depending on repo size
- **Verification**: Integrity checks add ~30 seconds
- **Env Recreation**: conda/venv rebuild adds ~2-3 minutes

## When to Use This Script

✅ **Good Use Cases**:
- Moving to faster external SSD
- Creating bootable backup before risky operations
- Migrating to new machine (export to external drive)
- Disaster recovery preparation
- Performance optimization (faster disk I/O)

❌ **Don't Use For**:
- Regular daily backups (use Git + remote backup)
- CI/CD environments (use Docker images)
- Quick file copies (use `cp` or `rsync` directly)

## Related Documentation

- [DISK_SPACE_CLEANUP_GUIDE.md](/DISK_SPACE_CLEANUP_GUIDE.md) - Free up space before move
- [BACKUP_SUMMARY_20251027.md](/BACKUP_SUMMARY_20251027.md) - Regular backup strategy
- [PYTHON_SETUP.md](/PYTHON_SETUP.md) - Python environment details
- [QUICK_START.md](/QUICK_START.md) - Post-move setup checklist

## Script Maintenance

**Version**: 1.0  
**Last Updated**: 2025-10-29  
**Author**: Kofi Rusu / NeonHub Team  
**License**: MIT (same as NeonHub)

Report issues or suggest improvements via GitHub issues.
