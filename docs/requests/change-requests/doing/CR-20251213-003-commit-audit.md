# Change Request: Commit Audit

**ID**: CR-20251213-003  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-13  
**Owner**: agent  

---

## What

Introduce a **commit audit** mechanism that automatically creates an audit request after a commit is made. This enables post-commit spot checks to assess whether standards are being enforced and to identify potential issues.

This CR introduces:
1. **Audit Request Type (AR)** — A new request type for spot-check reviews (not QA, not bug fixes)
2. **Post-Commit Gate** — A gate in the workflow that triggers after commit creation
3. **Automatic Request Creation** — System-generated requests based on workflow events

---

## Why

Currently, all requests are manually created (CR for changes, FR for fixes). There's no mechanism for:
- **Automated quality spot checks** — Reviewing commits for standards compliance after the fact
- **Audit-style reviews** — Reviews without a specific focus, looking for issues broadly
- **Post-commit hooks** — Triggering actions after commits are created

Commit audits provide a lightweight review layer that catches issues that slip through task-level review. They're not full QA — they're spot checks that enforce standards and catch patterns.

---

## Scope

**In Scope**:
- New audit request type (AR) with appropriate template
- Post-commit gate concept in workflow stages
- Automatic AR creation triggered by post-commit gate
- AR template designed for spot-check reviews (not targeted like CR/FR)
- Integration with standard workflow's commit stage

**Out of Scope**:
- Full QA workflows
- Automated code analysis (linting, static analysis — already covered by verification stage)
- Blocking commits based on audit results (audits are advisory)

---

## Affected Design Documents

- [Standard Workflow](../../../design/core/features/standard-workflow.md) — Add post-commit gate concept
- [Governance Enforcement](../../../design/core/features/governance-enforcement.md) — Audit as governance mechanism

---

## Linked ADRs

- (To be created: ADR for audit request type and automatic request creation)

---

## Commits

No commits yet.

---

## Implementation Notes

### Audit Request Type

Audits differ from CRs and FRs:
- **Not targeted** — No specific problem or feature; broad review
- **Spot-check nature** — Not comprehensive QA
- **System-generated** — Created automatically, not manually
- **Advisory** — Findings may spawn FRs but don't block workflow

### Post-Commit Gate

The standard workflow has a commit stage (Stage 6). A post-commit gate would:
1. Fire after `git:commit` tool completes
2. Trigger automatic AR creation with commit metadata
3. Not block workflow progression (async audit)

### Automatic Request Creation

This is a new concept. Currently requests are manual. Options:
- **Hook-based** — `onCommit` hook creates AR
- **Gate-based** — Post-commit gate spawns audit workflow
- **Event-based** — Commit event triggers AR creation via orchestrator

### AR Template Structure

```markdown
# Audit Request: Commit {{COMMIT_SHA_SHORT}}

**ID**: AR-{{DATE}}-{{SEQ}}
**Type**: commit-audit
**Status**: todo
**Created**: {{DATE_FORMATTED}}
**Trigger**: post-commit

---

## Commit Details

**SHA**: {{COMMIT_SHA}}
**Author**: {{COMMIT_AUTHOR}}
**Date**: {{COMMIT_DATE}}
**Message**: {{COMMIT_MESSAGE}}
**Files Changed**: {{FILE_COUNT}}

---

## Audit Checklist

- [ ] Commit message follows format
- [ ] CR/FR reference present and valid
- [ ] Changed files within declared scope
- [ ] No unrelated changes bundled
- [ ] Standards compliance (naming, structure)

---

## Findings

(Populated by audit agent)

---

## Spawned Requests

(FRs created from findings, if any)
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
