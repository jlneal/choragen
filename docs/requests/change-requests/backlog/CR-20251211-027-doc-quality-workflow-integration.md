# Change Request: Documentation Quality Workflow Integration

**ID**: CR-20251211-027  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Integrate documentation quality with the workflow orchestration system, enabling doc quality gates and agent tools for documentation verification.

---

## Why

Documentation quality without enforcement is advisory. To maintain documentation standards:

- Workflow gates fail if documentation is incomplete
- Workflow gates fail if quality score is too low
- Agents can check doc quality before completing work
- Documentation issues are caught before merge

---

## Scope

**In Scope**:
- New gate type: `doc_quality` — requires quality score above threshold
- New gate type: `doc_complete` — requires all required sections present
- Agent tool: `doc_quality` — check documentation quality
- Doc quality results in workflow messages
- Workflow template updates to include doc quality gates

**Out of Scope**:
- Automated documentation generation
- AI-powered documentation improvement
- Documentation alerting

---

## Acceptance Criteria

- [ ] `doc_quality` gate type blocks if score below threshold
- [ ] `doc_quality` supports category filtering (completeness, clarity, etc.)
- [ ] `doc_complete` gate type blocks if required sections missing
- [ ] Agents can call `doc_quality` tool
- [ ] Doc quality results appear in workflow chat
- [ ] Standard workflow template includes doc quality gate
- [ ] Gate failure message includes quality summary
- [ ] Doc quality gates can be configured as warn-only

---

## Affected Design Documents

- [Documentation Quality](../../../design/core/features/documentation-quality.md)
- [Workflow Orchestration](../../../design/core/features/workflow-orchestration.md)

---

## Linked ADRs

- ADR-011: Workflow Orchestration
- ADR-017: Documentation Quality

---

## Dependencies

- **CR-20251211-024**: Documentation Quality Core Infrastructure
- **CR-20251211-025**: Documentation Clarity Analysis
- **CR-20251211-026**: Documentation Quality Web Dashboard

---

## Commits

No commits yet.

---

## Implementation Notes

New gate types in workflow templates:

```yaml
stages:
  - name: documentation
    type: verification
    gate:
      type: doc_quality
      minScore: 80
      categories:
        completeness: true
        clarity: true
  
  - name: doc-complete
    type: verification
    gate:
      type: doc_complete
      docTypes: [change-request, feature]
```

Gate implementation:

```typescript
case "doc_quality": {
  const report = await docQualityEngine.analyze();
  
  if (report.summary.overallScore < gate.minScore) {
    throw new Error(
      `Doc quality score ${report.summary.overallScore} below threshold ${gate.minScore}`
    );
  }
  
  return;
}

case "doc_complete": {
  const report = await docQualityEngine.checkCompleteness(gate.docTypes);
  const incomplete = report.files.filter(f => !f.completeness.complete);
  
  if (incomplete.length > 0) {
    throw new Error(
      `Incomplete documentation:\n` +
      incomplete.map(f => `  ${f.path}: missing ${f.completeness.missingSections.join(", ")}`).join("\n")
    );
  }
  
  return;
}
```

Agent tool:

```typescript
{
  name: "doc_quality",
  description: "Check documentation quality",
  parameters: {
    files: { type: "array", items: { type: "string" } },
    checks: { 
      type: "array", 
      items: { type: "string", enum: ["completeness", "clarity", "consistency", "accuracy"] }
    },
  },
  execute: async ({ files, checks = ["completeness", "clarity"] }) => {
    const report = await docQualityEngine.analyze(files, checks);
    return {
      passed: report.summary.overallScore >= 80,
      score: report.summary.overallScore,
      issues: report.issues.filter(i => i.severity === "error"),
      suggestions: report.issues.filter(i => i.severity === "warning"),
    };
  },
}
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
