# Agent API Reference

## Execute Agent

```typescript
// Frontend usage:
const result = await trpc.agents.execute.mutate({
  agent: "email",
  intent: "generate-sequence",
  payload: {
    topic: "Product Launch",
    numEmails: 3,
  },
});
```

## List Agent Runs

```typescript
const runs = await trpc.agents.listRuns.query({
  agentId: "email-agent",
  limit: 20,
});
```

## Get Run Details

```typescript
const run = await trpc.agents.getRun.query({
  runId: "run_123",
});
```
