# Task: Expand AGENTS.md with Patterns

**Chain**: CHAIN-016-agentic-chassis  
**Task**: 006-expand-agents-md  
**Type**: implementation  
**Status**: done  
**Created**: 2025-12-06

---

## Objective

Expand the root AGENTS.md with "cookbook" patterns that make agents effective. Currently 206 lines, target ~500+ lines with practical patterns.

---

## Reference

See `/Users/justin/Projects/itinerary-planner/AGENTS.md` (873 lines) for inspiration.

---

## Expected Files

Update:
- `AGENTS.md`

---

## Sections to Add

### 1. Common Patterns (Copy-Paste Ready)

```markdown
## Common Patterns (Copy-Paste Ready)

**Use these patterns to avoid lint errors. Copy directly into your code.**

### HTTP Status Codes
\`\`\`typescript
import { HttpStatus } from "@choragen/contracts";

// ✅ CORRECT: Use enum constants
expect(response.status).toBe(HttpStatus.OK);
expect(response.status).toBe(HttpStatus.NOT_FOUND);

// ❌ WRONG: Magic numbers trigger lint errors
expect(response.status).toBe(404);
\`\`\`

### API Error Handling
\`\`\`typescript
import { ApiError, HttpStatus } from "@choragen/contracts";

throw new ApiError("Not found", HttpStatus.NOT_FOUND);
\`\`\`

### Design Contracts
\`\`\`typescript
import { DesignContract } from "@choragen/contracts";

export const GET = DesignContract({
  designDoc: "docs/design/core/features/task-management.md",
  handler: async (request) => {
    // Implementation
  },
});
\`\`\`
```

### 2. Validation Commands Reference

```markdown
## Validation Commands

Run these before committing:

\`\`\`bash
# Quick validation
choragen validate:quick

# Full validation
choragen validate:all

# Specific validators
choragen validate:links
choragen validate:adr-traceability
choragen validate:chain-types
\`\`\`
```

### 3. Test Traceability Workflow

```markdown
## Test Traceability

### Adding Test Metadata
\`\`\`typescript
/**
 * @design-doc docs/design/core/features/task-management.md
 * @test-type unit
 */
describe("TaskManager", () => {
  // tests
});
\`\`\`

### Validating Coverage
\`\`\`bash
choragen validate:test-coverage
\`\`\`
```

### 4. Lint After Every Edit

```markdown
## Lint After Every Edit (CRITICAL)

**Run ESLint after EVERY file edit to catch errors immediately.**

\`\`\`bash
pnpm lint
# Or for specific file:
npx eslint packages/core/src/file.ts
\`\`\`
```

### 5. Agentic Development Section

```markdown
## Agentic Development

This project is built using **agent-first development**.

### Key Principles
- All changes go through CR/FR → Chain → Task flow
- Control agents manage, impl agents execute
- Every commit references a CR or FR
- Validation scripts provide structured output

### Structured Output
All validation scripts output JSON for agent consumption:
\`\`\`bash
node scripts/validate-links.mjs 2>/dev/null | jq
\`\`\`
```

---

## Acceptance Criteria

- [ ] Common patterns section with copy-paste code
- [ ] Validation commands reference
- [ ] Test traceability workflow
- [ ] "Lint after every edit" section
- [ ] Agentic development section
- [ ] AGENTS.md is 400+ lines

---

## Verification

```bash
wc -l AGENTS.md
# Should be 400+ lines

grep -c "```" AGENTS.md
# Should have many code blocks
```
