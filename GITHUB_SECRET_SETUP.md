# 🔑 GitHub Secret Setup (5-Year-Old Edition)

## What You Need To Do

You need to tell GitHub a secret password so it can talk to your database in the cloud.

---

## Step 1: Open Your Repo Settings 🏠

1. Go to GitHub.com
2. Click on your **NeonHub** project
3. Look at the top of the page
4. Click the **Settings** tab (looks like a gear ⚙️)

---

## Step 2: Find the Secrets Page 🔐

1. On the left side, scroll down
2. Click **Secrets and variables**
3. Click **Actions** (it opens a submenu)

---

## Step 3: Add Your Secret 🎁

1. Click the green button that says **New repository secret**
2. You'll see two boxes:

### Box 1: Name
Type exactly: `DATABASE_URL`

### Box 2: Secret
Paste your cloud database URL. It looks like this:
```
postgresql://username:password@some-cloud-host.com:5432/neonhub
```

**Important**: Use your CLOUD database, NOT `localhost`! ☁️

3. Click the green **Add secret** button

---

## Step 4: Add Second Secret (Optional) 🎁

Some databases need two URLs. If yours does:

1. Click **New repository secret** again
2. Name: `DIRECT_DATABASE_URL`
3. Secret: Usually the same as `DATABASE_URL`
4. Click **Add secret**

---

## Step 5: Run the Magic Workflow ✨

1. Click the **Actions** tab at the top
2. On the left side, click **DB Deploy**
3. You'll see a button **Run workflow** on the right
4. Click it
5. Choose your branch: `ci/codex-autofix-and-heal`
6. Click the green **Run workflow** button

---

## Step 6: Watch It Work 👀

1. Wait a few seconds
2. A new workflow run appears
3. Click on it to see the progress
4. Look for green checkmarks ✅

---

## What Success Looks Like 🎉

You'll see:
- ✅ "Prisma Generate" - Green
- ✅ "Migrate Deploy" - Green
- ✅ "Seed DB" - Green
- ✅ "Health Check" - Green

If anything is RED ❌, copy the error message and send it to me!

---

## Quick Check: Do I Have The Right Database URL?

Your URL should:
- ✅ Start with `postgresql://`
- ✅ Have a username and password
- ✅ Have a HOST that is NOT `localhost` (should be something like `aws.com` or `neon.tech`)
- ✅ End with `/neonhub` or your database name

Example:
```
postgresql://myuser:mypass@cloud-host.region.aws.com:5432/neonhub
```

❌ WRONG: `postgresql://neonhub:****@localhost:5433/neonhub`
☁️ RIGHT: `postgresql://user:pass@cloud-provider.com:5432/neonhub`

---

## If You Get Stuck 🆘

Take a screenshot of:
1. The error message (if any)
2. The GitHub Actions logs
3. Your workflow run page

Send them to me and I'll tell you the exact fix!

