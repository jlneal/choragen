# ADR-015: Commit Audit Mechanism

**Status**: done  
**Created**: 2025-12-13  
**Linked CR/FR**: CR-20251213-003  
**Linked Design Docs**:
- docs/design/core/features/agent-feedback.md
- docs/design/core/features/standard-workflow.md
- docs/design/core/features/governance-enforcement.md

---

## Context

Currently, all requests are manually created (CR for changes, FR for fixes). There's no mechanism for:

1. **Automated quality spot checks** — Reviewing commits for standards compliance after the fact
2. **Audit-style reviews** — Reviews without a specific focus, looking for issues broadly
3. **Post-commit hooks** — Triggering actions after commits are created

The standard workflow has a commit stage (Stage 6) but no post-commit gate to trigger automatic review. Commit audits would provide a lightweight review layer that catches issues that slip through task-level review. They're not full QA — they're spot checks that enforce standards and catch patterns.

---

## Decision

Introduce a **commit audit mechanism** with the following components:

### 1. Audit Feedback Type

Add `audit` to the existing feedback types in Agent Feedback:

| Type | Purpose | Urgency | Blocks Work? |
|------|---------|---------|--------------|
| **audit** | Spot-check findings from commit review | Low | No |

Audit feedback differs from other types:
- **Not targeted** — No specific problem or feature; broad review
- **Spot-check nature** — Not comprehensive QA
- **System-generated** — Created by audit chain, not human-requested
- **Advisory** — Findings may spawn FRs but don't block workflow
- **Batched** — Multiple findings per commit, grouped together

### 2. Post-Commit Gate

A gate in the standard workflow that fires after `git:commit` tool completes:
- Triggers automatic audit chain creation with commit metadata
- Does not block workflow progression (async audit)
- Passes commit SHA, message, and changed files to audit chain

### 3. Audit Chain Structure

The audit is a **chain of specialized audit tasks**, each focusing on a different layer:

| Task | Type | Focus |
|------|------|-------|
| 1 | `security-audit` | Security vulnerabilities, secrets, permissions |
| 2 | `architecture-audit` | Design patterns, coupling, dependencies |
| 3 | `standards-audit` | Naming, structure, conventions |
| 4 | `documentation-audit` | Comments, README, API docs, design doc refs |
| 5 | `testing-audit` | Test coverage, test quality, edge cases |
| 6 | `traceability-audit` | CR/FR refs, scope compliance, commit format |
| 7 | `performance-audit` | Obvious inefficiencies, resource usage |
| 8 | `review` | Cross-cutting concerns, overall assessment |
| 9 | `feedback-compilation` | Compile all findings into feedback items |

### 4. Task-Level Findings

Each audit task (1-8) produces **internal findings** stored in the chain context, not actual feedback:

```typescript
interface AuditTaskFindings {
  taskType: string;
  findings: Array<{
    severity: "critical" | "major" | "minor" | "info";
    category: string;
    description: string;
    file?: string;
    line?: number;
    suggestion?: string;
  }>;
}
```

### 5. Feedback Compilation

The final task (9) reads all task-level findings and:
1. Deduplicates overlapping findings
2. Prioritizes by severity
3. Groups related findings
4. Creates actual `audit` feedback items
5. Optionally spawns FRs for critical/major issues

---

## Consequences

**Positive**:
- Catches issues that slip through task-level review
- Provides systematic quality enforcement without blocking workflow
- Creates audit trail for compliance and improvement
- Enables pattern detection across commits over time

**Negative**:
- Additional processing overhead per commit
- May generate noise if not tuned properly
- Requires maintenance of audit checklists

**Mitigations**:
- Audit runs asynchronously, doesn't block workflow
- Severity levels allow filtering low-priority findings
- Checklists are configurable per project

---

## Alternatives Considered

### Alternative 1: Single Audit Agent

A single agent performs all audit checks in one pass.

**Rejected because**: Specialized audit tasks allow for deeper expertise in each domain. A single agent would have too broad a scope and might miss domain-specific issues. The chain structure also allows parallel execution of independent audits.

### Alternative 2: Pre-Commit Audits

Run audits before commits are created, blocking if issues found.

**Rejected because**: This would slow down the workflow significantly. The verification stage already handles blocking checks (build, test, lint). Audits are meant to be advisory spot-checks, not blocking gates.

### Alternative 3: Separate Audit Request Documents

Create AR (Audit Request) documents similar to CR/FR.

**Rejected because**: Audits are lightweight and don't need the full request lifecycle. Using feedback items keeps them visible without cluttering the request stream. Critical findings can spawn FRs if they need formal tracking.

---

## Implementation

- `packages/core/src/audit/types.ts` — Audit findings domain types
- `packages/core/src/audit/index.ts` — Barrel export
- `packages/core/src/feedback/types.ts` — Added `audit` feedback type and `FEEDBACK_TYPE_BEHAVIOR`
- `packages/core/src/feedback/FeedbackManager.ts` — Default priority derivation from behavior map
- `packages/core/src/workflow/types.ts` — Added `post_commit` gate type and `PostCommitMetadata`
- `packages/core/src/workflow/gates/post-commit.ts` — Post-commit gate handler
- `packages/core/src/workflow/gates/index.ts` — Gates barrel export
- `packages/core/src/workflow/manager.ts` — `post_commit` case in `ensureGateSatisfied`
- `packages/core/src/workflow/templates.ts` — `auditEnabled` parsing
- `templates/workflow-templates/audit.yaml` — 9-stage audit workflow template
