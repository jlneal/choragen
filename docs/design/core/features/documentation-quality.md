# Feature: Documentation Quality

**Domain**: core  
**Created**: 2025-12-11  
**Status**: draft  

---

## Overview

Documentation Quality extends the trust layer to verify that documentation artifacts meet quality standards: completeness, clarity, consistency, and accuracy. While linting verifies structure, documentation quality verifies **content**.

```
Trust = Lint × Tests × Contracts × Security × Performance × DocQuality
```

For agent-generated documentation, quality verification is essential:
- Agents may produce structurally valid but incomplete docs
- Agents may use inconsistent terminology
- Agents may include outdated or incorrect code examples
- Documentation quality directly impacts developer productivity

---

## Capabilities

### Completeness Checking

- Required sections present and non-empty
- All placeholders filled (no `[TODO]`, `[TBD]`)
- Cross-references resolved (linked docs exist)
- Code examples present where expected
- Acceptance criteria defined for CRs

### Clarity Metrics

- Readability scores (Flesch-Kincaid, etc.)
- Sentence complexity analysis
- Jargon detection and glossary suggestions
- Passive voice detection
- Ambiguous language flagging

### Consistency Verification

- Terminology consistency across docs
- Style guide compliance
- Naming convention adherence
- Date/version format consistency
- Cross-document term alignment

### Accuracy Validation

- Code examples compile/run
- API references match actual code
- Links resolve (no broken links)
- Version references are current
- Examples produce expected output

### Coverage Analysis

- Which features have documentation?
- Which APIs are documented?
- Which components lack READMEs?
- Documentation freshness (last updated)

---

## Architecture

### Documentation Quality Data Model

```typescript
interface DocQualityReport {
  timestamp: Date;
  summary: DocQualitySummary;
  files: DocFileAnalysis[];
  issues: DocQualityIssue[];
}

interface DocQualitySummary {
  totalDocs: number;
  completenesScore: number;    // 0-100
  clarityScore: number;        // 0-100
  consistencyScore: number;    // 0-100
  accuracyScore: number;       // 0-100
  overallScore: number;        // 0-100
}

interface DocFileAnalysis {
  path: string;
  type: DocType;
  completeness: CompletenessResult;
  clarity: ClarityResult;
  issues: DocQualityIssue[];
}

type DocType = 
  | "change-request"
  | "fix-request"
  | "adr"
  | "feature"
  | "scenario"
  | "readme"
  | "api-doc"
  | "guide";

interface DocQualityIssue {
  file: string;
  line?: number;
  category: "completeness" | "clarity" | "consistency" | "accuracy";
  severity: "error" | "warning" | "info";
  message: string;
  suggestion?: string;
}

interface CompletenessResult {
  requiredSections: SectionCheck[];
  placeholders: PlaceholderFinding[];
  brokenLinks: BrokenLink[];
}

interface ClarityResult {
  readabilityScore: number;
  avgSentenceLength: number;
  complexSentences: number;
  passiveVoice: number;
  jargonTerms: string[];
}
```

### Configuration Schema

```yaml
# .choragen/doc-quality.yaml
completeness:
  # Required sections by doc type
  change-request:
    required: [What, Why, Scope, "Acceptance Criteria"]
    recommended: ["Implementation Notes", "Completion Notes"]
  
  feature:
    required: [Overview, Capabilities, "User Stories", "Acceptance Criteria"]
    recommended: [Architecture, Implementation]
  
  adr:
    required: [Context, Decision, Consequences]

clarity:
  maxSentenceLength: 30
  maxParagraphLength: 150
  minReadabilityScore: 60  # Flesch-Kincaid
  flagPassiveVoice: true
  
consistency:
  # Term mappings (prefer left side)
  terminology:
    "Change Request": ["CR", "change request", "ChangeRequest"]
    "workflow": ["work flow", "work-flow"]
  
  # Style rules
  headingStyle: "title-case"
  listStyle: "dash"

accuracy:
  validateCodeExamples: true
  checkLinks: true
  checkApiReferences: true

thresholds:
  minOverallScore: 80
  minCompleteness: 90
  minClarity: 70
```

### Integration Points

#### Workflow Gates

```yaml
stages:
  - name: documentation
    type: verification
    gate:
      type: doc_quality
      minScore: 80
      requireComplete: true
```

#### CLI Commands

```bash
# Full documentation quality check
choragen docs:quality

# Check specific file
choragen docs:quality docs/design/core/features/my-feature.md

# Check completeness only
choragen docs:completeness

# Check clarity metrics
choragen docs:clarity

# Validate code examples
choragen docs:validate-examples

# Check for broken links
choragen docs:links
```

#### Agent Tool

```typescript
{
  name: "doc_quality",
  description: "Check documentation quality for files",
  parameters: {
    files: { type: "array", items: { type: "string" } },
    checks: { 
      type: "array", 
      items: { type: "string", enum: ["completeness", "clarity", "consistency", "accuracy"] }
    },
  },
  execute: async ({ files, checks = ["completeness", "clarity"] }) => {
    const report = await docQualityEngine.analyze(files, checks);
    return {
      passed: report.summary.overallScore >= 80,
      score: report.summary.overallScore,
      issues: report.issues.filter(i => i.severity === "error"),
      suggestions: report.issues.filter(i => i.severity === "warning"),
    };
  },
}
```

---

## Web Dashboard

### Routes

- `/docs/quality` — Overview with quality scores
- `/docs/quality/files` — Per-file quality analysis
- `/docs/quality/issues` — All quality issues
- `/docs/quality/coverage` — Documentation coverage
- `/docs/quality/config` — Configuration UI

### Components

- **Doc Quality Score Card** — Overall quality metrics
- **File Quality Table** — Per-file scores and issues
- **Issue Browser** — Filterable issue list
- **Coverage Heatmap** — Which code has docs
- **Terminology Checker** — Consistency violations
- **Example Validator** — Code example status

### Trust Score Integration

```typescript
trustScore = (
  lintScore * 0.20 +
  coverageScore * 0.15 +
  testPassRate * 0.15 +
  contractScore * 0.10 +
  securityScore * 0.15 +
  performanceScore * 0.10 +
  docQualityScore * 0.15
)
```

---

## User Stories

### As a Human Operator

I want to ensure all CRs have complete sections  
So that work is well-defined before starting

### As a Human Operator

I want to catch broken links in documentation  
So that readers don't hit dead ends

### As a Human Operator

I want consistent terminology across docs  
So that the documentation is coherent

### As an AI Agent

I want feedback on documentation clarity  
So that I can improve readability

### As an AI Agent

I want to validate my code examples work  
So that documentation is accurate

---

## Acceptance Criteria

- [ ] Completeness checking for all doc types (CR, FR, ADR, feature, etc.)
- [ ] Required section validation per doc type
- [ ] Placeholder detection (`[TODO]`, `[TBD]`, etc.)
- [ ] Broken link detection (internal and external)
- [ ] Readability score calculation (Flesch-Kincaid)
- [ ] Sentence complexity analysis
- [ ] Passive voice detection
- [ ] Terminology consistency checking
- [ ] Code example validation (TypeScript compilation)
- [ ] Configuration via `.choragen/doc-quality.yaml`
- [ ] `choragen docs:quality` CLI command
- [ ] `doc_quality` workflow gate type
- [ ] `doc_quality` agent tool
- [ ] Web dashboard with quality scores
- [ ] Documentation coverage metrics
- [ ] Doc quality contributes to trust score

---

## Linked ADRs

- ADR-017: Documentation Quality (to be created)

---

## Implementation

### Phase 1: Core Infrastructure
- Completeness checking
- Placeholder detection
- Link validation
- CLI commands

### Phase 2: Clarity Analysis
- Readability scoring
- Sentence analysis
- Passive voice detection

### Phase 3: Consistency & Accuracy
- Terminology checking
- Code example validation
- API reference verification

### Phase 4: Web Dashboard & Integration
- Quality dashboard
- Workflow gates
- Agent tools
- Trust score integration

---

## Design Decisions

### Readability Metrics

Use Flesch-Kincaid as primary metric — well-understood, widely used. Supplement with sentence length and complexity counts for actionable feedback.

### Code Example Validation

For TypeScript examples:
1. Extract code blocks from markdown
2. Attempt to compile with `tsc --noEmit`
3. Report compilation errors as accuracy issues

For runnable examples, optionally execute and compare output.

### Terminology Consistency

Build a project glossary from configuration. Flag terms that don't match preferred forms. Suggest corrections.

### Doc Type Detection

Infer doc type from:
1. File path (e.g., `change-requests/` → CR)
2. Frontmatter metadata
3. Content patterns (e.g., `**ID**: CR-` → CR)

Apply type-specific completeness rules.
