import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Warnings (should fix but not blocking)
      "@typescript-eslint/no-explicit-any": ["warn", { ignoreRestArgs: false }], // Warning budget allows this
      "@next/next/no-img-element": "warn", // Allow <img> with warning
      "react/jsx-no-target-blank": "warn",
      
      // Errors (must fix)
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_"
      }],
      "react/no-unescaped-entities": "error",
      "react-hooks/exhaustive-deps": "error",
      "react/no-unknown-property": "error",
      
      // Disable overly strict rules
      "@typescript-eslint/no-require-imports": "off", // Some legacy code needs this
    },
  },
  {
    files: ["**/__tests__/**/*", "**/*.test.*", "**/*.spec.*"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Allow any in tests
    },
  },
];

export default eslintConfig;
