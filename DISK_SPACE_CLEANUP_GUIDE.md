# 🚨 Disk Space Cleanup Guide

## Critical Issue Detected

**Current Disk Usage:** 204 GB / 228 GB (100% full, only 152 MB available)

This is **blocking all Phase 4 verification** because:
- Cannot install npm dependencies (needs ~2-3 GB)
- Cannot run tests
- Cannot start applications
- Cannot proceed with any verification steps

---

## 🎯 Quick Cleanup Steps (Ordered by Impact)

### 1. Empty Trash (Easiest, High Impact)
```bash
# macOS: Empty Trash
# Go to Finder → Empty Trash
# Or command:
rm -rf ~/.Trash/*
```
**Expected Recovery:** 1-10 GB (varies)

---

### 2. Clear System Caches (Safe, Medium Impact)
```bash
# Clear user caches
rm -rf ~/Library/Caches/*

# Clear npm cache
npm cache clean --force

# Clear Homebrew cache (if installed)
brew cleanup -s

# Clear CocoaPods cache (if used)
rm -rf ~/Library/Caches/CocoaPods
```
**Expected Recovery:** 500 MB - 2 GB

---

### 3. Remove Old node_modules (High Impact)
```bash
# Find all node_modules directories
find ~/Desktop -type d -name "node_modules" -prune 2>/dev/null

# Remove them (be careful!)
find ~/Desktop -type d -name "node_modules" -prune -exec rm -rf {} +

# Or just in NeonHub
cd /Users/kofirusu/Desktop/NeonHub
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf core/*/node_modules
rm -rf modules/*/node_modules
rm -rf packages/*/node_modules
```
**Expected Recovery:** 1-5 GB

---

### 4. Docker Cleanup (if Docker installed)
```bash
# Remove all stopped containers
docker container prune -a

# Remove unused images
docker image prune -a

# Remove volumes
docker volume prune

# Nuclear option: clean everything
docker system prune -a --volumes
```
**Expected Recovery:** 5-20 GB (if Docker is used heavily)

---

### 5. Find and Remove Large Files
```bash
# Find files larger than 100 MB in your home directory
find ~ -type f -size +100M -exec ls -lh {} \; 2>/dev/null | awk '{print $9, $5}'

# Find largest directories in home
du -sh ~/* 2>/dev/null | sort -h | tail -20

# Check Downloads folder
du -sh ~/Downloads/* 2>/dev/null | sort -h | tail -20

# Common large file locations:
# - ~/Downloads
# - ~/Library/Caches
# - ~/.npm
# - ~/.cache
# - ~/Desktop
```

---

### 6. Remove Old Applications (Manual)
```bash
# List installed applications by size
du -sh /Applications/* 2>/dev/null | sort -h | tail -20

# Uninstall apps you don't use via Finder
# Move to Trash, then empty Trash
```
**Expected Recovery:** Varies (500 MB - 10 GB per app)

---

### 7. Clear Logs (Safe, Low Impact)
```bash
# System logs
sudo rm -rf /private/var/log/*

# Application logs
rm -rf ~/Library/Logs/*
```
**Expected Recovery:** 100 MB - 500 MB

---

### 8. Remove Old iOS/Xcode Simulators (if Xcode installed)
```bash
# Remove unavailable simulators
xcrun simctl delete unavailable

# List all simulators
xcrun simctl list

# Delete specific simulator
xcrun simctl delete <UUID>

# Remove derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Remove device support
rm -rf ~/Library/Developer/Xcode/iOS\ DeviceSupport
```
**Expected Recovery:** 5-30 GB

---

## 🔍 Diagnostic Commands

### Check Disk Usage
```bash
# Overall disk space
df -h

# Largest directories in home
du -sh ~/* | sort -h | tail -20

# Disk usage by user directories
du -sh ~/Desktop ~/Downloads ~/Documents ~/Library 2>/dev/null
```

### Find Disk Hogs
```bash
# Largest files in home directory
find ~ -type f -size +500M -exec ls -lh {} \; 2>/dev/null

# Largest directories
ncdu ~  # if installed (brew install ncdu)
# Or use:
du -h ~ | sort -h | tail -50
```

---

## ⚡ Recommended Cleanup Order

For fastest results, do these in order:

1. **Empty Trash** (2 minutes)
   - Go to Finder → Empty Trash

2. **Clear npm cache** (1 minute)
   ```bash
   npm cache clean --force
   ```

3. **Remove NeonHub node_modules** (2 minutes)
   ```bash
   cd /Users/kofirusu/Desktop/NeonHub
   rm -rf node_modules apps/*/node_modules core/*/node_modules
   ```

4. **Clear system caches** (5 minutes)
   ```bash
   rm -rf ~/Library/Caches/*
   ```

5. **Docker cleanup** (if installed, 5 minutes)
   ```bash
   docker system prune -a --volumes
   ```

6. **Check Downloads folder** (manual, 5 minutes)
   - Remove old downloads you don't need

7. **Verify space freed** (1 minute)
   ```bash
   df -h
   ```

**Total Time:** ~20 minutes  
**Expected Recovery:** 5-20 GB

---

## ✅ Success Criteria

After cleanup, verify you have sufficient space:

```bash
df -h /

# You should see:
# - At least 3 GB free for npm install
# - Ideally 5-10 GB free for comfortable development
```

---

## 🚀 After Cleanup: Resume Verification

Once you have freed up space, continue with Phase 4 verification:

```bash
# 1. Install dependencies
cd /Users/kofirusu/Desktop/NeonHub
npm install

# 2. Verify installation
cd apps/api
npm list jest  # Should show jest version

# 3. Run tests
npm run test:coverage

# 4. Continue with verification steps in PHASE_4_VERIFICATION_STATUS.md
```

---

## 📊 Current Project Size Estimate

NeonHub project with full dependencies:
- Source code: ~50 MB
- node_modules (root): ~500 MB
- node_modules (all workspaces): ~1.5 GB
- Build artifacts: ~200 MB
- **Total:** ~2.3 GB

**Minimum disk space needed:** 3 GB (for buffer)  
**Recommended disk space:** 10 GB

---

## 🆘 If Problems Persist

### Option 1: Use a Different Location
```bash
# Move project to external drive or location with more space
mv /Users/kofirusu/Desktop/NeonHub /Volumes/ExternalDrive/NeonHub
cd /Volumes/ExternalDrive/NeonHub
```

### Option 2: Use Docker Development Environment
```bash
# Run development in Docker container (disk usage is isolated)
docker run -it --rm \
  -v $(pwd):/app \
  -w /app \
  node:20 \
  bash
```

### Option 3: Cloud Development Environment
- Use GitHub Codespaces
- Use GitPod
- Use Cloud9

---

## 📞 Need Help?

If you're unable to free up space:

1. **Check for large files:**
   ```bash
   find ~ -type f -size +1G 2>/dev/null
   ```

2. **Check what's using space:**
   ```bash
   du -sh ~/* | sort -h | tail -30
   ```

3. **Get detailed storage breakdown:**
   - Go to **Apple Menu** → **About This Mac** → **Storage**
   - Click **Manage** for recommendations

---

**Generated:** October 25, 2025  
**Critical Issue:** Disk 100% full (204 GB / 228 GB)  
**Required Action:** Free up minimum 3 GB before proceeding

