# Change Request: Documentation Clarity Analysis

**ID**: CR-20251211-025  
**Domain**: core  
**Status**: todo  
**Created**: 2025-12-11  
**Owner**: agent  

---

## What

Add clarity analysis to documentation quality: readability scoring, sentence complexity analysis, passive voice detection, and terminology consistency checking.

---

## Why

Completeness ensures docs have content, but clarity ensures that content is understandable. Agent-generated documentation may be verbose, use complex sentences, or inconsistent terminology. Clarity analysis provides actionable feedback for improvement.

---

## Scope

**In Scope**:
- Readability score calculation (Flesch-Kincaid)
- Sentence length analysis
- Sentence complexity detection
- Passive voice detection
- Terminology consistency checking
- Jargon detection
- Code example validation (TypeScript compilation)
- `choragen docs:clarity` CLI command

**Out of Scope**:
- Web dashboard (CR-20251211-026)
- Workflow integration (CR-20251211-027)
- Grammar checking (future enhancement)
- Spell checking (future enhancement)

---

## Acceptance Criteria

- [ ] Flesch-Kincaid readability score calculation
- [ ] Average sentence length calculation
- [ ] Long sentence detection (>30 words configurable)
- [ ] Complex sentence detection (multiple clauses)
- [ ] Passive voice detection with suggestions
- [ ] Terminology consistency checking against glossary
- [ ] Inconsistent term flagging with preferred form
- [ ] Code example extraction from markdown
- [ ] TypeScript example compilation validation
- [ ] `choragen docs:clarity` runs clarity analysis
- [ ] Clarity score calculation (0-100)
- [ ] Suggestions for improving clarity

---

## Affected Design Documents

- [Documentation Quality](../../../design/core/features/documentation-quality.md)

---

## Linked ADRs

- ADR-017: Documentation Quality

---

## Dependencies

- **CR-20251211-024**: Documentation Quality Core Infrastructure

---

## Commits

No commits yet.

---

## Implementation Notes

Key files to create:

```
packages/core/src/doc-quality/
├── clarity/
│   ├── index.ts
│   ├── readability.ts          # Flesch-Kincaid calculation
│   ├── sentences.ts            # Sentence analysis
│   ├── passive-voice.ts        # Passive voice detection
│   └── terminology.ts          # Consistency checking
├── accuracy/
│   ├── index.ts
│   └── code-examples.ts        # Code validation
└── __tests__/
    ├── readability.test.ts
    ├── passive-voice.test.ts
    └── code-examples.test.ts
```

Flesch-Kincaid formula:
```typescript
function fleschKincaid(text: string): number {
  const sentences = countSentences(text);
  const words = countWords(text);
  const syllables = countSyllables(text);
  
  return 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words);
}
// Score interpretation:
// 90-100: Very easy (5th grade)
// 60-70: Standard (8th-9th grade)
// 30-50: Difficult (college)
// 0-30: Very difficult (professional)
```

Passive voice detection:
```typescript
// Look for: "is/was/were/been + past participle"
const passivePatterns = [
  /\b(is|are|was|were|been|being)\s+\w+ed\b/gi,
  /\b(is|are|was|were|been|being)\s+\w+en\b/gi,
];
```

---

## Completion Notes

[Added when moved to done/ - summary of what was actually implemented]
