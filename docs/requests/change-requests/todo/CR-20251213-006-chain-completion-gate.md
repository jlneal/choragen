# Change Request: Chain Completion Gate

**ID**: CR-20251213-006  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-13  
**Owner**: agent  

---

## What

Introduce a **chain completion gate** that fires when a task chain completes but before the associated request is closed. This ensures all chain-level requirements are satisfied before moving to request closure.

This CR introduces:
1. A `chain_complete` gate enhancement with validation hooks
2. Chain-level acceptance criteria verification
3. Integration with the chain lifecycle

---

## Why

Currently, chains can complete without verification that:
- All tasks have proper completion notes
- Acceptance criteria from the request are actually met
- Design documents were updated if the chain touched them
- All task files are in the correct state

A chain completion gate provides a structured checkpoint before the control agent closes the request.

---

## Acceptance Criteria

- [ ] Chain completion triggers validation hooks
- [ ] Gate verifies all tasks have completion notes (if required)
- [ ] Gate can check acceptance criteria markers in task files
- [ ] Gate validates design doc updates if chain scope includes them
- [ ] Failed validations produce actionable feedback
- [ ] Gate can be configured per-chain or globally

---

## Scope

**In scope:**
- Chain completion validation hooks
- Task file state verification
- Acceptance criteria checking
- Design doc update detection

**Out of scope:**
- Automated acceptance criteria evaluation (requires human judgment)
- Cross-chain validation
- Request-level validation (separate CR)

---

## Affected Design Documents

- [Standard Workflow](../../../design/core/features/standard-workflow.md) — Add chain completion gate concept
- [Task Chain Management](../../../design/core/features/task-chain-management.md) — Chain lifecycle hooks

---

## Linked ADRs

[Created during implementation]

---

## Commits

No commits yet.

---

## Task Chain

[Created during implementation]

---

## Implementation Notes

### Validation Checks

The chain completion gate should verify:

1. **Task state** — All tasks in `done/` directory
2. **Completion notes** — Each task file has completion notes (if template requires)
3. **Acceptance criteria** — Checkboxes in task files are checked
4. **Design doc updates** — If chain scope includes design docs, verify they were modified
5. **Test coverage** — If chain includes impl tasks, verify tests exist

### Hook Integration

```typescript
interface ChainHooks {
  onStart?: TransitionAction[];
  onComplete?: TransitionAction[];  // <-- Chain completion gate fires here
  onApprove?: TransitionAction[];
  onReject?: TransitionAction[];
}
```

### Configuration

```yaml
# In chain definition or workflow template
chainHooks:
  onComplete:
    - type: validation
      checks:
        - task_state
        - completion_notes
        - acceptance_criteria
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
