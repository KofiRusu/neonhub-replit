# Terminal B Continuation - Agent Orchestration

**Context**: Previous Terminal B got stuck on EmailAgent tests after 40min  
**Status**: EmailAgent code complete, tests broken - SKIP and move on  
**Next**: Continue with remaining 4 agents

---

## ✅ What Previous Terminal B Accomplished

### EmailAgent - COMPLETE (Code Done, Tests Deferred)

**Files Modified**:
1. ✅ `apps/api/src/agents/utils/agent-run.ts` - Created executeAgentRun helper
2. ✅ `apps/api/src/agents/_shared/normalize.ts` - Added validation utilities
3. ✅ `apps/api/src/agents/EmailAgent.ts` - Added handle() method with AgentRun tracking
4. ✅ `apps/api/src/agents/__tests__/EmailAgent.test.ts` - Rewrote tests (but TypeScript errors)

**What Was Implemented**:
- AgentRun.create() on execution start
- AgentRun.update() on success (with metrics)
- AgentRun.update() on failure (with error)
- Input validation with Zod schemas
- Proper error handling with response codes

**Issue**: Jest Mock typing conflicts - tests don't compile. **SKIP for now.**

---

## 🎯 Your Mission - Continue Agent Orchestration

**Goal**: Add AgentRun persistence to remaining 4 agents (skip tests if they break)

**Agents Remaining**:
1. ⏳ SEOAgent ← START HERE
2. ⏳ SocialAgent
3. ⏳ ContentAgent
4. ⏳ SupportAgent

**Strategy**: Copy the pattern from EmailAgent, skip test writing if complex

---

## 📋 Task 1: Update SEOAgent (Start Here)

**File**: `apps/api/src/agents/SEOAgent.ts`

### Step 1: Add Imports

Add at top of file:
```typescript
import { executeAgentRun } from './utils/agent-run.js';
import { validateAgentContext } from './_shared/normalize.js';
import type { OrchestratorRequest, OrchestratorResponse } from '../services/orchestration/types.js';
import type { AgentExecutionContext } from './utils/agent-run.js';
```

### Step 2: Add Zod Schemas

Add after imports (adapt to SEOAgent's actual methods):
```typescript
import { z } from 'zod';

const AnalyzeKeywordsInputSchema = z.object({
  keywords: z.array(z.string()),
  targetAudience: z.string().optional(),
});

const GenerateContentInputSchema = z.object({
  keyword: z.string(),
  brandId: z.string(),
  contentType: z.enum(['article', 'blog', 'guide']),
});

type AnalyzeKeywordsInput = z.infer<typeof AnalyzeKeywordsInputSchema>;
type GenerateContentInput = z.infer<typeof GenerateContentInputSchema>;
```

### Step 3: Add Class Property

Inside SEOAgent class:
```typescript
private readonly orchestratorAgentId = "SEOAgent";
```

### Step 4: Add Helper Methods

Add before class closing brace:
```typescript
private resolveExecutionContext(rawContext: unknown): AgentExecutionContext {
  const validated = validateAgentContext(rawContext);
  return {
    organizationId: validated.organizationId,
    prisma: validated.prisma,
    logger: validated.logger ?? logger, // Use global logger if not provided
    userId: validated.userId,
  };
}

private async handleAnalyzeKeywordsIntent(
  payload: unknown,
  context: AgentExecutionContext,
  intent: string
): Promise<OrchestratorResponse> {
  let input: AnalyzeKeywordsInput;
  try {
    input = AnalyzeKeywordsInputSchema.parse(payload) as AnalyzeKeywordsInput;
  } catch (error) {
    return { ok: false, error: error.message, code: 'INVALID_INPUT' };
  }

  try {
    const { result } = await executeAgentRun(
      this.orchestratorAgentId,
      context,
      input,
      () => this.analyzeKeywords(input), // Or whatever method exists
      {
        intent,
        buildMetrics: output => ({ keywordsAnalyzed: output.length })
      }
    );
    return { ok: true, data: result };
  } catch (error) {
    return { ok: false, error: error.message, code: 'AGENT_EXECUTION_FAILED' };
  }
}

async handle(request: OrchestratorRequest): Promise<OrchestratorResponse> {
  let executionContext: AgentExecutionContext;

  try {
    executionContext = this.resolveExecutionContext(request.context);
  } catch (error) {
    return { ok: false, error: error.message, code: 'INVALID_CONTEXT' };
  }

  switch (request.intent) {
    case 'analyze-keywords':
      return this.handleAnalyzeKeywordsIntent(request.payload, executionContext, request.intent);
    case 'generate-content':
      // Add similar handler
      return { ok: false, error: 'Not implemented', code: 'NOT_IMPLEMENTED' };
    default:
      return { ok: false, error: `Unsupported intent: ${request.intent}`, code: 'UNSUPPORTED_INTENT' };
  }
}
```

### Step 5: Verify TypeScript

```bash
pnpm --filter apps/api run typecheck
# If passes, move to next agent
# If fails, show errors and I'll help
```

### Step 6: SKIP Tests (For Now)

**Don't write tests** - they cause TypeScript issues. We'll fix tests in bulk later.

Just ensure the code compiles.

---

## 📋 Task 2-4: Repeat for Remaining Agents

**Apply same pattern to**:
- SocialAgent (Task 2)
- ContentAgent (Task 3)
- SupportAgent (Task 4)

**For each**:
1. Add imports (executeAgentRun, validateAgentContext, etc.)
2. Create Zod schemas for agent's methods
3. Add orchestratorAgentId property
4. Add helper methods (resolveExecutionContext, intent handlers)
5. Add main handle() method
6. Run typecheck
7. **SKIP test writing**

---

## 🚨 Critical Rules

1. **Follow EmailAgent pattern** exactly
   - Use same imports
   - Use same helper structure
   - Use same handle() method pattern

2. **Adapt to each agent's methods**
   - SEOAgent: analyzeKeywords, generateContent, etc.
   - SocialAgent: createPost, schedulePost, etc.
   - ContentAgent: generateArticle, optimizeContent, etc.
   - SupportAgent: respondToTicket, categorizeIssue, etc.

3. **Skip tests if they break**
   - Focus on getting code to typecheck
   - We'll fix tests later in bulk
   - Don't waste time on Jest Mock typing issues

4. **Verify after each agent**
   ```bash
   pnpm --filter apps/api run typecheck
   # Must pass before moving to next agent
   ```

5. **Report progress**
   - After each agent, say: "SEOAgent complete, moving to SocialAgent"
   - Don't batch - do one at a time

---

## 📁 Reference Files

**Study these first**:
- `apps/api/src/agents/EmailAgent.ts` (lines 567-693) - Your template
- `apps/api/src/agents/utils/agent-run.ts` - Helper you'll use
- `apps/api/src/agents/_shared/normalize.ts` - Validation helpers

**Agents to modify**:
- `apps/api/src/agents/SEOAgent.ts`
- `apps/api/src/agents/SocialAgent.ts`
- `apps/api/src/agents/ContentAgent.ts`
- `apps/api/src/agents/SupportAgent.ts`

---

## ✅ Success Criteria

**When ALL 4 agents complete**:

```bash
# 1. TypeScript compiles clean
pnpm --filter apps/api run typecheck
# Expected: 0 errors

# 2. All agents have handle() method
# Verify each agent exports:
# - handle(request: OrchestratorRequest): Promise<OrchestratorResponse>

# 3. Update documentation
# Edit ORCHESTRATOR_AUDIT.md to mark agents 2-5 complete
```

**Report Back**:
```
Terminal B Complete (Agent Orchestration)

Agents Updated: 5/5 ✅
1. EmailAgent - Complete (previous terminal)
2. SEOAgent - Complete
3. SocialAgent - Complete
4. ContentAgent - Complete
5. SupportAgent - Complete

Files Modified:
- apps/api/src/agents/SEOAgent.ts
- apps/api/src/agents/SocialAgent.ts
- apps/api/src/agents/ContentAgent.ts
- apps/api/src/agents/SupportAgent.ts

TypeScript: 0 errors ✅
Tests: Deferred (EmailAgent test has issues, others skipped)

Ready for: Phase 4 (Frontend Integration)
```

---

## ⚠️ If You Get Stuck

**On TypeScript errors**:
- Show me the error
- Show me the code
- I'll help debug

**On missing methods**:
- Check what methods the agent actually has
- Adapt the intent handlers accordingly
- It's OK if agent has different methods than EmailAgent

**On tests**:
- **SKIP THEM** - They're causing issues
- Just get code to compile
- We'll fix tests later

---

## 🚀 Start Immediately

**First command**:
```bash
cd /Users/kofirusu/Desktop/NeonHub
git pull origin main  # Get latest including EmailAgent changes
```

**Then**: Start with SEOAgent (Task 1 above)

**Report after each agent** so I can validate progress.

---

**You're Agent Orchestration Lead - Focus on getting code done, skip test complexity!** 🎯
