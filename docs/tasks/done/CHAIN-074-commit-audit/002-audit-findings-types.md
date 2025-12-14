# Task: Implement Audit Findings Types

**Chain**: CHAIN-074-commit-audit  
**Task**: 002  
**Status**: todo  
**Type**: impl  
**Created**: 2025-12-13

---

## Objective

Create the TypeScript interfaces and types for audit task findings, which are the internal data structures used by audit tasks before compilation into feedback items.

---

## Context

Each audit task (security, architecture, standards, etc.) produces internal findings stored in chain context. These are not actual feedback items — they're intermediate data that the feedback compilation task aggregates.

Reference: `@/Users/justin/Projects/choragen/docs/requests/change-requests/doing/CR-20251213-003-commit-audit.md:114-127`

---

## Expected Files

- `packages/core/src/audit/types.ts` (new)
- `packages/core/src/audit/index.ts` (new)

---

## Acceptance Criteria

- [ ] `AuditTaskFindings` interface defined per CR spec
- [ ] `AuditFinding` interface with severity, category, description, file, line, suggestion
- [ ] `AuditSeverity` type: `"critical" | "major" | "minor" | "info"`
- [ ] `AuditTaskType` type for the 8 audit task types
- [ ] `AuditChainContext` interface for storing findings across tasks
- [ ] All types exported from `packages/core/src/audit/index.ts`
- [ ] JSDoc comments on all public types

---

## Constraints

- Types only — no implementation logic in this task
- Follow existing type patterns in `packages/core/src/`

---

## Notes

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
