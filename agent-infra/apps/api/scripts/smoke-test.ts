import { config as loadEnv } from "dotenv";
import path from "node:path";
import { setTimeout as sleep } from "node:timers/promises";

loadEnv({ path: path.resolve(process.cwd(), ".env") });

const baseUrl = process.env.SMOKE_API_URL ?? "http://localhost:4000";
const workspaceSlug = process.env.SMOKE_WORKSPACE ?? "neonhub-default";
const workflowName = process.env.SMOKE_WORKFLOW ?? "HTTP to Slack";

async function run() {
  const requestBody = {
    workspaceSlug,
    workflowName,
    trigger: "manual"
  };

  const orchestrateResponse = await fetch(`${baseUrl}/orchestrate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody)
  });

  if (!orchestrateResponse.ok) {
    throw new Error(`Failed to orchestrate workflow: ${orchestrateResponse.status} ${orchestrateResponse.statusText}`);
  }

  const orchestratePayload = (await orchestrateResponse.json()) as { runId: string };
  const runId = orchestratePayload.runId;
  if (!runId) {
    throw new Error("No runId returned from orchestration");
  }

  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    const runResponse = await fetch(`${baseUrl}/runs/${runId}`);
    if (!runResponse.ok) {
      throw new Error(`Failed to fetch run state: ${runResponse.status}`);
    }

    const { run } = (await runResponse.json()) as { run: { status: string; error?: unknown } };
    if (run.status === "completed") {
      console.info(`Run ${runId} completed successfully`);
      return;
    }
    if (run.status === "failed" || run.status === "cancelled") {
      console.error("Run failed", run.error);
      process.exitCode = 1;
      return;
    }

    await sleep(2_000);
  }

  throw new Error(`Run ${runId} did not complete within timeout`);
}

run().catch(error => {
  console.error("Smoke test failed", error);
  process.exit(1);
});
