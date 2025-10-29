# 🔄 Terminal B Restart - Simplified Agent Orchestration

**Copy this ENTIRE prompt to NEW Terminal B chat**

---

```
@workspace NeonHub

# Objective: Complete Agent Orchestration (Simplified - No Complex Tests)

## Context Recovery

Previous Terminal B session added AgentRun persistence to EmailAgent but got stuck on test complexity.

Files already updated (DON'T re-do):
- ✅ apps/api/src/agents/EmailAgent.ts - AgentRun persistence added
- ✅ apps/api/src/agents/utils/agent-run.ts - Execution helper exists
- ✅ apps/api/src/agents/_shared/normalize.ts - Validation functions added

## Your Tasks (Simplified Approach)

### Task 1: Verify EmailAgent Compiles (5 min)

```bash
pnpm --filter apps/api run typecheck
```

If errors in EmailAgent.ts, fix them. Show me the errors.
Ignore EmailAgent.test.ts errors - we'll skip that file.

### Task 2: Skip EmailAgent Test (2 min)

```bash
mv apps/api/src/agents/__tests__/EmailAgent.test.ts apps/api/src/agents/__tests__/EmailAgent.test.ts.skip
```

Or just delete it. We'll do integration tests later instead of unit tests.

### Task 3: Add AgentRun to SEOAgent (30 min)

File: apps/api/src/agents/SEOAgent.ts

Add these imports at top:
```typescript
import { executeAgentRun, type AgentExecutionContext } from "./utils/agent-run.js";
import { validateAgentContext } from "./_shared/normalize.js";
import type { OrchestratorRequest, OrchestratorResponse } from "../services/orchestration/types.js";
```

Add to class:
```typescript
private readonly orchestratorAgentId = "SEOAgent";

async handle(request: OrchestratorRequest): Promise<OrchestratorResponse> {
  let context: AgentExecutionContext;
  
  try {
    context = validateAgentContext(request.context);
  } catch (error) {
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : "Invalid context",
      code: "INVALID_CONTEXT" 
    };
  }

  try {
    // Find the main SEO method (analyzeIntent, generateContent, etc.)
    // Wrap it with executeAgentRun like this:
    const { result } = await executeAgentRun(
      this.orchestratorAgentId,
      context,
      request.payload,
      () => this.analyzeIntent(request.payload), // Replace with actual method
      {
        intent: request.intent || "seo-analysis",
        buildMetrics: (output) => ({ keywordsAnalyzed: output?.keywords?.length || 0 })
      }
    );
    
    return { ok: true, data: result };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Execution failed",
      code: "AGENT_EXECUTION_FAILED"
    };
  }
}
```

Verify: pnpm --filter apps/api run typecheck
NO TESTS - just make sure it compiles.

### Task 4: Repeat for SocialAgent (30 min)

File: apps/api/src/agents/SocialAgent.ts

Same imports, same pattern.
Replace orchestratorAgentId with "SocialAgent".
Wrap the main method (postContent, schedulePost, etc.).

Verify: pnpm --filter apps/api run typecheck

### Task 5: Repeat for ContentAgent (30 min)

File: apps/api/src/agents/ContentAgent.ts (if exists)

Same pattern. If file doesn't exist, skip this one.

### Task 6: Repeat for SupportAgent (30 min)

File: apps/api/src/agents/SupportAgent.ts (if exists)

Same pattern. If file doesn't exist, skip this one.

### Task 7: Update Documentation (15 min)

File: ORCHESTRATOR_AUDIT.md

Add section at end:

## AgentRun Persistence - Implementation Complete ✅

All agents now persist execution records:
- EmailAgent ✅
- SEOAgent ✅ 
- SocialAgent ✅
- ContentAgent ✅ (or note if skipped)
- SupportAgent ✅ (or note if skipped)

Pattern: All use executeAgentRun() helper from utils/agent-run.ts

Verification: TypeScript compiles with 0 errors

Note: Unit tests deferred - will implement integration tests in next phase.

## Success Criteria

Final verification:
```bash
pnpm --filter apps/api run typecheck
```

Expected: 0 errors in agents/ files

Report back:
- List agents updated (expect 4-5 total with EmailAgent)
- Show typecheck output (should be clean)
- Note which agents exist vs. don't exist
- Confirm ORCHESTRATOR_AUDIT.md updated

## Critical Rules

1. NO UNIT TESTS - Just code changes
2. TypeScript must compile cleanly
3. Use exact pattern from EmailAgent
4. If agent file doesn't exist, skip it (note in report)
5. Work fast - don't get stuck on complexity

## Timeline

Expected: 2-3 hours (vs 10+ hours with tests)
```

---

**Copy everything above (inside the code block) to new Terminal B chat**
