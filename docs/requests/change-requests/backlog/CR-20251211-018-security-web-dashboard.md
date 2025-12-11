# Change Request: Security Web Dashboard

**ID**: CR-20251211-018  
**Domain**: web  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Build the web dashboard for security scanning: security score overview, vulnerability browser, secret findings, SAST issues, license compliance, and exception management.

---

## Why

The web dashboard provides visibility into security posture without requiring CLI expertise. It enables:

- At-a-glance security health assessment
- Drill-down into specific vulnerabilities and issues
- Exception management with audit trail
- Configuration without editing YAML files
- Integration with the overall trust score

---

## Scope

**In Scope**:
- `/security` route — Overview dashboard with security score
- `/security/vulnerabilities` route — Dependency vulnerability browser
- `/security/secrets` route — Secret detection findings
- `/security/code` route — SAST findings browser
- `/security/licenses` route — License compliance status
- `/security/exceptions` route — Exception management
- `/security/config` route — Security configuration UI
- tRPC router for security operations
- Security summary card on main dashboard
- Trust score integration

**Out of Scope**:
- Workflow gate integration (CR-20251211-019)
- Real-time scanning (scan on demand)
- Automated remediation

---

## Acceptance Criteria

- [ ] `/security` shows security score (0-100) with breakdown
- [ ] Security score includes: vulnerabilities, secrets, code issues, licenses
- [ ] `/security/vulnerabilities` lists dependencies with vulnerabilities
- [ ] Vulnerabilities sortable by severity, package, fix availability
- [ ] Vulnerability detail shows CVE, description, remediation
- [ ] `/security/secrets` shows detected secrets with redacted snippets
- [ ] `/security/code` shows SAST findings with file locations
- [ ] `/security/licenses` shows license compliance matrix
- [ ] `/security/exceptions` allows adding exceptions with reason and expiration
- [ ] Exception audit trail (who added, when, why)
- [ ] `/security/config` allows threshold configuration
- [ ] Configuration changes persist to `.choragen/security.yaml`
- [ ] Security contributes to trust score on main dashboard
- [ ] tRPC router exposes all security operations

---

## Affected Design Documents

- [Security Scanning](../../../design/core/features/security-scanning.md)
- [Web Chat Interface](../../../design/core/features/web-chat-interface.md)

---

## Linked ADRs

- ADR-011: Web API Architecture
- ADR-015: Security Scanning

---

## Dependencies

- **CR-20251211-016**: Security Core Infrastructure
- **CR-20251211-017**: Security SAST Integration

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create:

```
packages/web/src/
├── app/security/
│   ├── page.tsx                    # Overview dashboard
│   ├── vulnerabilities/
│   │   └── page.tsx                # Vulnerability browser
│   ├── secrets/
│   │   └── page.tsx                # Secret findings
│   ├── code/
│   │   └── page.tsx                # SAST findings
│   ├── licenses/
│   │   └── page.tsx                # License compliance
│   ├── exceptions/
│   │   └── page.tsx                # Exception management
│   └── config/
│       └── page.tsx                # Configuration
├── components/security/
│   ├── security-score-card.tsx     # Score with breakdown
│   ├── vulnerability-table.tsx     # Vulnerability list
│   ├── secret-findings-list.tsx    # Secret findings
│   ├── code-issues-table.tsx       # SAST findings
│   ├── license-matrix.tsx          # License compliance
│   ├── exception-form.tsx          # Add/edit exception
│   └── exception-list.tsx          # Exception browser
└── server/routers/
    └── security.ts                 # tRPC router
```

tRPC procedures:
- `security.getSummary` — Security score and breakdown
- `security.getVulnerabilities` — Vulnerability list with filters
- `security.getSecrets` — Secret findings
- `security.getCodeIssues` — SAST findings
- `security.getLicenses` — License compliance
- `security.getExceptions` — Current exceptions
- `security.addException` — Add new exception
- `security.removeException` — Remove exception
- `security.getConfig` — Current configuration
- `security.updateConfig` — Update configuration

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
