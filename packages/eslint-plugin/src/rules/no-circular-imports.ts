/**
 * Rule: no-circular-imports
 *
 * Detects circular import chains within a package.
 *
 * ADR: ADR-002-governance-schema (ESLint plugin architecture)
 * CR: CR-20251214-002
 */

import type { Rule } from "eslint";
import { existsSync, statSync } from "node:fs";
import { dirname, join, normalize, resolve, sep } from "node:path";

interface RuleOptions {
  maxDepth?: number;
  ignoreTypeImports?: boolean;
}

const DEFAULT_MAX_DEPTH = 5;
const DEFAULT_IGNORE_TYPE_IMPORTS = true;
const KNOWN_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
];

const importGraph = new Map<string, Set<string>>();
const resolvedPathCache = new Map<string, string | null>();
const packageRootCache = new Map<string, string | null>();
const reportedCycles = new Set<string>();
let graphEdgeCount = 0;
let lastCycleCheckEdgeCount = 0;

const rule: Rule.RuleModule = {
  meta: {
    type: "problem",
    docs: {
      description: "Detect circular import chains within a package",
      category: "Code Hygiene",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          maxDepth: {
            type: "number",
            minimum: 1,
            default: DEFAULT_MAX_DEPTH,
            description: "Maximum depth to traverse when searching for cycles",
          },
          ignoreTypeImports: {
            type: "boolean",
            default: DEFAULT_IGNORE_TYPE_IMPORTS,
            description: "Ignore type-only imports when building the graph",
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      circularImport:
        "Circular import detected: {{chain}}", // Placeholder message; final implementation will format chain
    },
  },

  create(context) {
    const options = (context.options[0] || {}) as RuleOptions;
    const maxDepth =
      typeof options.maxDepth === "number"
        ? options.maxDepth
        : DEFAULT_MAX_DEPTH;
    const ignoreTypeImports =
      options.ignoreTypeImports ?? DEFAULT_IGNORE_TYPE_IMPORTS;
    const filename = normalize(context.getFilename());
    const packageRoot = findPackageRoot(filename);

    return {
      ImportDeclaration(node: any) {
        if (!packageRoot) {
          return;
        }

        if (
          ignoreTypeImports &&
          (node.importKind === "type" || isTypeOnlySpecifiers(node.specifiers))
        ) {
          return;
        }

        const target = resolveImportTarget(node.source?.value, filename, packageRoot);

        if (!target) {
          return;
        }

        addEdge(importGraph, filename, target);
        void maxDepth;
      },

      "Program:exit"() {
        if (!packageRoot) {
          return;
        }

        if (graphEdgeCount === lastCycleCheckEdgeCount) {
          return;
        }

        detectCyclesInGraph(importGraph, maxDepth, packageRoot, context);
        lastCycleCheckEdgeCount = graphEdgeCount;
      },
    };
  },
};

export default rule;

function isTypeOnlySpecifiers(specifiers: any[]): boolean {
  if (!specifiers.length) return false;
  return specifiers.every(
    (specifier) =>
      specifier.type === "ImportSpecifier" && specifier.importKind === "type"
  );
}

function resolveImportTarget(
  source: unknown,
  importer: string,
  packageRoot: string
): string | null {
  const cacheKey = `${importer}::${String(source)}`;
  if (resolvedPathCache.has(cacheKey)) {
    return resolvedPathCache.get(cacheKey) ?? null;
  }

  if (typeof source !== "string") {
    resolvedPathCache.set(cacheKey, null);
    return null;
  }

  // Only resolve relative imports; external modules are skipped
  if (!source.startsWith(".")) {
    resolvedPathCache.set(cacheKey, null);
    return null;
  }

  const importerDir = dirname(importer);
  const absolutePath = normalize(resolve(importerDir, source));
  const packageRootWithSep = packageRoot.endsWith(sep)
    ? packageRoot
    : `${packageRoot}${sep}`;

  if (!absolutePath.startsWith(packageRootWithSep)) {
    resolvedPathCache.set(cacheKey, null);
    return null;
  }

  if (absolutePath.includes(`${sep}node_modules${sep}`)) {
    resolvedPathCache.set(cacheKey, null);
    return null;
  }

  const resolvedFile = resolveWithExtensions(absolutePath);
  const target = resolvedFile ?? absolutePath;
  resolvedPathCache.set(cacheKey, target);
  return target;
}

function resolveWithExtensions(basePath: string): string | null {
  if (existsSync(basePath)) {
    if (statSync(basePath).isDirectory()) {
      for (const ext of KNOWN_EXTENSIONS) {
        const indexPath = join(basePath, `index${ext}`);
        if (existsSync(indexPath)) {
          return normalize(indexPath);
        }
      }
      return null;
    }
    return normalize(basePath);
  }

  for (const ext of KNOWN_EXTENSIONS) {
    const candidate = `${basePath}${ext}`;
    if (existsSync(candidate)) {
      return normalize(candidate);
    }
  }

  return null;
}

function addEdge(graph: Map<string, Set<string>>, from: string, to: string) {
  const normalizedFrom = normalize(from);
  const normalizedTo = normalize(to);
  const neighbors = graph.get(normalizedFrom) ?? new Set<string>();
  const sizeBefore = neighbors.size;
  neighbors.add(normalizedTo);
  graph.set(normalizedFrom, neighbors);
  if (neighbors.size > sizeBefore) {
    graphEdgeCount += 1;
  }
}

function findPackageRoot(filePath: string): string | null {
  if (packageRootCache.has(filePath)) {
    return packageRootCache.get(filePath) ?? null;
  }

  let currentDir = dirname(filePath);
  while (currentDir !== dirname(currentDir)) {
    const candidate = join(currentDir, "package.json");
    if (existsSync(candidate)) {
      packageRootCache.set(filePath, currentDir);
      return currentDir;
    }
    currentDir = dirname(currentDir);
  }

  packageRootCache.set(filePath, null);
  return null;
}

function detectCyclesInGraph(
  graph: Map<string, Set<string>>,
  maxDepth: number,
  packageRoot: string,
  context: Rule.RuleContext
) {
  const visited = new Set<string>();

  for (const startNode of graph.keys()) {
    if (visited.has(startNode)) {
      continue;
    }
    const stack: string[] = [];
    const stackSet = new Set<string>();
    const root = findPackageRoot(startNode) || packageRoot;

    dfs(startNode, 0, maxDepth, graph, stack, stackSet, visited, root, context);
  }
}

function dfs(
  node: string,
  depth: number,
  maxDepth: number,
  graph: Map<string, Set<string>>,
  stack: string[],
  stackSet: Set<string>,
  visited: Set<string>,
  packageRoot: string,
  context: Rule.RuleContext
) {
  if (depth > maxDepth) {
    return;
  }

  stack.push(node);
  stackSet.add(node);

  const neighbors = graph.get(node);
  if (neighbors) {
    for (const neighbor of neighbors) {
      if (stackSet.has(neighbor)) {
        const cycleStartIndex = stack.indexOf(neighbor);
        const cyclePath = stack.slice(cycleStartIndex).concat(neighbor);
        const chain = formatCycleChain(cyclePath, packageRoot);
        if (!reportedCycles.has(chain)) {
          reportedCycles.add(chain);
          context.report({
            loc: { line: 1, column: 0 },
            messageId: "circularImport",
            data: { chain: `\n  ${chain}` },
          });
        }
        continue;
      }

      if (depth + 1 > maxDepth) {
        continue;
      }

      if (!visited.has(neighbor)) {
        dfs(
          neighbor,
          depth + 1,
          maxDepth,
          graph,
          stack,
          stackSet,
          visited,
          packageRoot,
          context
        );
      }
    }
  }

  stack.pop();
  stackSet.delete(node);
  visited.add(node);
}

function formatCycleChain(paths: string[], packageRoot: string): string {
  const rootPrefix = packageRoot.endsWith(sep) ? packageRoot : `${packageRoot}${sep}`;
  const display = paths.map((path) => {
    const normalizedPath = normalize(path);
    if (normalizedPath.startsWith(rootPrefix)) {
      return normalizedPath.slice(rootPrefix.length);
    }
    return normalizedPath;
  });
  return display.join(" -> ");
}
