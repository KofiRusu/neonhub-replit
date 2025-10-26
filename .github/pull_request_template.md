# Pull Request

## Description
<!-- Provide a clear description of your changes -->

## Type of Change
<!-- Mark the relevant option with an [x] -->
- [ ] Bug fix (non-breaking change fixing an issue)
- [ ] New feature (non-breaking change adding functionality)
- [ ] Breaking change (fix or feature causing existing functionality to change)
- [ ] Documentation update
- [ ] Refactoring (no functional changes)
- [ ] Performance improvement
- [ ] CI/CD changes
- [ ] Database migration

## Related Issues
<!-- Link related issues: Closes #123, Fixes #456 -->

## Changes Made
<!-- List the main changes in this PR -->
- Change 1
- Change 2
- Change 3

## Test Matrix

### Backend Tests
- [ ] Unit tests pass (`npm test --filter apps/api`)
- [ ] Integration tests pass
- [ ] API endpoints tested manually
- [ ] Database migrations applied successfully

### Frontend Tests
- [ ] Unit tests pass (`npm test --filter apps/web`)
- [ ] E2E tests pass (`npm run test:e2e`)
- [ ] Component renders correctly
- [ ] Responsive design verified

### Cross-Cutting Tests
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run type-check`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors or warnings

## Environment Impact

### Environment Variables
<!-- List any new or changed environment variables -->
- [ ] No environment variable changes
- [ ] New variables added (documented in .env.example)
- [ ] Existing variables modified
- [ ] **Variables:**
  - `VARIABLE_NAME` - Description

### Database Changes
- [ ] No database changes
- [ ] Schema changes (migration included)
- [ ] Seed data changes
- [ ] Data backfill required
- [ ] **Migration file:** `apps/api/prisma/migrations/[name]`

### Deployment Notes
<!-- Any special deployment considerations -->
- [ ] No special deployment steps
- [ ] Requires coordinated deployment (API + Web)
- [ ] Requires environment variable updates
- [ ] Requires database backup before deployment
- [ ] **Notes:**

## Screenshots / Videos
<!-- Add screenshots or screen recordings for UI changes -->

### Before
<!-- Screenshot of current state -->

### After
<!-- Screenshot of new state -->

## Performance Impact
- [ ] No performance impact
- [ ] Performance improved (provide metrics)
- [ ] Performance impact analyzed and acceptable
- [ ] **Notes:**

## Security Considerations
- [ ] No security impact
- [ ] Security-sensitive code reviewed
- [ ] Input validation added/updated
- [ ] Authentication/authorization checked
- [ ] Secrets properly handled (not committed)
- [ ] **Notes:**

## Documentation
- [ ] README updated
- [ ] API documentation updated
- [ ] Code comments added where needed
- [ ] Migration guide included (if breaking changes)
- [ ] **Docs location:**

## Checklist
<!-- Ensure all items are completed before requesting review -->

### Pre-submission
- [ ] Code follows project style guide
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] No unnecessary console.logs or debug code
- [ ] Git history is clean (squashed if needed)

### Testing
- [ ] All tests pass locally
- [ ] New tests added for new functionality
- [ ] Edge cases considered and tested
- [ ] Error handling tested

### Review
- [ ] PR title is clear and descriptive
- [ ] Description explains "why" not just "what"
- [ ] Screenshots added for UI changes
- [ ] Reviewers assigned
- [ ] Labels added (bug, feature, etc.)

### Deployment
- [ ] Backward compatible OR migration path documented
- [ ] Environment variables documented
- [ ] Database migrations tested locally
- [ ] Rollback plan considered

## Reviewer Notes
<!-- Guidance for reviewers -->

**Focus Areas:**
<!-- Highlight areas needing special attention -->

**Testing Instructions:**
<!-- Step-by-step guide for reviewers to test changes -->
1. Step 1
2. Step 2

**Risk Assessment:**
- **Risk Level:** [Low / Medium / High]
- **User Impact:** [None / Low / Medium / High]
- **Rollback Difficulty:** [Easy / Medium / Hard]

---

## Post-Merge Actions
<!-- Actions needed after PR is merged -->
- [ ] Deploy to staging
- [ ] Smoke test staging
- [ ] Update CHANGELOG.md
- [ ] Notify team in Slack
- [ ] Monitor Sentry for errors
- [ ] Deploy to production (if applicable)

