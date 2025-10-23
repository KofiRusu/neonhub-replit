---
name: Agent Task (Autonomous)
about: Break down, fix, and verify a NeonUI task end-to-end
labels: ['agent:autonomous','area:ui','prio:now']
---

## Objective
Complete the task autonomously with commits + PR, passing CI.

## Steps
- Reproduce
- Fix
- Add/Update scripts if needed
- Verify locally (`npm run build`)
- Open PR with checklist below

## Acceptance
- CI green on PR
- Manual runbook steps succeed in Codespaces
- Docs updated

## PR Checklist
- [ ] Root cause explained
- [ ] Code + config changes listed
- [ ] Local dev instructions updated
- [ ] Screenshots / logs attached
