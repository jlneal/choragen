// ADR: ADR-001-task-file-format

/**
 * Init command - scaffolds the Choragen directory structure
 */

import { mkdir, writeFile, chmod } from "node:fs/promises";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { execSync } from "node:child_process";

/**
 * Directory structure to create for a new Choragen project
 */
const DIRECTORIES = [
  // docs/requests
  "docs/requests/change-requests/todo",
  "docs/requests/change-requests/doing",
  "docs/requests/change-requests/done",
  "docs/requests/fix-requests/todo",
  "docs/requests/fix-requests/doing",
  "docs/requests/fix-requests/done",

  // docs/adr
  "docs/adr/todo",
  "docs/adr/doing",
  "docs/adr/done",
  "docs/adr/archive",

  // docs/design
  "docs/design/core/personas",
  "docs/design/core/scenarios",
  "docs/design/core/use-cases",
  "docs/design/core/features",
  "docs/design/core/enhancements",

  // docs/tasks
  "docs/tasks/.chains",
  "docs/tasks/backlog",
  "docs/tasks/todo",
  "docs/tasks/in-progress",
  "docs/tasks/in-review",
  "docs/tasks/done",
  "docs/tasks/blocked",

  // Top-level directories
  "githooks",
  "templates",
  ".choragen",
];

/**
 * Template files to create in the templates/ directory
 */
const TEMPLATE_FILES: Record<string, string> = {
  "templates/task.md": `# Task: {{TASK_TITLE}}

**Chain**: {{CHAIN_ID}}  
**Task**: {{TASK_ID}}  
**Status**: todo  
**Created**: {{DATE}}

---

## Objective

{{OBJECTIVE}}

---

## Context

{{CONTEXT}}

---

## Expected Files

- \`{{FILE_PATH_1}}\`
- \`{{FILE_PATH_2}}\`

---

## Acceptance Criteria

- [ ] {{CRITERION_1}}
- [ ] {{CRITERION_2}}
- [ ] {{CRITERION_3}}

---

## Constraints

- {{CONSTRAINT_1}}

---

## Notes

{{NOTES}}
`,

  "templates/change-request.md": `# Change Request: {{TITLE}}

**ID**: CR-{{DATE}}-{{SEQ}}  
**Domain**: {{DOMAIN}}  
**Status**: todo  
**Created**: {{DATE_FORMATTED}}  
**Owner**: {{OWNER}}  

---

## What

{{DESCRIPTION}}

---

## Why

{{MOTIVATION}}

---

## Scope

**In Scope**:
- {{IN_SCOPE_1}}
- {{IN_SCOPE_2}}

**Out of Scope**:
- {{OUT_OF_SCOPE_1}}

---

## Affected Design Documents

- {{DESIGN_DOC_1}}

---

## Linked ADRs

- {{ADR_1}}

---

## Commits

No commits yet.

---

## Implementation Notes

{{NOTES}}

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
`,

  "templates/fix-request.md": `# Fix Request: {{TITLE}}

**ID**: FR-{{DATE}}-{{SEQ}}  
**Domain**: {{DOMAIN}}  
**Status**: todo  
**Created**: {{DATE_FORMATTED}}  
**Severity**: {{SEVERITY}}  
**Owner**: {{OWNER}}  

---

## Problem

{{PROBLEM_DESCRIPTION}}

---

## Expected Behavior

{{EXPECTED}}

---

## Actual Behavior

{{ACTUAL}}

---

## Steps to Reproduce

1. {{STEP_1}}
2. {{STEP_2}}
3. {{STEP_3}}

---

## Root Cause Analysis

{{ROOT_CAUSE}}

---

## Proposed Fix

{{PROPOSED_FIX}}

---

## Affected Files

- {{FILE_1}}

---

## Linked ADRs

- {{ADR_1}}

---

## Commits

No commits yet.

---

## Verification

- [ ] Bug no longer reproducible
- [ ] Regression test added
- [ ] Related functionality still works

---

## Completion Notes

[Added when moved to done/]
`,

  "templates/adr.md": `# ADR-{{SEQ}}: {{TITLE}}

**Status**: todo  
**Created**: {{DATE}}  
**Linked CR/FR**: {{CR_FR_ID}}  
**Linked Design Docs**: {{DESIGN_DOC}}  

---

## Context

{{CONTEXT}}

---

## Decision

{{DECISION}}

---

## Consequences

**Positive**:
- {{POSITIVE_1}}
- {{POSITIVE_2}}

**Negative**:
- {{NEGATIVE_1}}

**Mitigations**:
- {{MITIGATION_1}}

---

## Alternatives Considered

### Alternative 1: {{ALT_1_NAME}}

{{ALT_1_DESCRIPTION}}

**Rejected because**: {{ALT_1_REJECTION}}

---

## Implementation

[Added when moved to done/]

- {{IMPL_FILE_1}}
- {{IMPL_FILE_2}}
`,

  "templates/feature.md": `# Feature: {{TITLE}}

**Domain**: {{DOMAIN}}  
**Created**: {{DATE}}  
**Status**: {{STATUS}}  

---

## Overview

{{OVERVIEW}}

---

## Capabilities

{{CAPABILITIES}}

---

## User Stories

### As a {{PERSONA}}

I want to {{ACTION}}  
So that {{BENEFIT}}

---

## Acceptance Criteria

- [ ] {{CRITERION_1}}
- [ ] {{CRITERION_2}}
- [ ] {{CRITERION_3}}

---

## Linked ADRs

- {{ADR_1}}

---

## Linked Scenarios

- {{SCENARIO_1}}

---

## Implementation

[Added when implemented]

- {{IMPL_FILE_1}}

---

## Acceptance Tests

[Added when tests written]

- {{TEST_FILE_1}}
`,
};

/**
 * AGENTS.md file templates with {{PROJECT_NAME}} placeholder
 */
const AGENTS_MD_FILES: Record<string, string> = {
  "AGENTS.md": `# Agent Guidelines for {{PROJECT_NAME}}

These guidelines apply to the entire repository.

## Project Overview

{{PROJECT_NAME}} is a project using the Choragen framework for agentic software development.

## Documentation Structure

\`\`\`
docs/
├── requests/           # Change and fix requests
│   ├── change-requests/
│   │   ├── todo/
│   │   ├── doing/
│   │   └── done/
│   └── fix-requests/
│       ├── todo/
│       ├── doing/
│       └── done/
│
├── adr/                # Architecture Decision Records
│   ├── todo/
│   ├── doing/
│   ├── done/
│   └── archive/
│
├── design/             # Design documentation
│   └── core/
│       ├── scenarios/
│       ├── features/
│       └── enhancements/
│
└── architecture.md     # System overview
\`\`\`

## Traceability Chain

Every artifact links backward:

\`\`\`
Request (CR/FR)
  → Design Doc (WHAT)
    → ADR (HOW)
      → Implementation (Code)
        → Tests
\`\`\`

## Commit Message Format

\`\`\`
<type>(<scope>): <description>

[body]

[CR-xxx | FR-xxx]
\`\`\`

Types: \`feat\`, \`fix\`, \`docs\`, \`test\`, \`refactor\`, \`chore\`

## Task Completion Checklist

Before marking any task complete:

\`\`\`bash
# 1. Build
pnpm build

# 2. Test
pnpm test

# 3. Type check
pnpm typecheck
\`\`\`

## Agent Roles

### Control Agent
The control agent manages work but **does not implement**:
- Creates CRs/FRs for new work
- Creates task chains and populates task files
- Reviews completed work from impl agents
- Approves or sends back for rework
- Commits and pushes completed work

### Implementation Agent
The impl agent executes tasks:
- Reads task file for full context
- Implements according to acceptance criteria
- Runs verification commands
- Reports completion (does NOT move task files)

## CRITICAL: Never Skip the System

**Control agents must NEVER implement code directly.** Even for "quick fixes":

1. Create an FR (fix request) or CR (change request)
2. Create a task chain with task(s)
3. Hand off to impl agent with prompt
4. Review and approve

This ensures:
- Full traceability (every change has a request)
- Proper review (control agent verifies work)
- Reproducibility (task files capture context)
- Accountability (clear ownership)
`,

  "docs/AGENTS.md": `# Agent Guidelines for docs/

This directory contains all project documentation following the Choragen development pipeline.

## Directory Structure

\`\`\`
docs/
├── requests/              # Stream: Transient change/fix requests
│   ├── change-requests/
│   │   ├── todo/
│   │   ├── doing/
│   │   └── done/
│   └── fix-requests/
│       ├── todo/
│       ├── doing/
│       └── done/
│
├── adr/                   # Pool: Architecture Decision Records
│   ├── todo/              # Decisions not yet implemented
│   ├── doing/             # Decisions being implemented
│   ├── done/              # Decisions controlling current implementation
│   └── archive/           # Superseded decisions
│
├── design/                # Pool: Design documentation (WHAT to build)
│   └── core/
│       ├── scenarios/
│       ├── features/
│       └── enhancements/
│
├── tasks/                 # Task chains for implementation work
│   ├── .chains/           # Chain metadata
│   ├── backlog/           # Future tasks
│   ├── todo/              # Ready to start
│   ├── in-progress/       # Currently being worked
│   ├── in-review/         # Awaiting approval
│   └── done/              # Completed tasks
│
└── architecture.md        # System overview
\`\`\`

## Development Pipeline

The pipeline flows from intent to implementation:

\`\`\`
Request (CR/FR) — Stream docs (transient)
  ↓
Design Docs (WHAT: scenarios, features) — Pool docs (persistent)
  ↓
ADRs (HOW: architecture decisions) — Pool docs (persistent)
  ↓
Implementation (Code + Tests) — Source as documentation
\`\`\`

## Creating Documents

### Change Request (CR)

Create in \`requests/change-requests/todo/\`:

\`\`\`markdown
# Change Request: Feature Name

**ID**: CR-YYYYMMDD-NNN
**Domain**: core
**Status**: todo
**Created**: YYYY-MM-DD
\`\`\`

Use template: \`templates/change-request.md\`

### Fix Request (FR)

Create in \`requests/fix-requests/todo/\`:

\`\`\`markdown
# Fix Request: Bug Description

**ID**: FR-YYYYMMDD-NNN
**Domain**: core
**Status**: todo
**Severity**: high|medium|low
\`\`\`

Use template: \`templates/fix-request.md\`

### Architecture Decision Record (ADR)

Create in \`adr/todo/\`:

\`\`\`markdown
# ADR-NNN: Decision Title

**Status**: todo
**Linked CR/FR**: CR-YYYYMMDD-NNN
**Linked Design Docs**: docs/design/core/features/xxx.md
\`\`\`

Use template: \`templates/adr.md\`

### Feature Design Doc

Create in \`design/core/features/\`:

\`\`\`markdown
# Feature: Feature Name

**Domain**: core
**Status**: draft
\`\`\`

Use template: \`templates/feature.md\`

## Document Lifecycle

### Requests (CR/FR)

1. Create in \`todo/\`
2. Move to \`doing/\` when work starts
3. Move to \`done/\` when complete (add completion notes)

### ADRs

1. Create in \`todo/\`
2. Move to \`doing/\` when implementing
3. Move to \`done/\` when complete (add implementation references)
4. Move to \`archive/\` when superseded

## Traceability Requirements

Every artifact must link backward:

- **ADRs** → must reference CR/FR and design docs
- **Design docs** → should reference linked ADRs
- **Source files** → should reference governing ADR
`,

  "githooks/AGENTS.md": `# Git Hook Guidelines

## Hooks Overview

| Hook | Purpose |
|------|---------|
| \`pre-commit\` | Build check, lint warnings |
| \`commit-msg\` | Semantic format, CR/FR traceability |
| \`pre-push\` | Build and test validation before push |

## Commit Message Format

\`\`\`
<type>(<scope>): <description>

[optional body]

[CR-YYYYMMDD-NNN | FR-YYYYMMDD-NNN]
\`\`\`

### Types

- \`feat\` - New feature
- \`fix\` - Bug fix
- \`docs\` - Documentation only
- \`test\` - Adding/updating tests
- \`refactor\` - Code change that neither fixes nor adds
- \`chore\` - Maintenance tasks
- \`style\` - Formatting, whitespace
- \`perf\` - Performance improvement
- \`ci\` - CI/CD changes
- \`build\` - Build system changes
- \`revert\` - Reverting previous commit

### Exempt Types

These don't require CR/FR references:

- \`chore(deps)\` - Dependency updates
- \`chore(format)\` - Formatting only
- \`chore(tooling)\` - Build/CI tooling
- \`chore(planning)\` - Creating CR/FR docs
- \`ci\` - CI changes
- \`build\` - Build changes
- \`revert\` - Reverts

## Installing Hooks

\`\`\`bash
# From project root
git config core.hooksPath githooks
chmod +x githooks/*
\`\`\`

## Bypassing Hooks

In emergencies only:

\`\`\`bash
git commit --no-verify -m "emergency: fix production issue"
\`\`\`

Document the bypass in the commit message.
`,

  "templates/AGENTS.md": `# Agent Guidelines for templates/

This directory contains document templates for the Choragen development pipeline.

## Available Templates

| Template | Purpose | Output Location |
|----------|---------|-----------------|
| \`change-request.md\` | New features, enhancements | \`docs/requests/change-requests/todo/\` |
| \`fix-request.md\` | Bugs, design flaws | \`docs/requests/fix-requests/todo/\` |
| \`adr.md\` | Architecture decisions | \`docs/adr/todo/\` |
| \`feature.md\` | Feature design docs | \`docs/design/core/features/\` |
| \`task.md\` | Task chain tasks | \`docs/tasks/todo/<chain-id>/\` |

## Template Variables

Templates use \`{{VARIABLE}}\` syntax for placeholders:

### Common Variables

| Variable | Description | Example |
|----------|-------------|---------|
| \`{{TITLE}}\` | Document title | \`Task Chain Management\` |
| \`{{DATE}}\` | Date in YYYYMMDD format | \`20251206\` |
| \`{{DATE_FORMATTED}}\` | Date in YYYY-MM-DD format | \`2025-12-06\` |
| \`{{SEQ}}\` | Sequence number | \`001\` |
| \`{{DOMAIN}}\` | Feature domain | \`core\` |
| \`{{OWNER}}\` | Document owner | \`agent\` |
| \`{{STATUS}}\` | Document status | \`todo\` |

## Using Templates

### Manual Usage

1. Copy template to target location
2. Replace all \`{{VARIABLE}}\` placeholders
3. Remove unused optional sections

### CLI Usage

\`\`\`bash
choragen cr:new core my-feature
choragen fr:new core my-bug
choragen adr:new my-decision
\`\`\`

## Adding New Templates

1. Create template file with \`.md\` extension
2. Use \`{{VARIABLE}}\` syntax for placeholders
3. Include required sections for the document type
4. Add placeholder text that explains what goes in each section
5. Update this file's "Available Templates" table
`,
};

/**
 * Git hook files to create in githooks/ directory
 */
const GIT_HOOK_FILES: Record<string, string> = {
  "githooks/pre-commit": `#!/bin/bash
#
# Pre-commit hook
# Runs lint and format checks on staged files
#

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m'

echo -e "\${YELLOW}[pre-commit] Running checks...\${NC}"

# Get staged TypeScript files
STAGED_TS=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|tsx)$' | grep -v 'node_modules' || true)

if [ -n "$STAGED_TS" ]; then
  echo -e "[pre-commit] Checking TypeScript files..."
  
  # Type check
  if ! pnpm build > /dev/null 2>&1; then
    echo -e "\${RED}[pre-commit] Build failed\${NC}"
    echo "Run 'pnpm build' to see errors"
    exit 1
  fi
  echo -e "\${GREEN}[pre-commit] Build passed\${NC}"
fi

# Check for console.log in non-test files
CONSOLE_LOGS=$(echo "$STAGED_TS" | xargs grep -l 'console\.log' 2>/dev/null | grep -v '\.test\.' | grep -v '__tests__' || true)
if [ -n "$CONSOLE_LOGS" ]; then
  echo -e "\${YELLOW}[pre-commit] Warning: console.log found in:\${NC}"
  echo "$CONSOLE_LOGS"
fi

# Check for TODO/FIXME without issue reference
TODOS=$(git diff --cached --diff-filter=ACM -U0 | grep -E '^\+.*\b(TODO|FIXME)\b' | grep -v 'CR-\|FR-\|#[0-9]' || true)
if [ -n "$TODOS" ]; then
  echo -e "\${YELLOW}[pre-commit] Warning: TODO/FIXME without CR/FR reference:\${NC}"
  echo "$TODOS"
fi

echo -e "\${GREEN}[pre-commit] All checks passed\${NC}"
exit 0
`,

  "githooks/commit-msg": `#!/bin/bash
#
# Commit message validation hook
# Enforces semantic commit format and CR/FR traceability
#

COMMIT_MSG_FILE="$1"
COMMIT_MSG=$(cat "$COMMIT_MSG_FILE")

# Colors
RED='\\033[0;31m'
GREEN='\\033[0;32m'
YELLOW='\\033[1;33m'
NC='\\033[0m' # No Color

# Semantic commit pattern
# type(scope): description
SEMANTIC_PATTERN='^(feat|fix|docs|test|refactor|chore|style|perf|ci|build|revert)(\([a-z0-9_-]+\))?: .+'

# CR/FR reference pattern
CR_FR_PATTERN='(CR|FR)-[0-9]{8}-[0-9]{3}'

# Exempt commit types (don't require CR/FR)
EXEMPT_TYPES=(
  "chore(deps)"
  "chore(format)"
  "chore(tooling)"
  "chore(planning)"
  "chore(metrics)"
  "ci"
  "build"
  "revert"
)

# Get the first line (subject)
SUBJECT=$(echo "$COMMIT_MSG" | head -n 1)

# Check semantic format
if ! echo "$SUBJECT" | grep -qE "$SEMANTIC_PATTERN"; then
  echo -e "\${RED}[commit-msg] Invalid commit message format\${NC}"
  echo ""
  echo "Expected: <type>(<scope>): <description>"
  echo "Got: $SUBJECT"
  echo ""
  echo "Valid types: feat, fix, docs, test, refactor, chore, style, perf, ci, build, revert"
  exit 1
fi

# Extract type and scope
TYPE=$(echo "$SUBJECT" | sed -E 's/^([a-z]+)(\([^)]+\))?: .+/\\1/')
SCOPE=$(echo "$SUBJECT" | sed -E 's/^[a-z]+\(([^)]+)\): .+/\\1/' | grep -v "^$SUBJECT$" || echo "")
TYPE_WITH_SCOPE="$TYPE"
if [ -n "$SCOPE" ]; then
  TYPE_WITH_SCOPE="$TYPE($SCOPE)"
fi

# Check if exempt
IS_EXEMPT=false
for exempt in "\${EXEMPT_TYPES[@]}"; do
  if [[ "$TYPE_WITH_SCOPE" == "$exempt"* ]] || [[ "$TYPE" == "$exempt" ]]; then
    IS_EXEMPT=true
    break
  fi
done

if [ "$IS_EXEMPT" = true ]; then
  echo -e "\${GREEN}[commit-msg] Commit type '$TYPE_WITH_SCOPE' is exempt from CR/FR requirement\${NC}"
  exit 0
fi

# Check for CR/FR reference
if ! echo "$COMMIT_MSG" | grep -qE "$CR_FR_PATTERN"; then
  echo -e "\${RED}[commit-msg] Missing CR/FR reference\${NC}"
  echo ""
  echo "Non-exempt commits must reference a Change Request or Fix Request."
  echo "Add one of the following to your commit message:"
  echo "  CR-YYYYMMDD-NNN (for new features/changes)"
  echo "  FR-YYYYMMDD-NNN (for bug fixes)"
  echo ""
  echo "Or use an exempt commit type:"
  echo "  chore(deps), chore(format), chore(tooling), chore(planning), ci, build, revert"
  exit 1
fi

# Extract the CR/FR ID
CR_FR_ID=$(echo "$COMMIT_MSG" | grep -oE "$CR_FR_PATTERN" | head -n 1)

# Check if the CR/FR exists (in doing/ or done/)
CR_PATH="docs/requests/change-requests"
FR_PATH="docs/requests/fix-requests"

if [[ "$CR_FR_ID" == CR-* ]]; then
  if [ -f "$CR_PATH/doing/$CR_FR_ID"*.md ] || [ -f "$CR_PATH/done/$CR_FR_ID"*.md ]; then
    echo -e "\${GREEN}[commit-msg] Found $CR_FR_ID in doing/ or done/\${NC}"
  elif [ -f "$CR_PATH/todo/$CR_FR_ID"*.md ]; then
    echo -e "\${YELLOW}[commit-msg] Warning: $CR_FR_ID is still in todo/ - should be in doing/\${NC}"
  else
    echo -e "\${YELLOW}[commit-msg] Warning: Could not find $CR_FR_ID document\${NC}"
  fi
elif [[ "$CR_FR_ID" == FR-* ]]; then
  if [ -f "$FR_PATH/doing/$CR_FR_ID"*.md ] || [ -f "$FR_PATH/done/$CR_FR_ID"*.md ]; then
    echo -e "\${GREEN}[commit-msg] Found $CR_FR_ID in doing/ or done/\${NC}"
  elif [ -f "$FR_PATH/todo/$CR_FR_ID"*.md ]; then
    echo -e "\${YELLOW}[commit-msg] Warning: $CR_FR_ID is still in todo/ - should be in doing/\${NC}"
  else
    echo -e "\${YELLOW}[commit-msg] Warning: Could not find $CR_FR_ID document\${NC}"
  fi
fi

echo -e "\${GREEN}[commit-msg] Commit message validated\${NC}"
exit 0
`,
};

/**
 * Configuration files to create with {{PROJECT_NAME}} and {{DOMAIN}} placeholders
 */
const CONFIG_FILES: Record<string, string> = {
  ".choragen/config.yaml": `# Choragen Project Configuration
# Generated by choragen init

project:
  name: "{{PROJECT_NAME}}"
  domain: "{{DOMAIN}}"

# Paths relative to project root
paths:
  adr: "docs/adr/"
  design: "docs/design/"
  requests: "docs/requests/"
  tasks: "docs/tasks/"

# Domain names for design docs
domains:
  - "{{DOMAIN}}"

# Governance schema file
governance: "choragen.governance.yaml"
`,

  "choragen.governance.yaml": `# Choragen Governance Schema
# Defines rules for file mutations: allow, approve, deny

mutations:
  # Files that can be modified without approval
  allow:
    - pattern: "src/**/*.ts"
      actions: [create, modify]
    - pattern: "src/**/*.tsx"
      actions: [create, modify]
    - pattern: "__tests__/**/*"
      actions: [create, modify, delete]
    - pattern: "docs/**/*.md"
      actions: [create, modify]

  # Files that require human approval before modification
  approve:
    - pattern: "package.json"
      actions: [modify]
      reason: "Dependency changes require review"
    - pattern: "*.config.*"
      actions: [modify]
      reason: "Configuration changes require review"

  # Files that should never be modified by agents
  deny:
    - pattern: "*.key"
    - pattern: "*.pem"
    - pattern: ".env*"
    - pattern: ".git/**"

# How to handle parallel chain collisions
collision_detection:
  strategy: "file-lock"
  on_collision: "block"
`,
};

export interface InitResult {
  created: string[];
  skipped: string[];
  filesCreated: string[];
  filesSkipped: string[];
  agentsCreated: string[];
  agentsSkipped: string[];
  configCreated: string[];
  configSkipped: string[];
  hooksCreated: string[];
  hooksSkipped: string[];
  hooksInstalled: boolean;
}

export interface InitOptions {
  projectName?: string;
  domain?: string;
  skipHooks?: boolean;
  installHooks?: boolean;
}

/**
 * Initialize a Choragen project by creating the directory structure
 * @param projectRoot - The root directory of the project
 * @param options - Configuration options for initialization
 */
export async function initProject(
  projectRoot: string,
  options: InitOptions = {}
): Promise<InitResult> {
  const {
    projectName = "MyProject",
    domain = "core",
    skipHooks = false,
    installHooks = false,
  } = options;

  const created: string[] = [];
  const skipped: string[] = [];
  const filesCreated: string[] = [];
  const filesSkipped: string[] = [];
  const agentsCreated: string[] = [];
  const agentsSkipped: string[] = [];
  const configCreated: string[] = [];
  const configSkipped: string[] = [];
  const hooksCreated: string[] = [];
  const hooksSkipped: string[] = [];
  let hooksInstalled = false;

  // Create directories
  for (const dir of DIRECTORIES) {
    const fullPath = join(projectRoot, dir);

    if (existsSync(fullPath)) {
      skipped.push(dir);
    } else {
      await mkdir(fullPath, { recursive: true });
      created.push(dir);
    }
  }

  // Create template files
  for (const [filePath, content] of Object.entries(TEMPLATE_FILES)) {
    const fullPath = join(projectRoot, filePath);

    if (existsSync(fullPath)) {
      filesSkipped.push(filePath);
    } else {
      await writeFile(fullPath, content, "utf-8");
      filesCreated.push(filePath);
    }
  }

  // Create AGENTS.md files with project name substitution
  for (const [filePath, template] of Object.entries(AGENTS_MD_FILES)) {
    const fullPath = join(projectRoot, filePath);
    const content = template.replace(/\{\{PROJECT_NAME\}\}/g, projectName);

    if (existsSync(fullPath)) {
      agentsSkipped.push(filePath);
    } else {
      await writeFile(fullPath, content, "utf-8");
      agentsCreated.push(filePath);
    }
  }

  // Create config files with project name and domain substitution
  for (const [filePath, template] of Object.entries(CONFIG_FILES)) {
    const fullPath = join(projectRoot, filePath);
    const content = template
      .replace(/\{\{PROJECT_NAME\}\}/g, projectName)
      .replace(/\{\{DOMAIN\}\}/g, domain);

    if (existsSync(fullPath)) {
      configSkipped.push(filePath);
    } else {
      await writeFile(fullPath, content, "utf-8");
      configCreated.push(filePath);
    }
  }

  // Create git hook files (unless --skip-hooks)
  if (!skipHooks) {
    for (const [filePath, content] of Object.entries(GIT_HOOK_FILES)) {
      const fullPath = join(projectRoot, filePath);

      if (existsSync(fullPath)) {
        hooksSkipped.push(filePath);
      } else {
        await writeFile(fullPath, content, "utf-8");
        // Make hook executable
        await chmod(fullPath, 0o755);
        hooksCreated.push(filePath);
      }
    }

    // Install hooks if requested
    if (installHooks) {
      try {
        execSync("git config core.hooksPath githooks", {
          cwd: projectRoot,
          stdio: "pipe",
        });
        hooksInstalled = true;
      } catch {
        // Git not initialized or other error - hooks not installed
        hooksInstalled = false;
      }
    }
  }

  return {
    created,
    skipped,
    filesCreated,
    filesSkipped,
    agentsCreated,
    agentsSkipped,
    configCreated,
    configSkipped,
    hooksCreated,
    hooksSkipped,
    hooksInstalled,
  };
}

/**
 * Format the init result for console output
 */
export function formatInitResult(result: InitResult): string {
  const lines: string[] = [];

  if (result.created.length > 0) {
    lines.push("Created directories:");
    for (const dir of result.created) {
      lines.push(`  ✓ ${dir}`);
    }
  }

  if (result.skipped.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Skipped directories (already exist):");
    for (const dir of result.skipped) {
      lines.push(`  - ${dir}`);
    }
  }

  if (result.filesCreated.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Created template files:");
    for (const file of result.filesCreated) {
      lines.push(`  ✓ ${file}`);
    }
  }

  if (result.filesSkipped.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Skipped template files (already exist):");
    for (const file of result.filesSkipped) {
      lines.push(`  - ${file}`);
    }
  }

  if (result.agentsCreated.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Created AGENTS.md files:");
    for (const file of result.agentsCreated) {
      lines.push(`  ✓ ${file}`);
    }
  }

  if (result.agentsSkipped.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Skipped AGENTS.md files (already exist):");
    for (const file of result.agentsSkipped) {
      lines.push(`  - ${file}`);
    }
  }

  if (result.configCreated.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Created config files:");
    for (const file of result.configCreated) {
      lines.push(`  ✓ ${file}`);
    }
  }

  if (result.configSkipped.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Skipped config files (already exist):");
    for (const file of result.configSkipped) {
      lines.push(`  - ${file}`);
    }
  }

  if (result.hooksCreated.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Created git hooks:");
    for (const file of result.hooksCreated) {
      lines.push(`  ✓ ${file}`);
    }
  }

  if (result.hooksSkipped.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push("Skipped git hooks (already exist):");
    for (const file of result.hooksSkipped) {
      lines.push(`  - ${file}`);
    }
  }

  if (result.hooksInstalled) {
    if (lines.length > 0) lines.push("");
    lines.push("✓ Git hooks installed (git config core.hooksPath githooks)");
  }

  const totalCreated = result.created.length + result.filesCreated.length + result.agentsCreated.length + result.configCreated.length + result.hooksCreated.length;
  const totalSkipped = result.skipped.length + result.filesSkipped.length + result.agentsSkipped.length + result.configSkipped.length + result.hooksSkipped.length;

  if (totalCreated === 0 && totalSkipped > 0) {
    lines.push("");
    lines.push("All directories and files already exist. Nothing to create.");
  } else if (totalCreated > 0) {
    lines.push("");
    lines.push(`✓ Initialized Choragen project (${result.created.length} directories, ${result.filesCreated.length + result.agentsCreated.length + result.configCreated.length + result.hooksCreated.length} files created)`);
  }

  return lines.join("\n");
}
