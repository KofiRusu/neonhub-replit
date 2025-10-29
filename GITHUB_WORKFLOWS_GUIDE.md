# 📱 GitHub Workflows - Visual Navigation Guide

**For**: Finding and running your DB Deploy workflow  
**Date**: 2025-10-27  
> ⚠️ Local audit (2025-10-27) could not execute the database workflows. Ensure secrets (`DATABASE_URL`, `DIRECT_DATABASE_URL`) are configured and pnpm install succeeds before relying on this guide.

---

## 🎯 Step-by-Step Visual Guide

### Step 1: Navigate to Actions Page

**URL**: https://github.com/NeonHub3A/neonhub/actions

```
┌─────────────────────────────────────────────────────────────────┐
│ [NeonHub3A] / neonhub                                           │
├─────────────────────────────────────────────────────────────────┤
│  <> Code    Issues    Pull requests    [Actions]    ...         │
└─────────────────────────────────────────────────────────────────┘
```

**What you'll see**:
- Top navigation bar with tabs: Code, Issues, Pull requests, **Actions**
- Click **Actions** tab

---

### Step 2: Workflow Sidebar (Left Side)

Once on Actions page, look at the **left sidebar**:

```
┌──────────────────────────┐  ┌────────────────────────────┐
│  All workflows           │  │  Recent workflow runs      │
│                          │  │                            │
│  📋 CI                   │  │  [Run workflow ▼]         │
│  🔧 Codex Auto-Fix       │  │                            │
│  💾 DB Backup            │  │  ✅ CI - #123             │
│  🚀 DB Deploy            │  │  ⏳ DB Drift Check - #45  │
│  🔍 DB Drift Check       │  │  ❌ Security - #12        │
│  📊 DB Migrate Diff      │  │                            │
│  🔄 DB Restore           │  │                            │
│  🛡️ Security Preflight   │  │                            │
│  ...                     │  │                            │
└──────────────────────────┘  └────────────────────────────┘
```

**If you DON'T see these workflows**:
- Check the branch filter (top of page)
- Select branch: `ci/codex-autofix-and-heal`
- Workflows are branch-specific!

---

### Step 3: Click "DB Deploy"

Click on **"DB Deploy"** in the left sidebar:

```
┌────────────────────────────────────────────────────────────────┐
│  DB Deploy                                     [Run workflow ▼] │
├────────────────────────────────────────────────────────────────┤
│  This workflow runs database migrations with approval gates    │
│                                                                 │
│  Recent runs:                                                   │
│  [ No runs yet - click "Run workflow" to start ]              │
└────────────────────────────────────────────────────────────────┘
```

---

### Step 4: Click "Run workflow" Button

**Location**: Top right of the page (green button)

```
┌────────────────────────────────────────────────────────────────┐
│  DB Deploy                                [Run workflow ▼]      │
└────────────────────────────────────────────────────────────────┘
                                                     ↑
                                              Click this!
```

A dropdown will appear:

```
┌────────────────────────────────────────┐
│  Run workflow                          │
├────────────────────────────────────────┤
│  Branch: [ci/codex-autofix-and-heal ▼]│
│                                        │
│  RUN_SEED                              │
│  Run seed after migrate                │
│  [true ▼]                             │
│                                        │
│  [Run workflow]                       │
└────────────────────────────────────────┘
```

---

### Step 5: Configure and Run

**Configuration**:

1. **Branch**: Select `ci/codex-autofix-and-heal`
   - This is where your workflows are
   - Don't use `main` yet

2. **RUN_SEED**: 
   - `true` = Seeds database with test data (staging)
   - `false` = No seeding (production)

3. Click green **"Run workflow"** button

---

### Step 6: Monitor Progress

After clicking, you'll see:

```
┌────────────────────────────────────────────────────────────────┐
│  DB Deploy                                                      │
├────────────────────────────────────────────────────────────────┤
│  Recent runs:                                                   │
│                                                                 │
│  ⏳ DB Deploy #1                                    just now    │
│     ci/codex-autofix-and-heal                       username    │
│     [In progress...]                                            │
└────────────────────────────────────────────────────────────────┘
```

**Click on the run** to see detailed logs:

```
┌────────────────────────────────────────────────────────────────┐
│  DB Deploy #1                                      ⏳ In progress│
├────────────────────────────────────────────────────────────────┤
│  Jobs:                                                          │
│    db-deploy                                                    │
│      ✅ Checkout                                                │
│      ✅ Setup Node                                              │
│      ✅ Install pnpm                                            │
│      ✅ Install deps                                            │
│      ⏳ Generate Prisma Client                                  │
│      ⏹️ Verify DB connectivity                                  │
│      ⏹️ Apply migrations (deploy)                              │
│      ⏹️ Seed database                                           │
└────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Troubleshooting: Can't Find Workflows?

### Issue 1: Branch Filter

**Problem**: Workflows don't show up in left sidebar

**Solution**:
```
┌────────────────────────────────────────┐
│  Branches: [all branches ▼]           │
│            [ Filter branches... ]      │
│                                        │
│  ☑ all branches                       │
│  ☐ ci/codex-autofix-and-heal          │
│  ☐ main                                │
└────────────────────────────────────────┘
```

Change filter to show `ci/codex-autofix-and-heal` branch!

---

### Issue 2: No "Run workflow" Button

**Problem**: Can't see the button

**Reasons**:
1. ❌ Not logged in to GitHub → Login first
2. ❌ No write permissions → Need collaborator access
3. ❌ Viewing from wrong branch → Switch branch
4. ❌ Workflow hasn't been merged → Use correct branch

---

### Issue 3: Workflow Requires Approval

**What you'll see**:
```
┌────────────────────────────────────────────────────────────────┐
│  DB Deploy #1                          ⏸️ Waiting for approval  │
├────────────────────────────────────────────────────────────────┤
│  Review deployment to "production"                              │
│                                                                 │
│  [Review deployments]                                          │
└────────────────────────────────────────────────────────────────┘
```

**Action**: Click **"Review deployments"** → Approve → Submit

---

## 📋 Complete Workflow List

Your repository has these workflows:

| Workflow | Purpose | When to Run |
|----------|---------|-------------|
| **Security Preflight** | Pre-deploy security checks | Before any deployment |
| **DB Drift Check** | Detect schema drift | Every 6 hours (auto) + manual |
| **DB Migrate Diff** | Preview migration SQL | Before DB Deploy |
| **DB Backup** | Create database backup | Daily 2AM (auto) + before deploy |
| **DB Deploy** | Apply migrations | After backup + approval |
| **DB Restore** | Emergency rollback | Only in emergency |
| **CI** | Main test suite | On every commit |
| **Codex Auto-Fix** | Auto-fix failures | On CI failure |

---

## 🎯 Direct Links to Each Workflow

**Click these in your browser**:

```
Security Preflight:
https://github.com/NeonHub3A/neonhub/actions/workflows/security-preflight.yml

DB Drift Check:
https://github.com/NeonHub3A/neonhub/actions/workflows/db-drift-check.yml

DB Diff (dry-run):
https://github.com/NeonHub3A/neonhub/actions/workflows/db-diff.yml

DB Backup:
https://github.com/NeonHub3A/neonhub/actions/workflows/db-backup.yml

DB Deploy:
https://github.com/NeonHub3A/neonhub/actions/workflows/db-deploy.yml

DB Restore:
https://github.com/NeonHub3A/neonhub/actions/workflows/db-restore.yml
```

---

## ⚠️ Before Running Any Workflow

### Required: Add DATABASE_URL Secret

**Steps**:
1. Go to: https://github.com/NeonHub3A/neonhub/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `DATABASE_URL`
4. Value: Your Neon database URL
5. Click **"Add secret"**

**Example value**:
```
postgresql://neondb_owner:PASSWORD@ep-xxx-123.us-east-2.aws.neon.tech:5432/neondb?sslmode=require
```

---

## ✅ Visual Checklist

- [ ] Can navigate to Actions page
- [ ] Can see workflows in left sidebar
- [ ] Can see "Run workflow" button
- [ ] DATABASE_URL secret is configured
- [ ] Selected correct branch (`ci/codex-autofix-and-heal`)
- [ ] Ready to run first workflow!

---

## 🎉 Success Indicators

**Workflow ran successfully** when you see:

```
┌────────────────────────────────────────────────────────────────┐
│  DB Deploy #1                                      ✅ Success    │
├────────────────────────────────────────────────────────────────┤
│  All checks have passed                                         │
│  This workflow run completed successfully                       │
│                                                                 │
│  db-deploy                                      ✅ 2m 34s       │
└────────────────────────────────────────────────────────────────┘
```

**Check the logs** for:
- ✅ "Database schema is up to date!"
- ✅ "Migration applied successfully"
- ✅ "Seed complete" (if RUN_SEED=true)

---

## 🆘 Getting Help

**If workflows still don't appear**:

1. **Check your access**: Settings → Collaborators
2. **Verify workflows exist**: Go to Code → `.github/workflows/`
3. **Check file contents**: Click `db-deploy.yml` to view
4. **Try different branch**: Switch to `ci/codex-autofix-and-heal`

**If workflow fails**:

1. **Click on the failed run**
2. **Expand the failed step**
3. **Copy the error message**
4. **Share with team or AI assistant**

---

## 📸 Screenshot Guide

**What to look for**:

### Top Navigation
```
[<> Code]  [Issues]  [Pull requests]  [Actions]  [Projects]
                                           ↑
                                    Click here first
```

### Left Sidebar
```
All workflows
├─ CI
├─ Codex Auto-Fix
├─ DB Backup         ← Security workflows
├─ DB Deploy         ← This is what you want!
├─ DB Drift Check    ← 
├─ DB Restore        ←
└─ Security Preflight ←
```

### Run Workflow Button
```
┌──────────────────────────────┐
│         [Run workflow ▼]     │  ← Top right, green button
└──────────────────────────────┘
```

---

**Created**: 2025-10-27  
**For**: GitHub Actions navigation  
**Next**: Run your first workflow!
