# Git Hook Guidelines

## Hooks Overview

| Hook | Purpose |
|------|---------|
| `pre-commit` | Build check, lint warnings |
| `commit-msg` | Semantic format, CR/FR traceability |

## Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[CR-YYYYMMDD-NNN | FR-YYYYMMDD-NNN]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `test` - Adding/updating tests
- `refactor` - Code change that neither fixes nor adds
- `chore` - Maintenance tasks
- `style` - Formatting, whitespace
- `perf` - Performance improvement
- `ci` - CI/CD changes
- `build` - Build system changes
- `revert` - Reverting previous commit

### Exempt Types

These don't require CR/FR references:

- `chore(deps)` - Dependency updates
- `chore(format)` - Formatting only
- `chore(tooling)` - Build/CI tooling
- `chore(planning)` - Creating CR/FR docs
- `chore(metrics)` - Metrics updates
- `ci` - CI changes
- `build` - Build changes
- `revert` - Reverts

## Installing Hooks

```bash
# From project root
git config core.hooksPath githooks
chmod +x githooks/*
```

Or use the CLI:

```bash
choragen hooks:install
```

## Bypassing Hooks

In emergencies only:

```bash
git commit --no-verify -m "emergency: fix production issue"
```

Document the bypass in the commit message.
