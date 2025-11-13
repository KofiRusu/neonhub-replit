import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { EventEmitter } from "node:events";

class MockQueue<T = unknown> extends EventEmitter {
  name: string;
  pending = 0;

  constructor(name: string, _options?: unknown) {
    super();
    this.name = name;
  }

  async add(jobName: string, data: T) {
    this.pending += 1;
    return { id: `${this.name}-${jobName}-${this.pending}`, data };
  }

  async getJobCounts() {
    return { waiting: this.pending };
  }
}

jest.mock(
  "bullmq",
  () => ({
    Queue: MockQueue,
  }),
  { virtual: true },
);

describe("BullMQ queue telemetry", () => {
  let queuesModule: typeof import("../apps/api/src/queues/index.ts");
  let metricsModule: typeof import("../apps/api/src/lib/metrics.ts");
  let recordSpy: jest.SpiedFunction<typeof import("../apps/api/src/lib/metrics.ts")["recordQueueJob"]>;
  let pendingSpy: jest.SpiedFunction<typeof import("../apps/api/src/lib/metrics.ts")["updateQueuePending"]>;

  beforeEach(async () => {
    jest.resetModules();

    metricsModule = await import("../apps/api/src/lib/metrics.js");
    recordSpy = jest.spyOn(metricsModule, "recordQueueJob");
    pendingSpy = jest.spyOn(metricsModule, "updateQueuePending");
    queuesModule = await import("../apps/api/src/queues/index.js");
  });

  it("records queue metrics on job add/completion/failure", async () => {
    const queue = queuesModule.queues["email.send"] as unknown as MockQueue;
    await queue.add("deliver", { id: "job-1" });

    expect(recordSpy).toHaveBeenCalledWith("email.send", "added");
    expect(pendingSpy).toHaveBeenCalledWith("email.send", 1);

    queue.emit("completed", { id: "job-1" });
    queue.emit("failed", { id: "job-1" }, new Error("boom"));

    expect(recordSpy).toHaveBeenCalledWith("email.send", "completed");
    expect(recordSpy).toHaveBeenCalledWith("email.send", "failed");
  });

  it("tracks failed jobs (DLQ path)", async () => {
    const queue = queuesModule.queues["sms.send"] as unknown as MockQueue;
    await queue.add("send", { id: "job-err" });
    const error = new Error("dlq");
    queue.emit("failed", { id: "job-err" }, error);

    expect(recordSpy).toHaveBeenLastCalledWith("sms.send", "failed");
  });
});
