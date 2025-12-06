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
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off", // We use any in ESLint rules

      // Choragen rules (self-hosted)
      "@choragen/require-adr-reference": "warn",
      "@choragen/no-as-unknown": "warn",
      "@choragen/no-magic-numbers-http": "warn",

      // Disabled for now - not all files need these yet
      // "@choragen/require-test-metadata": "warn",
      // "@choragen/require-design-contract": "warn",
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
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "off",

      // Test-specific rules
      "@choragen/require-test-metadata": "warn",
      "@choragen/no-as-unknown": "off", // Tests may need unsafe casts
    },
  },
];
