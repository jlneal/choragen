# Change Request: Backlog Sequencing

**ID**: CR-20251209-026  
**Domain**: core  
**Status**: done  
**Chain**: CHAIN-051  
**Created**: 2025-12-09  
**Owner**: agent  

---

## What

Add universal rank ordering to the backlog with support for group-based re-ranking.

---

## Why

A prioritized backlog enables:
- Clear "what's next" visibility
- Intentional commitment decisions
- Group-based batch prioritization
- Consistent ordering across views

---

## Scope

**In Scope**:
- Universal integer rank for backlog requests
- Drag-and-drop reordering
- Group re-ranking (move group, redistribute member ranks)
- Todo queue inherits from backlog (FIFO on promotion)
- Rank persistence

**Out of Scope**:
- Automatic ranking algorithms
- Priority scores/weights
- Time-based decay
- Cross-project ranking

---

## Proposed Changes

### Data Model

Ranks stored in `.choragen/backlog-ranks.json`:

```json
{
  "ranks": [
    { "requestId": "CR-20251209-018", "rank": 1 },
    { "requestId": "CR-20251209-019", "rank": 2 },
    { "requestId": "CR-20251209-020", "rank": 3 }
  ]
}
```

### Ranking Rules

1. **Universal ranks**: Every backlog request has a unique integer rank (1, 2, 3, ...)
2. **No gaps**: Ranks are always contiguous
3. **Insertion**: New requests default to end of backlog
4. **Group move**: Moving a group redistributes its members' ranks

### Group Re-ranking Example

```
Before: Group A at ranks 4, 5, 6
Action: Move group by +3
After:  Group A at ranks 7, 8, 9
        (Other requests shift to fill gaps)
```

### tRPC Procedures

```typescript
backlog.reorder({ requestId, newRank })
backlog.moveGroup({ groupId, delta })  // Positive = lower priority
backlog.getRanks()
```

### UI Components

- **BacklogList**: Drag-and-drop sortable list
- **RankBadge**: Shows current rank number
- **GroupMoveControls**: Up/down buttons for group movement

---

## Affected Design Documents

- `docs/design/core/features/web-dashboard.md`

---

## Linked ADRs

- ADR-011-web-api-architecture

---

## Dependencies

- CR-20251209-024 (Request Backlog)
- CR-20251209-025 (Request Groups)

---

## Commits

Pending commit with [CR-20251209-026]

---

## Implementation Notes

When a request is promoted from backlog to todo, it is removed from backlog-ranks.json. Todo maintains its own implicit ordering based on promotion time (FIFO).

---

## Completion Notes

Implemented Backlog Sequencing:

**Data Layer:**
- `.choragen/backlog-ranks.json` - Rank storage
- `packages/web/src/server/routers/backlog.ts` - Ranking operations

**tRPC Procedures:**
- `getRanks()`, `reorder()`, `moveGroup()`
- `addRequest()`, `removeRequest()`, `sync()`

**UI Components:**
- `RankBadge` - Shows priority number
- `SortableList` - @dnd-kit drag-and-drop wrapper
- Updated `BacklogList` with drag reordering

**Tests:** 19 unit tests for ranking operations

**Features:**
- Contiguous ranks (no gaps)
- Group re-ranking redistributes member ranks
- Drag disabled when filters active
- Auto-sync with actual backlog requests
