const rewards = new Map<string, { score: number; count: number }>();

export function recordReward(agentId: string, score: number) {
  const entry = rewards.get(agentId) ?? { score: 0, count: 0 };
  entry.score += score;
  entry.count += 1;
  rewards.set(agentId, entry);
  return getReward(agentId);
}

export function getReward(agentId: string) {
  const entry = rewards.get(agentId);
  if (!entry) return { average: 0, count: 0 };
  return { average: entry.score / entry.count, count: entry.count };
}
