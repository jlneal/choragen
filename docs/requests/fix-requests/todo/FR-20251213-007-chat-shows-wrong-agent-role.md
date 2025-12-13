# Fix Request: Chat Shows Wrong Agent Role Label

**ID**: FR-20251213-007  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-13  
**Severity**: low  
**Owner**: agent  

---

## Problem

The chat interface shows "Implementation agent..." in the typing indicator regardless of the actual workflow stage type. For ideation workflows, it should show "Ideation agent..." or similar.

---

## Expected Behavior

The typing indicator and agent message labels should reflect the current stage's role:
- Ideation stage → "Ideation agent..."
- Implementation stage → "Implementation agent..."
- Review stage → "Review agent..."

---

## Actual Behavior

The `ChatContainer` component has `agentRole = "impl"` as the default prop, and `ChatWorkflowContent` doesn't pass the actual stage type when rendering `ChatContainer`.

---

## Root Cause Analysis

In `packages/web/src/components/chat/chat-container.tsx:48`:
```typescript
agentRole = "impl",
```

In `packages/web/src/app/chat/[workflowId]/chat-workflow-content.tsx:239-243`:
```typescript
<ChatContainer
  workflowId={workflowId}
  initialMessages={messages}
  stageIndex={typeof stageIndex === "number" ? stageIndex : DEFAULT_STAGE_INDEX}
/>
```

The `agentRole` prop is not passed, so it defaults to `"impl"`.

---

## Proposed Fix

1. Derive `agentRole` from the current stage's `type` field in the workflow
2. Pass it to `ChatContainer` from `ChatWorkflowContent`
3. Map stage types to display-friendly role names

```typescript
const currentStage = workflow?.stages?.[workflow.currentStage];
const agentRole = currentStage?.type === "ideation" ? "ideation" 
  : currentStage?.type === "review" ? "control"
  : "impl";
```

---

## Affected Files

- `packages/web/src/app/chat/[workflowId]/chat-workflow-content.tsx`
- `packages/web/src/components/chat/typing-indicator.tsx` (may need role label mapping)

---

## Linked Design Docs

- `docs/design/core/features/web-chat-interface.md`

---

## Commits

No commits yet.

---

## Verification

- [ ] Ideation workflow shows "Ideation agent..." 
- [ ] Implementation stages show "Implementation agent..."
- [ ] Review stages show appropriate label

---

## Completion Notes

[Added when moved to done/]
