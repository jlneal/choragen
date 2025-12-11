# Change Request: Override Audit Web Dashboard

**ID**: CR-20251211-029  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Build the web dashboard for override audit: override history browser, search and filtering, trends visualization, and override flow UI in workflow chat.

---

## Why

The web dashboard provides visibility into override activity:
- See who is overriding gates and why
- Identify patterns of circumvention
- Review override justifications
- Track override trends over time

---

## Scope

**In Scope**:
- `/overrides` route — Override dashboard with recent activity
- `/overrides/history` route — Full override history with search
- `/overrides/[id]` route — Single override detail
- Override flow UI in workflow chat (rationale dialog)
- tRPC router for override operations
- Override summary card on main dashboard

**Out of Scope**:
- Alerting and reports — CR-20251211-030
- Email/Slack notifications

---

## Acceptance Criteria

- [ ] `/overrides` shows recent override activity
- [ ] Override count and trend on dashboard
- [ ] `/overrides/history` shows full override history
- [ ] Search by user, gate type, date range, reason category
- [ ] `/overrides/[id]` shows full override detail
- [ ] Override flow UI when gate fails in workflow chat
- [ ] Rationale dialog with category, description, ticket ref
- [ ] Override trends chart (overrides over time)
- [ ] Overrides by user table
- [ ] Overrides by gate type table
- [ ] tRPC router exposes override operations

---

## Affected Design Documents

- [Override Audit Trail](../../../design/core/features/override-audit.md)
- [Web Chat Interface](../../../design/core/features/web-chat-interface.md)

---

## Linked ADRs

- ADR-011: Web API Architecture
- ADR-018: Override Audit Trail

---

## Dependencies

- **CR-20251211-028**: Override Audit Core Infrastructure

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create:

```
packages/web/src/
├── app/overrides/
│   ├── page.tsx                    # Override dashboard
│   ├── history/
│   │   └── page.tsx                # Full history
│   └── [id]/
│       └── page.tsx                # Override detail
├── components/overrides/
│   ├── override-summary-card.tsx   # Recent activity
│   ├── override-timeline.tsx       # Recent overrides
│   ├── override-search.tsx         # Search/filter
│   ├── override-trends-chart.tsx   # Trends over time
│   ├── override-by-user-table.tsx  # User breakdown
│   ├── override-by-gate-table.tsx  # Gate breakdown
│   └── override-rationale-dialog.tsx # Rationale form
└── server/routers/
    └── overrides.ts                # tRPC router
```

Override rationale dialog (in workflow chat):
```tsx
function OverrideRationaleDialog({ gate, onSubmit, onCancel }) {
  const [category, setCategory] = useState<RationaleCategory>();
  const [description, setDescription] = useState("");
  const [ticketRef, setTicketRef] = useState("");
  
  return (
    <Dialog>
      <DialogTitle>Override Gate: {gate.name}</DialogTitle>
      <DialogContent>
        <Select value={category} onChange={setCategory}>
          <Option value="false-positive">False positive</Option>
          <Option value="time-pressure">Time pressure</Option>
          <Option value="known-issue">Known issue</Option>
          <Option value="other">Other</Option>
        </Select>
        <Textarea 
          value={description} 
          onChange={setDescription}
          placeholder="Explain why this override is justified..."
          minLength={20}
        />
        <Input 
          value={ticketRef} 
          onChange={setTicketRef}
          placeholder="Ticket reference (optional)"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>Cancel</Button>
        <Button onClick={() => onSubmit({ category, description, ticketRef })}>
          Override and Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
