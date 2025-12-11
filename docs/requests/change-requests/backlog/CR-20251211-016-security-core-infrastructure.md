# Change Request: Security Core Infrastructure

**ID**: CR-20251211-016  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Build the foundational infrastructure for Security Scanning: dependency vulnerability scanning, secret detection, configuration, and CLI commands.

---

## Why

Security is the fourth pillar of the trust layer. Agent-generated code may introduce vulnerable dependencies, accidentally expose secrets, or use insecure patterns. This CR establishes the core infrastructure for detecting and preventing security issues before they reach production.

---

## Scope

**In Scope**:
- `@choragen/core` security module (`packages/core/src/security/`)
- Dependency vulnerability scanning via npm audit
- Basic secret detection with common patterns (AWS, GitHub, Stripe, etc.)
- Security report data model
- Configuration loading from `.choragen/security.yaml`
- Severity classification and thresholds
- CLI commands: `choragen security`, `choragen security:deps`, `choragen security:secrets`, `choragen security:check`

**Out of Scope**:
- SAST (static analysis) — CR-20251211-017
- Web dashboard — CR-20251211-018
- Workflow integration — CR-20251211-019

---

## Acceptance Criteria

- [ ] Dependency vulnerability scanning via `npm audit --json`
- [ ] Parse npm audit output into `Vulnerability` data model
- [ ] Severity classification (critical, high, medium, low)
- [ ] Secret detection with patterns for: AWS keys, GitHub tokens, Stripe keys, generic API keys
- [ ] Custom secret pattern configuration
- [ ] Allowlist patterns for test files
- [ ] Configuration loads from `.choragen/security.yaml`
- [ ] Severity thresholds (fail on critical/high, warn on medium)
- [ ] Security exceptions with reason and expiration
- [ ] `choragen security` runs full scan
- [ ] `choragen security:deps` runs vulnerability scan only
- [ ] `choragen security:secrets` runs secret detection only
- [ ] `choragen security:check` validates against thresholds, exits non-zero on failure
- [ ] Security score calculation (0-100)

---

## Affected Design Documents

- [Security Scanning](../../../design/core/features/security-scanning.md)

---

## Linked ADRs

- ADR-015: Security Scanning (to be created)

---

## Dependencies

- None

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create:

```
packages/core/src/security/
├── index.ts                    # Barrel exports
├── types.ts                    # SecurityReport, Vulnerability, SecretFinding
├── config.ts                   # Configuration loader
├── vulnerabilities/
│   ├── index.ts
│   ├── npm-audit.ts            # npm audit provider
│   └── types.ts
├── secrets/
│   ├── index.ts
│   ├── detector.ts             # Pattern-based detection
│   ├── patterns.ts             # Built-in patterns
│   └── types.ts
├── score.ts                    # Security score calculation
└── __tests__/
    ├── npm-audit.test.ts
    ├── secrets.test.ts
    └── config.test.ts
```

CLI commands:
```
packages/cli/src/commands/security.ts
packages/cli/src/commands/security-deps.ts
packages/cli/src/commands/security-secrets.ts
packages/cli/src/commands/security-check.ts
```

Built-in secret patterns:
```typescript
const PATTERNS = [
  { name: "AWS Access Key", pattern: /AKIA[0-9A-Z]{16}/ },
  { name: "AWS Secret Key", pattern: /[A-Za-z0-9/+=]{40}/ },
  { name: "GitHub Token", pattern: /gh[pousr]_[A-Za-z0-9_]{36,}/ },
  { name: "Stripe Key", pattern: /sk_live_[A-Za-z0-9]{24,}/ },
  { name: "Generic API Key", pattern: /api[_-]?key[_-]?[=:]["']?[A-Za-z0-9]{16,}/ },
];
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
