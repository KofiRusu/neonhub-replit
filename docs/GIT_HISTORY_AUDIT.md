# Git History Audit - Large Files & LFS Migration

This guide helps you identify large files in git history and migrate them to Git LFS (Large File Storage) to keep your repository lean.

---

## 🔍 Why Audit Git History?

Even if you delete large files from the current branch, they remain in git history, making clones slow and consuming disk space. This audit identifies:

- Large binary files (images, videos, PDFs)
- Build artifacts accidentally committed
- Database dumps or backups
- Compressed archives (`.zip`, `.tar.gz`)

---

## 📊 Find Largest Files in History

### Top 50 Largest Blobs

Run this command to list the 50 largest files ever committed:

```bash
git rev-list --objects --all \
| git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
| awk '$1=="blob"{print $3"\t"$4}' \
| sort -nr | head -n 50
```

Output format: `SIZE_IN_BYTES  PATH`

Example output:
```
52428800    videos/demo.mp4
10485760    designs/mockup.psd
5242880     assets/archive.zip
```

### All Files Over 1 MB

```bash
git rev-list --objects --all \
| git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
| awk '$1=="blob" && $3 > 1048576 {print $3"\t"$4}' \
| sort -nr
```

### Find Specific File Types

```bash
# Find all .mp4 files in history
git rev-list --objects --all | grep '\.mp4$'

# Find all .psd files with sizes
git rev-list --objects --all \
| git cat-file --batch-check='%(objecttype) %(objectname) %(objectsize) %(rest)' \
| awk '$1=="blob" && $4 ~ /\.psd$/ {print $3"\t"$4}' \
| sort -nr
```

---

## 🎯 Git LFS Migration Strategy

**IMPORTANT:** Git LFS prevents **future** large files from bloating the repository. It does NOT remove existing files from history.

### Step 1: Install Git LFS

```bash
# macOS
brew install git-lfs

# Ubuntu/Debian
sudo apt-get install git-lfs

# Windows
# Download from https://git-lfs.github.com/

# Initialize LFS in your repo
cd /path/to/NeonHub
git lfs install
```

### Step 2: Track Large File Types

Based on your audit, track file patterns:

```bash
# Videos
git lfs track "*.mp4" "*.mov" "*.avi"

# Images (large formats)
git lfs track "*.psd" "*.ai" "*.sketch"

# Archives
git lfs track "*.zip" "*.tar.gz" "*.7z"

# Database dumps
git lfs track "*.sql" "*.dump"

# PDFs
git lfs track "*.pdf"
```

This creates `.gitattributes` entries:

```
*.mp4 filter=lfs diff=lfs merge=lfs -text
*.psd filter=lfs diff=lfs merge=lfs -text
*.zip filter=lfs diff=lfs merge=lfs -text
```

### Step 3: Commit .gitattributes

```bash
git add .gitattributes
git commit -m "chore: configure Git LFS for large file types"
git push
```

### Step 4: Add New Large Files

From now on, new files matching these patterns use LFS automatically:

```bash
# Add a video (will use LFS)
cp ~/Downloads/demo.mp4 assets/
git add assets/demo.mp4
git commit -m "Add demo video"
git push
```

Verify LFS is tracking:

```bash
git lfs ls-files
```

---

## ⚠️ History Rewrite (Advanced - Use with Caution!)

**WARNING:** Rewriting history is **destructive** and requires coordination with all team members.

### Before You Start

- ✅ **Backup the repository** (`git clone --mirror`)
- ✅ **Notify all team members** (no pushes during rewrite)
- ✅ **Create a backup branch** (`git branch backup-before-filter main`)
- ✅ **Have a rollback plan**

### Option 1: BFG Repo-Cleaner (Recommended)

BFG is faster and safer than `git filter-branch`:

```bash
# Install BFG
brew install bfg  # macOS
# Or download from https://rtyley.github.io/bfg-repo-cleaner/

# Create fresh clone
git clone --mirror https://github.com/YourOrg/NeonHub.git
cd NeonHub.git

# Remove files larger than 50MB
bfg --strip-blobs-bigger-than 50M

# Or remove specific files
bfg --delete-files '*.mp4'
bfg --delete-files '*.psd'

# Clean up
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Force push (DANGER!)
git push --force
```

### Option 2: git-filter-repo (Modern Tool)

```bash
# Install git-filter-repo
pip3 install git-filter-repo

# Create fresh clone
git clone https://github.com/YourOrg/NeonHub.git NeonHub-clean
cd NeonHub-clean

# Remove paths
git filter-repo --path-glob '*.mp4' --invert-paths
git filter-repo --path-glob '*.psd' --invert-paths

# Force push (DANGER!)
git remote add origin https://github.com/YourOrg/NeonHub.git
git push --force --all
git push --force --tags
```

### After History Rewrite

All team members must:

```bash
# Delete old local repo
cd ~/projects
rm -rf NeonHub

# Fresh clone
git clone https://github.com/YourOrg/NeonHub.git
cd NeonHub

# Verify size
du -sh .git
```

---

## 🛡️ Preventing Future Issues

### 1. Add Pre-Commit Hooks

Reject large files before commit:

```bash
# In .git/hooks/pre-commit or use Husky
#!/bin/bash
MAX_SIZE=10485760  # 10 MB

large_files=$(git diff --cached --name-only | xargs -I {} sh -c '[ -f {} ] && [ $(wc -c < {}) -gt '$MAX_SIZE' ] && echo {}')

if [ -n "$large_files" ]; then
  echo "❌ Error: The following files are too large (> 10 MB):"
  echo "$large_files"
  echo ""
  echo "Consider using Git LFS: git lfs track '*.ext'"
  exit 1
fi
```

### 2. Update .gitignore

Prevent accidental commits:

```gitignore
# Large artifacts
*.mp4
*.mov
*.avi
*.psd
*.ai
*.sketch
*.zip
*.tar.gz
*.sql
*.dump

# Database
*.sqlite
*.db

# Logs
*.log
```

### 3. Regular Audits

Schedule monthly audits:

```bash
# Add to crontab or CI/CD
bash scripts/git-history-audit.sh > logs/git-audit-$(date +%Y%m%d).txt
```

---

## 📋 Audit Checklist

- [ ] Run largest blobs query
- [ ] Identify file types over 1 MB
- [ ] Configure Git LFS for those types
- [ ] Commit `.gitattributes`
- [ ] Add pre-commit hooks
- [ ] Update `.gitignore`
- [ ] Document LFS patterns in team wiki
- [ ] (Optional) Plan history rewrite if needed
- [ ] (Optional) Backup before rewrite
- [ ] (Optional) Notify team before rewrite

---

## 📚 LFS Status Commands

```bash
# View LFS-tracked files
git lfs ls-files

# View LFS patterns
cat .gitattributes | grep lfs

# Show LFS storage usage
git lfs du

# Fetch LFS objects
git lfs fetch --all

# Prune old LFS objects
git lfs prune
```

---

## 🆘 Troubleshooting

### "This exceeds GitHub's file size limit of 100 MB"

Solution: Use Git LFS

```bash
git lfs track "large-file.zip"
git add .gitattributes large-file.zip
git commit -m "Move large file to LFS"
```

### "error: failed to push some refs"

If you already committed a large file:

```bash
# Remove from last commit
git rm --cached large-file.zip
git lfs track "large-file.zip"
git add large-file.zip
git commit --amend -m "Move large file to LFS"
git push --force-with-lease
```

### Clone is Very Slow

Check repository size:

```bash
# Total size
du -sh .git

# Unpacked size
git count-objects -vH
```

If over 500 MB, consider:
1. Git LFS for future files
2. History rewrite for past files
3. Shallow clones (`git clone --depth 1`)

---

## 📖 Resources

- [Git LFS Official Docs](https://git-lfs.github.com/)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo](https://github.com/newren/git-filter-repo)
- [GitHub LFS Pricing](https://docs.github.com/en/billing/managing-billing-for-git-large-file-storage)

---

**Last Updated:** October 27, 2025  
**Audit Version:** 1.0  
**Next Audit:** Monthly or before major releases

