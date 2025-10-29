/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: [],
  extends: ["eslint:recommended"],
  ignorePatterns: [
    "**/dist/**",
    "**/build/**",
    "**/node_modules/**",
    "*.config.js",
    "*.config.cjs",
    "*.config.mjs",
  ],
  rules: {
    "no-console": ["warn", { allow: ["warn", "error", "info", "debug"] }],
  },
};
