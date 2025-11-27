import fs from "fs";
import path from "path";

const CACHE_PATH = path.join(process.cwd(), "logs", "ai-docs.jsonl");

function ensureDir() {
  const dir = path.dirname(CACHE_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export type DocRecord = { id: string; text: string; meta: Record<string, unknown>; ts: number };

export function addDoc(id: string, text: string, meta: Record<string, unknown> = {}) {
  ensureDir();
  const record: DocRecord = { id, text, meta, ts: Date.now() };
  fs.appendFileSync(CACHE_PATH, `${JSON.stringify(record)}\n`);
  return record;
}

export function recent(limit = 10): DocRecord[] {
  if (!fs.existsSync(CACHE_PATH)) return [];
  const lines = fs.readFileSync(CACHE_PATH, "utf8").trim().split("\n").filter(Boolean);
  return lines.slice(-limit).map((line) => JSON.parse(line));
}
