import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from "@jest/globals";
import fs from "node:fs/promises";
import path from "node:path";

const DATA_ROOT = path.join(process.cwd(), "apps/api/data");
const KNOWLEDGE_DIR = path.join(DATA_ROOT, "knowledge");
const createdFiles: string[] = [];

describe("file-system database helpers", () => {
  beforeAll(async () => {
    await fs.mkdir(KNOWLEDGE_DIR, { recursive: true });
  });

  afterEach(async () => {
    for (const file of createdFiles.splice(0, createdFiles.length)) {
      await fs.rm(file, { force: true });
    }
  });

  afterAll(async () => {
    // Clean up empty directories that may have been created for the test
    try {
      const remaining = await fs.readdir(KNOWLEDGE_DIR);
      if (remaining.length === 0) {
        await fs.rmdir(KNOWLEDGE_DIR);
      }
    } catch {
      // ignore
    }
  });

  it("reads JSON documents from the data directory", async () => {
    const samplePath = path.join(DATA_ROOT, "sample.json");
    await fs.mkdir(DATA_ROOT, { recursive: true });
    await fs.writeFile(samplePath, JSON.stringify({ message: "hello" }), "utf8");
    createdFiles.push(samplePath);

    const { readJSON } = await import("../fsdb.js");
    const payload = await readJSON<{ message: string }>("sample.json");

    expect(payload).toEqual({ message: "hello" });
  });

  it("parses knowledge articles and derives metadata", async () => {
    const mdPath = path.join(KNOWLEDGE_DIR, "welcome.md");
    const txtPath = path.join(KNOWLEDGE_DIR, "snippet.txt");
    await fs.writeFile(mdPath, "# Welcome", "utf8");
    await fs.writeFile(txtPath, "plain text", "utf8");
    createdFiles.push(mdPath, txtPath);

    const { readKnowledge } = await import("../fsdb.js");
    const items = await readKnowledge();

    const ids = items.map((item) => item.id);
    expect(ids).toContain("welcome.md");
    expect(ids).toContain("snippet.txt");

    const markdownEntry = items.find((item) => item.id === "welcome.md");
    expect(markdownEntry?.type).toBe("markdown");
    expect(markdownEntry?.text).toContain("# Welcome");

    const textEntry = items.find((item) => item.id === "snippet.txt");
    expect(textEntry?.type).toBe("text");
    expect(textEntry?.text).toBe("plain text");
  });

  it("returns an empty array when knowledge directory is unavailable", async () => {
    const { readKnowledge } = await import("../fsdb.js");
    const spy = jest.spyOn(fs, "readdir").mockRejectedValueOnce(new Error("missing"));

    const result = await readKnowledge();
    expect(result).toEqual([]);

    spy.mockRestore();
  });
});
