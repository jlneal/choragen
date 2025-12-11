# Feature: Security Scanning

**Domain**: core  
**Created**: 2025-12-11  
**Status**: draft  

---

## Overview

Security Scanning provides the fourth pillar of the trust layer: verifying that code and dependencies are free from known vulnerabilities, secrets, and security anti-patterns. While linting verifies structure, tests verify behavior, and contracts verify invariants, security scanning verifies **safety**.

```
Trust = Lint × Tests × Contracts × Security
```

For agent-generated code, security scanning is critical:
- Agents may introduce vulnerable dependencies
- Agents may accidentally expose secrets in code
- Agents may use insecure patterns they learned from training data
- Security issues can have severe consequences if not caught early

---

## Capabilities

### Dependency Vulnerability Scanning

- Scan `package.json`, `pnpm-lock.yaml` for known vulnerabilities
- Integration with vulnerability databases (npm audit, GitHub Advisory, NVD)
- Severity classification (critical, high, medium, low)
- Remediation suggestions (upgrade paths, patches)
- License compliance checking
- Outdated dependency detection

### Secret Detection

- Scan source files for leaked credentials
- Detect API keys, tokens, passwords, private keys
- Support for common patterns (AWS, GitHub, Stripe, etc.)
- Custom pattern configuration
- Pre-commit hook integration
- Historical scan (git history)

### Static Application Security Testing (SAST)

- Code pattern analysis for security anti-patterns
- SQL injection detection
- XSS vulnerability detection
- Path traversal detection
- Insecure cryptography usage
- Hardcoded credentials
- Unsafe deserialization

### Security Policy Enforcement

- Required security headers for API routes
- Authentication/authorization pattern verification
- Input validation requirements
- Output encoding requirements
- CORS configuration validation

---

## Architecture

### Security Data Model

```typescript
interface SecurityReport {
  timestamp: Date;
  summary: SecuritySummary;
  vulnerabilities: Vulnerability[];
  secrets: SecretFinding[];
  codeIssues: CodeSecurityIssue[];
}

interface SecuritySummary {
  vulnerabilities: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  secrets: number;
  codeIssues: number;
  score: number; // 0-100
}

interface Vulnerability {
  id: string;           // CVE or advisory ID
  package: string;
  version: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  description: string;
  fixedIn?: string;     // Version with fix
  url: string;          // Advisory URL
}

interface SecretFinding {
  type: string;         // "aws_key", "github_token", etc.
  file: string;
  line: number;
  snippet: string;      // Redacted snippet
  confidence: "high" | "medium" | "low";
}

interface CodeSecurityIssue {
  rule: string;
  severity: "critical" | "high" | "medium" | "low";
  file: string;
  line: number;
  message: string;
  remediation: string;
}
```

### Configuration Schema

```yaml
# .choragen/security.yaml
vulnerabilities:
  enabled: true
  severity:
    fail: [critical, high]    # Block on these
    warn: [medium]            # Warn on these
    ignore: [low]             # Ignore these
  
  exceptions:
    # Known false positives or accepted risks
    - id: "CVE-2023-12345"
      reason: "Not exploitable in our usage"
      expires: "2025-06-01"

secrets:
  enabled: true
  patterns:
    - name: "Custom API Key"
      pattern: "MYAPP_[A-Z0-9]{32}"
  
  allowlist:
    # Files that may contain test secrets
    - "**/__tests__/**"
    - "**/fixtures/**"

sast:
  enabled: true
  rules:
    sql-injection: error
    xss: error
    path-traversal: error
    hardcoded-credentials: error
    insecure-crypto: warning

licenses:
  allowed: [MIT, Apache-2.0, BSD-3-Clause, ISC]
  denied: [GPL-3.0, AGPL-3.0]
```

### Integration Points

#### Vulnerability Providers

```typescript
interface VulnerabilityProvider {
  name: string;
  scan(lockfile: string): Promise<Vulnerability[]>;
}

// Built-in providers
class NpmAuditProvider implements VulnerabilityProvider { }
class GithubAdvisoryProvider implements VulnerabilityProvider { }
class SnykProvider implements VulnerabilityProvider { }
```

#### Secret Detection Providers

```typescript
interface SecretDetector {
  name: string;
  patterns: SecretPattern[];
  scan(files: string[]): Promise<SecretFinding[]>;
}

// Built-in detectors
class GitLeaksDetector implements SecretDetector { }
class TruffleHogDetector implements SecretDetector { }
class CustomPatternDetector implements SecretDetector { }
```

#### Workflow Gates

```yaml
stages:
  - name: security
    type: verification
    gate:
      type: security_scan
      vulnerabilities:
        maxCritical: 0
        maxHigh: 0
      secrets:
        allowed: 0
      sast:
        maxCritical: 0
```

#### CLI Commands

```bash
# Full security scan
choragen security

# Vulnerability scan only
choragen security:deps

# Secret detection only
choragen security:secrets

# SAST scan only
choragen security:code

# Check against thresholds
choragen security:check

# Show exceptions
choragen security:exceptions
```

#### Agent Tool

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
      summary: report.summary,
      critical: report.vulnerabilities.filter(v => v.severity === "critical"),
      secrets: report.secrets,
      codeIssues: report.codeIssues.filter(i => i.severity === "critical"),
    };
  },
}
```

---

## Web Dashboard

### Routes

- `/security` — Overview dashboard with security score
- `/security/vulnerabilities` — Dependency vulnerability browser
- `/security/secrets` — Secret detection findings
- `/security/code` — SAST findings browser
- `/security/licenses` — License compliance status
- `/security/config` — Security configuration UI
- `/security/exceptions` — Manage security exceptions

### Components

- **Security Score Card** — Overall security health (0-100)
- **Vulnerability Table** — Dependencies with vulnerabilities
- **Secret Findings List** — Detected secrets with locations
- **Code Issues Table** — SAST findings with remediation
- **License Matrix** — Dependencies by license type
- **Exception Manager** — Add/remove security exceptions
- **Trend Chart** — Security score over time

### Trust Score Integration

Security contributes to the overall trust score:

```typescript
trustScore = (
  lintScore * 0.25 +
  coverageScore * 0.25 +
  testPassRate * 0.15 +
  contractScore * 0.15 +
  securityScore * 0.20
)
```

---

## User Stories

### As a Human Operator

I want to see security vulnerabilities at a glance  
So that I can prioritize remediation efforts

### As a Human Operator

I want to block workflows on critical vulnerabilities  
So that insecure code never reaches production

### As a Human Operator

I want to manage security exceptions with expiration  
So that accepted risks are periodically reviewed

### As an AI Agent

I want to check for secrets before committing  
So that I never accidentally expose credentials

### As an AI Agent

I want security feedback on my code  
So that I can fix issues before human review

---

## Acceptance Criteria

- [ ] Dependency vulnerability scanning via npm audit
- [ ] GitHub Advisory database integration
- [ ] Vulnerability severity classification
- [ ] Secret detection with common patterns (AWS, GitHub, etc.)
- [ ] Custom secret pattern configuration
- [ ] SAST rules for common vulnerabilities (SQLi, XSS, etc.)
- [ ] License compliance checking
- [ ] Security exceptions with expiration
- [ ] Configuration via `.choragen/security.yaml`
- [ ] `choragen security` CLI command
- [ ] `choragen security:check` threshold validation
- [ ] `security_scan` workflow gate type
- [ ] `security_scan` agent tool
- [ ] Web dashboard with security score
- [ ] Vulnerability browser with remediation suggestions
- [ ] Secret findings with redacted snippets
- [ ] Security contributes to trust score

---

## Linked ADRs

- ADR-015: Security Scanning (to be created)

---

## Linked Scenarios

- [Human-Driven Development](../scenarios/human-driven-development.md) — Security enables trust in agent-generated code

---

## Implementation

[Added when implemented]

### Phase 1: Core Infrastructure
- Vulnerability scanning (npm audit)
- Secret detection (basic patterns)
- Configuration loading
- CLI commands

### Phase 2: Advanced Detection
- GitHub Advisory integration
- Custom secret patterns
- SAST rules
- License compliance

### Phase 3: Web Dashboard
- Security overview
- Vulnerability browser
- Secret findings
- Exception management

### Phase 4: Workflow Integration
- Security gates
- Agent tools
- Trust score integration

---

## Design Decisions

### Multiple Vulnerability Sources

Combine multiple vulnerability databases for comprehensive coverage:
- npm audit (fast, built-in)
- GitHub Advisory (comprehensive, requires token)
- Snyk (commercial, most comprehensive)

Results are deduplicated by CVE/advisory ID.

### Secret Detection Approach

Use pattern-based detection with entropy analysis:
- Known patterns (AWS keys, GitHub tokens) — high confidence
- High-entropy strings — medium confidence
- Custom patterns — configurable confidence

False positives are managed via allowlists and exceptions.

### SAST Scope

Focus on high-impact, low-false-positive rules:
- SQL injection (parameterized queries)
- XSS (output encoding)
- Path traversal (path validation)
- Hardcoded credentials (secret detection overlap)

Avoid noisy rules that generate many false positives.

### Exception Management

Security exceptions require:
- Explicit reason (why this is acceptable)
- Expiration date (forces periodic review)
- Audit trail (who approved, when)

Expired exceptions automatically become violations.
