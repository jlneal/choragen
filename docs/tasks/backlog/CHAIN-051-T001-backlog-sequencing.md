# Task: Implement Backlog Sequencing

**Chain**: CHAIN-051  
**Task**: T001  
**Type**: impl  
**Status**: blocked  
**Blocked By**: CHAIN-049 (Backlog), CHAIN-050 (Groups)  
**Request**: CR-20251209-026  

---

## Objective

Add universal rank ordering to the backlog with support for group-based re-ranking.

---

## Acceptance Criteria

1. **Rank storage**: Ranks stored in `.choragen/backlog-ranks.json`
2. **Universal ranks**: Every backlog request has unique integer rank (1, 2, 3...)
3. **No gaps**: Ranks are always contiguous
4. **tRPC procedures**: `backlog.reorder`, `backlog.moveGroup`, `backlog.getRanks`
5. **Drag-and-drop**: Sortable backlog list
6. **Group re-ranking**: Moving a group redistributes member ranks
7. **Tests**: Unit tests for ranking operations

---

## Implementation Guide

### 1. Data Model

Create `.choragen/backlog-ranks.json`:

```json
{
  "ranks": [
    { "requestId": "CR-20251209-018", "rank": 1 },
    { "requestId": "CR-20251209-019", "rank": 2 }
  ]
}
```

### 2. Ranking Rules

- **Universal ranks**: Every backlog request has a unique integer rank
- **No gaps**: Ranks are always contiguous (1, 2, 3, not 1, 3, 5)
- **Insertion**: New requests default to end of backlog
- **Group move**: Moving a group redistributes its members' ranks

### 3. tRPC Procedures

Create `packages/web/src/server/routers/backlog.ts`:

```typescript
backlog.reorder({ requestId, newRank })
backlog.moveGroup({ groupId, delta })  // Positive = lower priority
backlog.getRanks()
```

### 4. UI Components

- Update BacklogList with drag-and-drop (use @dnd-kit or similar)
- Add RankBadge showing current rank number
- Add GroupMoveControls (up/down buttons)

---

## Files to Modify

- `packages/web/src/server/routers/index.ts` - Add backlog router
- `packages/web/src/app/requests/backlog/page.tsx` - Add drag-and-drop

## Files to Create

- `.choragen/backlog-ranks.json` - Initial empty ranks
- `packages/web/src/server/routers/backlog.ts` - Backlog ranking router
- `packages/web/src/components/backlog/rank-badge.tsx`
- `packages/web/src/components/backlog/sortable-list.tsx`
- `packages/web/src/__tests__/backlog-sequencing.test.ts`

---

## Notes

When a request is promoted from backlog to todo, it is removed from backlog-ranks.json. Todo maintains its own implicit ordering based on promotion time (FIFO).
