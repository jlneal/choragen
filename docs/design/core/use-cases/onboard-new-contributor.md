# Use Case: Onboard New Contributor

**Domain**: core  
**Created**: 2025-12-06  

---

## Actor

- **Primary**: [Open Source Maintainer](../personas/open-source-maintainer.md), [Team Lead](../personas/team-lead.md)
- **Secondary**: New contributor (human or [AI Agent](../personas/ai-agent.md))

---

## Preconditions

- Choragen is initialized in the project
- Project has existing CRs/FRs ready for contribution
- AGENTS.md and governance rules are configured
- Maintainer has identified a suitable first task

---

## Main Flow

1. **Identify a good first issue**
   - Look for CRs/FRs tagged as "good first issue"
   - Choose work with clear scope and acceptance criteria
   - Prefer tasks that don't require deep codebase knowledge

2. **Create a task chain for the contributor**
   ```bash
   choragen chain:new FR-20251206-001 fix-typos "Fix Documentation Typos"
   ```

3. **Add well-defined tasks**
   ```bash
   choragen task:add CHAIN-xxx 001-identify "Identify typos in docs"
   choragen task:add CHAIN-xxx 002-fix "Fix identified typos"
   choragen task:add CHAIN-xxx 003-verify "Verify all links work"
   ```

4. **Populate task files with context**
   
   Edit each task file to include:
   - Clear objective
   - Step-by-step instructions
   - Relevant file paths
   - Acceptance criteria
   - Verification commands

5. **Ready the first task**
   ```bash
   choragen task:ready CHAIN-xxx 001-identify
   ```

6. **Share onboarding materials with contributor**
   
   Provide:
   - Link to AGENTS.md for project conventions
   - Link to task file for their assignment
   - Instructions for running verification
   - Contact info for questions

7. **Contributor reads and understands context**
   - Reviews AGENTS.md
   - Reads task file completely
   - Asks clarifying questions if needed

8. **Contributor starts work**
   ```bash
   choragen task:start CHAIN-xxx 001-identify
   ```

9. **Contributor completes task**
   - Follows task instructions
   - Runs verification commands
   - Reports completion

10. **Maintainer reviews and provides feedback**
    - Review work against acceptance criteria
    - Approve or provide constructive rework feedback
    - Guide contributor through any issues

11. **Iterate until task is approved**
    ```bash
    choragen task:approve CHAIN-xxx 001-identify
    ```

12. **Continue with remaining tasks**
    - Contributor gains confidence with each task
    - Maintainer can assign more complex work over time

---

## Alternative Flows

### A1: AI agent as new contributor

Onboarding an AI coding assistant:
1. Provide the handoff prompt template:
   ```
   You are an implementation agent working on [project] at [path]
   
   Your task is defined in this file:
   docs/tasks/todo/CHAIN-xxx/001-task.md
   
   Read that file for your full instructions.
   ```
2. AI reads task file and AGENTS.md
3. AI executes task according to instructions
4. Control agent reviews AI output
5. Iterate with rework if needed

### A2: Contributor needs help

Contributor is stuck:
1. Contributor asks question (issue, chat, etc.)
2. Maintainer adds clarification to task file
3. Maintainer may add hints or examples
4. Contributor retries with new information
5. Document common questions for future contributors

### A3: Task too difficult for first contribution

Contributor struggles with assigned task:
1. Recognize signs of difficulty early
2. Offer to pair or provide more guidance
3. Consider reassigning to simpler task
4. Break current task into smaller pieces
5. Use experience to improve "good first issue" selection

### A4: Contributor wants to take on more

Successful first contribution:
1. Thank contributor for their work
2. Offer additional tasks from backlog
3. Consider assigning entire chain ownership
4. Gradually increase task complexity
5. Eventually, contributor can become maintainer

---

## Postconditions

- Contributor has successfully completed at least one task
- Contributor understands project conventions (AGENTS.md)
- Contributor knows how to:
  - Read task files
  - Run verification commands
  - Report completion
- Maintainer has assessed contributor's capabilities
- Path exists for continued contribution

---

## Onboarding Checklist

Provide this to new contributors:

- [ ] **Read AGENTS.md** - Understand project conventions
- [ ] **Read your task file** - Full context for your work
- [ ] **Set up development environment** - Follow README instructions
- [ ] **Run existing tests** - Verify environment works
- [ ] **Ask questions** - Don't hesitate to clarify
- [ ] **Make small commits** - Easier to review and revert
- [ ] **Run verification** - Before reporting completion
- [ ] **Report completion** - Let maintainer know you're done

---

## Task File Template for New Contributors

```markdown
# Task: [Clear Action-Oriented Title]

**Chain**: CHAIN-xxx  
**Task**: 001-task-slug  
**Status**: todo  
**Difficulty**: beginner  

---

## Objective

[One sentence describing what needs to be done]

---

## Background

[Context a new contributor needs to understand the task]

---

## Files to Modify

- `path/to/file1.ts` - [What to change]
- `path/to/file2.ts` - [What to change]

---

## Step-by-Step Instructions

1. [First step with specific details]
2. [Second step]
3. [Continue...]

---

## Acceptance Criteria

- [ ] [Specific, verifiable criterion]
- [ ] [Another criterion]

---

## Verification

Run these commands to verify your work:

```bash
pnpm build
pnpm test
```

---

## Getting Help

If you're stuck:
- Check [link to docs]
- Ask in [communication channel]
- Tag @maintainer in your PR
```

---

## Related Features

- [Task Chain Management](../features/task-chain-management.md)
- [Governance Enforcement](../features/governance-enforcement.md)

---

## Related Personas

- [Open Source Maintainer](../personas/open-source-maintainer.md)
- [AI Agent](../personas/ai-agent.md)
