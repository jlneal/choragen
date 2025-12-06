# Persona: Open Source Maintainer

**Domain**: core  
**Created**: 2025-12-06  

---

## Description

A maintainer of an open source project who manages contributions from external developers, triages issues, reviews pull requests, and ensures project quality and consistency. They need to coordinate asynchronous contributions from people with varying levels of familiarity with the codebase.

---

## Goals

- **Maintain traceability** from issues to PRs to merged code
- **Onboard contributors** quickly with clear task definitions
- **Protect critical files** from accidental or malicious changes
- **Scale review capacity** by using AI assistants safely
- **Document decisions** for the community

---

## Pain Points

- **Context switching** - Reviewing PRs from many different contributors
- **Incomplete contributions** - PRs that don't follow project conventions
- **Security concerns** - Contributions that touch sensitive files
- **Decision fatigue** - Explaining the same architectural decisions repeatedly
- **Contributor churn** - New contributors not understanding project structure

---

## Key Workflows

1. **Triaging issues**
   - Convert issues to CRs/FRs with clear scope
   - Tag with appropriate labels and priority
   - Link to relevant ADRs for context

2. **Onboarding a contributor**
   - Create task chain from CR/FR
   - Populate task files with full context
   - Share task file as contribution guide

3. **Reviewing contributions**
   - Check governance compliance
   - Verify task acceptance criteria
   - Use `task:approve` or `task:rework`

4. **Using AI for maintenance**
   - Delegate routine tasks to AI agents
   - Use governance to limit AI scope
   - Review AI output before merging

---

## Success Metrics

- **Contributor success rate** - Do first-time contributors complete their tasks?
- **Review efficiency** - How long from PR to merge?
- **Governance violations** - Are sensitive files being protected?
- **Documentation coverage** - Are decisions being recorded?

---

## Linked Scenarios

- [Control Agent Workflow](../scenarios/control-agent-workflow.md)
- [Implementation Agent Workflow](../scenarios/implementation-agent-workflow.md)

---

## Linked Features

- [Task Chain Management](../features/task-chain-management.md)
- [Governance Enforcement](../features/governance-enforcement.md)
- [File Locking](../features/file-locking.md)
