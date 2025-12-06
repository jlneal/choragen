# Change Request: Complete Design Documentation

**ID**: CR-20251206-005  
**Domain**: core  
**Status**: done  
**Created**: 2025-12-06  
**Owner**: Justin  

---

## What

Complete the design documentation for choragen by adding personas, use cases, and enhancements. Currently only features and scenarios exist.

---

## Why

Choragen should eat its own dogfood. The design documentation structure we enforce on other projects should be complete in our own project. This also serves as reference examples for users.

---

## Current State

```
docs/design/core/
├── personas/        # ❌ Empty
├── scenarios/       # ✅ 2 files
├── use-cases/       # ❌ Empty
├── features/        # ✅ 3 files
└── enhancements/    # ❌ Empty
```

---

## Scope

**In Scope**:
- Personas for choragen users
- Use cases for common workflows
- Enhancements for future improvements
- Review/update existing scenarios and features

**Out of Scope**:
- Additional domains (only core for now)

---

## Proposed Personas

1. **Solo Developer** - Individual using choragen for personal projects
2. **Team Lead** - Managing a team using choragen for coordination
3. **AI Agent** - The impl/control agents that interact with choragen
4. **Open Source Maintainer** - Managing contributions with traceability

---

## Proposed Use Cases

1. **Bootstrap New Project** - Initialize choragen in a new repo
2. **Create and Execute Task Chain** - Full CR → chain → tasks → done flow
3. **Review and Approve Work** - Control agent reviewing impl agent output
4. **Debug Failed Task** - Understanding why a task failed
5. **Onboard New Contributor** - Getting someone up to speed

---

## Proposed Enhancements

1. **MCP Server Integration** - (Already CR-20251206-003)
2. **VS Code Extension** - Visual task management
3. **Dashboard UI** - Web-based chain/task visualization
4. **Metrics and Analytics** - Track velocity, completion rates
5. **Multi-repo Coordination** - Cross-repo task chains

---

## Acceptance Criteria

- [x] 4 persona documents created
- [x] 5 use case documents created
- [x] 4 enhancement documents created (MCP Server already covered by CR-003)
- [x] Existing scenarios reviewed and updated if needed
- [x] Existing features reviewed and updated if needed
- [x] All docs follow template structure
- [x] Cross-references between related docs

---

## Linked ADRs

- ADR-002-governance-schema

---

## Completion Notes

**Completed**: 2025-12-06

Completed design documentation for choragen:

**Personas** (4): solo-developer, team-lead, ai-agent, open-source-maintainer
**Use Cases** (5): bootstrap-new-project, create-execute-task-chain, review-approve-work, debug-failed-task, onboard-new-contributor
**Enhancements** (4): vscode-extension, dashboard-ui, metrics-analytics, multi-repo-coordination

All existing scenarios (2) and features (3) updated with cross-references to new personas and use cases. Design docs now form a cohesive, well-linked whole.

**Task Chain**: CHAIN-012-complete-design-docs (4 tasks completed)
