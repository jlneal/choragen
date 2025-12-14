# Change Request: Ideation Workflow Commit Gate

**ID**: CR-20251213-004  
**Domain**: core  
**Status**: doing  
**Created**: 2025-12-13  
**Owner**: agent  

---

## What

Add a **commit gate** to the Ideation Workflow that commits created request documents and triggers a commit audit. Currently, the ideation workflow creates requests but doesn't commit them, missing the opportunity for post-commit auditing.

This CR adds:
1. **Commit Stage** — New stage after creation that commits request docs
2. **Post-Commit Gate Integration** — Triggers commit audit (AR) for ideation commits
3. **Conditional Execution** — Only runs when requests are actually created (not on discard)

---

## Why

The Ideation Workflow currently ends at Stage 3 (Creation) with an `auto` gate that moves requests to backlog. However:

1. **No commit** — Created request docs aren't committed, leaving them as uncommitted changes
2. **No audit trail** — Without a commit, there's no post-commit audit opportunity
3. **Inconsistent with Standard Workflow** — Standard workflow has explicit commit stage; ideation should too

Adding a commit gate ensures:
- Request docs are properly committed with traceability
- Commit audits can verify request quality (proper format, complete fields, etc.)
- Consistency across workflows

---

## Scope

**In Scope**:
- Add commit stage to ideation workflow (Stage 4)
- Integrate with post-commit gate from CR-20251213-003
- Conditional execution: skip commit stage if workflow was discarded
- Update ideation workflow template

**Out of Scope**:
- Changes to exploration, proposal, or creation stages
- Modifications to the commit audit mechanism itself (covered by CR-20251213-003)
- Human approval for ideation commits (should be automatic after creation approval)

---

## Affected Design Documents

- [Ideation Workflow](../../../design/core/features/ideation-workflow.md) — Add commit stage
- [Standard Workflow](../../../design/core/features/standard-workflow.md) — Reference for commit stage pattern

---

## Linked ADRs

- (To be created with CR-20251213-003: ADR for audit request type)

---

## Commits

No commits yet.

---

## Implementation Notes

### Updated Workflow Stages

| Stage | Role | Gate | Purpose |
|-------|------|------|---------|
| **exploration** | Ideation | human_approval | Understand and scope the idea |
| **proposal** | Ideation | human_approval | Propose request structure |
| **creation** | Ideation | auto | Draft and create request docs |
| **commit** | Commit | post_commit | Commit requests, trigger audit |

### Conditional Commit

The commit stage should only execute if:
- Workflow was not discarded in exploration stage
- At least one request was created in creation stage

If discarded, workflow ends in "discarded" state without reaching commit stage.

### Updated Workflow Template

```yaml
name: ideation
displayName: Ideation Workflow
description: Explore and refine ideas into actionable requests

stages:
  - name: exploration
    type: ideation
    role: ideation
    gate:
      type: human_approval
      prompt: "Continue to request creation, or discard this idea?"
      options:
        - label: Continue
          action: advance
        - label: Discard
          action: discard

  - name: proposal
    type: ideation
    role: ideation
    gate:
      type: human_approval
      prompt: "Approve these request proposals?"

  - name: creation
    type: ideation
    role: ideation
    gate:
      type: auto
    onExit:
      - type: file_move
        pattern: "docs/requests/change-requests/draft/*.md"
        destination: "docs/requests/change-requests/backlog/"

  - name: commit
    type: commit
    role: commit
    condition: "workflow.state != 'discarded' && workflow.createdRequests.length > 0"
    gate:
      type: post_commit
      triggers:
        - audit_request
    onEnter:
      - type: command
        command: "git add docs/requests/change-requests/backlog/{{requestIds}}"
      - type: command
        command: "git commit -m 'docs(requests): create {{requestCount}} request(s) from ideation\n\n[IDEATION-{{workflowId}}]'"
```

### Commit Message Format

Ideation commits use a different format since they're not tied to a CR/FR:

```
docs(requests): create N request(s) from ideation

[IDEATION-{{workflowId}}]
```

The workflow ID provides traceability back to the ideation session.

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
