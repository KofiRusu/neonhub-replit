declare module "stripe" {
  export default class Stripe {
    constructor(apiKey: string, config?: Record<string, unknown>);
    customers: {
      list(params?: Record<string, unknown>): Promise<unknown>;
    };
  }
}
