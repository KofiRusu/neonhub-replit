/** Server bootstrap guard — call at startup for global protection. */
export function runBootstrapGuards() {
  const isProd = process.env.NODE_ENV === 'production';
  const useMocks = process.env.USE_MOCK_ADAPTERS !== 'false';
  if (!isProd) return;                // don’t block dev
  if (!useMocks) {
    const required = [
      'DATABASE_URL','REDIS_URL',
      'STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET',
      'PLAID_CLIENT_ID','PLAID_SECRET',
      'SUMSUB_APP_TOKEN','SUMSUB_SECRET_KEY',
      'OPENAI_API_KEY','INTERNAL_SIGNING_SECRET','JWT_SECRET'
    ];
    const missing = required.filter(k => !process.env[k]);
    if (missing.length) {
      const details = missing.map(m => `- ${m}`).join('\n');
      throw new Error(`Production startup blocked. Missing secrets:\n${details}`);
    }
  }
}
