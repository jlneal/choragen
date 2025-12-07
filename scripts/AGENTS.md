# Agent Guidelines for scripts/

This directory contains validation and utility scripts for the Choragen project.

## Available Scripts

| Script | Purpose |
|--------|---------|
| `validate-links.mjs` | Validate bidirectional links between docs and implementation |
| `validate-adr-traceability.mjs` | Validate ADR links to CR/FR and design docs |
| `validate-uncommitted-requests.mjs` | Detect done requests with uncommitted work |

## Running Scripts

```bash
# From project root
node scripts/validate-links.mjs
node scripts/validate-adr-traceability.mjs
```

## Script Conventions

### Naming

- Use kebab-case: `validate-something.mjs`
- Prefix with action verb: `validate-`, `generate-`, `check-`
- Use `.mjs` extension for ES modules

### Structure

Each script should:

1. Start with shebang: `#!/usr/bin/env node`
2. Include JSDoc header explaining purpose
3. Reference governing ADR: `* ADR: ADR-xxx-name`
4. Exit with appropriate code (0 = success, 1 = error)

### Example Template

```javascript
#!/usr/bin/env node
/**
 * Brief description of what this script does
 *
 * Checks:
 * 1. First thing it validates
 * 2. Second thing it validates
 *
 * ADR: ADR-xxx-name
 */

import { readFileSync } from "node:fs";

// Implementation...

process.exit(errors > 0 ? 1 : 0);
```

## Adding New Scripts

1. Create file in `scripts/` with `.mjs` extension
2. Follow naming convention: `action-target.mjs`
3. Add JSDoc header with ADR reference
4. Add script to `package.json` if it should be a CLI command
5. Update this file's "Available Scripts" table

## Output Conventions

Use ANSI colors for terminal output:

```javascript
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const NC = "\x1b[0m"; // No Color

console.log(`${GREEN}✅ Success${NC}`);
console.log(`${YELLOW}⚠️  Warning${NC}`);
console.log(`${RED}❌ Error${NC}`);
```
