export default {
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)sx?$": ["ts-jest", { useESM: true, tsconfig: "./tsconfig.json" }]
  },
  moduleNameMapper: {
    "^(.*)\\.js$": "$1"
  },
  extensionsToTreatAsEsm: [".ts"],
  roots: ["<rootDir>/src", "<rootDir>/tests"],
  collectCoverageFrom: ["src/**/*.ts", "!src/**/index.ts"],
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0
    }
  }
};
