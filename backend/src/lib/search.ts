export function scoreMatch(text: string, q: string): number {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const lower = text.toLowerCase();
  let score = 0;
  for (const t of terms) {
    const count = lower.split(t).length - 1;
    score += count * 2;
    if (lower.includes(` ${t} `)) score += 1;
  }
  return score;
}



