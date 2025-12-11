# Change Request: Override Audit Alerts and Reports

**ID**: CR-20251211-030  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Add alerting and reporting capabilities to override audit: threshold-based alerts, weekly/monthly reports, and notification channels.

---

## Why

Override tracking is only useful if patterns are surfaced proactively:
- Alert when a user overrides too frequently
- Alert when a gate type is overridden too often
- Generate periodic reports for team review
- Enable intervention before bad practices become normalized

---

## Scope

**In Scope**:
- Threshold-based alerts (user threshold, gate threshold)
- Alert configuration in `.choragen/override-audit.yaml`
- Dashboard alerts display
- `choragen overrides:report` CLI command
- Weekly/monthly report generation
- Report email delivery (optional)
- `/overrides/reports` web route
- `/overrides/alerts` configuration UI

**Out of Scope**:
- Slack/Teams integration (future enhancement)
- Real-time alert streaming
- Custom alert rules

---

## Acceptance Criteria

- [ ] Alert when user exceeds override threshold per week
- [ ] Alert when gate type exceeds override threshold per week
- [ ] Thresholds configurable in `.choragen/override-audit.yaml`
- [ ] Alerts displayed on override dashboard
- [ ] `choragen overrides:report` generates summary report
- [ ] Report includes: total overrides, by user, by gate, by reason
- [ ] Report includes trend comparison to previous period
- [ ] Weekly report auto-generation (configurable)
- [ ] Monthly report auto-generation (configurable)
- [ ] Report email delivery to configured recipients
- [ ] `/overrides/reports` shows generated reports
- [ ] `/overrides/alerts` allows threshold configuration

---

## Affected Design Documents

- [Override Audit Trail](../../../design/core/features/override-audit.md)

---

## Linked ADRs

- ADR-018: Override Audit Trail

---

## Dependencies

- **CR-20251211-028**: Override Audit Core Infrastructure
- **CR-20251211-029**: Override Audit Web Dashboard

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create:

```
packages/core/src/override-audit/
├── alerts/
│   ├── index.ts
│   ├── thresholds.ts           # Threshold checking
│   └── types.ts
├── reports/
│   ├── index.ts
│   ├── generator.ts            # Report generation
│   ├── email.ts                # Email delivery
│   └── types.ts
└── __tests__/
    ├── alerts.test.ts
    └── reports.test.ts
```

CLI command:
```
packages/cli/src/commands/overrides-report.ts
```

Web routes:
```
packages/web/src/app/overrides/
├── reports/
│   └── page.tsx
└── alerts/
    └── page.tsx
```

Alert checking logic:
```typescript
async function checkAlerts(): Promise<Alert[]> {
  const config = await loadConfig();
  const overrides = await getOverridesForPeriod("week");
  const alerts: Alert[] = [];
  
  // Check user thresholds
  const byUser = groupBy(overrides, "userId");
  for (const [userId, userOverrides] of Object.entries(byUser)) {
    if (userOverrides.length > config.alerts.userThreshold) {
      alerts.push({
        type: "user_threshold",
        userId,
        count: userOverrides.length,
        threshold: config.alerts.userThreshold,
      });
    }
  }
  
  // Check gate thresholds
  const byGate = groupBy(overrides, "gateType");
  for (const [gateType, gateOverrides] of Object.entries(byGate)) {
    if (gateOverrides.length > config.alerts.gateThreshold) {
      alerts.push({
        type: "gate_threshold",
        gateType,
        count: gateOverrides.length,
        threshold: config.alerts.gateThreshold,
      });
    }
  }
  
  return alerts;
}
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
