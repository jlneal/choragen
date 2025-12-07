# Change Request: User-Level Configuration Overrides

**ID**: CR-20251207-016  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-07  
**Owner**: agent  

---

## Summary

Add support for user-level configuration that overrides project defaults, similar to how git has global (~/.gitconfig) and local (.git/config) settings.

## Motivation

Different users on the same project may have different preferences:
- Editor integration settings
- Default agent identity
- Personal workflow preferences
- Development environment differences

User config allows personalization without modifying shared project config.

## Proposed Changes

### Config Hierarchy

```
~/.choragen/config.yaml      # User global (lowest priority)
.choragen/config.yaml        # Project (higher priority)
Environment variables        # Highest priority (for CI/CD)
```

### User Config Location

```
~/.choragen/
├── config.yaml              # User defaults
└── credentials/             # Future: API keys, tokens
```

### User-Specific Settings

```yaml
# ~/.choragen/config.yaml
user:
  name: "Justin"
  agent-id: "justin-dev"     # For metrics attribution
  
preferences:
  editor: code               # For opening files
  color: true                # CLI color output
  verbose: false             # Debug output
  
defaults:
  request-owner: justin      # Override project default
```

### Config Resolution

```typescript
// Merge order: user < project < env
const config = mergeConfigs(
  loadUserConfig(),           // ~/.choragen/config.yaml
  loadProjectConfig(),        // .choragen/config.yaml
  loadEnvConfig()             // CHORAGEN_* env vars
);
```

### CLI Commands

```bash
# Show merged config with sources
choragen config:show --show-sources

# Set user-level config
choragen config:set --user preferences.verbose true

# Show only user config
choragen config:show --user
```

### Environment Variables

```bash
CHORAGEN_WORKFLOW_BRANCHING_ENABLED=true
CHORAGEN_METRICS_ENABLED=false
```

Naming: `CHORAGEN_` + path in SCREAMING_SNAKE_CASE.

## Affected Components

| Component | Change |
|-----------|--------|
| `@choragen/core` | Config merger, user config loader |
| `@choragen/cli` | `--user` flag, env var support |

## Acceptance Criteria

- [ ] User config loaded from `~/.choragen/config.yaml`
- [ ] Project config overrides user config
- [ ] Env vars override both
- [ ] `config:show --show-sources` shows where each value comes from
- [ ] `config:set --user` updates user config
- [ ] Missing user config is fine (empty defaults)

## Dependencies

- CR-20251207-013 (Configuration System) - base config infrastructure

## ADR Required

No - extends existing config ADR

---

## Commits

[Populated by `choragen request:close`]
