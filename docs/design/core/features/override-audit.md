# Feature: Override Audit Trail

**Domain**: core  
**Created**: 2025-12-11  
**Status**: draft  

---

## Overview

Override Audit Trail provides accountability when humans bypass trust layer gates. When a workflow gate fails but a human chooses to proceed anyway, this decision is logged with rationale, creating an audit trail that enables pattern detection and accountability.

The trust layer is only as strong as its enforcement. Without override tracking:
- Bypasses are invisible and unaccountable
- Patterns of circumvention go undetected
- Trust metrics become unreliable
- Bad practices become normalized

---

## Capabilities

### Override Capture

- Log when any trust gate is bypassed
- Capture who bypassed (user identity)
- Capture when (timestamp)
- Capture what (which gate, what failure)
- Capture why (required rationale)
- Capture context (workflow, chain, task)

### Override Types

| Gate Type | Override Meaning |
|-----------|------------------|
| `lint` | Proceeding despite lint errors |
| `coverage` | Proceeding despite low coverage |
| `contracts` | Proceeding despite contract violations |
| `security` | Proceeding despite security issues |
| `performance` | Proceeding despite performance failures |
| `doc_quality` | Proceeding despite doc quality issues |
| `human_approval` | N/A (cannot be overridden) |

### Rationale Requirements

Overrides require structured rationale:
- **Reason category**: false-positive, time-pressure, known-issue, other
- **Description**: Free-text explanation
- **Ticket reference**: Optional link to tracking issue
- **Expiration**: When this override should be reviewed

### Pattern Detection

- Track override frequency per user
- Track override frequency per gate type
- Track override frequency per project area
- Alert on unusual patterns
- Weekly/monthly override reports

### Accountability Features

- Override history searchable and filterable
- Override trends over time
- Override leaderboard (who overrides most)
- Override justification review workflow
- Escalation for excessive overrides

---

## Architecture

### Override Data Model

```typescript
interface Override {
  id: string;
  timestamp: Date;
  
  // Who
  userId: string;
  userName: string;
  
  // What
  gateType: GateType;
  gateName: string;
  failureReason: string;
  failureDetails: Record<string, unknown>;
  
  // Where
  workflowId: string;
  chainId?: string;
  taskId?: string;
  
  // Why
  rationale: OverrideRationale;
}

interface OverrideRationale {
  category: "false-positive" | "time-pressure" | "known-issue" | "other";
  description: string;
  ticketRef?: string;
  expiresAt?: Date;
}

type GateType = 
  | "lint"
  | "coverage"
  | "contracts"
  | "security"
  | "performance"
  | "doc_quality";

interface OverrideReport {
  period: { start: Date; end: Date };
  totalOverrides: number;
  byGateType: Record<GateType, number>;
  byUser: Record<string, number>;
  byReason: Record<string, number>;
  trends: OverrideTrend[];
}

interface OverrideTrend {
  date: Date;
  count: number;
  gateType: GateType;
}
```

### Configuration Schema

```yaml
# .choragen/override-audit.yaml
enabled: true

rationale:
  required: true
  minLength: 20
  categories:
    - false-positive
    - time-pressure
    - known-issue
    - other

alerts:
  # Alert if user overrides more than N times per week
  userThreshold: 5
  # Alert if gate type overridden more than N times per week
  gateThreshold: 10
  # Alert channels
  channels:
    - type: dashboard
    - type: slack
      webhook: ${SLACK_WEBHOOK}

reports:
  weekly: true
  monthly: true
  recipients:
    - team-leads@example.com

retention:
  # How long to keep override records
  days: 365
```

### Integration Points

#### Workflow Gate Override

When a gate fails, the UI presents:
1. Failure details
2. Option to retry (fix and re-check)
3. Option to override (with rationale form)

```typescript
interface GateResult {
  passed: boolean;
  canOverride: boolean;
  failureReason?: string;
  failureDetails?: Record<string, unknown>;
}

async function handleGateFailure(
  gate: Gate,
  result: GateResult,
  workflow: Workflow
): Promise<"retry" | "override" | "abort"> {
  if (!result.canOverride) {
    // Some gates cannot be overridden (e.g., human_approval)
    return "abort";
  }
  
  const decision = await promptUserDecision(gate, result);
  
  if (decision.action === "override") {
    await recordOverride({
      gateType: gate.type,
      gateName: gate.name,
      failureReason: result.failureReason,
      failureDetails: result.failureDetails,
      workflowId: workflow.id,
      rationale: decision.rationale,
    });
  }
  
  return decision.action;
}
```

#### CLI Commands

```bash
# List recent overrides
choragen overrides

# Show override details
choragen overrides show <id>

# Generate override report
choragen overrides:report --period=weekly

# Search overrides
choragen overrides:search --user=<user> --gate=<type>
```

#### Agent Awareness

Agents cannot override gates, but they can:
- See that an override occurred
- See the rationale provided
- Factor override history into recommendations

---

## Web Dashboard

### Routes

- `/overrides` — Override dashboard with recent activity
- `/overrides/history` — Full override history with search
- `/overrides/[id]` — Single override detail
- `/overrides/reports` — Override reports and trends
- `/overrides/alerts` — Override alert configuration

### Components

- **Override Summary Card** — Recent override count and trend
- **Override Timeline** — Recent overrides with context
- **Override Detail** — Full override information
- **Override Search** — Filter by user, gate, date, reason
- **Override Trends Chart** — Overrides over time
- **User Override Table** — Overrides by user
- **Gate Override Table** — Overrides by gate type
- **Alert Configuration** — Threshold settings

### Override Flow UI

When a gate fails in the workflow chat:

```
┌─────────────────────────────────────────────┐
│ ⚠️ Gate Failed: coverage_threshold          │
│                                             │
│ Coverage is 72%, threshold is 80%           │
│                                             │
│ [Retry] [Override...] [Abort]               │
└─────────────────────────────────────────────┘
```

Override dialog:

```
┌─────────────────────────────────────────────┐
│ Override Gate: coverage_threshold           │
│                                             │
│ Reason: [dropdown]                          │
│   ○ False positive                          │
│   ○ Time pressure                           │
│   ● Known issue                             │
│   ○ Other                                   │
│                                             │
│ Explanation: (required)                     │
│ ┌─────────────────────────────────────────┐ │
│ │ Legacy code not covered, tracked in     │ │
│ │ JIRA-1234. Will address in next sprint. │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ Ticket: [JIRA-1234]                         │
│                                             │
│ [Cancel] [Override and Continue]            │
└─────────────────────────────────────────────┘
```

---

## User Stories

### As a Human Operator

I want to override a gate when I have a valid reason  
So that I can proceed with urgent work

### As a Human Operator

I want to see who has been overriding gates  
So that I can identify training needs or process issues

### As a Team Lead

I want weekly override reports  
So that I can monitor trust layer compliance

### As a Team Lead

I want alerts on excessive overrides  
So that I can intervene before bad practices become normalized

---

## Acceptance Criteria

- [ ] Override captured when any trust gate is bypassed
- [ ] Override includes: who, when, what gate, why (rationale)
- [ ] Rationale form with category dropdown and description
- [ ] Rationale minimum length configurable
- [ ] Optional ticket reference field
- [ ] Override history stored persistently
- [ ] `choragen overrides` CLI command lists recent overrides
- [ ] `choragen overrides:report` generates summary report
- [ ] Web dashboard shows override activity
- [ ] Override search by user, gate type, date range
- [ ] Override trends visualization
- [ ] Alert on user exceeding override threshold
- [ ] Alert on gate type exceeding override threshold
- [ ] Weekly/monthly report generation
- [ ] Override retention policy (configurable days)

---

## Linked ADRs

- ADR-018: Override Audit Trail (to be created)

---

## Implementation

### Phase 1: Core Infrastructure
- Override data model and storage
- Override capture in workflow gates
- CLI commands
- Basic configuration

### Phase 2: Web Dashboard
- Override history browser
- Override detail view
- Search and filtering
- Trends visualization

### Phase 3: Alerting & Reports
- Threshold-based alerts
- Weekly/monthly reports
- Email/Slack notifications

---

## Design Decisions

### Required Rationale

Overrides without rationale are meaningless. Requiring explanation:
- Forces conscious decision-making
- Creates accountability
- Enables pattern analysis
- Supports retrospective review

### Non-Overridable Gates

Some gates cannot be overridden:
- `human_approval` — The whole point is human decision
- Custom gates marked as `canOverride: false`

### Override vs Exception

Overrides are one-time bypasses. For recurring issues, use:
- Security exceptions (with expiration)
- Lint rule disabling
- Coverage threshold overrides

Overrides should be rare; frequent overrides indicate a configuration problem.

### Retention Policy

Override records are retained for accountability but not forever:
- Default: 365 days
- Configurable per organization
- Aggregated statistics kept longer than individual records
