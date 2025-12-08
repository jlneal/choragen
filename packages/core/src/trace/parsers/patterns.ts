/**
 * Centralized regex patterns for link discovery
 *
 * These patterns are copied from the design doc (lines 137-229) and used
 * by all link parsers to extract traceability references.
 *
 * @design-doc docs/design/core/features/trace-command.md
 * ADR: ADR-001-task-file-format (traceability patterns)
 */

// =============================================================================
// ADR References (design doc lines 139-155)
// =============================================================================

/**
 * Pattern: Matches ADR references in comments
 *
 * Examples that match:
 * - "// ADR: ADR-001-task-file-format"     → captures "ADR-001-task-file-format"
 * - "* ADR: ADR-002-governance-model"      → captures "ADR-002-governance-model"
 * - "/\* @adr ADR-003-file-locking \*\/"   → captures "ADR-003-file-locking"
 */
export const ADR_COMMENT_PATTERN =
  /(?:\/\/|\/\*|\*|#)\s*(?:ADR:|@adr)\s*(ADR-\d{3}(-[\w-]+)?)/g;

/**
 * Pattern: Matches ADR path references
 *
 * Examples that match:
 * - "docs/adr/done/ADR-001-task-file-format.md" → captures "ADR-001-task-file-format"
 */
export const ADR_PATH_PATTERN =
  /docs\/adr\/(?:todo|doing|done|archive)\/(ADR-\d{3}(-[\w-]+)?)\.md/g;

/**
 * Pattern: Matches ADR ID only (without path)
 */
export const ADR_ID_PATTERN = /ADR-\d{3}(-[\w-]+)?/g;

// =============================================================================
// CR/FR References (design doc lines 157-175)
// =============================================================================

/**
 * Pattern: Matches CR IDs
 *
 * Examples that match:
 * - "CR-20251206-011"  → captures ["20251206", "011"]
 * - "**Linked CR/FR**: CR-20251205-001" → captures ["20251205", "001"]
 */
export const CR_ID_PATTERN = /CR-(\d{8})-(\d{3})/g;

/**
 * Pattern: Matches FR IDs
 *
 * Examples that match:
 * - "FR-20251207-002"  → captures ["20251207", "002"]
 */
export const FR_ID_PATTERN = /FR-(\d{8})-(\d{3})/g;

/**
 * Pattern: Matches CR/FR in Linked field (ADRs)
 */
export const LINKED_CR_FR_PATTERN =
  /\*\*Linked CR\/FR\*\*:\s*((?:CR|FR)-\d{8}-\d{3})/;

/**
 * Pattern: Matches any request ID (CR or FR)
 */
export const REQUEST_ID_PATTERN = /(CR|FR)-(\d{8})-(\d{3})/g;

// =============================================================================
// Design Doc References (design doc lines 177-192)
// =============================================================================

/**
 * Pattern: Matches design doc paths
 *
 * Examples that match:
 * - "docs/design/core/features/task-chain-management.md"
 * - "docs/design/core/scenarios/control-agent-workflow.md"
 */
export const DESIGN_DOC_PATH_PATTERN =
  /docs\/design\/(?:core\/)?(?:scenarios|features|enhancements)\/([\w-]+)\.md/g;

/**
 * Pattern: Matches @design-doc JSDoc tag
 *
 * Examples that match:
 * - "@design-doc docs/design/core/features/trace-command.md"
 */
export const DESIGN_DOC_TAG_PATTERN = /@design-doc\s+(docs\/design\/[\w\/-]+\.md)/g;

/**
 * Pattern: Matches Linked Design Docs field in ADRs
 */
export const LINKED_DESIGN_DOCS_PATTERN =
  /\*\*Linked Design Docs\*\*:\s*(docs\/design\/[\w\/-]+\.md)/;

// =============================================================================
// Chain References (design doc lines 194-205)
// =============================================================================

/**
 * Pattern: Matches chain IDs
 *
 * Examples that match:
 * - "CHAIN-033-trace-command" → captures ["033", "trace-command"]
 */
export const CHAIN_ID_PATTERN = /CHAIN-(\d{3})-([\w-]+)/g;

/**
 * Pattern: Matches chain metadata files
 */
export const CHAIN_METADATA_PATTERN =
  /docs\/tasks\/\.chains\/(CHAIN-\d{3}(-[\w-]+)?)\.(?:yaml|json)/g;

// =============================================================================
// Task References (design doc lines 207-215)
// =============================================================================

/**
 * Pattern: Matches task IDs within chains
 *
 * Examples that match:
 * - "002-link-discovery" → captures ["002", "link-discovery"]
 */
export const TASK_ID_PATTERN = /(\d{3})-([\w-]+)/g;

// =============================================================================
// Import/Consumer Discovery (design doc lines 217-229)
// =============================================================================

/**
 * Pattern: Matches TypeScript/JavaScript imports
 *
 * Examples that match:
 * - "import { ChainManager } from './chain-manager'" → captures "./chain-manager"
 */
export const IMPORT_PATTERN =
  /import\s+(?:\{[^}]+\}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;

/**
 * Pattern: Matches require statements
 *
 * Examples that match:
 * - "const fs = require('node:fs')" → captures "node:fs"
 */
export const REQUIRE_PATTERN = /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

/**
 * Pattern: Matches dynamic imports
 *
 * Examples that match:
 * - "await import('./module')" → captures "./module"
 */
export const DYNAMIC_IMPORT_PATTERN = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

// =============================================================================
// Markdown Link Patterns
// =============================================================================

/**
 * Pattern: Matches markdown links
 *
 * Examples that match:
 * - "[Link Text](path/to/file.md)" → captures ["Link Text", "path/to/file.md"]
 */
export const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Pattern: Matches markdown links to docs directory
 */
export const DOCS_LINK_PATTERN = /\[([^\]]+)\]\((docs\/[^)]+)\)/g;

// =============================================================================
// Section Patterns (for parsing markdown sections)
// =============================================================================

/**
 * Pattern: Matches Implementation section in ADRs
 */
export const IMPLEMENTATION_SECTION_PATTERN =
  /##\s*Implementation\s*\n([\s\S]*?)(?=\n##\s|\n---|\z)/;

/**
 * Pattern: Matches Linked ADRs section in design docs
 */
export const LINKED_ADRS_SECTION_PATTERN =
  /##\s*Linked ADRs\s*\n([\s\S]*?)(?=\n##\s|\n---|\z)/;

/**
 * Pattern: Matches Linked Request section in design docs
 */
export const LINKED_REQUEST_SECTION_PATTERN =
  /##\s*Linked Request\s*\n([\s\S]*?)(?=\n##\s|\n---|\z)/;

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Create a fresh copy of a global regex pattern
 * (Global regexes maintain state, so we need fresh copies for each use)
 */
export function freshPattern(pattern: RegExp): RegExp {
  return new RegExp(pattern.source, pattern.flags);
}

/**
 * Extract all matches from content using a pattern
 */
export function extractMatches(content: string, pattern: RegExp): string[] {
  const matches: string[] = [];
  const regex = freshPattern(pattern);
  let match;
  while ((match = regex.exec(content)) !== null) {
    matches.push(match[0]);
  }
  return matches;
}

/**
 * Extract capture groups from content using a pattern
 */
export function extractCaptureGroups(
  content: string,
  pattern: RegExp
): string[][] {
  const groups: string[][] = [];
  const regex = freshPattern(pattern);
  let match;
  while ((match = regex.exec(content)) !== null) {
    groups.push(match.slice(1));
  }
  return groups;
}
