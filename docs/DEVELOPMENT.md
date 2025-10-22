# 🛠️ NeonHub Development Guide

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm 8+
- Git 2.35+

### Initial Setup

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/KofiRusu/NeonHub.git
cd NeonHub

# Install dependencies
pnpm install

# Run local development
pnpm dev
```

### For Existing Clones

If you already cloned the repo before submodules were added:

```bash
git submodule init
git submodule update --recursive
```

---

## 🔗 NeonUI-3.4 Frontend Submodule

The frontend UI (NeonUI-3.4) is maintained as a **git submodule** pointing to [`https://github.com/KofiRusu/NeonUI-3.4.git`](https://github.com/KofiRusu/NeonUI-3.4.git).

### Cloning the Repo

```bash
# Always use --recurse-submodules to get the frontend
git clone --recurse-submodules https://github.com/KofiRusu/NeonHub.git
```

### Updating Submodules

To pull the latest version of NeonUI-3.4:

```bash
# Update submodule to latest remote commit
git submodule update --remote --merge

# Or manually:
cd NeonUI-3.4
git pull origin main
cd ..
git add NeonUI-3.4
git commit -m "chore: update NeonUI-3.4 to latest"
```

### Working in the Frontend

When making changes to NeonUI-3.4:

```bash
cd NeonUI-3.4

# Make your changes
# ... edit files ...

# Commit and push to NeonUI-3.4 repo
git add .
git commit -m "feat: add new dashboard component"
git push origin main

# Return to parent repo and update submodule reference
cd ..
git add NeonUI-3.4
git commit -m "chore: bump NeonUI-3.4 submodule ref"
git push origin <your-branch>
```

**⚠️ Important:** Always commit submodule reference bumps in NeonHub after pushing changes to NeonUI-3.4.

### Checking Submodule Status

```bash
# View submodule status
git submodule status

# See which commit the submodule is at
cd NeonUI-3.4 && git log --oneline -5 && cd ..
```

---

## 🏗️ Project Structure

```
NeonHub/
├── apps/
│   ├── api/          # Backend API (Node.js + Express)
│   └── web/          # Main web application
├── core/             # Core AI services
│   ├── ai-economy/
│   ├── data-trust/
│   └── ...
├── NeonUI-3.4/       # Frontend submodule ⭐
├── packages/         # Shared packages
└── docs/             # Documentation
```

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific workspace tests
pnpm --filter @neonhub/backend-v3.2 test
pnpm --filter @neonhub/data-trust test

# Run with coverage
pnpm test -- --coverage
```

---

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment instructions.

---

## 📝 Git Workflow

### Branching Strategy

- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - New features
- `fix/*` - Bug fixes
- `chore/*` - Maintenance tasks

### Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
feat: add user authentication
fix: resolve memory leak in data-trust
chore: update dependencies
docs: improve API documentation
test: add MerkleTree unit tests
```

### Pull Request Process

1. Create feature branch from `develop`
2. Make changes and commit
3. Push and create PR to `develop`
4. Wait for CI checks to pass
5. Request review from team
6. Merge after approval

---

## 🔧 Troubleshooting

### Submodule Issues

**Submodule not initialized:**
```bash
git submodule update --init --recursive
```

**Submodule detached HEAD:**
```bash
cd NeonUI-3.4
git checkout main
git pull
cd ..
```

**Reset submodule to committed version:**
```bash
git submodule update --force --recursive
```

### Common Errors

**"No files matching pattern" (ESLint):**
- Some workspaces lack ESLint configs. This is tracked in issue #XXX.

**Test failures in orchestrator-global:**
- Known memory allocation issue. Safe to skip with `--no-verify` for now.

---

## 📚 Additional Resources

- [API Documentation](./API_DEPLOYMENT.md)
- [Testing Guide](./TESTING.md)
- [CI/CD Setup](./CI_CD_SETUP.md)
- [Production Checklist](../PRODUCTION_CHECKLIST.md)

---

## 💬 Need Help?

- 📧 Email: dev@neonhub.io
- 💬 Slack: #neonhub-dev
- 📖 Wiki: [GitHub Wiki](https://github.com/KofiRusu/NeonHub/wiki)

