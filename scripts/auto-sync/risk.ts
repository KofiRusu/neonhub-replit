export type RiskLevel = "low" | "medium" | "high";

export function scoreRisk(opts: {
  filesChanged: number;
  tsErrors: number;
  testFailures: number;
  touchedPrisma: boolean;
  touchedEnv: boolean;
}): RiskLevel {
  if (opts.touchedEnv) return "high";
  if (opts.touchedPrisma && (opts.tsErrors > 0 || opts.testFailures > 0)) return "high";
  const weight = opts.filesChanged + opts.tsErrors * 3 + opts.testFailures * 5 + (opts.touchedPrisma ? 2 : 0);
  if (weight <= 5) return "low";
  if (weight <= 15) return "medium";
  return "high";
}

