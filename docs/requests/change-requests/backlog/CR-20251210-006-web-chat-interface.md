# Change Request: Web Chat Interface

**ID**: CR-20251210-006  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-10  
**Owner**: agent  

---

## What

Build the chat UI that humans use to interact with Choragen workflows. This is the primary human interaction point—where humans give high-level instructions, observe agent work, and approve stage gates.

---

## Why

The human-driven development scenario requires a chat interface where:

1. Humans can express intent in natural language ("Add pagination to the backlog")
2. Agents translate intent into Choragen operations
3. Humans observe agent work in real-time
4. Gate approval prompts surface at the right moments
5. Artifacts (CRs, chains, tasks, files) are linked and explorable

Without this UI, humans must interact via CLI or IDE chat panels, losing the unified view of workflow progress and the structured gate approval experience.

---

## Scope

**In Scope**:
- `ChatContainer` component with message list and input area
- Message type rendering: human, control, impl, system, gate_prompt, artifact, tool_call, error
- `GatePrompt` component with approve/reject buttons
- `ArtifactLink` component with expandable previews
- `WorkflowSidebar` showing stage progress, artifacts, metrics
- `/chat` route — main chat view, shows active workflow or start new
- `/chat/[workflowId]` route — specific workflow conversation
- Real-time message updates via tRPC subscription
- Input area with send functionality
- Workflow switcher (switch between active workflows)
- Start new workflow from chat (intent-based)
- Start workflow from existing backlog CR

**Out of Scope**:
- Workflow history/archive view (CR-20251210-007)
- Mobile-specific optimizations (CR-20251210-007)
- Typing indicators / advanced loading states (CR-20251210-007)
- Message editing/deletion

---

## Acceptance Criteria

- [ ] `/chat` route renders chat interface
- [ ] `/chat/[workflowId]` route shows specific workflow conversation
- [ ] Message list displays all message types with appropriate styling
- [ ] Human messages appear right-aligned in user bubble style
- [ ] Agent messages appear left-aligned with role indicator (control/impl)
- [ ] System messages appear centered with muted styling
- [ ] Gate prompts render as cards with Approve/Reject buttons
- [ ] Clicking Approve calls `workflow.satisfyGate` mutation
- [ ] Artifact links are clickable and expand to show preview
- [ ] Tool calls are collapsible (hidden by default, expandable)
- [ ] Workflow sidebar shows current stage with progress indicator
- [ ] Sidebar shows list of artifacts created during workflow
- [ ] Input area sends message via `workflow.sendMessage` mutation
- [ ] New messages appear in real-time via subscription
- [ ] Can start new workflow by typing intent (no active workflow)
- [ ] Can start workflow from backlog CR selection
- [ ] Can switch between active workflows

---

## Affected Design Documents

- [Web Chat Interface](../../../design/core/features/web-chat-interface.md)
- [Human-Driven Development](../../../design/core/scenarios/human-driven-development.md)

---

## Linked ADRs

- ADR-011: Web API Architecture

---

## Dependencies

- **CR-20251210-005**: Web-Runtime Bridge (needs tRPC workflow router)

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create:
- `packages/web/src/app/chat/page.tsx` — Main chat route
- `packages/web/src/app/chat/[workflowId]/page.tsx` — Workflow-specific route
- `packages/web/src/components/chat/` — Chat components directory
  - `chat-container.tsx`
  - `message-list.tsx`
  - `message-item.tsx`
  - `chat-input.tsx`
  - `gate-prompt.tsx`
  - `artifact-link.tsx`
  - `workflow-sidebar.tsx`
  - `workflow-switcher.tsx`

Use existing shadcn/ui components:
- `Card` for gate prompts and artifacts
- `Button` for actions
- `Input` for chat input
- `ScrollArea` for message list
- `Badge` for status indicators

For real-time updates, use tRPC's `useSubscription` hook with the `workflow.onMessage` subscription.

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
