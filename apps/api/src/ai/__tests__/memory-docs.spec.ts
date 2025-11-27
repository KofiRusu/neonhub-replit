import fs from "fs";
import os from "os";
import path from "path";

describe("ai memory docs cache", () => {
  const originalCwd = process.cwd();
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "memory-docs-"));
    process.chdir(tempDir);
    jest.resetModules();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns empty array when cache is absent", async () => {
    const { recent } = await import("../memory/docs");
    expect(recent()).toEqual([]);
  });

  it("appends documents and respects limits", async () => {
    const { addDoc, recent } = await import("../memory/docs");

    addDoc("doc-1", "First entry");
    addDoc("doc-2", "Second entry", { topic: "launch" });
    addDoc("doc-3", "Third entry");

    const cacheFile = path.join(tempDir, "logs", "ai-docs.jsonl");
    expect(fs.existsSync(cacheFile)).toBe(true);

    const latest = recent(2);
    expect(latest).toHaveLength(2);
    expect(latest[0].id).toBe("doc-2");
    expect(latest[0].meta).toMatchObject({ topic: "launch" });
    expect(latest[1].id).toBe("doc-3");
    expect(latest[1].text).toBe("Third entry");
  });
});
