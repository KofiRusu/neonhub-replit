import baseConfig from "./jest.base.config.js";

const unitConfig = {
  ...baseConfig,
  displayName: "unit",
  testMatch: ["**/?(*.)+(test).ts", "**/?(*.)+(spec).ts"],
  testPathIgnorePatterns: [...baseConfig.testPathIgnorePatterns, "<rootDir>/src/__tests__/"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup-unit.ts"],
  collectCoverage: true,
  coverageReporters: ["text", "lcov", "html", "json-summary"],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    "^puppeteer$": "<rootDir>/src/__mocks__/puppeteer.ts",
    "^@tensorflow/tfjs-node$": "<rootDir>/src/__mocks__/@tensorflow/tfjs-node.ts",
    "^@tensorflow/tfjs$": "<rootDir>/src/__mocks__/@tensorflow/tfjs.ts",
    "^@tensorflow/tfjs/(.*)$": "<rootDir>/src/__mocks__/@tensorflow/tfjs.ts",
    "^@neonhub/predictive-engine$": "<rootDir>/src/__mocks__/predictive-engine.ts",
  },
};

export default unitConfig;
