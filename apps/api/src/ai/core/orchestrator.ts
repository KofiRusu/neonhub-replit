import { runPipeline } from "../workflows/pipeline";
import { REGISTRY } from "./registry";
import type { TaskSpec } from "./reason";
import { route } from "./reason";
import { useLiveModel } from "../utils/runtime";
import { recordReward } from "../scoring/reward";
// @ts-ignore adjust path when integrating fully
import { startRun, recordStep, finishRun } from "../../services/agent-run.service";

export async function executePreview(task: TaskSpec, agentOverride?: string) {
  const agent = agentOverride ?? route(task, REGISTRY);
  const result = await runPipeline({ ...task, channel: task.channel ?? "blog" });
  recordReward(agent, result.score.total);
  return {
    agent,
    usedLiveModel: useLiveModel(),
    ...result,
  };
}

export async function executeTask(
  db: any,
  orgId: string,
  agentName: string,
  task: TaskSpec,
) {
  const agentId = agentName;
  const agent = route(task, REGISTRY) ?? agentName;
  const run = await startRun(db, {
    agentId,
    agentName,
    orgId,
    payload: task,
    objective: task.objective,
    meta: { channel: task.channel ?? "blog" },
  });

  try {
    const output = await recordStep(
      db,
      run.id,
      "ai-pipeline",
      () => runPipeline({ ...task, channel: task.channel ?? "blog" }),
      {},
    );
    recordReward(agent, output.score.total);
    await finishRun(db, run, { status: "SUCCESS", result: output });
    return { runId: run.id, agent, usedLiveModel: useLiveModel(), result: output };
  } catch (error) {
    await finishRun(db, run, { status: "FAILED", error });
    throw error;
  }
}
