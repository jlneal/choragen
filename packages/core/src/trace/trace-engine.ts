/**
 * TraceEngine - Core orchestrator for traceability traversal
 *
 * Walks the traceability chain in both directions (upstream/downstream)
 * from any starting artifact, discovering links and verifying bidirectional
 * relationships.
 *
 * @design-doc docs/design/core/features/trace-command.md
 * ADR: ADR-001-task-file-format (traceability patterns)
 */

import * as fs from "node:fs/promises";
import * as path from "node:path";
import type {
  ArtifactReference,
  ArtifactType,
  BidirectionalStatus,
  LinkRelationship,
  MissingLink,
  TraceConfig,
  TraceMetadata,
  TraceNode,
  TraceOptions,
  TraceResult,
  TraceSummary,
} from "./types.js";
import { DEFAULT_TRACE_CONFIG, DEFAULT_TRACE_OPTIONS } from "./types.js";
import { TraceCache, type DiscoveredLinks } from "./cache.js";
import { ParserRegistry, createParseContext } from "./parsers/index.js";

/**
 * TraceEngine orchestrates traceability traversal across the codebase
 */
export class TraceEngine {
  private config: Required<TraceConfig>;
  private cache: TraceCache;
  private parserRegistry: ParserRegistry;

  constructor(config: TraceConfig) {
    this.config = {
      ...config,
      artifactPaths: {
        ...DEFAULT_TRACE_CONFIG.artifactPaths,
        ...config.artifactPaths,
      },
      cacheTtlMs: config.cacheTtlMs ?? DEFAULT_TRACE_CONFIG.cacheTtlMs,
    };
    this.cache = new TraceCache(this.config.cacheTtlMs);
    this.parserRegistry = new ParserRegistry();
  }

  /**
   * Perform a trace from the given artifact
   */
  async trace(
    artifactPath: string,
    options: TraceOptions = {}
  ): Promise<TraceResult> {
    const opts = { ...DEFAULT_TRACE_OPTIONS, ...options };
    const startTime = Date.now();

    // Check cache first if enabled
    if (opts.useCache) {
      const cached = this.cache.getTrace(artifactPath);
      if (cached) {
        return {
          ...cached,
          metadata: {
            ...cached.metadata,
            cached: true,
          },
        };
      }
    }

    // Resolve the artifact
    const artifact = await this.resolveArtifact(artifactPath);
    if (!artifact) {
      throw new Error(`Artifact not found: ${artifactPath}`);
    }

    // Track visited nodes for cycle detection
    const visited = new Set<string>();

    // Trace upstream and downstream
    const upstream: TraceNode[] = [];
    const downstream: TraceNode[] = [];
    const missing: MissingLink[] = [];

    if (opts.direction === "both" || opts.direction === "upstream") {
      const upstreamResult = await this.traceDirection(
        artifact,
        "upstream",
        visited,
        opts.maxDepth,
        0
      );
      upstream.push(...upstreamResult.nodes);
      missing.push(...upstreamResult.missing);
    }

    // Reset visited for downstream (allow revisiting in opposite direction)
    visited.clear();
    visited.add(artifact.path);

    if (opts.direction === "both" || opts.direction === "downstream") {
      const downstreamResult = await this.traceDirection(
        artifact,
        "downstream",
        visited,
        opts.maxDepth,
        0
      );
      downstream.push(...downstreamResult.nodes);
      missing.push(...downstreamResult.missing);
    }

    // Calculate summary
    const summary = this.calculateSummary(artifact, upstream, downstream, missing);

    // Build metadata
    const metadata: TraceMetadata = {
      timestamp: new Date().toISOString(),
      direction: opts.direction ?? "both",
      maxDepth: opts.maxDepth ?? null,
      cached: false,
      durationMs: Date.now() - startTime,
    };

    const result: TraceResult = {
      artifact,
      upstream,
      downstream,
      missing: opts.showMissing ? missing : [],
      summary,
      metadata,
    };

    // Cache the result
    if (opts.useCache) {
      this.cache.setTrace(artifactPath, result);
    }

    return result;
  }

  /**
   * Trace in a specific direction (upstream or downstream)
   */
  private async traceDirection(
    artifact: ArtifactReference,
    direction: "upstream" | "downstream",
    visited: Set<string>,
    maxDepth: number | null | undefined,
    currentDepth: number
  ): Promise<{ nodes: TraceNode[]; missing: MissingLink[] }> {
    // Check depth limit
    if (maxDepth !== null && maxDepth !== undefined && currentDepth >= maxDepth) {
      return { nodes: [], missing: [] };
    }

    // Mark as visited
    visited.add(artifact.path);

    // Discover links from this artifact
    const links = await this.discoverLinks(artifact);
    const relevantLinks =
      direction === "upstream" ? links.upstream : links.downstream;

    const nodes: TraceNode[] = [];
    const missing: MissingLink[] = [];

    for (const linkedArtifact of relevantLinks) {
      // Cycle detection
      if (visited.has(linkedArtifact.path)) {
        continue;
      }

      // Check if the linked artifact exists
      const exists = await this.artifactExists(linkedArtifact.path);
      if (!exists) {
        missing.push({
          type: "missing",
          expected: {
            type: linkedArtifact.type,
            id: linkedArtifact.id,
            path: linkedArtifact.path,
          },
          referencedFrom: artifact,
          message: `Referenced artifact not found: ${linkedArtifact.path}`,
        });
        continue;
      }

      // Determine relationship type
      const relationship = this.inferRelationship(artifact, linkedArtifact, direction);

      // Check bidirectional status
      const bidirectional = await this.checkBidirectional(
        artifact,
        linkedArtifact,
        direction
      );

      // Recursively trace children
      const childResult = await this.traceDirection(
        linkedArtifact,
        direction,
        visited,
        maxDepth,
        currentDepth + 1
      );

      nodes.push({
        artifact: linkedArtifact,
        relationship,
        bidirectional,
        children: childResult.nodes,
      });

      missing.push(...childResult.missing);
    }

    return { nodes, missing };
  }

  /**
   * Resolve an artifact path or ID to an ArtifactReference
   */
  async resolveArtifact(pathOrId: string): Promise<ArtifactReference | null> {
    // Check cache first
    const cached = this.cache.getArtifact(pathOrId);
    if (cached) return cached;

    // Try as a direct path first
    const fullPath = path.isAbsolute(pathOrId)
      ? pathOrId
      : path.join(this.config.projectRoot, pathOrId);

    try {
      await fs.access(fullPath);
      const artifact = await this.parseArtifact(fullPath);
      if (artifact) {
        this.cache.setArtifact(pathOrId, artifact);
      }
      return artifact;
    } catch {
      // Not a direct path, try to resolve as ID
      return this.resolveArtifactById(pathOrId);
    }
  }

  /**
   * Resolve an artifact by its ID (e.g., CR-20251206-011, ADR-001)
   */
  private async resolveArtifactById(
    id: string
  ): Promise<ArtifactReference | null> {
    // Determine type from ID pattern
    if (id.startsWith("CR-") || id.startsWith("FR-")) {
      return this.findRequestById(id);
    }
    if (id.startsWith("ADR-")) {
      return this.findAdrById(id);
    }
    if (id.startsWith("CHAIN-")) {
      return this.findChainById(id);
    }

    // Unknown ID format
    return null;
  }

  /**
   * Find a request (CR/FR) by ID
   */
  private async findRequestById(id: string): Promise<ArtifactReference | null> {
    const requestsDir = this.config.artifactPaths.requests;
    if (!requestsDir) return null;
    const requestsPath = path.join(this.config.projectRoot, requestsDir);
    const type = id.startsWith("CR-") ? "change-requests" : "fix-requests";

    // Search in todo, doing, done directories
    for (const status of ["todo", "doing", "done"]) {
      const dir = path.join(requestsPath, type, status);
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (file.includes(id) && file.endsWith(".md")) {
            const filePath = path.join(dir, file);
            return this.parseArtifact(filePath);
          }
        }
      } catch {
        // Directory doesn't exist, continue
      }
    }

    return null;
  }

  /**
   * Find an ADR by ID
   */
  private async findAdrById(id: string): Promise<ArtifactReference | null> {
    const adrsDir = this.config.artifactPaths.adrs;
    if (!adrsDir) return null;
    const adrsPath = path.join(this.config.projectRoot, adrsDir);

    // Search in todo, doing, done, archive directories
    for (const status of ["todo", "doing", "done", "archive"]) {
      const dir = path.join(adrsPath, status);
      try {
        const files = await fs.readdir(dir);
        for (const file of files) {
          if (file.includes(id) && file.endsWith(".md")) {
            const filePath = path.join(dir, file);
            return this.parseArtifact(filePath);
          }
        }
      } catch {
        // Directory doesn't exist, continue
      }
    }

    return null;
  }

  /**
   * Find a chain by ID
   */
  private async findChainById(id: string): Promise<ArtifactReference | null> {
    const tasksDir = this.config.artifactPaths.tasks;
    if (!tasksDir) return null;
    const tasksPath = path.join(this.config.projectRoot, tasksDir);
    const chainsDir = path.join(tasksPath, ".chains");

    try {
      const metadataPath = path.join(chainsDir, `${id}.json`);
      await fs.access(metadataPath);
      return {
        type: "chain",
        id,
        path: path.relative(this.config.projectRoot, metadataPath),
        title: id,
      };
    } catch {
      return null;
    }
  }

  /**
   * Parse an artifact file to extract metadata
   */
  private async parseArtifact(filePath: string): Promise<ArtifactReference | null> {
    const relativePath = path.relative(this.config.projectRoot, filePath);
    const type = this.inferArtifactType(relativePath);
    const id = this.extractArtifactId(relativePath, type);

    try {
      const content = await fs.readFile(filePath, "utf-8");
      const title = this.extractTitle(content);

      return {
        type,
        id,
        path: relativePath,
        title,
      };
    } catch {
      return null;
    }
  }

  /**
   * Infer artifact type from path
   */
  private inferArtifactType(relativePath: string): ArtifactType {
    if (relativePath.includes("change-requests") || relativePath.includes("fix-requests")) {
      return "request";
    }
    if (relativePath.includes("/adr/")) {
      return "adr";
    }
    if (relativePath.includes("/design/")) {
      return "design";
    }
    if (relativePath.includes("/tasks/") && relativePath.includes(".chains")) {
      return "chain";
    }
    if (relativePath.includes("/tasks/")) {
      return "task";
    }
    if (relativePath.includes("__tests__") || relativePath.includes(".test.") || relativePath.includes(".spec.")) {
      return "test";
    }
    if (relativePath.includes("/src/")) {
      return "source";
    }
    return "external";
  }

  /**
   * Extract artifact ID from path
   */
  private extractArtifactId(relativePath: string, _type: ArtifactType): string {
    const filename = path.basename(relativePath, path.extname(relativePath));

    // Extract ID patterns
    const crMatch = filename.match(/CR-\d{8}-\d{3}/);
    if (crMatch) return crMatch[0];

    const frMatch = filename.match(/FR-\d{8}-\d{3}/);
    if (frMatch) return frMatch[0];

    const adrMatch = filename.match(/ADR-\d{3}(-[\w-]+)?/);
    if (adrMatch) return adrMatch[0];

    const chainMatch = filename.match(/CHAIN-\d{3}(-[\w-]+)?/);
    if (chainMatch) return chainMatch[0];

    // Default to filename
    return filename;
  }

  /**
   * Extract title from file content
   */
  private extractTitle(content: string): string | undefined {
    // Look for markdown title
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      // Clean up common prefixes
      let title = titleMatch[1];
      title = title.replace(/^(Change Request|Fix Request|ADR-\d{3}):\s*/i, "");
      return title.trim();
    }
    return undefined;
  }

  /**
   * Discover links from an artifact using the parser registry
   */
  private async discoverLinks(
    artifact: ArtifactReference
  ): Promise<DiscoveredLinks> {
    // Check cache
    const cached = this.cache.getLinks(artifact.path);
    if (cached) return cached;

    const fullPath = path.join(this.config.projectRoot, artifact.path);
    let content: string;

    try {
      content = await fs.readFile(fullPath, "utf-8");
    } catch {
      return { upstream: [], downstream: [] };
    }

    // Create parse context
    const context = createParseContext(
      artifact.path,
      this.config.projectRoot,
      artifact.id
    );

    // Use parser registry to extract links
    const parseResult = this.parserRegistry.parse(content, context);

    // Resolve parsed references to actual artifacts
    const upstream = await this.resolveReferences(parseResult.upstream);
    const downstream = await this.resolveReferences(parseResult.downstream);

    // Add heuristic downstream links (e.g., test files for source files)
    downstream.push(...(await this.discoverHeuristicDownstreamLinks(artifact)));

    const links: DiscoveredLinks = { upstream, downstream };
    this.cache.setLinks(artifact.path, links);

    return links;
  }

  /**
   * Resolve parsed references to actual artifacts
   */
  private async resolveReferences(
    refs: ArtifactReference[]
  ): Promise<ArtifactReference[]> {
    const resolved: ArtifactReference[] = [];
    const seen = new Set<string>();

    for (const ref of refs) {
      // Skip duplicates
      if (seen.has(ref.path)) continue;

      // Try to resolve by ID first, then by path
      let artifact: ArtifactReference | null = null;
      if (ref.id) {
        artifact = await this.resolveArtifactById(ref.id);
      }
      if (!artifact) {
        artifact = await this.resolveArtifact(ref.path);
      }

      if (artifact) {
        seen.add(artifact.path);
        resolved.push(artifact);
      } else {
        // Keep the unresolved reference (will be marked as missing)
        seen.add(ref.path);
        resolved.push(ref);
      }
    }

    return resolved;
  }

  /**
   * Discover heuristic downstream links (e.g., test files for source files)
   */
  private async discoverHeuristicDownstreamLinks(
    artifact: ArtifactReference
  ): Promise<ArtifactReference[]> {
    const links: ArtifactReference[] = [];

    // For source files, look for corresponding test files
    if (artifact.type === "source") {
      const testPath = this.inferTestPath(artifact.path);
      if (testPath) {
        const test = await this.resolveArtifact(testPath);
        if (test) links.push(test);
      }
    }

    // For ADRs, we would need to scan source files for references
    // This is expensive, so we defer to a full codebase scan if needed

    return links;
  }

  /**
   * Infer the test file path for a source file
   */
  private inferTestPath(sourcePath: string): string | null {
    // packages/core/src/tasks/chain-manager.ts
    // -> packages/core/src/tasks/__tests__/chain-manager.test.ts
    const dir = path.dirname(sourcePath);
    const basename = path.basename(sourcePath, ".ts");
    const testDir = path.join(dir, "__tests__");
    return path.join(testDir, `${basename}.test.ts`);
  }

  /**
   * Check if an artifact file exists
   */
  private async artifactExists(artifactPath: string): Promise<boolean> {
    const fullPath = path.join(this.config.projectRoot, artifactPath);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Infer the relationship type between two artifacts
   */
  private inferRelationship(
    from: ArtifactReference,
    to: ArtifactReference,
    direction: "upstream" | "downstream"
  ): LinkRelationship {
    if (direction === "upstream") {
      // From source to ADR
      if (from.type === "source" && to.type === "adr") return "implements";
      // From ADR to design
      if (from.type === "adr" && to.type === "design") return "derives-from";
      // From design to request
      if (from.type === "design" && to.type === "request") return "derives-from";
      // From ADR to request
      if (from.type === "adr" && to.type === "request") return "derives-from";
    } else {
      // From source to test
      if (from.type === "source" && to.type === "test") return "tests";
      // From ADR to source
      if (from.type === "adr" && to.type === "source") return "governs";
      // From design to ADR
      if (from.type === "design" && to.type === "adr") return "documents";
    }

    return "references";
  }

  /**
   * Check bidirectional link status between two artifacts
   */
  private async checkBidirectional(
    from: ArtifactReference,
    to: ArtifactReference,
    direction: "upstream" | "downstream"
  ): Promise<BidirectionalStatus> {
    // Check cache
    const cached = this.cache.getBidirectional(from.path, to.path);
    if (cached) return cached;

    // Forward link exists (we found it during discovery)
    const forward = true;

    // Check reverse link
    const toLinks = await this.discoverLinks(to);
    const reverseLinks =
      direction === "upstream" ? toLinks.downstream : toLinks.upstream;
    const reverse = reverseLinks.some((link) => link.path === from.path);

    let status: BidirectionalStatus["status"];
    if (forward && reverse) {
      status = "complete";
    } else if (forward) {
      status = "forward-only";
    } else if (reverse) {
      status = "reverse-only";
    } else {
      status = "missing";
    }

    const result: BidirectionalStatus = { forward, reverse, status };
    this.cache.setBidirectional(from.path, to.path, result);

    return result;
  }

  /**
   * Calculate summary statistics for the trace
   */
  private calculateSummary(
    artifact: ArtifactReference,
    upstream: TraceNode[],
    downstream: TraceNode[],
    missing: MissingLink[]
  ): TraceSummary {
    const byType: Record<ArtifactType, number> = {
      request: 0,
      adr: 0,
      design: 0,
      chain: 0,
      task: 0,
      source: 0,
      test: 0,
      external: 0,
    };

    let totalArtifacts = 1; // Include the starting artifact
    byType[artifact.type]++;

    let incompleteBidirectional = 0;
    let maxDepth = 0;

    const countNodes = (nodes: TraceNode[], depth: number): void => {
      for (const node of nodes) {
        totalArtifacts++;
        byType[node.artifact.type]++;

        if (node.bidirectional.status !== "complete") {
          incompleteBidirectional++;
        }

        maxDepth = Math.max(maxDepth, depth);
        countNodes(node.children, depth + 1);
      }
    };

    countNodes(upstream, 1);
    countNodes(downstream, 1);

    return {
      totalArtifacts,
      byType,
      missingCount: missing.length,
      incompleteBidirectional,
      maxDepth,
    };
  }

  /**
   * Clear the trace cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): ReturnType<TraceCache["getStats"]> {
    return this.cache.getStats();
  }
}
