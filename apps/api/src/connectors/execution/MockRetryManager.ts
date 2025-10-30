export const mockRetryManager = {
  async run<T>(fn: () => Promise<T>): Promise<T> {
    return fn();
  },
};
