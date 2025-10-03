import { readJSON, readKnowledge } from "../lib/fsdb";
import { scoreMatch } from "../lib/search";

export type BrandProfile = {
  name: string;
  mission: string;
  tone: string[];
  pillars: string[];
  dos: string[];
  donts: string[];
  examplePhrases: string[];
  personas: { name: string; description: string }[];
  valueProps: string[];
};

export async function getBrandProfile(): Promise<BrandProfile> {
  return readJSON<BrandProfile>("brand-profile.json");
}

export async function searchKnowledge(q = "", filters?: { type?: string; agent?: string }) {
  const docs = await readKnowledge();
  let items = docs.map((d) => ({
    id: d.id,
    title: d.title,
    ref: d.ref,
    type: d.type,
    updatedAt: d.updatedAt,
    agent: undefined as string | undefined,
    score: q ? scoreMatch(d.text, q) + scoreMatch(d.title, q) * 3 : 0,
  }));
  if (filters?.type) items = items.filter((i) => i.type === filters.type);
  items.sort((a, b) => b.score - a.score);
  return items.map(({ score, ...rest }) => rest);
}



