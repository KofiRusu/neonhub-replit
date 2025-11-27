import { readability, coverage, brandFit, seoScore } from "./signals";

export type ScoreWeights = {
  readability: number;
  coverage: number;
  brand: number;
  seo: number;
};

export function computeScorecard(content: string, weights: ScoreWeights = {
  readability: 0.25,
  coverage: 0.25,
  brand: 0.25,
  seo: 0.25,
}) {
  const r = readability(content);
  const c = coverage(content);
  const b = brandFit(content);
  const s = seoScore(content);
  const total = r * weights.readability + c * weights.coverage + b * weights.brand + s * weights.seo;
  return {
    total: Number(total.toFixed(3)),
    breakdown: {
      readability: Number(r.toFixed(3)),
      coverage: Number(c.toFixed(3)),
      brand: Number(b.toFixed(3)),
      seo: Number(s.toFixed(3)),
    },
  };
}
