import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../data");

export async function readJSON<T>(rel: string): Promise<T> {
  const p = path.join(ROOT, rel);
  const raw = await fs.readFile(p, "utf8");
  return JSON.parse(raw) as T;
}

export type DocItem = { id: string; title: string; ref: string; type: string; agent?: string; updatedAt: string; text: string };
export async function readKnowledge(): Promise<DocItem[]> {
  const dir = path.join(ROOT, "knowledge");
  let files: string[] = [];
  try {
    files = await fs.readdir(dir);
  } catch {
    return [];
  }
  const now = new Date().toISOString();
  const items: DocItem[] = [];
  for (const f of files) {
    try {
      const full = path.join(dir, f);
      const txt = await fs.readFile(full, "utf8");
      items.push({
        id: f,
        title: f.replace(/\.(md|txt)$/i, ""),
        ref: `knowledge/${f}`,
        type: f.endsWith(".md") ? "markdown" : "text",
        updatedAt: now,
        text: txt,
      });
    } catch {
      // skip unreadable files
    }
  }
  return items;
}


