/**
 * ESLint configuration for Choragen
 *
 * Uses @choragen/eslint-plugin for self-hosted enforcement.
 *
 * ADR: ADR-002-governance-schema
 */

import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

// Import our own plugin (built version)
import choragenPlugin from "./packages/eslint-plugin/dist/index.js";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/*.d.ts",
      "**/*.js",
      "**/*.mjs",
    ],
  },

  // TypeScript files
  {
    files: ["packages/*/src/**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "@choragen": choragenPlugin,
    },
    rules: {
      // TypeScript rules
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off", // We use any in ESLint rules

      // Choragen rules (self-hosted) - ALL ERRORS for deterministic feedback
      "@choragen/require-adr-reference": "error",
      "@choragen/no-as-unknown": "error",
      "@choragen/no-magic-numbers-http": "error",
      "@choragen/no-untracked-todos": "error",
      "@choragen/require-chain-design-dependency": "error",
      "@choragen/require-eslint-disable-justification": "error",
    },
  },

  // Test files
  {
    files: ["packages/*/**/__tests__/**/*.ts", "packages/*/**/*.test.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "@choragen": choragenPlugin,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",

      // Test-specific rules - ALL ERRORS for deterministic feedback
      "@choragen/require-test-metadata": "error",
      "@choragen/no-as-unknown": "off", // Tests may need unsafe casts
      "@choragen/no-untracked-todos": "error",
      "@choragen/require-eslint-disable-justification": "error",
    },
  },
];
