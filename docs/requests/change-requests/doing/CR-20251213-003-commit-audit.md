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
1. **Audit Feedback Type** — A new feedback type for spot-check reviews (not QA, not bug fixes)
2. **Post-Commit Gate** — A gate in the workflow that triggers after commit creation
3. **Audit Chain Structure** — A chain of layered audit tasks (security, architecture, standards, etc.)
4. **Feedback Compilation Task** — Final task that compiles individual task findings into actual feedback items

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
- New `audit` feedback type in the Agent Feedback system
- Post-commit gate concept in workflow stages
- Audit chain with layered task types (security, architecture, standards, etc.)
- Each audit task provides its own findings (internal)
- Final feedback compilation task creates actual feedback items
- Integration with standard workflow's commit stage

**Out of Scope**:
- Full QA workflows
- Automated code analysis (linting, static analysis — already covered by verification stage)
- Blocking commits based on audit results (audits are advisory)
- Separate audit request documents (use feedback instead)

---

## Affected Design Documents

- [Agent Feedback](../../../design/core/features/agent-feedback.md) — Add `audit` feedback type
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

### Audit Feedback Type

Add `audit` to the existing feedback types in Agent Feedback:

| Type | Purpose | Urgency | Blocks Work? |
|------|---------|---------|---------------|
| **audit** | Spot-check findings from commit review | Low | No |

Audit feedback differs from other types:
- **Not targeted** — No specific problem or feature; broad review
- **Spot-check nature** — Not comprehensive QA
- **System-generated** — Created by audit agent, not human-requested
- **Advisory** — Findings may spawn FRs but don't block workflow
- **Batched** — Multiple findings per commit, grouped together

### Post-Commit Gate

The standard workflow has a commit stage (Stage 6). A post-commit gate would:
1. Fire after `git:commit` tool completes
2. Trigger automatic AR creation with commit metadata
3. Not block workflow progression (async audit)

### Audit Chain Structure

The audit is not a single agent but a **chain of specialized audit tasks**, each focusing on a different layer:

| Task | Type | Focus | Output |
|------|------|-------|--------|
| 1 | `security-audit` | Security vulnerabilities, secrets, permissions | Task-level findings |
| 2 | `architecture-audit` | Design patterns, coupling, dependencies | Task-level findings |
| 3 | `standards-audit` | Naming, structure, conventions | Task-level findings |
| 4 | `traceability-audit` | CR/FR refs, scope compliance, commit format | Task-level findings |
| 5 | `review` | Cross-cutting concerns, overall assessment | Task-level findings |
| 6 | `feedback-compilation` | Compile all findings into feedback items | Actual `audit` feedback |

### Task-Level Findings

Each audit task (1-5) produces **internal findings** stored in the chain context, not actual feedback:

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

### Feedback Compilation Task

The final task (6) reads all task-level findings and:
1. Deduplicates overlapping findings
2. Prioritizes by severity
3. Groups related findings
4. Creates actual `audit` feedback items
5. Optionally spawns FRs for critical/major issues

### Audit Feedback Structure

```typescript
// Example audit feedback creation
await tools.feedback.create({
  type: "audit",
  content: "Commit message missing CR/FR reference",
  context: {
    commit: {
      sha: "abc123",
      message: "fix: update validation logic",
      author: "agent",
      filesChanged: ["src/validation.ts"]
    },
    checklistItem: "CR/FR reference present and valid",
    severity: "minor"
  },
  priority: "low"
});
```

### Audit Checklists by Task Type

**Security Audit:**
- [ ] No secrets or credentials in code
- [ ] No hardcoded API keys
- [ ] Proper input validation
- [ ] No obvious injection vulnerabilities

**Architecture Audit:**
- [ ] Follows established patterns
- [ ] Appropriate coupling/cohesion
- [ ] Dependencies are reasonable
- [ ] No circular dependencies introduced

**Standards Audit:**
- [ ] Naming conventions followed
- [ ] File structure conventions followed
- [ ] Code style consistent
- [ ] Documentation present where required

**Traceability Audit:**
- [ ] Commit message follows format
- [ ] CR/FR reference present and valid
- [ ] Changed files within declared scope
- [ ] No unrelated changes bundled

**Review (Cross-cutting):**
- [ ] Changes are coherent as a unit
- [ ] No obvious bugs or logic errors
- [ ] Test coverage appropriate
- [ ] Overall quality assessment

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
