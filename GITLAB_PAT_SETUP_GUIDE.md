# 🔐 GitLab Personal Access Token Setup Guide

**Purpose:** Enable push access to GitLab repository for NeonHub codebase  
**Status:** Required for GitLab integration  
**Date Created:** October 24, 2025

---

## 🎯 Quick Start (5 Minutes)

### Step 1: Create GitLab Personal Access Token

1. **Navigate to GitLab:**
   - Go to: https://gitlab.com/-/profile/personal_access_tokens
   - Or: GitLab → Profile Icon (top-right) → **Preferences** → **Access Tokens**

2. **Configure Token:**
   ```
   Token name: NeonHub Push Token
   Description: Full access token for pushing NeonHub codebase
   Expiration date: 90 days from today (recommended)
   
   Select scopes:
   ☑ api            - Full API access
   ☑ read_api       - Read API
   ☑ read_repository - Read repository
   ☑ write_repository - Write/push to repository
   ☑ read_registry  - Read container registry
   ☑ write_registry - Write container registry (optional)
   ```

3. **Generate Token:**
   - Click **"Create personal access token"**
   - **⚠️ COPY THE TOKEN IMMEDIATELY** - You won't see it again!
   - Save it temporarily in a secure location (password manager recommended)

---

## 📋 Step 2: Create GitLab Repository (If Not Already Created)

### Option A: Via GitLab Web UI

1. **Navigate to:** https://gitlab.com/projects/new
2. **Configure:**
   ```
   Project name: NeonHub
   Project URL: gitlab.com/[your-username]/neonhub
   Visibility: Private (recommended) or Public
   
   Initialize repository with a README: ☐ (uncheck - we're pushing existing code)
   ```
3. **Click:** "Create project"
4. **Copy the repository URL** (shown on next page)

### Option B: Via GitLab CLI (glab)

```bash
# Install glab if not already installed
brew install glab

# Authenticate
glab auth login

# Create repository
glab repo create neonhub --private --description "NeonHub AI Automation Ecosystem"

# Get repository URL
glab repo view --web
```

---

## 🔧 Step 3: Configure Git Remote

Once you have your **GitLab repository URL** and **Personal Access Token**:

```bash
# Navigate to NeonHub directory
cd /Users/kofirusu/Desktop/NeonHub

# Add GitLab as a remote (choose one format)

# Option 1: HTTPS with token embedded (simpler, less secure)
git remote add gitlab https://oauth2:[YOUR_TOKEN]@gitlab.com/[username]/neonhub.git

# Option 2: HTTPS (will prompt for credentials)
git remote add gitlab https://gitlab.com/[username]/neonhub.git

# Option 3: SSH (most secure, requires SSH key setup)
git remote add gitlab git@gitlab.com:[username]/neonhub.git

# Verify remotes
git remote -v
```

**Example with token embedded:**
```bash
git remote add gitlab https://oauth2:glpat-xxxxxxxxxxxxxxxxxxxx@gitlab.com/kofirusu/neonhub.git
```

---

## 🚀 Step 4: Push to GitLab

```bash
# Stage all changes (including untracked files, excluding .DS_Store)
git add --all
git reset HEAD .DS_Store **/.DS_Store

# Create commit
git commit -m "feat: initial GitLab sync - NeonHub v3.2 codebase

- Complete monorepo structure with apps, packages, core modules
- CI/CD workflows and automation scripts
- AI governance, economy, and federation systems
- Comprehensive documentation and reports
- Production-ready deployment configurations"

# Push to GitLab
git push gitlab main

# If this is the first push and main doesn't exist on GitLab:
git push -u gitlab main
```

---

## 🔐 Security Best Practices

### Token Storage

**✅ DO:**
- Store token in Git credential manager
- Use environment variables for automation
- Rotate tokens every 90 days
- Use minimum required scopes
- Revoke immediately if compromised

**❌ DON'T:**
- Commit tokens to code
- Share tokens in chat/email
- Set tokens to never expire
- Use personal tokens for shared/production systems

### Using Git Credential Manager (Recommended)

```bash
# Configure Git to cache credentials
git config --global credential.helper store

# First push will prompt for username and token
# Subsequent pushes will use cached credentials

# Or use macOS Keychain
git config --global credential.helper osxkeychain
```

---

## 🔄 Maintaining Multiple Remotes (GitHub + GitLab)

Your current setup after adding GitLab:

```bash
origin  https://github.com/NeonHub3A/neonhub.git (fetch/push)
v3      https://github.com/KofiRusu/NeonHub-v3.0.git (fetch/push)
v4.7    https://github.com/KofiRusu/Neon-v4.7.git (fetch/push)
gitlab  https://gitlab.com/[username]/neonhub.git (fetch/push)
```

### Push to All Remotes Simultaneously

```bash
# Option 1: Push to specific remote
git push origin main
git push gitlab main

# Option 2: Add "all" remote that pushes to multiple locations
git remote add all https://github.com/NeonHub3A/neonhub.git
git remote set-url --add --push all https://github.com/NeonHub3A/neonhub.git
git remote set-url --add --push all https://gitlab.com/[username]/neonhub.git

# Now push to both with one command
git push all main
```

### Create Git Alias for Multi-Push

```bash
# Add to ~/.gitconfig
git config --global alias.pushall '!git push origin main && git push gitlab main'

# Usage
git pushall
```

---

## 🐛 Troubleshooting

### Issue: "Authentication failed"
**Fix:**
```bash
# Verify token is correct
# Re-add remote with correct token format
git remote remove gitlab
git remote add gitlab https://oauth2:[YOUR_TOKEN]@gitlab.com/[username]/neonhub.git
```

### Issue: "Repository not found"
**Causes:**
- Repository doesn't exist on GitLab
- Username/repo name is incorrect
- Token doesn't have repository access

**Fix:**
```bash
# Verify repository exists
glab repo view [username]/neonhub

# Or visit https://gitlab.com/[username]/neonhub directly
```

### Issue: "Failed to push some refs"
**Cause:** Remote has commits you don't have locally

**Fix:**
```bash
# Pull and merge first
git pull gitlab main --allow-unrelated-histories

# Then push
git push gitlab main
```

### Issue: "Large files rejected"
**Cause:** GitLab has file size limits (default 100MB)

**Fix:**
```bash
# Check for large files
find . -type f -size +50M

# Use Git LFS for large files
git lfs install
git lfs track "*.large-extension"
git add .gitattributes
git commit -m "chore: add Git LFS tracking"
```

---

## 📊 Verification Checklist

After setup, verify:

- [ ] GitLab repository created
- [ ] Personal access token generated and saved securely
- [ ] Git remote 'gitlab' added (`git remote -v`)
- [ ] Changes committed (`git status` shows clean working tree)
- [ ] Successfully pushed to GitLab (`git push gitlab main`)
- [ ] Code visible on GitLab web interface
- [ ] Token saved in credential manager (won't prompt on next push)
- [ ] Calendar reminder set for token rotation (90 days)

---

## 📦 What Gets Pushed to GitLab

Based on current repository state, the push will include:

### Modified Files (8 files)
- `.github/workflows/*.yml` - CI/CD workflow updates
- `apps/web/next.config.ts` - Next.js configuration
- `core/qa-sentinel/package.json` - QA dependencies
- `package.json` - Root package configuration

### New Files (20+ files)
- `WORKFLOW_FIXES_COMPLETION_REPORT.md`
- `apps/api/src/services/brandVoiceOptimizer.service.ts`
- `core/qa-sentinel/scripts/*`
- `packages/*` - New package additions
- Various reports in `reports/` directory

### Excluded Files (via .gitignore)
- `.DS_Store` files (macOS metadata)
- `node_modules/` directories
- Build artifacts (`dist/`, `.next/`)
- Environment files (`.env`, `secrets/`)

---

## 🔄 Token Rotation Schedule

| Action | Frequency | Next Due |
|--------|-----------|----------|
| Review token usage | Monthly | [Set reminder] |
| Rotate token | Every 90 days | [Token expiry date] |
| Audit permissions | Quarterly | [Set reminder] |

**To rotate:**
1. Create new PAT (Step 1)
2. Update Git remote with new token
3. Test push to verify
4. Revoke old token at https://gitlab.com/-/profile/personal_access_tokens

---

## 🎯 Alternative: SSH Key Setup (More Secure)

If you prefer SSH over HTTPS with embedded tokens:

### 1. Generate SSH Key
```bash
# Generate new SSH key
ssh-keygen -t ed25519 -C "your.email@example.com" -f ~/.ssh/gitlab_neonhub

# Start SSH agent
eval "$(ssh-agent -s)"

# Add key to agent
ssh-add ~/.ssh/gitlab_neonhub
```

### 2. Add Public Key to GitLab
```bash
# Copy public key
cat ~/.ssh/gitlab_neonhub.pub | pbcopy

# Navigate to: https://gitlab.com/-/profile/keys
# Paste key and save
```

### 3. Configure Git Remote
```bash
# Remove HTTPS remote
git remote remove gitlab

# Add SSH remote
git remote add gitlab git@gitlab.com:[username]/neonhub.git

# Configure SSH
cat << EOF >> ~/.ssh/config
Host gitlab.com
  HostName gitlab.com
  User git
  IdentityFile ~/.ssh/gitlab_neonhub
EOF

# Test connection
ssh -T git@gitlab.com
```

---

## 📖 Additional Resources

- **GitLab PAT Documentation:** https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html
- **GitLab SSH Keys:** https://docs.gitlab.com/ee/user/ssh.html
- **GitLab Push Options:** https://docs.gitlab.com/ee/user/project/push_options.html
- **Git Credential Storage:** https://git-scm.com/docs/gitcredentials

---

## 🎊 Ready to Push!

Once you've completed Steps 1-3, you'll be able to push your NeonHub codebase to GitLab and maintain it alongside your GitHub repositories.

**Next Steps After Push:**
1. Verify code on GitLab web interface
2. Set up GitLab CI/CD (optional - can mirror your GitHub Actions)
3. Configure repository settings (branch protection, merge requests)
4. Add collaborators if working with a team

---

**🚀 Your NeonHub codebase will be safely backed up on GitLab!**

