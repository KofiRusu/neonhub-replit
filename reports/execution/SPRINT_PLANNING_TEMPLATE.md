# SPRINT PLANNING TEMPLATE
## NeonHub Agent Remediation Program - Bi-Weekly Sprint Planning

**Version:** 1.0  
**Date:** January 2025  
**Status:** OPERATIONAL  
**Owner:** Program Manager / Scrum Master

---

## EXECUTIVE SUMMARY

This template provides comprehensive procedures for bi-weekly sprint planning, enabling the team to effectively plan, commit to, and execute 2-week sprints throughout the 12-month remediation program.

**Sprint Cadence:**
- **Duration:** 2 weeks (10 working days)
- **Frequency:** 26 sprints over 12 months
- **Planning:** First Monday of sprint (2 hours)
- **Review:** Last Friday of sprint (1 hour)
- **Retrospective:** Last Friday of sprint (45 min)

**Planning Objectives:**
- Define clear sprint goal
- Commit to achievable work
- Ensure team alignment
- Identify dependencies and risks
- Set expectations with stakeholders

---

## 1. SPRINT PLANNING OVERVIEW

### 1.1 Sprint Planning Meeting

**When:** First Monday of each 2-week sprint  
**Duration:** 2 hours (9:00 AM - 11:00 AM)  
**Location:** Conference room / Zoom  
**Required Attendees:** Entire development team, Product Manager, Validation Lead

**Optional Attendees:** CTO, stakeholders (for input only)

**Meeting Structure:**
- **Part 1 (60 min):** What - Sprint goal and backlog selection
- **Part 2 (60 min):** How - Task breakdown and estimation

### 1.2 Pre-Planning Preparation

**Product Manager (1 week before):**
- [ ] Backlog groomed and prioritized
- [ ] User stories have acceptance criteria
- [ ] Dependencies identified
- [ ] Stakeholder input gathered
- [ ] Draft sprint goal prepared

**Engineering Lead (1 week before):**
- [ ] Technical spikes completed
- [ ] Architecture decisions documented
- [ ] Technical debt items identified
- [ ] Infrastructure readiness confirmed

**Team Members (1 day before):**
- [ ] Review prioritized backlog
- [ ] Identify questions or concerns
- [ ] Review last sprint results
- [ ] Come prepared to estimate

---

## 2. SPRINT PLANNING AGENDA

### 2.1 Part 1: Sprint Goal & Backlog Selection (60 min)

#### Opening (10 min) - Product Manager

**Review:**
- Last sprint results and velocity
- Current phase objectives
- Stakeholder feedback
- Market/business changes

**Example:**
```
Sprint 5 in Review:
- Planned: 28 points | Completed: 26 points (93%)
- Carryover: 2 stories (6 points)
- Velocity trend: Stable at 26-28 points

Phase 2 Status: 65% complete
- On track for phase completion Week 12
- No major blockers
```

#### Sprint Goal Definition (15 min) - Product Manager + Team

**Sprint Goal Characteristics:**
- One clear sentence
- Outcome-focused (not output)
- Inspires the team
- Measurable success

**Sprint Goal Template:**
```
"By the end of this sprint, we will [ACHIEVE WHAT] so that [VALUE/BENEFIT]."
```

**Examples:**

**Good Sprint Goals:**
- "Complete SEO title generation validation so we can deploy to staging"
- "Build content summarization API so customers can test in beta"
- "Achieve 95% test coverage on Campaign Agent core so we meet quality gate"

**Bad Sprint Goals:**
- "Complete 10 stories" (output-focused, not outcome)
- "Work on various features" (not specific)
- "Make progress" (not measurable)

**Sprint Goal Vote:**
- Team discusses and refines
- Majority agreement required
- Document final goal

#### Capacity Planning (10 min) - Program Manager

**Calculate Team Capacity:**

```
Available Capacity Calculation:

Team Members:        [N] people
Sprint Days:         10 days
PTO/Holidays:        - [N] days
Meetings/Overhead:   - 20% (2 days)
Carryover Work:      - [N] points
Training/Learning:   - 5% (0.5 days)
─────────────────────────────────────
Available Days:      [N] days per person
Points per Day:      0.7 (historical average)
─────────────────────────────────────
Total Capacity:      [N] points
Sprint Commitment:   [N] points (with 15% buffer)
```

**Example:**
```
Team Members:        12 people
Sprint Days:         10 days
PTO:                 - 5 days (Alice on vacation Week 2)
Meetings:            - 24 days total (2 days per person)
Carryover:           - 6 points
Training:            - 6 days total (0.5 per person)
─────────────────────────────────────
Available Days:      85 days total
Points per Day:      0.7
─────────────────────────────────────
Total Capacity:      60 points
Sprint Commitment:   51 points (with 15% buffer)
```

#### Backlog Selection (25 min) - Product Manager + Team

**Selection Process:**

1. **Review Top Priority Items** (Product Manager presents)
   - Must-have items for sprint goal
   - Dependencies and risks
   - Value and urgency

2. **Team Questions & Discussion**
   - Clarify requirements
   - Identify technical challenges
   - Surface dependencies

3. **Initial Selection**
   - Add stories until capacity reached
   - Ensure sprint goal achievable
   - Balance risk and value

**Backlog Selection Criteria:**

| Priority | Description | Sprint Commitment |
|----------|-------------|-------------------|
| **P0 - Critical** | Blocks sprint goal | Must include |
| **P1 - High** | Supports sprint goal | Should include |
| **P2 - Medium** | Nice to have | Include if capacity |
| **P3 - Low** | Defer to future | Do not include |

**Selected Backlog Example:**

| Story ID | Title | Priority | Estimate | Owner |
|----------|-------|----------|----------|-------|
| STORY-045 | SEO title validation framework | P0 | 8 pts | Alice |
| STORY-046 | Integrate OpenAI API for titles | P0 | 5 pts | Bob |
| STORY-047 | Build validation dashboard | P1 | 5 pts | Carol |
| STORY-048 | Unit tests for title generation | P1 | 3 pts | David |
| STORY-049 | Performance optimization | P2 | 5 pts | Alice |
| STORY-050 | Documentation updates | P2 | 3 pts | Tech Writer |
| **TOTAL** | - | - | **29 pts** | - |

---

### 2.2 Part 2: Task Breakdown & Estimation (60 min)

#### Story Point Estimation (40 min) - Entire Team

**Estimation Method:** Planning Poker (Modified Fibonacci)

**Scale:** 1, 2, 3, 5, 8, 13, 20, 40

**What Each Number Means:**

| Points | Complexity | Effort | Duration | Risk |
|--------|------------|--------|----------|------|
| **1** | Trivial | <2 hours | Half day | None |
| **2** | Simple | 2-4 hours | Half day | Very low |
| **3** | Straightforward | 4-8 hours | 1 day | Low |
| **5** | Moderate | 1-2 days | 1-2 days | Medium |
| **8** | Complex | 2-3 days | 2-3 days | Medium-High |
| **13** | Very complex | 3-5 days | 3-5 days | High |
| **20+** | Epic | Break down | Multiple weeks | Very high |

**Planning Poker Process:**

**For each story:**

1. **Present Story (3 min)**
   - Product Manager reads story
   - Shows acceptance criteria
   - Answers clarifying questions

2. **Team Discussion (3 min)**
   - Technical approach
   - Potential challenges
   - Dependencies
   - Assumptions

3. **Silent Estimation (30 sec)**
   - Each team member selects card
   - No discussion during selection

4. **Reveal (30 sec)**
   - Everyone shows cards simultaneously
   - Record estimates

5. **Discuss Variance (2 min if needed)**
   - If estimates differ by >2 points:
     - Highest estimate explains
     - Lowest estimate explains
     - Team discusses
     - Re-estimate

6. **Consensus (30 sec)**
   - Team agrees on final estimate
   - Record in JIRA
   - Move to next story

**Estimation Guidelines:**

- Estimate based on effort, not calendar time
- Include testing and code review time
- Include documentation time
- Account for unknowns with higher estimate
- When in doubt, estimate higher
- If >13 points, break down story

#### Task Breakdown (20 min) - Team Members

**For each selected story:**

1. **Identify Tasks**
   - What specific work needed?
   - Who will do each task?
   - What's the sequence?

2. **Create Subtasks in JIRA**
   - Clear, actionable task descriptions
   - Estimated hours for each
   - Assigned to team member
   - Dependencies noted

**Example Story Breakdown:**

```
STORY-045: SEO Title Validation Framework (8 points)

Tasks:
- [ ] Design validation interface (Alice, 4h)
- [ ] Implement accuracy validator (Alice, 6h)
- [ ] Implement performance validator (Bob, 4h)
- [ ] Create test data set (Carol, 4h)
- [ ] Write unit tests (Alice, 4h)
- [ ] Integration testing (Carol, 3h)
- [ ] Code review and refinement (Team, 2h)
- [ ] Documentation (Tech Writer, 2h)

Total: 29 hours ≈ 8 points ✓
Dependencies: Test data from Carol before Alice can complete validation
```

---

## 3. SPRINT GOAL EXAMPLES

### 3.1 Phase 0 Sprint Goals

**Sprint 1 (Foundation):**
"Complete core validation framework so we can validate our first component"

**Sprint 2 (Foundation):**
"Establish complete development infrastructure so the team can work efficiently"

### 3.2 Phase 1-5 Sprint Goals (Agent Development)

**Sprint 3 (SEO - Week 1-2):**
"Complete SEO title generation with validation so we can begin user testing"

**Sprint 4 (SEO - Week 3-4):**
"Achieve production-ready SEO agent so we can deploy to beta customers"

**Sprint 7 (Content - Week 1-2):**
"Build content summarization engine so we can validate accuracy against benchmarks"

### 3.3 Sprint Goal Anti-Patterns

**Avoid:**
- "Complete as many stories as possible" (no focus)
- "Work on SEO agent" (too vague)
- "Fix all bugs" (not specific or achievable)
- "Implement 5 features" (output-focused)
- "Make customers happy" (not measurable in 2 weeks)

---

## 4. STORY STRUCTURE & ACCEPTANCE CRITERIA

### 4.1 User Story Template

```markdown
## [STORY-XXX] Title (One sentence describing the feature)

**As a** [user type]
**I want** [feature/capability]
**So that** [business value]

### Acceptance Criteria
- [ ] Criterion 1 (specific, testable)
- [ ] Criterion 2 (specific, testable)
- [ ] Criterion 3 (specific, testable)
- [ ] All unit tests pass (≥90% coverage)
- [ ] Code review completed and approved
- [ ] Documentation updated
- [ ] Validation passed (if applicable)

### Technical Notes
[Any technical context, architecture decisions, dependencies]

### Definition of Done
- [ ] Code complete and merged to main
- [ ] Tests written and passing
- [ ] Code reviewed and approved
- [ ] Deployed to staging
- [ ] Validated per standards
- [ ] Documentation complete
- [ ] Product Owner accepted

### Dependencies
- [List any dependencies on other stories or external factors]

### Risks
- [List any risks or unknowns]

**Story Points:** [N]
**Priority:** [P0/P1/P2/P3]
**Assignee:** [NAME]
**Sprint:** Sprint [N]
```

### 4.2 Acceptance Criteria Standards

**Good Acceptance Criteria:**
- ✓ Specific and unambiguous
- ✓ Testable (can verify pass/fail)
- ✓ Written from user perspective
- ✓ Independent of implementation
- ✓ Complete (covers all scenarios)

**Example - Good:**
```
Acceptance Criteria:
- [ ] User can input a blog topic and receive 5 SEO-optimized title suggestions
- [ ] Each title is between 50-60 characters
- [ ] Titles include at least one keyword from the input
- [ ] API responds within 500ms for 95% of requests
- [ ] System handles up to 100 concurrent requests
```

**Example - Bad:**
```
Acceptance Criteria:
- [ ] Feature works (too vague)
- [ ] Code is good quality (subjective)
- [ ] Fast response (not specific)
```

---

## 5. CAPACITY PLANNING WORKSHEET

### 5.1 Team Availability Matrix

| Team Member | Days Available | PTO/Holiday | Meetings | Other | Net Availability | Points Capacity |
|-------------|----------------|-------------|----------|-------|------------------|-----------------|
| Alice | 10 | 0 | 2 | 0.5 | 7.5 | 5.3 |
| Bob | 10 | 2 | 2 | 0.5 | 5.5 | 3.9 |
| Carol | 10 | 0 | 2 | 1 (training) | 7.0 | 4.9 |
| David | 10 | 0 | 2 | 0.5 | 7.5 | 5.3 |
| Eve | 10 | 0 | 2 | 2 (onboarding) | 6.0 | 4.2 |
| ... | ... | ... | ... | ... | ... | ... |
| **TOTAL** | **120** | **-7** | **-24** | **-6.5** | **82.5** | **57.8** |

**Calculations:**
- Points per day: 0.7 (historical team average)
- Total capacity: 82.5 days × 0.7 = 57.8 points
- Sprint commitment: 57.8 × 0.85 (buffer) = **49 points**

### 5.2 Capacity Adjustment Factors

**Account for:**
- **New Team Members:** 50% capacity first sprint, 75% second sprint, 100% after
- **Complexity Factor:** Unfamiliar domain = +20% time estimate
- **Integration Work:** External dependencies = +30% buffer
- **Tech Debt:** Aging codebase = +15% time
- **Holidays:** Reduce capacity proportionally
- **On-Call Rotation:** -10% for person on-call

---

## 6. BACKLOG GROOMING PROCESS

### 6.1 Weekly Grooming Session

**When:** Thursday, 2:00 PM (mid-sprint)  
**Duration:** 1 hour  
**Attendees:** Product Manager, Engineering Lead, 2-3 engineers (rotating)

**Grooming Objectives:**
- Refine stories for next 2-3 sprints
- Add acceptance criteria
- Identify dependencies
- High-level estimation
- Prioritization

**Grooming Checklist per Story:**
- [ ] Title clear and descriptive
- [ ] User story format complete
- [ ] Acceptance criteria defined (3-7 criteria)
- [ ] Technical notes added
- [ ] Dependencies identified
- [ ] Rough size estimate (t-shirt: S/M/L)
- [ ] Priority assigned
- [ ] Ready for sprint planning

### 6.2 Definition of Ready

**Story is "Ready" when:**
- [ ] Clearly defined with user story format
- [ ] Acceptance criteria complete and testable
- [ ] Dependencies identified and documented
- [ ] Estimated (at least t-shirt size)
- [ ] No open questions or unknowns
- [ ] Small enough to complete in 1 sprint
- [ ] Value is clear and understood
- [ ] Product Owner approved

**If story not ready:**
- Do not commit to sprint
- Schedule refinement session
- Defer to future sprint

---

## 7. SPRINT COMMITMENT

### 7.1 Commitment Process

**After selection and estimation:**

1. **Review Total Points** (Program Manager)
   - Sum all selected story points
   - Compare to calculated capacity
   - Check if realistic

2. **Risk Assessment** (Engineering Lead)
   - Any high-risk stories?
   - Dependencies outside team?
   - New technology or unknowns?
   - Add buffer if needed

3. **Team Confidence Vote**
   - Each member: Thumbs up/down/sideways
   - Discuss concerns if not unanimous
   - Adjust backlog if needed

4. **Final Commitment**
   - Team collectively commits
   - Document in sprint planning doc
   - Update JIRA sprint
   - Communicate to stakeholders

### 7.2 Sprint Commitment Template

```
SPRINT [N] COMMITMENT
Sprint Dates: [START DATE] - [END DATE]
Planning Date: [DATE]

SPRINT GOAL:
"[Sprint goal statement]"

TEAM CAPACITY:
- Team Size: [N] people
- Available Days: [N] days
- Calculated Capacity: [N] points
- Commitment: [N] points

COMMITTED STORIES:
1. [STORY-XXX] [Title] (Est: [N] pts) - [Assignee]
2. [STORY-XXX] [Title] (Est: [N] pts) - [Assignee]
3. [STORY-XXX] [Title] (Est: [N] pts) - [Assignee]
...
TOTAL: [N] points

RISKS:
- [Risk 1] - Mitigation: [Plan]
- [Risk 2] - Mitigation: [Plan]

DEPENDENCIES:
- [Dependency 1] - Status: [Status]
- [Dependency 2] - Status: [Status]

TEAM CONFIDENCE: [%]% (based on voting)

STRETCH GOALS (if ahead of schedule):
- [STORY-XXX] [Title] ([N] pts)

COMMITTED BY:
Team: _________________ Date: _______
Product Manager: _______ Date: _______
Engineering Lead: ______ Date: _______
```

---

## 8. ESTIMATION TECHNIQUES

### 8.1 Planning Poker Detailed Process

**Setup:**
- Use cards: 1, 2, 3, 5, 8, 13, 20, ?, ☕
- ? = Need more information
- ☕ = Need a break

**Round-by-Round:**

**Round 1:**
```
Story: STORY-045 - SEO Title Validation Framework

PM: "We need to build a validation framework for SEO title generation..."
[Explains acceptance criteria]

Team discusses (3 min)
- Alice: "Do we need to validate performance too?"
- PM: "Yes, both accuracy and performance"
- Bob: "What's the accuracy threshold?"
- PM: "90% match to expert-generated titles"

Team estimates silently
Everyone reveals:
- Alice: 8
- Bob: 13
- Carol: 8
- David: 5

Discuss variance (Bob's 13 vs David's 5):
- Bob: "I think we need to build test data pipeline first"
- David: "Oh, I didn't account for that, more like 8"
- Alice: "Test data is separate story, this is just framework"
- Bob: "Good point, then 8 makes sense"

Re-estimate:
- All: 8 points ✓

Record: STORY-045 = 8 points
```

### 8.2 Reference Stories (Baseline)

**Establish reference stories for consistent estimation:**

**1-Point Story Example:**
- Fix typo in documentation
- Update configuration value
- Simple UI text change

**3-Point Story Example:**
- Add new API endpoint (simple CRUD)
- Write unit tests for one module
- Create basic UI component

**5-Point Story Example:**
- Implement new validator class
- Build API integration with error handling
- Create complex UI component with state

**8-Point Story Example:**
- Build complete feature with tests
- Refactor major module
- Implement end-to-end workflow

**13-Point Story Example:**
- Design and implement new subsystem
- Major architecture change
- Complex integration with multiple services

**If >13 Points:**
- Story is too large
- Break down into smaller stories
- Epic might be better

### 8.3 Estimation Anti-Patterns

**Avoid:**
- ❌ Estimating in hours (use points for complexity)
- ❌ Individual estimating (team should estimate together)
- ❌ Averaging estimates (discuss variances first)
- ❌ Manager pressure to lower estimates
- ❌ Comparing developers ("Alice is faster than Bob")
- ❌ Forgetting testing and review time

---

## 9. SPRINT BACKLOG MANAGEMENT

### 9.1 Sprint Backlog in JIRA

**Sprint Board Columns:**

```
To Do → In Progress → Code Review → Testing → Done
```

**Story Workflow:**

1. **To Do**
   - Story ready to start
   - All prerequisites met
   - Assigned to developer

2. **In Progress**
   - Actively being worked on
   - Max 1-2 stories per person
   - Daily standup updates

3. **Code Review**
   - PR created and linked
   - Reviewer assigned
   - Target: Review within 4 hours

4. **Testing**
   - QA validation
   - Automated tests running
   - Validation criteria checked

5. **Done**
   - All acceptance criteria met
   - Deployed to staging
   - Validated and accepted

### 9.2 Work In Progress (WIP) Limits

**Enforce WIP limits to maintain flow:**

| Column | WIP Limit | Reason |
|--------|-----------|--------|
| To Do | Unlimited | Sprint backlog |
| In Progress | [N×2] | Max 2 stories per person |
| Code Review | 5 | Prevent bottleneck |
| Testing | 4 | QA capacity limit |
| Done | Unlimited | Completed work |

**If WIP limit reached:**
- Stop starting new work
- Help finish existing work
- Swarm on blockers
- Focus on flow, not utilization

---

## 10. SPRINT CEREMONIES

### 10.1 Daily Standup (15 min)

**When:** Every day, 9:00 AM  
**Duration:** Max 15 minutes  
**Format:** Stand up (if in person)

**Each person answers (2 min max):**
1. What did I complete yesterday?
2. What will I do today?
3. Any blockers?

**Standup Rules:**
- Timeboxed strictly
- No problem-solving (take offline)
- Update JIRA before standup
- Be prepared and concise
- Focus on sprint goal progress

**Facilitator (rotating):**
- Keep time
- Ensure everyone speaks
- Note blockers for follow-up
- Update burndown chart

### 10.2 Sprint Review (1 hour)

**When:** Last Friday, 2:00 PM  
**Duration:** 1 hour  
**Attendees:** Team + stakeholders + Product Manager

**Agenda:**

**1. Sprint Overview (5 min) - Program Manager**
- Sprint goal
- Committed vs. completed
- Key metrics

**2. Demo (40 min) - Engineers**
- Each story demonstrated
- Show working software (not slides)
- Explain technical approach
- Answer stakeholder questions

**3. Stakeholder Feedback (10 min)**
- What do you think?
- Any concerns?
- Priorities for next sprint?

**4. Next Sprint Preview (5 min) - Product Manager**
- Next sprint goal
- Top priorities
- Any changes needed

### 10.3 Sprint Retrospective (45 min)

**When:** Last Friday, 3:15 PM (after review)  
**Duration:** 45 minutes  
**Attendees:** Team only (safe space)

**Retrospective Format:**

**1. Set the Stage (5 min)**
- Prime directive: "Everyone did their best"
- Reiterate: Blameless, constructive
- Review retrospective agreements

**2. Gather Data (15 min)**
- What went well? (green sticky notes)
- What didn't go well? (red sticky notes)
- Ideas for improvement? (blue sticky notes)
- Team adds notes silently
- Group similar themes

**3. Generate Insights (10 min)**
- Discuss themes
- Identify root causes
- Vote on top 3 issues to address

**4. Decide Actions (10 min)**
- For each top issue, decide:
  - Specific action to take
  - Who will do it
  - By when
  - How to measure success

**5. Close (5 min)**
- Review action items
- Appreciate team
- Preview next sprint

**Retrospective Action Items:**

| Action | Owner | Deadline | Status |
|--------|-------|----------|--------|
| [Action 1] | [NAME] | Next sprint | ⏳ |
| [Action 2] | [NAME] | This week | ✓ |

**Track action items in next sprint backlog**

---

## 11. MID-SPRINT CHECKPOINT

### 11.1 Mid-Sprint Review (Thursday Week 1)

**Informal 30-min check:**
- Are we on track for sprint goal?
- Any stories at risk?
- Burndown healthy?
- Any blockers emerged?
- Need to adjust scope?

**Adjustments Allowed:**
- Add small stories if ahead
- Remove low-priority stories if behind
- Swarm on critical stories
- Request help from stakeholders

### 11.2 Sprint Health Indicators

**Healthy Sprint:**
- 🟢 Burndown trending to zero
- 🟢 No critical blockers
- 🟢 Team morale positive
- 🟢 WIP limits respected
- 🟢 On track for sprint goal

**At-Risk Sprint:**
- 🟡 Burndown flat or trending up
- 🟡 1-2 blockers
- 🟡 Some scope concerns
- 🟡 Might miss 1-2 stories

**Crisis Sprint:**
- 🔴 Burndown increasing
- 🔴 Multiple blockers
- 🔴 Sprint goal at risk
- 🔴 Team struggling

**If at-risk or crisis:**
- Daily standup → twice daily
- Emergency team session
- Remove low-priority stories
- Escalate blockers to management
- Consider scope reduction

---

## 12. VELOCITY TRACKING

### 12.1 Velocity Calculation

```
Sprint Velocity = Sum of Story Points Completed in Sprint

Rolling Average Velocity = Avg(last 3 sprints)
```

**Velocity Targets:**
- Phase 0: 20-30 points (team ramping up)
- Phase 1-2: 25-35 points (team at capacity)
- Phase 3-5: 30-40 points (team optimized)

### 12.2 Velocity Trends

**Track and analyze:**

| Sprint | Committed | Completed | Velocity | Trend |
|--------|-----------|-----------|----------|-------|
| Sprint 1 | 25 | 22 | 22 | Baseline |
| Sprint 2 | 28 | 26 | 26 | ↗ +18% |
| Sprint 3 | 30 | 28 | 28 | ↗ +8% |
| Sprint 4 | 32 | 31 | 31 | ↗ +11% |
| Sprint 5 | 35 | 30 | 30 | ↘ -3% |
| **Avg (last 3)** | - | - | **29.7** | **Stable** |

**Velocity Analysis:**
- **Increasing:** Team improving, learning, optimizing ✓
- **Stable:** Predictable, sustainable ✓
- **Decreasing:** Technical debt, complexity, burnout ⚠
- **Erratic:** Estimation issues, scope changes ⚠

---

## 13. DEFINITION OF DONE

### 13.1 Story-Level Definition of Done

**Every story must meet:**
- [ ] Code complete and follows coding standards
- [ ] Unit tests written (≥90% coverage for new code)
- [ ] Integration tests pass (if applicable)
- [ ] Code reviewed and approved by 1+ senior engineer
- [ ] All acceptance criteria met
- [ ] No critical or high-severity bugs
- [ ] Deployed to staging environment
- [ ] Validation passed (per validation framework)
- [ ] Documentation updated (API docs, user guides)
- [ ] Product Owner accepted

### 13.2 Sprint-Level Definition of Done

**Sprint is "Done" when:**
- [ ] Sprint goal achieved
- [ ] All committed stories meet DoD
- [ ] All tests passing in CI/CD
- [ ] Code coverage ≥90%
- [ ] No P0/P1 bugs introduced
- [ ] Staging deployment successful
- [ ] Sprint review completed
- [ ] Retrospective completed
- [ ] Next sprint planned

### 13.3 Phase-Level Definition of Done

**Phase is "Done" when:**
- [ ] All phase objectives achieved
- [ ] All stories validated and deployed
- [ ] Phase gate passed (see [`VALIDATION_GATE_CHECKLIST.md`](VALIDATION_GATE_CHECKLIST.md))
- [ ] Documentation complete
- [ ] Customer beta testing completed (if applicable)
- [ ] Production deployment successful
- [ ] Post-deployment monitoring period complete
- [ ] Lessons learned documented

---

## 14. SPRINT METRICS & REPORTING

### 14.1 Sprint Burndown Chart

**Track daily:**
- Remaining story points
- Ideal burndown (straight line)
- Actual burndown (jagged line)

**Burndown Chart Template:**

```
SPRINT 5 BURNDOWN CHART

30 pts ┤●
28 pts ┤ ╲
26 pts ┤  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ Ideal
24 pts ┤   ╲     ●
22 pts ┤    ╲   ╱ ╲
20 pts ┤     ╲ ╱   ●━━━━━━━━━━━━━━━━━━━━ Actual
18 pts ┤      ●     ╲
16 pts ┤       ╲     ●
14 pts ┤        ╲   ╱ ╲
12 pts ┤         ╲ ╱   ╲
10 pts ┤          ●     ●
8 pts  ┤           ╲   ╱ ╲
6 pts  ┤            ╲ ╱   ●
4 pts  ┤             ●     ╲
2 pts  ┤              ╲     ●
0 pts  ┤               ╲━━━━━╲━━━●
       └─┬──┬──┬──┬──┬──┬──┬──┬──┬──┬─
        D0 D1 D2 D3 D4 D5 D6 D7 D8 D9 D10

Status: 🟢 On track to complete sprint goal
```

### 14.2 Sprint Metrics Summary

**Report at sprint review:**

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Committed Points | [N] | [N] | - |
| Completed Points | [N] | [N] | [%]% |
| Stories Completed | [N] | [N] | [%]% |
| Carryover Stories | 0 | [N] | [🟢/🟡/🔴] |
| Sprint Goal Met | Yes | [Y/N] | [✓/✗] |
| Code Coverage | ≥90% | [%]% | [🟢/🟡/🔴] |
| Bugs Introduced | 0 | [N] | [🟢/🟡/🔴] |
| Deployment Success | Yes | [Y/N] | [✓/✗] |

---

## 15. COMMON PLANNING CHALLENGES

### 15.1 Challenge: Over-Commitment

**Symptoms:**
- Consistently not completing committed work
- Velocity declining
- Team stress increasing
- Quality suffering

**Solutions:**
- Reduce commitment by 20%
- Re-estimate reference stories
- Identify and remove waste
- Improve estimation accuracy
- Add more buffer for unknowns

### 15.2 Challenge: Under-Commitment

**Symptoms:**
- Consistently completing early
- Team idle time
- Velocity increasing rapidly
- Adding scope mid-sprint frequently

**Solutions:**
- Increase commitment by 15%
- Add stretch goals
- Review capacity calculation
- Consider if stories too small
- Use extra capacity for tech debt

### 15.3 Challenge: Unclear Requirements

**Symptoms:**
- Stories not ready for planning
- Many questions during estimation
- Rework after sprint starts
- Scope changes mid-sprint

**Solutions:**
- Improve backlog grooming
- Stricter "Definition of Ready"
- Product Manager availability during sprint
- Architecture spikes before planning
- Technical writer earlier involvement

### 15.4 Challenge: Technical Uncertainty

**Symptoms:**
- High estimates due to unknowns
- Stories blocked on technical decisions
- Estimation variance >5 points
- Frequent escalations

**Solutions:**
- Technical spikes in prior sprint
- Architecture office hours
- POC/prototype before full implementation
- Break into smaller, lower-risk stories
- Pair programming on complex work

---

## 16. SPRINT PLANNING TOOLS

### 16.1 Required Tools

**Planning Tools:**
- JIRA/Linear (backlog management)
- Planning Poker app (Pointing Poker, Planning Poker Online)
- Miro/Mural (virtual whiteboard for distributed teams)
- Zoom (video conferencing)
- Confluence (documentation)

**Automation:**
- Auto-create sprint in JIRA
- Auto-calculate capacity
- Auto-generate burndown charts
- Auto-send sprint summary emails

### 16.2 Planning Meeting Facilitation Tips

**Good Facilitator:**
- ✓ Keeps meeting on time
- ✓ Ensures everyone participates
- ✓ Manages discussions (no rabbit holes)
- ✓ Parking lot for off-topic items
- ✓ Maintains energy and focus

**Facilitation Techniques:**
- Use timer for each story discussion
- "Park" detailed technical discussions for later
- Rotate facilitator role (learning opportunity)
- Start/end on time (respect people's calendars)
- Take breaks if needed

---

## 17. TEMPLATES & CHECKLISTS

### 17.1 Sprint Planning Meeting Agenda

```
SPRINT [N] PLANNING MEETING
Date: [DATE] | Time: 9:00 AM - 11:00 AM

PRE-MEETING (8:45 AM):
- [ ] JIRA sprint created
- [ ] Backlog prioritized
- [ ] Team capacity calculated
- [ ] Room/Zoom ready
- [ ] Planning poker cards ready

PART 1: WHAT (9:00 - 10:00):
- [ ] Welcome and last sprint review (10 min)
- [ ] Sprint goal definition (15 min)
- [ ] Capacity planning (10 min)
- [ ] Backlog selection (25 min)

BREAK (10:00 - 10:05)

PART 2: HOW (10:05 - 11:00):
- [ ] Story estimation (40 min)
- [ ] Task breakdown (15 min)

CLOSING (10:55 - 11:00):
- [ ] Team commitment vote
- [ ] Document sprint plan
- [ ] Communicate to stakeholders
- [ ] Schedule sprint ceremonies
```

### 17.2 Sprint Planning Checklist

**Product Manager:**
- [ ] Backlog groomed and prioritized
- [ ] Stories have acceptance criteria
- [ ] Dependencies identified
- [ ] Sprint goal draft prepared
- [ ] Stakeholder input gathered

**Engineering Lead:**
- [ ] Technical readiness confirmed
- [ ] Architecture decisions made
- [ ] Test environments ready
- [ ] No critical blockers

**Program Manager:**
- [ ] Sprint created in JIRA
- [ ] Capacity calculated
- [ ] Previous sprint metrics reviewed
- [ ] Meeting scheduled and invites sent

**Team:**
- [ ] Reviewed backlog before meeting
- [ ] Questions prepared
- [ ] Ready to estimate and commit

**Post-Planning:**
- [ ] Sprint backlog finalized in JIRA
- [ ] Sprint goal documented
- [ ] Team committed
- [ ] Stakeholders informed
- [ ] Daily standup scheduled
- [ ] Sprint board configured

---

## 18. SPECIAL SCENARIOS

### 18.1 Planning for First Sprint (Sprint 1)

**Challenges:**
- No historical velocity
- New team
- Unknowns

**Approach:**
- Start conservative (20 points)
- Focus on learning
- Establish baseline
- Adjust in Sprint 2

### 18.2 Planning with New Team Members

**Account for onboarding:**
- Week 1: 25% capacity
- Week 2: 50% capacity
- Week 3: 75% capacity
- Week 4+: 100% capacity

**Buddy assignment:**
- Pair new member with experienced member
- Assign easier stories initially
- Increase complexity gradually

### 18.3 Planning During Holidays

**Holiday impact:**
- Reduce capacity proportionally
- Consider team morale (lighter sprint)
- Plan for knowledge transfer before vacation
- Have backup coverage identified

---

## APPENDICES

### Appendix A: Planning Poker Cards (Print Template)

```
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│  1  │ │  2  │ │  3  │ │  5  │
└─────┘ └─────┘ └─────┘ └─────┘

┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│  8  │ │ 13  │ │ 20  │ │  ?  │
└─────┘ └─────┘ └─────┘ └─────┘

┌─────┐
│  ☕  │  (Break time!)
└─────┘
```

### Appendix B: Sprint Planning Examples

See `examples/sprint-planning/` for:
- Completed sprint plan (Sprint 3)
- Estimation session transcript
- Capacity calculation worksheet
- Sprint goal brainstorming notes

### Appendix C: Reference Documents

- [`PHASE_0_KICKOFF_PLAYBOOK.md`](PHASE_0_KICKOFF_PLAYBOOK.md)
- [`WEEKLY_STATUS_REPORT_TEMPLATE.md`](WEEKLY_STATUS_REPORT_TEMPLATE.md)
- [`KPI_DASHBOARD_SPECIFICATION.md`](KPI_DASHBOARD_SPECIFICATION.md)
- [`VALIDATION_GATE_CHECKLIST.md`](VALIDATION_GATE_CHECKLIST.md)
- [`FOCUSED_REBUILD_PROJECT_PLAN.md`](../strategic/FOCUSED_REBUILD_PROJECT_PLAN.md)

---

## DOCUMENT CONTROL

**Version History:**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-15 | PMO + Scrum Master | Initial sprint planning template |

**Approval:**

- [ ] Program Manager Approved: _____ Date: _______
- [ ] Engineering Lead Approved: _____ Date: _______
- [ ] Product Manager Approved: ______ Date: _______

**Distribution:** Remediation Team, Product Management, Stakeholders

**Review Cycle:** After each sprint retrospective, update based on learnings

---

**END OF SPRINT PLANNING TEMPLATE**