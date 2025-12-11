# Change Request: Workflow Polish & Integration

**ID**: CR-20251210-007  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-10  
**Owner**: agent  

---

## What

Final integration, edge case handling, and UX polish for the workflow-driven chat interface. This CR addresses the gaps left after the core functionality is in place.

---

## Why

After CR-004 through CR-006 are complete, the core workflow and chat functionality will work, but there will be rough edges:

- No workflow history/archive view
- Limited error handling and recovery UI
- No loading states or typing indicators
- Mobile experience may be suboptimal
- Documentation needs updating

This CR polishes the experience and ensures production readiness.

---

## Scope

**In Scope**:
- Workflow history view (`/chat/history`) — list completed/cancelled workflows
- Error handling UI — clear error messages, retry options
- Loading states — skeleton loaders, typing indicators
- Mobile-responsive chat layout
- Workflow cancellation — ability to cancel active workflow
- Workflow pause/resume — pause workflow for later continuation
- Navigation integration — link sessions page to chat, link chains to workflows
- Documentation updates — update AGENTS.md, feature docs with final implementation details
- Update existing backlog CRs (001-003) to note they may be superseded by chat-driven workflow

**Out of Scope**:
- Workflow templates management UI (future CR)
- Multi-project support (future CR)
- Offline support

---

## Acceptance Criteria

- [ ] `/chat/history` route shows list of all workflows (active, paused, completed, cancelled)
- [ ] Workflow cards show: request ID, current stage, status, last activity time
- [ ] Can filter workflows by status
- [ ] Error messages display clearly with retry option where applicable
- [ ] Loading skeleton shows while workflow data loads
- [ ] Typing indicator shows when agent is processing
- [ ] Chat layout works on mobile (responsive breakpoints)
- [ ] Can cancel active workflow with confirmation
- [ ] Can pause workflow (stops at current point, can resume later)
- [ ] Sessions page links to associated workflow chat
- [ ] Chain cards link to associated workflow (if any)
- [ ] AGENTS.md updated with workflow-driven development guidance
- [ ] Feature docs updated with implementation references
- [ ] README updated with workflow quick start

---

## Affected Design Documents

- [Web Chat Interface](../../../design/core/features/web-chat-interface.md)
- [Workflow Orchestration](../../../design/core/features/workflow-orchestration.md)
- [Human-Driven Development](../../../design/core/scenarios/human-driven-development.md)

---

## Linked ADRs

- ADR-011: Web API Architecture

---

## Dependencies

- **CR-20251210-006**: Web Chat Interface (needs chat UI complete)

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create/modify:
- `packages/web/src/app/chat/history/page.tsx` — Workflow history route
- `packages/web/src/components/chat/workflow-card.tsx` — Workflow list item
- `packages/web/src/components/chat/typing-indicator.tsx` — Typing animation
- `packages/web/src/components/chat/error-message.tsx` — Error display
- `packages/web/src/components/sessions/session-card.tsx` — Add workflow link
- `packages/web/src/components/chains/chain-card.tsx` — Add workflow link
- `AGENTS.md` — Add workflow-driven development section
- `README.md` — Add workflow quick start

Consider adding Framer Motion for smooth animations on:
- Message appearance
- Typing indicator
- Stage transitions

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
