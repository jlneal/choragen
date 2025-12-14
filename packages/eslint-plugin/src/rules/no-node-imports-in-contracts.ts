/**
 * Rule: no-node-imports-in-contracts
 *
 * Prevents Node.js-specific imports inside @choragen/contracts to keep the
 * package client-safe.
 *
 * ADR: ADR-002-governance-schema
 * CR: CR-20251214-003
 */

import type { Rule } from "eslint";

const NODE_PROTOCOL_PREFIX = "node:";

const NODE_BUILTIN_MODULES = new Set([
  "fs",
  "path",
  "crypto",
  "child_process",
  "os",
  "http",
  "https",
  "net",
  "dgram",
  "dns",
  "tls",
  "readline",
  "repl",
  "vm",
  "worker_threads",
  "cluster",
  "perf_hooks",
  "async_hooks",
  "v8",
  "inspector",
  "buffer",
  "stream",
  "zlib",
  "util",
  "events",
  "assert",
  "url",
  "querystring",
  "string_decoder",
  "timers",
  "tty",
  "punycode",
  "domain",
  "constants",
  "module",
  "process",
]);

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow Node.js built-in imports within @choragen/contracts to keep it client-safe",
      category: "Contracts",
      recommended: true,
    },
    schema: [],
    messages: {
      noNodeImport:
        "Node.js import '{{module}}' is not allowed in @choragen/contracts. " +
        "This package must remain client-safe. Move Node.js-specific code to @choragen/core.",
    },
  },
  create(context) {
    const rawFilename = context.filename ?? context.getFilename();
    const normalizedFilename = rawFilename.replace(/\\/g, "/");

    if (!normalizedFilename.includes("/packages/contracts/")) {
      return {};
    }

    return {
      ImportDeclaration(node: any) {
        const source = node.source?.value;

        if (typeof source !== "string") {
          return;
        }

        if (source.startsWith(NODE_PROTOCOL_PREFIX)) {
          context.report({
            node,
            messageId: "noNodeImport",
            data: { module: source },
          });
          return;
        }

        if (NODE_BUILTIN_MODULES.has(source)) {
          context.report({
            node,
            messageId: "noNodeImport",
            data: { module: source },
          });
        }
      },
    };
  },
};

export default rule;
