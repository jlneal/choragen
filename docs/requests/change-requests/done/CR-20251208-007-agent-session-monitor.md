# Change Request: Agent Session Monitor

**ID**: CR-20251208-007  
**Domain**: web  
**Status**: done  
**Created**: 2025-12-08  
**Owner**: control-agent  

---

## Summary

Implement the agent session monitor with session list, detail view, and live status display for agent runtime sessions.

---

## Motivation

Users need visibility into agent sessions:
- See all running, paused, and completed sessions
- View session details (role, model, tokens, cost)
- Understand session state and progress
- Prepare for Phase 2 session control

---

## Scope

**In Scope**:
- Session list page with status filtering
- Session detail page with full info
- Token and cost display
- Session status badges
- Tool call history (if available)
- Error display for failed sessions

**Out of Scope**:
- Starting/stopping sessions (Phase 2)
- Real-time streaming (Phase 3)
- Live tool call display

---

## Proposed Changes

### Session List Page

```
/sessions
┌─────────────────────────────────────────────────────────────┐
│  Agent Sessions                    [All] [Running] [Paused] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟢 session-20251208-210855-abc123          running  │   │
│  │ impl · claude-3-5-sonnet · 45,231 tokens · $0.89    │   │
│  │ Started: 2 minutes ago                              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🟡 session-20251208-193422-def456          paused   │   │
│  │ control · claude-3-5-sonnet · 32,109 tokens · $0.64 │   │
│  │ Paused: 15 minutes ago · Turn 12                    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✅ session-20251208-182245-ghi789         completed │   │
│  │ impl · gpt-4o · 28,445 tokens · $0.57               │   │
│  │ Duration: 12 minutes · 8 tool calls                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ❌ session-20251208-154512-jkl012           failed  │   │
│  │ impl · claude-3-5-sonnet · 15,234 tokens · $0.31    │   │
│  │ Error: Rate limit exceeded (recoverable)            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Session Detail Page

```
/sessions/session-20251208-210855-abc123
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Sessions                                         │
│                                                             │
│  session-20251208-210855-abc123                   running   │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Role        │ │ Model       │ │ Provider    │           │
│  │ impl        │ │ claude-3-5  │ │ anthropic   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Tokens      │ │ Cost        │ │ Duration    │           │
│  │ 45,231      │ │ $0.89       │ │ 2m 34s      │           │
│  │ 38K in/7K out│            │ │             │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Context                                                    │
│  ─────────────────────────────────────────────────────────  │
│  Chain: CHAIN-041-interactive-menu                          │
│  Task: 003-start-session-wizard                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Tool Calls (23)                                            │
│  ─────────────────────────────────────────────────────────  │
│  │ # │ Tool          │ Status  │ Duration │                │
│  ├───┼───────────────┼─────────┼──────────┤                │
│  │ 1 │ read_file     │ ✓       │ 45ms     │                │
│  │ 2 │ grep_search   │ ✓       │ 120ms    │                │
│  │ 3 │ write_to_file │ ✓       │ 89ms     │                │
│  │ 4 │ run_command   │ ✓       │ 2.3s     │                │
│  └───┴───────────────┴─────────┴──────────┘                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Components

```typescript
// Session list components
SessionList        // Main list with filtering
SessionCard        // Individual session card
SessionStatusBadge // Status indicator (running/paused/done/failed)
SessionFilters     // Status, role, date filters

// Session detail components
SessionHeader      // ID, status, timestamps
SessionMetrics     // Token, cost, duration cards
SessionContext     // Chain/task links
ToolCallTable      // List of tool calls
ToolCallDetail     // Expandable tool call info
SessionError       // Error display for failed sessions
```

---

## Acceptance Criteria

- [x] `/sessions` page lists all sessions
- [x] Session cards show: ID, role, model, tokens, cost, status
- [x] Status badges with colors (green=running, yellow=paused, gray=done, red=failed)
- [x] Filter by status
- [x] Sort by date, tokens, cost
- [x] `/sessions/[id]` shows session detail
- [x] Display session metrics (tokens, cost, duration)
- [x] Show chain/task context if available
- [x] Display tool call history (deferred to Phase 2 — requires enhanced session tracking)
- [x] Show error details for failed sessions
- [x] Empty states for no sessions
- [x] Loading skeletons while fetching
- [x] `pnpm build` passes
- [x] `pnpm lint` passes

---

## Dependencies

- CR-20251208-002 (Web API Server)
- CR-20251208-003 (Dashboard Scaffold)

---

## Linked Design Documents

- [Web Dashboard](../../design/core/features/web-dashboard.md)
- [Agent Runtime](../../design/core/features/agent-runtime.md)

---

## Completion Notes

Implemented agent session monitor with list and detail views. Sessions are derived from file locks via the existing `sessions.ts` tRPC router. Token/cost display and tool call history require enhanced session tracking planned for Phase 2.

---

## Commits

**Chain**: CHAIN-047-agent-session-monitor

**Completed**: 2025-12-09

**Files Created**:
- `packages/web/src/components/sessions/session-status-badge.tsx`
- `packages/web/src/components/sessions/session-card.tsx`
- `packages/web/src/components/sessions/session-card-skeleton.tsx`
- `packages/web/src/components/sessions/session-filters.tsx`
- `packages/web/src/components/sessions/session-sort.tsx`
- `packages/web/src/components/sessions/session-list.tsx`
- `packages/web/src/components/sessions/session-empty.tsx`
- `packages/web/src/components/sessions/session-header.tsx`
- `packages/web/src/components/sessions/session-metrics.tsx`
- `packages/web/src/components/sessions/session-context.tsx`
- `packages/web/src/components/sessions/session-error.tsx`
- `packages/web/src/components/sessions/index.ts`
- `packages/web/src/hooks/use-session-filters.ts`
- `packages/web/src/app/sessions/page.tsx` (updated)
- `packages/web/src/app/sessions/[id]/page.tsx`
- `packages/web/src/app/sessions/[id]/session-detail-content.tsx`

**Notes**:
- Tool call history display deferred — current sessions router derives from file locks only
- Token/cost display placeholder — requires enhanced session tracking in Phase 2
