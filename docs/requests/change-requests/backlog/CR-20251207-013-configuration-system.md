# Change Request: Choragen Configuration System

**ID**: CR-20251207-013  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-07  
**Owner**: agent  

---

## Summary

Expand the Choragen configuration system to support project-level settings that control workflow behavior, feature toggles, and defaults.

## Motivation

Currently `.choragen/config.yaml` is minimal. As Choragen grows, projects need to configure:
- Workflow preferences (branching, commit requirements)
- Feature toggles (metrics, strict governance)
- Domain-specific rules (which domains require chains)
- Default behaviors

A robust config system enables Choragen to adapt to different team workflows without code changes.

## Proposed Changes

### Configuration File

Expand `.choragen/config.yaml`:

```yaml
# .choragen/config.yaml
version: 1

workflow:
  # Branching (see CR-20251207-014)
  branching:
    enabled: false
    # Additional settings defined in CR-014
    
  # Chain requirements
  chains:
    required-for-domains: []          # e.g., ["core", "cli"]
    required-when:
      acceptance-criteria-count: 3    # Require chain if CR has 3+ criteria
      
  # Commit discipline
  commits:
    require-request-id: true          # Commit must reference CR/FR
    conventional-commits: true        # Enforce conventional commit format
    
metrics:
  enabled: false                      # Enable metrics collection
  storage: local                      # local | (future: hosted)
  
governance:
  strict: true                        # Treat governance violations as errors
  
defaults:
  request-owner: agent                # Default owner for new requests
  task-agent: impl                    # Default agent for new tasks
```

### CLI Integration

```bash
# View current config
choragen config:show

# Get specific value
choragen config:get workflow.branching.enabled

# Set value (updates config file)
choragen config:set workflow.branching.enabled true

# Validate config
choragen config:validate
```

### Config Loading

```typescript
// packages/core/src/config/config-loader.ts
export interface ChoragenConfig {
  version: number;
  workflow: WorkflowConfig;
  metrics: MetricsConfig;
  governance: GovernanceConfig;
  defaults: DefaultsConfig;
}

export function loadConfig(projectRoot: string): ChoragenConfig;
export function validateConfig(config: unknown): ChoragenConfig;
```

### Default Config

If no config exists, use sensible defaults:
- Branching: disabled
- Chains: not required
- Commits: require request ID
- Metrics: disabled
- Governance: strict

## Affected Components

| Component | Change |
|-----------|--------|
| `@choragen/core` | ConfigLoader, config types, validation |
| `@choragen/cli` | `config:*` commands, config integration |
| `.choragen/config.yaml` | Expanded schema |

## Acceptance Criteria

- [ ] Config schema defined with TypeScript types
- [ ] ConfigLoader reads and validates `.choragen/config.yaml`
- [ ] Missing config uses defaults
- [ ] `config:show` displays current config
- [ ] `config:get` retrieves specific values
- [ ] `config:set` updates config file
- [ ] `config:validate` checks config validity
- [ ] Existing commands respect config settings

## Future Requests (Out of Scope)

- CR-20251207-014: Request-per-branch workflow (uses this config)
- User-level config overrides (~/.choragen/config.yaml)
- Config inheritance (project extends base)

## ADR Required

Yes - ADR for config schema design and defaults

---

## Commits

[Populated by `choragen request:close`]
