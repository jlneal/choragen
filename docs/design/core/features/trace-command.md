# Feature: Trace Command

**Domain**: cli  
**Created**: 2025-12-07  
**Status**: Approved  

---

## Overview

The `choragen trace` command produces full traceability traces for any artifact in the Choragen system. Given a starting point (CR, FR, ADR, design doc, source file, test, or chain), it walks the traceability links in both directions and outputs a complete trace.

This command enables:
- **Debugging traceability gaps** — Quickly see what's missing in the chain
- **Impact analysis** — "What will be affected if I change this ADR?"
- **Onboarding** — Understand how artifacts relate to each other
- **Audit** — Verify that the traceability chain is complete for a given feature
- **Documentation** — Generate traceability reports for stakeholders

---

## CLI Interface

### Basic Usage

```bash
choragen trace <artifact-path-or-id>
```

The command accepts either:
- A file path (absolute or relative)
- An artifact ID (e.g., `CR-20251206-011`, `ADR-001`, `CHAIN-033`)

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--format=<format>` | Output format: `tree`, `json`, `markdown` | `tree` |
| `--direction=<dir>` | Trace direction: `both`, `upstream`, `downstream` | `both` |
| `--depth=<n>` | Maximum traversal depth | unlimited |
| `--show-missing` | Highlight broken/missing links | enabled |

### Examples

#### Trace from a source file

```bash
$ choragen trace packages/core/src/tasks/chain-manager.ts

Traceability for: packages/core/src/tasks/chain-manager.ts

UPSTREAM (toward intent):
├── ADR: docs/adr/done/ADR-001-task-file-format.md
│   ├── Design: docs/design/core/features/task-chain-management.md
│   │   └── Request: docs/requests/change-requests/done/CR-20251205-001-bootstrap-choragen.md
│   └── Request: docs/requests/change-requests/done/CR-20251205-001-bootstrap-choragen.md

DOWNSTREAM (toward verification):
├── Test: packages/core/src/tasks/__tests__/chain-manager.test.ts [MISSING]
└── Consumers: packages/cli/src/cli.ts
```

#### Trace from a Change Request

```bash
$ choragen trace CR-20251206-008

Traceability for: CR-20251206-008 (Comprehensive Test Coverage)

DOWNSTREAM:
├── Chains: (none yet)
├── ADRs: (none yet)
├── Design Docs: 
│   ├── docs/design/core/features/task-chain-management.md
│   ├── docs/design/core/features/governance-enforcement.md
│   └── docs/design/core/features/file-locking.md
└── Implementation: (pending)
```

#### JSON output for tooling

```bash
$ choragen trace ADR-001-task-file-format --format=json
```

```json
{
  "artifact": {
    "type": "adr",
    "id": "ADR-001",
    "path": "docs/adr/done/ADR-001-task-file-format.md"
  },
  "upstream": [
    {
      "type": "request",
      "id": "CR-20251205-001",
      "path": "docs/requests/change-requests/done/CR-20251205-001-bootstrap-choragen.md"
    }
  ],
  "downstream": [
    {
      "type": "source",
      "path": "packages/core/src/tasks/chain-manager.ts"
    }
  ],
  "missing": []
}
```

#### Markdown output for documentation

```bash
$ choragen trace CHAIN-033 --format=markdown > trace-report.md
```

---

## Artifact Types

The trace command supports all artifacts in the Choragen traceability chain:

| Artifact Type | ID Pattern | Location |
|---------------|------------|----------|
| **Change Request** | `CR-YYYYMMDD-NNN` | `docs/requests/change-requests/` |
| **Fix Request** | `FR-YYYYMMDD-NNN` | `docs/requests/fix-requests/` |
| **ADR** | `ADR-NNN-slug` | `docs/adr/` |
| **Design Doc** | File path | `docs/design/` |
| **Chain** | `CHAIN-NNN-slug` | `docs/tasks/.chains/` |
| **Task** | `NNN-slug` | `docs/tasks/` |
| **Source File** | File path | `packages/*/src/` |
| **Test File** | File path | `packages/*/src/**/__tests__/` |

### Link Discovery Strategy

This section provides implementation-ready patterns for discovering traceability links.

#### Regex Patterns by Link Type

##### ADR References in Source Files

```typescript
// Pattern: Matches ADR references in comments
const ADR_COMMENT_PATTERN = /(?:\/\/|\/\*|\*)\s*(?:ADR:|@adr)\s*(ADR-\d{3}-[\w-]+)/;

// Examples that match:
// "// ADR: ADR-001-task-file-format"     → captures "ADR-001-task-file-format"
// "* ADR: ADR-002-governance-model"      → captures "ADR-002-governance-model"
// "/* @adr ADR-003-file-locking */"      → captures "ADR-003-file-locking"

// Pattern: Matches ADR path references
const ADR_PATH_PATTERN = /docs\/adr\/(?:todo|doing|done|archive)\/(ADR-\d{3}-[\w-]+)\.md/;

// Examples that match:
// "docs/adr/done/ADR-001-task-file-format.md" → captures "ADR-001-task-file-format"
```

##### CR/FR References

```typescript
// Pattern: Matches CR IDs
const CR_ID_PATTERN = /CR-(\d{8})-(\d{3})/g;

// Examples that match:
// "CR-20251206-011"  → captures ["20251206", "011"]
// "**Linked CR/FR**: CR-20251205-001" → captures ["20251205", "001"]

// Pattern: Matches FR IDs
const FR_ID_PATTERN = /FR-(\d{8})-(\d{3})/g;

// Examples that match:
// "FR-20251207-002"  → captures ["20251207", "002"]

// Pattern: Matches CR/FR in Linked field (ADRs)
const LINKED_CR_FR_PATTERN = /\*\*Linked CR\/FR\*\*:\s*(?:CR|FR)-(\d{8})-(\d{3})/;
```

##### Design Doc References

```typescript
// Pattern: Matches design doc paths
const DESIGN_DOC_PATH_PATTERN = /docs\/design\/(?:core\/)?(?:scenarios|features|enhancements)\/([\w-]+)\.md/g;

// Examples that match:
// "docs/design/core/features/task-chain-management.md"
// "docs/design/core/scenarios/control-agent-workflow.md"

// Pattern: Matches @design-doc JSDoc tag
const DESIGN_DOC_TAG_PATTERN = /@design-doc\s+(docs\/design\/[\w/-]+\.md)/;

// Examples that match:
// "@design-doc docs/design/core/features/trace-command.md"
```

##### Chain References

```typescript
// Pattern: Matches chain IDs
const CHAIN_ID_PATTERN = /CHAIN-(\d{3})-([\w-]+)/;

// Examples that match:
// "CHAIN-033-trace-command" → captures ["033", "trace-command"]

// Pattern: Matches chain metadata files
const CHAIN_METADATA_PATTERN = /docs\/tasks\/\.chains\/(CHAIN-\d{3}-[\w-]+)\.yaml/;
```

##### Task References

```typescript
// Pattern: Matches task IDs within chains
const TASK_ID_PATTERN = /(\d{3})-([\w-]+)/;

// Examples that match:
// "002-link-discovery" → captures ["002", "link-discovery"]
```

##### Import/Consumer Discovery

```typescript
// Pattern: Matches TypeScript/JavaScript imports
const IMPORT_PATTERN = /import\s+(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;

// Pattern: Matches require statements
const REQUIRE_PATTERN = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

// Examples that match:
// "import { ChainManager } from './chain-manager'" → captures "./chain-manager"
// "const fs = require('node:fs')" → captures "node:fs"
```

#### Edge Cases

The trace command must handle these edge cases gracefully:

| Edge Case | Behavior | Example |
|-----------|----------|---------|
| **Missing file** | Mark as `[MISSING]` in output, continue traversal | ADR references deleted source file |
| **Circular reference** | Track visited nodes, skip already-visited | A → B → C → A |
| **Broken link** | Mark as `[BROKEN]`, include in `missing` array | CR references non-existent ADR |
| **Ambiguous ID** | Prefer exact match, warn if multiple matches | `ADR-001` matches multiple files |
| **Moved file** | Check all status directories (todo/doing/done) | ADR moved from doing/ to done/ |
| **Malformed reference** | Log warning, skip invalid pattern | `ADR-1` instead of `ADR-001` |
| **Empty section** | Treat as no links, not an error | `## Implementation\n\n[Added when implemented]` |
| **External reference** | Mark as `[EXTERNAL]`, don't traverse | Link to GitHub issue |

##### Handling Missing Files

```typescript
interface LinkResult {
  type: 'found' | 'missing' | 'broken' | 'external';
  path?: string;
  id?: string;
  error?: string;
}

function resolveLink(reference: string): LinkResult {
  // Check if file exists in expected locations
  const candidates = [
    `docs/adr/todo/${reference}.md`,
    `docs/adr/doing/${reference}.md`,
    `docs/adr/done/${reference}.md`,
    `docs/adr/archive/${reference}.md`,
  ];
  
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return { type: 'found', path: candidate, id: reference };
    }
  }
  
  return { type: 'missing', id: reference, error: 'File not found in any status directory' };
}
```

##### Handling Circular References

```typescript
function traceWithCycleDetection(
  startId: string,
  visited: Set<string> = new Set()
): TraceNode {
  if (visited.has(startId)) {
    return { id: startId, type: 'cycle-detected', children: [] };
  }
  
  visited.add(startId);
  const links = discoverLinks(startId);
  
  return {
    id: startId,
    children: links.map(link => traceWithCycleDetection(link.id, visited)),
  };
}
```

#### Bidirectional Verification

Traceability links should be bidirectional. The trace command verifies both directions:

##### Forward Links (Explicit)

These are explicitly declared in the source artifact:

| From | To | How Declared |
|------|----|--------------|
| Source file | ADR | `// ADR: ADR-xxx` comment |
| ADR | CR/FR | `**Linked CR/FR**: CR-xxx` field |
| ADR | Design doc | `**Linked Design Docs**: path` field |
| ADR | Source | `## Implementation` section |
| Design doc | ADR | `## Linked ADRs` section |
| CR/FR | Design doc | `## Design` or `docs/design/` reference |

##### Reverse Links (Discovered)

These are discovered by searching for references:

| From | To | How Discovered |
|------|----|----------------|
| ADR | Source files | Grep for `// ADR: <adr-id>` in packages/ |
| Design doc | Tests | Grep for `@design-doc <path>` in test files |
| CR/FR | ADRs | Grep for `CR-xxx` or `FR-xxx` in docs/adr/ |
| CR/FR | Chains | Search chain metadata for `requestId` |

##### Verification Algorithm

```typescript
interface BidirectionalCheck {
  forward: boolean;   // A explicitly links to B
  reverse: boolean;   // B explicitly links to A
  status: 'complete' | 'forward-only' | 'reverse-only' | 'missing';
}

function verifyBidirectional(
  sourceId: string,
  targetId: string,
  sourceType: ArtifactType,
  targetType: ArtifactType
): BidirectionalCheck {
  const forwardLinks = getExplicitLinks(sourceId, sourceType);
  const reverseLinks = getExplicitLinks(targetId, targetType);
  
  const forward = forwardLinks.some(link => link.id === targetId);
  const reverse = reverseLinks.some(link => link.id === sourceId);
  
  return {
    forward,
    reverse,
    status: forward && reverse ? 'complete' :
            forward ? 'forward-only' :
            reverse ? 'reverse-only' : 'missing',
  };
}
```

##### Verification Report

When `--show-missing` is enabled (default), the trace output highlights incomplete bidirectional links:

```
Traceability for: packages/core/src/tasks/chain-manager.ts

UPSTREAM:
├── ADR: ADR-001-task-file-format [bidirectional ✓]
│   └── CR: CR-20251205-001 [forward-only ⚠]
│       (ADR links to CR, but CR doesn't link back to ADR)
```

#### Caching Strategy

For performance, the trace command implements a multi-level cache:

##### Cache Levels

| Level | Scope | TTL | Invalidation |
|-------|-------|-----|--------------|
| **File content** | Per-file | Session | File mtime change |
| **Parsed links** | Per-artifact | Session | Source file change |
| **Resolved paths** | Global | Session | Any file change in watched dirs |
| **Full trace** | Per-artifact | 5 min | Any dependency change |

##### Cache Implementation

```typescript
interface CacheEntry<T> {
  value: T;
  mtime: number;      // File modification time
  timestamp: number;  // Cache entry creation time
  ttl: number;        // Time-to-live in ms
}

class TraceCache {
  private fileContent = new Map<string, CacheEntry<string>>();
  private parsedLinks = new Map<string, CacheEntry<Link[]>>();
  private resolvedPaths = new Map<string, CacheEntry<string>>();
  
  getFileContent(path: string): string | null {
    const entry = this.fileContent.get(path);
    if (!entry) return null;
    
    const currentMtime = statSync(path).mtimeMs;
    if (currentMtime !== entry.mtime) {
      this.invalidateFile(path);
      return null;
    }
    
    return entry.value;
  }
  
  invalidateFile(path: string): void {
    this.fileContent.delete(path);
    this.parsedLinks.delete(path);
    // Invalidate any resolved paths that depend on this file
    for (const [key, entry] of this.resolvedPaths) {
      if (entry.value === path) {
        this.resolvedPaths.delete(key);
      }
    }
  }
  
  invalidateAll(): void {
    this.fileContent.clear();
    this.parsedLinks.clear();
    this.resolvedPaths.clear();
  }
}
```

##### Cache Warming

For large repositories, the trace command can pre-warm caches:

```bash
# Warm cache for all artifacts (useful before batch operations)
choragen trace --warm-cache

# Warm cache for specific artifact types
choragen trace --warm-cache --types=adr,source
```

##### Cache Statistics

```bash
$ choragen trace ADR-001 --cache-stats

Cache Statistics:
  File content hits:  45/50 (90%)
  Parsed links hits:  12/15 (80%)
  Resolved paths:     23/25 (92%)
  Cache size:         2.3 MB
  Oldest entry:       5m ago
```

---

## Output Formats

The trace command supports three output formats, each optimized for different use cases.

### Tree Format (Default)

The tree format provides a human-readable hierarchical view using Unicode box-drawing characters.

#### Symbols

| Symbol | Meaning |
|--------|---------|
| `├──` | Branch with siblings below |
| `└──` | Last branch at current level |
| `│` | Vertical continuation line |
| `   ` | Indentation (3 spaces per level) |

#### ANSI Colors

| Color | ANSI Code | Usage |
|-------|-----------|-------|
| **Cyan** | `\x1b[36m` | Artifact type labels (ADR:, CR:, Design:) |
| **Green** | `\x1b[32m` | Found/complete status, checkmarks (✓) |
| **Yellow** | `\x1b[33m` | Warnings, forward-only links (⚠) |
| **Red** | `\x1b[31m` | Missing/broken links, errors |
| **Dim** | `\x1b[2m` | Secondary info (paths, hints) |
| **Reset** | `\x1b[0m` | Reset to default |

Colors are automatically disabled when output is piped or `--no-color` is specified.

#### Indentation Rules

- Each nesting level adds 3 spaces of indentation
- The tree prefix (`├──`, `└──`, `│`) is followed by a single space
- Continuation lines use `│` aligned with the parent branch

#### Complete Example

```
Traceability for: packages/core/src/tasks/chain-manager.ts

UPSTREAM (toward intent):
├── ADR: ADR-001-task-file-format [bidirectional ✓]
│   ├── Design: docs/design/core/features/task-chain-management.md
│   │   └── Request: CR-20251205-001 [forward-only ⚠]
│   │       (ADR links to CR, but CR doesn't link back to ADR)
│   └── Request: CR-20251205-001
└── Design: docs/design/core/features/governance-enforcement.md
    └── Request: CR-20251206-003

DOWNSTREAM (toward verification):
├── Test: packages/core/src/tasks/__tests__/chain-manager.test.ts [MISSING]
├── Consumers:
│   ├── packages/cli/src/cli.ts
│   └── packages/cli/src/commands/chain-status.ts
└── Dependents: (none)

Summary:
  Total artifacts: 8
  Missing links: 1
  Incomplete bidirectional: 1
```

#### Use Cases

- **Interactive debugging** — Quick visual inspection of traceability
- **Terminal workflows** — Human-readable output for agent review
- **Documentation screenshots** — Clear visual representation for docs

### JSON Format

The JSON format provides machine-readable output for tooling integration.

#### TypeScript Interface

```typescript
/**
 * Complete trace result structure
 */
interface TraceResult {
  /** The starting artifact */
  artifact: ArtifactReference;
  
  /** Upstream links (toward intent: source → ADR → design → CR/FR) */
  upstream: TraceNode[];
  
  /** Downstream links (toward verification: CR/FR → design → ADR → source → tests) */
  downstream: TraceNode[];
  
  /** All missing or broken links discovered */
  missing: MissingLink[];
  
  /** Summary statistics */
  summary: TraceSummary;
  
  /** Trace metadata */
  metadata: TraceMetadata;
}

/**
 * Reference to an artifact in the system
 */
interface ArtifactReference {
  /** Artifact type */
  type: ArtifactType;
  
  /** Artifact identifier (e.g., "ADR-001", "CR-20251206-011") */
  id: string;
  
  /** File path relative to project root */
  path: string;
  
  /** Human-readable title (if available) */
  title?: string;
}

/**
 * Supported artifact types
 */
type ArtifactType = 
  | 'request'      // CR or FR
  | 'adr'          // Architecture Decision Record
  | 'design'       // Design document
  | 'chain'        // Task chain
  | 'task'         // Individual task
  | 'source'       // Source file
  | 'test'         // Test file
  | 'external';    // External reference (GitHub issue, etc.)

/**
 * Node in the trace tree
 */
interface TraceNode {
  /** The artifact at this node */
  artifact: ArtifactReference;
  
  /** Relationship to parent */
  relationship: LinkRelationship;
  
  /** Bidirectional link status */
  bidirectional: BidirectionalStatus;
  
  /** Child nodes (further links from this artifact) */
  children: TraceNode[];
}

/**
 * Type of relationship between artifacts
 */
type LinkRelationship =
  | 'implements'      // Source implements ADR
  | 'tests'           // Test verifies source
  | 'references'      // General reference
  | 'derives-from'    // ADR derives from CR/FR
  | 'consumes'        // File imports/uses another
  | 'documents'       // Design doc documents feature
  | 'governs';        // ADR governs implementation

/**
 * Bidirectional link verification status
 */
interface BidirectionalStatus {
  /** Forward link exists (A → B) */
  forward: boolean;
  
  /** Reverse link exists (B → A) */
  reverse: boolean;
  
  /** Overall status */
  status: 'complete' | 'forward-only' | 'reverse-only' | 'missing';
}

/**
 * Information about a missing or broken link
 */
interface MissingLink {
  /** Type of issue */
  type: 'missing' | 'broken' | 'external';
  
  /** The artifact that should exist */
  expected: {
    type: ArtifactType;
    id?: string;
    path?: string;
  };
  
  /** Where the reference was found */
  referencedFrom: ArtifactReference;
  
  /** Human-readable description of the issue */
  message: string;
}

/**
 * Summary statistics for the trace
 */
interface TraceSummary {
  /** Total artifacts discovered */
  totalArtifacts: number;
  
  /** Count by artifact type */
  byType: Record<ArtifactType, number>;
  
  /** Number of missing links */
  missingCount: number;
  
  /** Number of incomplete bidirectional links */
  incompleteBidirectional: number;
  
  /** Maximum depth reached */
  maxDepth: number;
}

/**
 * Metadata about the trace operation
 */
interface TraceMetadata {
  /** When the trace was performed */
  timestamp: string;  // ISO 8601
  
  /** Trace direction used */
  direction: 'both' | 'upstream' | 'downstream';
  
  /** Maximum depth setting (null = unlimited) */
  maxDepth: number | null;
  
  /** Whether cache was used */
  cached: boolean;
  
  /** Trace duration in milliseconds */
  durationMs: number;
}
```

#### Complete Example

```json
{
  "artifact": {
    "type": "source",
    "id": "chain-manager.ts",
    "path": "packages/core/src/tasks/chain-manager.ts",
    "title": "Chain Manager"
  },
  "upstream": [
    {
      "artifact": {
        "type": "adr",
        "id": "ADR-001",
        "path": "docs/adr/done/ADR-001-task-file-format.md",
        "title": "Task File Format"
      },
      "relationship": "implements",
      "bidirectional": {
        "forward": true,
        "reverse": true,
        "status": "complete"
      },
      "children": [
        {
          "artifact": {
            "type": "design",
            "id": "task-chain-management",
            "path": "docs/design/core/features/task-chain-management.md",
            "title": "Task Chain Management"
          },
          "relationship": "derives-from",
          "bidirectional": {
            "forward": true,
            "reverse": true,
            "status": "complete"
          },
          "children": [
            {
              "artifact": {
                "type": "request",
                "id": "CR-20251205-001",
                "path": "docs/requests/change-requests/done/CR-20251205-001-bootstrap-choragen.md",
                "title": "Bootstrap Choragen"
              },
              "relationship": "derives-from",
              "bidirectional": {
                "forward": true,
                "reverse": false,
                "status": "forward-only"
              },
              "children": []
            }
          ]
        }
      ]
    }
  ],
  "downstream": [
    {
      "artifact": {
        "type": "test",
        "id": "chain-manager.test.ts",
        "path": "packages/core/src/tasks/__tests__/chain-manager.test.ts"
      },
      "relationship": "tests",
      "bidirectional": {
        "forward": false,
        "reverse": false,
        "status": "missing"
      },
      "children": []
    },
    {
      "artifact": {
        "type": "source",
        "id": "cli.ts",
        "path": "packages/cli/src/cli.ts"
      },
      "relationship": "consumes",
      "bidirectional": {
        "forward": true,
        "reverse": false,
        "status": "forward-only"
      },
      "children": []
    }
  ],
  "missing": [
    {
      "type": "missing",
      "expected": {
        "type": "test",
        "path": "packages/core/src/tasks/__tests__/chain-manager.test.ts"
      },
      "referencedFrom": {
        "type": "source",
        "id": "chain-manager.ts",
        "path": "packages/core/src/tasks/chain-manager.ts"
      },
      "message": "Expected test file not found"
    }
  ],
  "summary": {
    "totalArtifacts": 6,
    "byType": {
      "request": 1,
      "adr": 1,
      "design": 1,
      "source": 2,
      "test": 1,
      "chain": 0,
      "task": 0,
      "external": 0
    },
    "missingCount": 1,
    "incompleteBidirectional": 2,
    "maxDepth": 3
  },
  "metadata": {
    "timestamp": "2025-12-07T19:30:00.000Z",
    "direction": "both",
    "maxDepth": null,
    "cached": true,
    "durationMs": 45
  }
}
```

#### Use Cases

- **CI/CD integration** — Parse trace results in pipelines
- **Custom tooling** — Build dashboards or reports from trace data
- **Automated validation** — Check traceability completeness programmatically
- **IDE extensions** — Display trace information in editors

### Markdown Format

The markdown format generates documentation-ready reports with proper headings, tables, and links.

#### Template Structure

```markdown
# Traceability Report: {artifact.title || artifact.id}

**Generated**: {metadata.timestamp}  
**Artifact**: `{artifact.path}`  
**Type**: {artifact.type}  

---

## Summary

| Metric | Value |
|--------|-------|
| Total Artifacts | {summary.totalArtifacts} |
| Missing Links | {summary.missingCount} |
| Incomplete Bidirectional | {summary.incompleteBidirectional} |
| Max Depth | {summary.maxDepth} |

### Artifacts by Type

| Type | Count |
|------|-------|
| Requests | {summary.byType.request} |
| ADRs | {summary.byType.adr} |
| Design Docs | {summary.byType.design} |
| Source Files | {summary.byType.source} |
| Test Files | {summary.byType.test} |
| Chains | {summary.byType.chain} |

---

## Upstream Trace (Toward Intent)

{upstream trace as nested list with links}

---

## Downstream Trace (Toward Verification)

{downstream trace as nested list with links}

---

## Missing Links

{table of missing links if any, otherwise "No missing links found."}

---

## Bidirectional Link Status

{table showing incomplete bidirectional links}

---

## Trace Metadata

- **Direction**: {metadata.direction}
- **Max Depth**: {metadata.maxDepth || "unlimited"}
- **Cached**: {metadata.cached ? "Yes" : "No"}
- **Duration**: {metadata.durationMs}ms
```

#### Complete Example

```markdown
# Traceability Report: Chain Manager

**Generated**: 2025-12-07T19:30:00.000Z  
**Artifact**: `packages/core/src/tasks/chain-manager.ts`  
**Type**: source  

---

## Summary

| Metric | Value |
|--------|-------|
| Total Artifacts | 6 |
| Missing Links | 1 |
| Incomplete Bidirectional | 2 |
| Max Depth | 3 |

### Artifacts by Type

| Type | Count |
|------|-------|
| Requests | 1 |
| ADRs | 1 |
| Design Docs | 1 |
| Source Files | 2 |
| Test Files | 1 |
| Chains | 0 |

---

## Upstream Trace (Toward Intent)

- **ADR**: [ADR-001-task-file-format](docs/adr/done/ADR-001-task-file-format.md) ✓
  - **Design**: [Task Chain Management](docs/design/core/features/task-chain-management.md) ✓
    - **Request**: [CR-20251205-001](docs/requests/change-requests/done/CR-20251205-001-bootstrap-choragen.md) ⚠ forward-only
  - **Request**: [CR-20251205-001](docs/requests/change-requests/done/CR-20251205-001-bootstrap-choragen.md) ✓

---

## Downstream Trace (Toward Verification)

- **Test**: `packages/core/src/tasks/__tests__/chain-manager.test.ts` ❌ MISSING
- **Consumer**: [cli.ts](packages/cli/src/cli.ts) ⚠ forward-only
- **Consumer**: [chain-status.ts](packages/cli/src/commands/chain-status.ts) ✓

---

## Missing Links

| Expected | Type | Referenced From | Issue |
|----------|------|-----------------|-------|
| `__tests__/chain-manager.test.ts` | test | chain-manager.ts | Expected test file not found |

---

## Bidirectional Link Status

| From | To | Status | Issue |
|------|----|--------|-------|
| ADR-001 | CR-20251205-001 | forward-only | CR doesn't link back to ADR |
| chain-manager.ts | cli.ts | forward-only | Consumer doesn't declare dependency |

---

## Trace Metadata

- **Direction**: both
- **Max Depth**: unlimited
- **Cached**: Yes
- **Duration**: 45ms
```

#### Use Cases

- **Documentation** — Generate traceability reports for stakeholders
- **Audit compliance** — Produce evidence of traceability for audits
- **Pull request comments** — Attach trace reports to PRs
- **Wiki pages** — Publish trace reports to project wikis

### Format Selection Guide

| Scenario | Recommended Format | Reason |
|----------|-------------------|--------|
| Interactive terminal use | `tree` | Human-readable, colored output |
| CI/CD pipeline | `json` | Machine-parseable for automation |
| Documentation | `markdown` | Ready for docs, wikis, PRs |
| Quick debugging | `tree` | Fast visual inspection |
| Building dashboards | `json` | Structured data for visualization |
| Stakeholder reports | `markdown` | Professional, shareable format |
| IDE integration | `json` | Programmatic access to trace data |
| Git commit messages | `tree` | Compact summary for commits |

---

## User Stories

### As a Control Agent

I want to trace the full lineage of any artifact  
So that I can verify traceability is complete before approving work

### As an Implementation Agent

I want to see what depends on a file I'm modifying  
So that I can assess the impact of my changes

### As a Project Lead

I want to generate traceability reports  
So that I can demonstrate audit compliance to stakeholders

---

## Acceptance Criteria

- [ ] Command accepts file paths and artifact IDs
- [ ] Traces upstream toward intent (source → ADR → design → CR/FR)
- [ ] Traces downstream toward verification (CR/FR → design → ADR → source → tests)
- [ ] Supports tree, JSON, and markdown output formats
- [ ] Handles cycles gracefully (no infinite loops)
- [ ] Shows broken links (referenced but not found)
- [ ] Integrates with existing validation scripts

---

## Linked Scenarios

- [Control Agent Workflow](../scenarios/control-agent-workflow.md) — Verifying work completeness
- [Implementation Agent Workflow](../scenarios/implementation-agent-workflow.md) — Understanding context

---

## Linked Use Cases

- [Debug Failed Task](../use-cases/debug-failed-task.md) — Tracing to find root cause
- [Review and Approve Work](../use-cases/review-approve-work.md) — Verifying traceability before approval
- [Onboard New Contributor](../use-cases/onboard-new-contributor.md) — Understanding artifact relationships

---

## Linked ADRs

[Added when ADRs are created]

---

## Linked Request

- [CR-20251206-011: Traceability Explorer](../../requests/change-requests/doing/CR-20251206-011-traceability-explorer.md)

---

## Implementation

[Added when implemented]

---

## Acceptance Tests

[Added when tests written]
