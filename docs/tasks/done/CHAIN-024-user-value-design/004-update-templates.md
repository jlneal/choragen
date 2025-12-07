# Task: Update Templates

**Chain**: CHAIN-024-user-value-design  
**Task**: 004-update-templates  
**Type**: implementation  
**Status**: todo  

---

## Objective

Update document templates to include required linking sections for user value traceability.

---

## Templates to Update

### 1. `templates/feature.md`
Add required section:
```markdown
## Linked Scenarios

- [Scenario Name](../scenarios/scenario-name.md)

## Linked Use Cases

- [Use Case Name](../use-cases/use-case-name.md)
```

### 2. `templates/change-request.md`
Clarify that "Affected Design Documents" should include feature docs:
```markdown
## Affected Design Documents

<!-- Must include at least one feature doc that links to user value -->
- docs/design/core/features/{{FEATURE}}.md
```

### 3. Create `templates/scenario.md` (if not exists)
Include required sections:
```markdown
## Linked Personas

- [Persona Name](../personas/persona-name.md)

## Linked Use Cases

- [Use Case Name](../use-cases/use-case-name.md)
```

### 4. Create `templates/use-case.md` (if not exists)
Include required section:
```markdown
## Linked Scenario

- [Scenario Name](../scenarios/scenario-name.md)
```

---

## Acceptance Criteria

- [ ] `templates/feature.md` has "Linked Scenarios" and/or "Linked Use Cases" sections
- [ ] `templates/change-request.md` clarifies feature doc requirement
- [ ] `templates/scenario.md` exists with "Linked Personas" section
- [ ] `templates/use-case.md` exists with "Linked Scenario" section
- [ ] All templates have placeholder text explaining the requirement

---

## Files to Modify/Create

- `templates/feature.md` (modify)
- `templates/change-request.md` (modify)
- `templates/scenario.md` (create)
- `templates/use-case.md` (create)

---

## Verification

```bash
grep -l "Linked Scenarios\|Linked Personas\|Linked Use Cases" templates/*.md
```
