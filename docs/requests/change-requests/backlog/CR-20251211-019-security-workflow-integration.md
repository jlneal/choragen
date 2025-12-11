# Change Request: Security Workflow Integration

**ID**: CR-20251211-019  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Integrate security scanning with the workflow orchestration system, enabling security gates that block workflow advancement and agent tools for security verification.

---

## Why

Security without enforcement is advisory. To achieve the trust layer vision, security must be **enforced**:

- Workflow gates fail if critical vulnerabilities exist
- Workflow gates fail if secrets are detected
- Agents can check security before completing work
- Pre-commit hooks prevent secret commits

This ensures security issues are caught and fixed before code advances through the pipeline.

---

## Scope

**In Scope**:
- New gate type: `security_scan` — requires security score above threshold
- New gate type: `no_secrets` — requires zero secret findings
- New gate type: `no_critical_vulns` — requires zero critical vulnerabilities
- Agent tool: `security_scan` — check security for self-correction
- Pre-commit hook for secret detection
- Security results in workflow messages
- Workflow template updates to include security gates

**Out of Scope**:
- Automated vulnerability remediation
- Dependency update PRs
- Security alerting (Slack, email)

---

## Acceptance Criteria

- [ ] `security_scan` gate type blocks if score below threshold
- [ ] `no_secrets` gate type blocks if any secrets detected
- [ ] `no_critical_vulns` gate type blocks if critical vulnerabilities exist
- [ ] Gates support severity configuration (which levels block)
- [ ] Agents can call `security_scan` tool to check security
- [ ] Security findings appear as system messages in workflow chat
- [ ] Standard workflow template includes security gate
- [ ] Gate failure message includes security summary
- [ ] Pre-commit hook detects secrets before commit
- [ ] Security gates can be configured as warn-only for transition

---

## Affected Design Documents

- [Security Scanning](../../../design/core/features/security-scanning.md)
- [Workflow Orchestration](../../../design/core/features/workflow-orchestration.md)

---

## Linked ADRs

- ADR-011: Workflow Orchestration
- ADR-015: Security Scanning

---

## Dependencies

- **CR-20251211-016**: Security Core Infrastructure
- **CR-20251211-017**: Security SAST Integration
- **CR-20251211-018**: Security Web Dashboard

---

## Commits

No commits yet.

---

## Implementation Notes

New gate types in workflow templates:

```yaml
stages:
  - name: security
    type: verification
    gate:
      type: security_scan
      minScore: 80
      vulnerabilities:
        maxCritical: 0
        maxHigh: 0
      secrets:
        allowed: 0
```

Gate implementation:

```typescript
case "security_scan": {
  const report = await securityEngine.scan();
  
  if (report.summary.score < gate.minScore) {
    throw new Error(`Security score ${report.summary.score} below threshold ${gate.minScore}`);
  }
  
  if (report.summary.vulnerabilities.critical > gate.vulnerabilities.maxCritical) {
    throw new Error(`${report.summary.vulnerabilities.critical} critical vulnerabilities found`);
  }
  
  if (report.secrets.length > gate.secrets.allowed) {
    throw new Error(`${report.secrets.length} secrets detected in code`);
  }
  
  return;
}
```

Agent tool:

```typescript
{
  name: "security_scan",
  description: "Scan code for security vulnerabilities and issues",
  parameters: {
    files: { type: "array", items: { type: "string" } },
    type: { type: "string", enum: ["all", "deps", "secrets", "code"] },
  },
  execute: async ({ files, type = "all" }) => {
    const report = await securityEngine.scan(files, type);
    return {
      passed: report.summary.score >= 80,
      score: report.summary.score,
      vulnerabilities: report.summary.vulnerabilities,
      secrets: report.secrets.length,
      codeIssues: report.codeIssues.length,
    };
  },
}
```

Pre-commit hook (add to `githooks/`):
```bash
#!/bin/bash
# Run secret detection on staged files
choragen security:secrets --staged
if [ $? -ne 0 ]; then
  echo "❌ Secrets detected in staged files"
  exit 1
fi
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
