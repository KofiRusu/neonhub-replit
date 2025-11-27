/** Production guards (JS twin) — lets preflight run without a TS build. */
const REQUIRED_SECRETS = [
  "DATABASE_URL","REDIS_URL",
  "STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET",
  "PLAID_CLIENT_ID","PLAID_SECRET",
  "SUMSUB_APP_TOKEN","SUMSUB_SECRET_KEY",
  "OPENAI_API_KEY","INTERNAL_SIGNING_SECRET","JWT_SECRET"
];

export function assertProductionConfig(env){
  const usingMocks = env.USE_MOCK_ADAPTERS !== "false";
  const missing = REQUIRED_SECRETS.filter((k)=> !env[k]);
  const warnings = [];
  if (!usingMocks && missing.length) {
    warnings.push("USE_MOCK_ADAPTERS is false but required provider secrets are missing.");
  }
  if (env.FINTECH_ENABLED === "true" && usingMocks) {
    warnings.push("FINTECH_ENABLED=true while USE_MOCK_ADAPTERS=true; live providers won’t be called.");
  }
  return { ok: missing.length === 0, missing, warnings };
}

export function enforceProductionConfig(env){
  const { ok, missing, warnings } = assertProductionConfig(env);
  for (const w of warnings) console.warn(`[production-guard] ${w}`);
  if (!ok) {
    const details = missing.map((m) => `- ${m}`).join("\n");
    throw new Error(
      `Production configuration invalid. Missing secrets:\n${details}\n` +
      `Restore USE_MOCK_ADAPTERS=true until all secrets are provided.`
    );
  }
}
