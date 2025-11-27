const baseConfig = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  roots: ["<rootDir>/src"],
  globals: {
    "ts-jest": {
      isolatedModules: true,
      diagnostics: false,
      tsconfig: "tsconfig.json",
      useESM: true,
    },
  },
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
        useESM: true,
      },
    ],
  },
  transformIgnorePatterns: ["/node_modules/(?!(uuid|superjson|copy-anything|is-what)/)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  setupFiles: ["<rootDir>/jest.setup.ts"],
  workerIdleMemoryLimit: "512MB",
  maxWorkers: 1,
  testTimeout: 30000,
  passWithNoTests: false,
  coverageProvider: "v8",
  collectCoverageFrom: [
    "src/lib/**/*.ts",
    "src/observability/**/*.ts",
    "src/services/**/*.ts",
    "src/agents/utils/**/*.ts",
    "src/routes/orchestration/**/*.ts",
    "src/trpc/**/*.ts",
    "src/ai/**/*.ts",
    "!src/**/__tests__/**",
    "!src/**/__mocks__/**",
    "!src/**/*.d.ts",
  ],
  modulePathIgnorePatterns: ["<rootDir>/.pnpm", "<rootDir>/dist", "<rootDir>/build", "<rootDir>/logs"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "\\.skip\\.ts$"],
  verbose: true,
  forceExit: true,
};

export default baseConfig;
