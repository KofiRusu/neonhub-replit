const forbiddenPatterns = [
  /password/i,
  /ssn/i,
  /credit\s*card/i,
];

export function moderationCheck(content: string) {
  const violations = forbiddenPatterns
    .filter((pattern) => pattern.test(content))
    .map((pattern) => pattern.toString());

  return {
    ok: violations.length === 0,
    violations,
  };
}

export function enforceBrandRules(content: string, brandGuide: { tone?: string[] } = {}) {
  if (!brandGuide.tone || brandGuide.tone.length === 0) return { ok: true, message: "no tone rules" };
  const hasTone = brandGuide.tone.some((rule) => content.toLowerCase().includes(rule.toLowerCase()));
  return {
    ok: hasTone,
    message: hasTone ? "tone aligned" : "missing brand tone signal",
  };
}
