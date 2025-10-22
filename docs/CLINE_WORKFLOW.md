# 🤖 Cline AI Assistant - NeonHub Workflow Guide

**Version:** 1.0  
**Last Updated:** October 22, 2025  
**Cline Version:** 3.2.0+

---

## 📖 Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Common Workflows](#common-workflows)
4. [Best Practices](#best-practices)
5. [Examples](#examples)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Usage](#advanced-usage)

---

## Overview

**Cline** is an AI-powered coding assistant integrated into NeonHub to accelerate development, improve code quality, and maintain consistency across the monorepo. Cline understands NeonHub's architecture, coding standards, and project-specific rules defined in `.clinerules`.

### Key Benefits

- 🚀 **Faster Development** - Generate boilerplate code, refactor components, and fix errors automatically
- 🎯 **Context-Aware** - Understands NeonHub's tech stack (Next.js, Express, Prisma, etc.)
- ✅ **Quality Assurance** - Follows TypeScript strict mode, ESLint rules, and project conventions
- 📚 **Documentation** - Automatically updates docs when code changes
- 🧪 **Test Generation** - Creates comprehensive tests with high coverage

---

## Getting Started

### Prerequisites

- **Node.js:** >= 20.0.0
- **npm:** >= 10.0.0
- **Cline:** Installed globally (`npm install -g cline`) or via project devDependencies

### Installation

Cline is already included in NeonHub's `devDependencies`. To ensure it's installed:

```bash
# From project root
npm install
```

### Authentication

Authenticate Cline with your AI model provider:

```bash
# Run authentication wizard
npx cline auth
```

This will:
1. Sign you into your Cline account
2. Configure your preferred AI model (GPT-4, Claude, etc.)
3. Store credentials securely

### Verify Installation

```bash
# Check Cline version
npx cline --version

# Test interactive mode
npm run cline
```

---

## Common Workflows

### 1. Interactive Development Session

Start an interactive chat with Cline to work on complex tasks:

```bash
npm run cline
```

**Example interaction:**
```
You: "Refactor the ContentAgent to improve error handling"
Cline: [Analyzes code, suggests improvements, shows diff]
You: "/act"  # Execute the changes
```

### 2. Quick Task Execution

Run Cline with a specific task description:

```bash
# General format
cline "Your task description here"

# Examples
cline "Add input validation to the campaign creation endpoint"
cline "Create a new React component for displaying metrics"
cline "Optimize database queries in the InsightAgent"
```

### 3. Fix TypeScript and Linting Errors

Automatically identify and fix code quality issues:

```bash
npm run cline:fix
```

This command runs: `cline 'Fix all TypeScript and linting errors in the codebase'`

**What it does:**
- Scans for TypeScript errors
- Identifies ESLint violations
- Proposes and applies fixes
- Ensures zero errors before completion

### 4. Add Missing Tests

Generate comprehensive tests for untested code:

```bash
npm run cline:test
```

This command runs: `cline 'Add missing tests and improve coverage to >= 95%'`

**What it does:**
- Identifies untested functions and modules
- Creates Jest unit tests
- Generates Playwright E2E tests
- Aims for >= 95% coverage target

### 5. Update Documentation

Sync documentation with recent code changes:

```bash
npm run cline:docs
```

This command runs: `cline 'Update documentation to reflect recent changes'`

**What it does:**
- Updates README files
- Adds JSDoc comments
- Updates API documentation
- Creates migration guides if needed

---

## Best Practices

### ✅ Do's

1. **Be Specific with Tasks**
   ```bash
   # Good
   cline "Add error handling with try-catch to all API routes in apps/api/src/routes/"
   
   # Bad
   cline "Fix the API"
   ```

2. **Review Changes Before Committing**
   - Always review Cline's diffs
   - Test changes locally
   - Run quality checks: `npm run verify`

3. **Use Project Context**
   ```bash
   cline "Update the DesignAgent to follow the same pattern as ContentAgent"
   ```

4. **Leverage Cline for Repetitive Tasks**
   ```bash
   cline "Add TypeScript types to all untyped variables in apps/web/src/components/"
   ```

5. **Combine with Git Workflow**
   ```bash
   git checkout -b feature/new-feature
   cline "Implement new feature X following NeonHub patterns"
   git add .
   git commit -m "feat: add feature X with AI assistance"
   ```

### ❌ Don'ts

1. **Don't Modify Sensitive Files**
   - Cline is configured to avoid `.env` files
   - Never ask Cline to modify secrets or keys

2. **Don't Skip Testing**
   - Always run `npm run test` after Cline makes changes
   - Verify functionality manually

3. **Don't Ignore .clinerules**
   - Cline follows project-specific rules
   - Don't ask for patterns that violate standards

4. **Don't Use Cline for Large Rewrites Without Review**
   - Break large tasks into smaller chunks
   - Review each step before proceeding

---

## Examples

### Example 1: Add a New API Endpoint

```bash
cline "Create a new API endpoint at /api/analytics/summary that returns aggregated campaign metrics using Prisma"
```

**What Cline will do:**
1. Create route file in `apps/api/src/routes/`
2. Add Prisma query for metrics
3. Implement error handling
4. Add TypeScript types
5. Register route in `server.ts`
6. Create tests in `__tests__/`

### Example 2: Refactor a React Component

```bash
cline "Refactor apps/web/src/components/Dashboard.tsx to use React Query for data fetching and add loading/error states"
```

**What Cline will do:**
1. Install/use @tanstack/react-query
2. Create custom hooks
3. Add loading skeletons
4. Implement error boundaries
5. Update component logic
6. Maintain existing styling

### Example 3: Fix Production Bug

```bash
cline "Fix the bug in OutreachAgent where email sending fails when recipient name contains special characters"
```

**What Cline will do:**
1. Locate the bug in `apps/api/src/agents/outreach/`
2. Add input sanitization
3. Update validation logic
4. Add error handling
5. Create regression tests
6. Update related documentation

### Example 4: Add Dark Mode Support

```bash
cline "Add dark mode support to the Analytics page using next-themes and TailwindCSS dark: variants"
```

**What Cline will do:**
1. Check if next-themes is installed
2. Add dark mode classes
3. Update color schemes
4. Ensure consistency with existing pages
5. Test theme switching

### Example 5: Optimize Performance

```bash
cline "Optimize the campaign dashboard by implementing React.memo, useMemo, and useCallback where appropriate"
```

**What Cline will do:**
1. Analyze component re-renders
2. Add memoization
3. Optimize expensive calculations
4. Add performance comments
5. Ensure no functionality breaks

---

## Troubleshooting

### Issue: Cline Not Found

**Solution:**
```bash
# Install globally
npm install -g cline

# Or use via npx
npx cline "Your task"
```

### Issue: Authentication Failed

**Solution:**
```bash
# Re-authenticate
npx cline auth

# Follow the prompts to sign in
```

### Issue: Cline Ignoring Project Rules

**Solution:**
1. Check that `.clinerules` exists in project root
2. Verify `.clinerules` syntax
3. Restart Cline session

### Issue: Changes Not Applied

**Solution:**
1. Review Cline's plan carefully
2. Type `/act` to execute in interactive mode
3. Check for errors in output

### Issue: TypeScript Errors After Changes

**Solution:**
```bash
# Let Cline fix it
npm run cline:fix

# Or manually check
npm run typecheck
```

---

## Advanced Usage

### Custom Task Templates

Create reusable task templates for common operations:

```bash
# Add to package.json scripts
"cline:component": "cline 'Create a new React component with TypeScript, proper typing, and a story'",
"cline:endpoint": "cline 'Create a new API endpoint with Prisma query, validation, and tests'",
"cline:agent": "cline 'Create a new AI agent following the pattern of existing agents'"
```

### Chaining Multiple Tasks

```bash
# Run multiple Cline tasks in sequence
cline "Add new feature X" && \
npm run cline:test && \
npm run cline:docs && \
npm run verify
```

### Integration with CI/CD

Use Cline in pre-commit hooks:

```bash
# .husky/pre-commit
npm run cline:fix
npm run verify
```

### Workspace-Specific Tasks

Target specific workspaces in the monorepo:

```bash
# API only
cline "Optimize database queries in apps/api/ to reduce response time"

# Web only
cline "Improve accessibility in apps/web/ by adding ARIA labels"

# Core modules
cline "Refactor core/orchestrator-global/ to use dependency injection"
```

### Using Cline with Feature Branches

```bash
# Create feature branch
git checkout -b feature/ai-analytics

# Use Cline for development
cline "Implement AI-powered analytics dashboard with real-time updates"

# Review and test
npm run verify

# Commit with conventional format
git commit -m "feat(analytics): add AI-powered dashboard"
```

---

## Configuration

### .clinerules File

NeonHub's `.clinerules` file defines project-specific guidelines:

```
Location: /Users/kofirusu/Desktop/NeonHub/.clinerules
Purpose: Guide Cline's behavior for NeonHub development
```

**Key configurations:**
- Tech stack awareness (Next.js, Express, Prisma)
- Code quality standards (TypeScript strict, ESLint)
- Security rules (no secret modifications)
- Testing requirements (>= 95% coverage)
- Documentation standards

To modify rules, edit `.clinerules` and restart Cline.

---

## Tips for Maximum Productivity

1. **Start Broad, Then Narrow**
   ```bash
   # First
   cline "Analyze the performance issues in the dashboard"
   
   # Then
   cline "Optimize the specific query identified in AnalyticsService"
   ```

2. **Use Cline for Learning**
   ```bash
   cline "Explain how the ContentAgent uses OpenAI and suggest improvements"
   ```

3. **Iterate Quickly**
   - Make small changes
   - Test immediately
   - Iterate based on results

4. **Combine with Manual Work**
   - Use Cline for boilerplate
   - Manually fine-tune critical logic
   - Let Cline handle tests and docs

5. **Save Common Tasks**
   - Document successful Cline commands
   - Add them to `package.json` scripts
   - Share with team

---

## Resources

- **Cline Documentation:** https://docs.cline.bot
- **NeonHub README:** [../README.md](../README.md)
- **Project Rules:** [../.clinerules](../.clinerules)
- **Cursor Rules:** [../.cursorrules](../.cursorrules)

---

## Support

### Questions?

- Check this guide first
- Review Cline's official docs
- Ask in team chat
- Open an issue in the repository

### Feedback

If you find ways to improve Cline integration:
1. Update `.clinerules`
2. Document the improvement
3. Share with the team

---

**Happy Coding with Cline! 🚀**

