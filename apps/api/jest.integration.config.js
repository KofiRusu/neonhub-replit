import baseConfig from "./jest.base.config.js";

const integrationConfig = {
  ...baseConfig,
  displayName: "integration",
  testMatch: ["<rootDir>/src/__tests__/**/*.spec.ts", "<rootDir>/src/__tests__/**/*.test.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup-integration.ts"],
  collectCoverage: false,
  coverageThreshold: undefined,
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
  },
  maxWorkers: 1,
  workerIdleMemoryLimit: "768MB",
};

export default integrationConfig;
