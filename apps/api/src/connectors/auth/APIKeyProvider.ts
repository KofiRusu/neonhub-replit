export class APIKeyProvider {
  constructor(private readonly options: { requiredFields: string[] }) {}

  validate(payload: Record<string, string | undefined>) {
    const missing = this.options.requiredFields.filter(key => !payload[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required API key fields: ${missing.join(", ")}`);
    }
  }
}
