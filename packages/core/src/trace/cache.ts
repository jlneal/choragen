/**
 * 4-level trace cache for performance optimization
 *
 * Cache levels:
 * 1. Artifact metadata (type, id, path, title)
 * 2. Link discovery (references found in a file)
 * 3. Bidirectional status (forward/reverse link verification)
 * 4. Complete trace results (full TraceResult for an artifact)
 *
 * @design-doc docs/design/core/features/trace-command.md
 * ADR: ADR-001-task-file-format (traceability patterns)
 */

import type {
  ArtifactReference,
  BidirectionalStatus,
  TraceResult,
} from "./types.js";

/**
 * Cache entry with TTL support
 */
interface CacheEntry<T> {
  value: T;
  timestamp: number;
}

/**
 * Links discovered from a file
 */
export interface DiscoveredLinks {
  /** Upstream references (this file references these) */
  upstream: ArtifactReference[];
  /** Downstream references (these reference this file) */
  downstream: ArtifactReference[];
}

/**
 * 4-level trace cache implementation
 *
 * Provides caching at multiple granularities to optimize trace operations:
 * - Level 1: Individual artifact metadata
 * - Level 2: Links discovered from file content
 * - Level 3: Bidirectional link verification results
 * - Level 4: Complete trace results
 */
export class TraceCache {
  private ttlMs: number;

  // Level 1: Artifact metadata cache (path -> ArtifactReference)
  private artifactCache: Map<string, CacheEntry<ArtifactReference>>;

  // Level 2: Link discovery cache (path -> DiscoveredLinks)
  private linkCache: Map<string, CacheEntry<DiscoveredLinks>>;

  // Level 3: Bidirectional status cache (from:to -> BidirectionalStatus)
  private bidirectionalCache: Map<string, CacheEntry<BidirectionalStatus>>;

  // Level 4: Complete trace results cache (path -> TraceResult)
  private traceCache: Map<string, CacheEntry<TraceResult>>;

  constructor(ttlMs: number = 60000) {
    this.ttlMs = ttlMs;
    this.artifactCache = new Map();
    this.linkCache = new Map();
    this.bidirectionalCache = new Map();
    this.traceCache = new Map();
  }

  /**
   * Check if a cache entry is still valid
   */
  private isValid<T>(entry: CacheEntry<T> | undefined): entry is CacheEntry<T> {
    if (!entry) return false;
    return Date.now() - entry.timestamp < this.ttlMs;
  }

  /**
   * Create a bidirectional cache key
   */
  private bidirectionalKey(from: string, to: string): string {
    return `${from}:${to}`;
  }

  // ============================================================
  // Level 1: Artifact Metadata
  // ============================================================

  /**
   * Get cached artifact metadata
   */
  getArtifact(path: string): ArtifactReference | null {
    const entry = this.artifactCache.get(path);
    return this.isValid(entry) ? entry.value : null;
  }

  /**
   * Cache artifact metadata
   */
  setArtifact(path: string, artifact: ArtifactReference): void {
    this.artifactCache.set(path, {
      value: artifact,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if artifact is cached
   */
  hasArtifact(path: string): boolean {
    return this.isValid(this.artifactCache.get(path));
  }

  // ============================================================
  // Level 2: Link Discovery
  // ============================================================

  /**
   * Get cached discovered links for a file
   */
  getLinks(path: string): DiscoveredLinks | null {
    const entry = this.linkCache.get(path);
    return this.isValid(entry) ? entry.value : null;
  }

  /**
   * Cache discovered links for a file
   */
  setLinks(path: string, links: DiscoveredLinks): void {
    this.linkCache.set(path, {
      value: links,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if links are cached for a file
   */
  hasLinks(path: string): boolean {
    return this.isValid(this.linkCache.get(path));
  }

  // ============================================================
  // Level 3: Bidirectional Status
  // ============================================================

  /**
   * Get cached bidirectional status between two artifacts
   */
  getBidirectional(from: string, to: string): BidirectionalStatus | null {
    const key = this.bidirectionalKey(from, to);
    const entry = this.bidirectionalCache.get(key);
    return this.isValid(entry) ? entry.value : null;
  }

  /**
   * Cache bidirectional status between two artifacts
   */
  setBidirectional(
    from: string,
    to: string,
    status: BidirectionalStatus
  ): void {
    const key = this.bidirectionalKey(from, to);
    this.bidirectionalCache.set(key, {
      value: status,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if bidirectional status is cached
   */
  hasBidirectional(from: string, to: string): boolean {
    const key = this.bidirectionalKey(from, to);
    return this.isValid(this.bidirectionalCache.get(key));
  }

  // ============================================================
  // Level 4: Complete Trace Results
  // ============================================================

  /**
   * Get cached complete trace result
   */
  getTrace(path: string): TraceResult | null {
    const entry = this.traceCache.get(path);
    return this.isValid(entry) ? entry.value : null;
  }

  /**
   * Cache complete trace result
   */
  setTrace(path: string, result: TraceResult): void {
    this.traceCache.set(path, {
      value: result,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if trace result is cached
   */
  hasTrace(path: string): boolean {
    return this.isValid(this.traceCache.get(path));
  }

  // ============================================================
  // Cache Management
  // ============================================================

  /**
   * Clear all caches
   */
  clear(): void {
    this.artifactCache.clear();
    this.linkCache.clear();
    this.bidirectionalCache.clear();
    this.traceCache.clear();
  }

  /**
   * Clear expired entries from all caches
   */
  prune(): void {
    const now = Date.now();

    for (const [key, entry] of this.artifactCache) {
      if (now - entry.timestamp >= this.ttlMs) {
        this.artifactCache.delete(key);
      }
    }

    for (const [key, entry] of this.linkCache) {
      if (now - entry.timestamp >= this.ttlMs) {
        this.linkCache.delete(key);
      }
    }

    for (const [key, entry] of this.bidirectionalCache) {
      if (now - entry.timestamp >= this.ttlMs) {
        this.bidirectionalCache.delete(key);
      }
    }

    for (const [key, entry] of this.traceCache) {
      if (now - entry.timestamp >= this.ttlMs) {
        this.traceCache.delete(key);
      }
    }
  }

  /**
   * Invalidate cache entries for a specific path
   * (useful when a file is modified)
   */
  invalidate(path: string): void {
    this.artifactCache.delete(path);
    this.linkCache.delete(path);
    this.traceCache.delete(path);

    // Also invalidate bidirectional entries involving this path
    for (const key of this.bidirectionalCache.keys()) {
      if (key.startsWith(`${path}:`) || key.endsWith(`:${path}`)) {
        this.bidirectionalCache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    artifacts: number;
    links: number;
    bidirectional: number;
    traces: number;
  } {
    return {
      artifacts: this.artifactCache.size,
      links: this.linkCache.size,
      bidirectional: this.bidirectionalCache.size,
      traces: this.traceCache.size,
    };
  }
}
