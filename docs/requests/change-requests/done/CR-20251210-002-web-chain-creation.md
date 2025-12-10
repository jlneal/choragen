# Change Request: Web Chain Creation UI Integration

**ID**: CR-20251210-002  
**Domain**: dashboard  
**Status**: done  
**Created**: 2025-12-10  
**Owner**: agent  

---

## What

Expose the existing `ChainCreator` component in the web dashboard UI.

---

## Why

The `ChainCreator` component and `chains.create` tRPC mutation already exist but are not accessible from the UI. Users cannot create chains from the web dashboard without this integration.

---

## Scope

**In Scope**:
- "New Chain" button in chains page header
- Route to `/chains/new` page (or dialog)
- Wire up existing `ChainCreator` component

**Out of Scope**:
- Form component changes (already complete)
- tRPC procedure changes (already complete)
- "Create Chain" action on request detail page (future enhancement)

---

## Proposed Changes

### UI Integration

Add button to `/app/chains/page.tsx`:

```
┌─────────────────────────────────────────────────┐
│ Task Chains                      [+ New Chain]  │
├─────────────────────────────────────────────────┤
```

Create `/app/chains/new/page.tsx` that renders `ChainCreator`.

---

## Affected Design Documents

- `docs/design/core/enhancements/dashboard-ui.md`

---

## Linked ADRs

- ADR-011-web-api-architecture

---

## Commits

No commits yet.

---

## Implementation Notes

Existing components to use:
- `src/components/chains/chain-creator.tsx` - Full form component
- `chains.create` mutation in `src/server/routers/chains.ts`

---

## Completion Notes

Implemented via CHAIN-058-chain-creation-ui:
- Created `/app/chains/new/page.tsx` rendering `ChainCreator` component
- Added "New Chain" button to `/app/chains/page.tsx` header matching requests page pattern
