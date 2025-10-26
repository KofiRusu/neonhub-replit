# Beta Feedback Guide

## How to Submit Feedback

We value your input! Here's how to effectively submit feedback during the beta program.

## Feedback Types

### 1. Bug Reports 🐛

Use for: Software defects, errors, crashes

**Required Information:**
- Clear title describing the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information
- Screenshots (if applicable)

**Example:**
```json
{
  "type": "bug",
  "category": "documents",
  "title": "Document version creation fails",
  "description": "When creating a version of a document with special characters in the title, I get a 500 error. Steps to reproduce: 1. Create document with title 'Test & Demo', 2. Click 'Create Version', 3. Error appears.",
  "metadata": {
    "browser": "Chrome 118",
    "os": "macOS 14.0",
    "screenshot": "https://..."
  }
}
```

### 2. Feature Requests 💡

Use for: New functionality, enhancements

**Required Information:**
- Clear feature description
- Use case/problem it solves
- Priority (nice-to-have vs critical)
- Any examples from other tools

**Example:**
```json
{
  "type": "feature",
  "category": "tasks",
  "title": "Add recurring tasks",
  "description": "I need to create tasks that repeat daily/weekly/monthly. Use case: Daily standup reminders, weekly reports. Similar to Asana's recurring tasks feature.",
  "rating": 5
}
```

### 3. Improvements 🎯

Use for: Existing features that could be better

**Required Information:**
- Feature being improved
- Current pain point
- Suggested improvement
- Impact on workflow

**Example:**
```json
{
  "type": "improvement",
  "category": "ui",
  "title": "Document list needs better filtering",
  "description": "Currently can only filter by status and type. Would be helpful to filter by date range, tags, and author. This would save 5-10 minutes per day when searching for documents.",
  "rating": 4
}
```

### 4. Questions ❓

Use for: Clarifications, help requests

**Required Information:**
- What you're trying to accomplish
- What you've tried so far
- Specific question

**Example:**
```json
{
  "type": "question",
  "category": "messaging",
  "title": "How do I create group messages?",
  "description": "I want to message multiple team members at once. I tried creating multiple messages but that's inefficient. Is there a group messaging feature?"
}
```

## Submitting Feedback

### Via API

```bash
curl -X POST https://api.neonhub.com/api/feedback \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "bug",
    "category": "documents",
    "title": "Clear, specific title",
    "description": "Detailed description with steps",
    "rating": 3,
    "metadata": {
      "browser": "Chrome 118",
      "os": "macOS 14.0"
    }
  }'
```

### Via UI

1. Click "Feedback" in navigation
2. Choose feedback type
3. Fill in required fields
4. Optionally add rating (1-5 stars)
5. Submit

### Via GitHub Issues

For complex bugs or feature requests, you can use our GitHub issue templates:

```
https://github.com/neonhub/neonhub/issues/new?template=beta-feedback.md
```

## Feedback Lifecycle

### Status Flow

```
open → in_progress → resolved → closed
```

**Status Meanings:**
- `open` - Submitted, waiting for review
- `in_progress` - Being investigated/developed
- `resolved` - Fixed/implemented, pending verification
- `closed` - Verified and complete

### Response Time

- **Critical bugs:** Within 24 hours
- **Standard bugs:** Within 3 business days
- **Feature requests:** Within 1 week
- **Questions:** Within 1 business day

## Beta-Specific Features

### Feedback Statistics (Beta Users Only)

View aggregated feedback metrics:

```bash
GET /api/feedback/stats
```

Returns:
```json
{
  "total": 100,
  "byType": {
    "bug": 40,
    "feature": 30,
    "improvement": 20,
    "question": 10
  },
  "byStatus": {
    "open": 50,
    "in_progress": 20,
    "resolved": 25,
    "closed": 5
  },
  "averageRating": 4.2
}
```

### View All Feedback (Beta Users Only)

Beta users can view feedback from all users:

```bash
GET /api/feedback?allUsers=true
```

### Update Feedback (Beta Users Only)

Beta users can update feedback status and add responses:

```bash
PUT /api/feedback/:id
{
  "status": "resolved",
  "response": "Fixed in version 3.2.1"
}
```

## Tips for Effective Feedback

### 1. Be Specific
❌ "Documents don't work"  
✅ "Creating a document with > 10,000 characters causes a timeout error"

### 2. Include Context
❌ "Button is broken"  
✅ "The 'Save' button on the document editor doesn't respond when clicked after editing for >30 minutes. Browser console shows 'Session expired' error."

### 3. Prioritize
Use ratings to indicate importance:
- ⭐ (1 star): Minor annoyance
- ⭐⭐⭐ (3 stars): Moderate impact
- ⭐⭐⭐⭐⭐ (5 stars): Critical/blocking issue

### 4. Provide Examples
Include:
- Screenshots
- Screen recordings (Loom, CloudApp)
- API responses
- Console errors
- Network requests

### 5. Suggest Solutions
While not required, if you have ideas for fixes or improvements, share them!

## What Happens to Your Feedback

1. **Submission** - Your feedback is logged and assigned an ID
2. **Triage** - Team reviews within 24-48 hours
3. **Prioritization** - Added to sprint backlog based on impact
4. **Development** - Fixed/implemented in upcoming sprint
5. **Notification** - You're notified when status changes
6. **Verification** - We may reach out for testing/clarification

## Feedback Rewards

Active beta testers who provide quality feedback will receive:

- 🏆 Early access to new features
- 💎 Extended trial period
- 🎁 Discount on paid plans
- 👥 Recognition in release notes
- 🎯 Direct input on roadmap priorities

## Common Questions

**Q: How many feedback items can I submit?**  
A: No limit! Submit as many as you encounter.

**Q: Can I submit feedback anonymously?**  
A: No, feedback is tied to your user account for follow-up.

**Q: What if my feedback is a duplicate?**  
A: That's okay! It helps us understand priority. We'll link duplicates.

**Q: Can I edit my feedback after submitting?**  
A: You can delete and resubmit, or comment with updates.

**Q: Who sees my feedback?**  
A: Core team and other beta users (if viewing all feedback).

## Contact

For urgent issues or questions about feedback:
- **Email:** beta@neonhub.com
- **Slack:** #beta-feedback channel
- **GitHub:** @neonhub/beta-team

---

Thank you for helping us build a better product! 🚀

