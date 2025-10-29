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
  collectCoverageFrom: ["src/**/*.ts", "!src/server.ts"]
};
