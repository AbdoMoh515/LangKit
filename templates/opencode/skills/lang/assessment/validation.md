# Content Validation (spec §34)

Generated content passes a validation stage before it is shown.

## Checklist

- [ ] target item is present
- [ ] target item has the intended meaning/sense
- [ ] supporting vocabulary is acceptable (`lang vocab check`)
- [ ] difficulty appropriate across relevant dimensions (vocabulary, grammar,
      task, listening, speaking)
- [ ] exercise actually tests the intended skill
- [ ] answer options are not accidentally ambiguous
- [ ] translations are coherent
- [ ] sentence usage is natural enough
- [ ] no accidental answer leakage (e.g. the explanation contains the answer)

## Pipeline

```text
Generator → Validator → Repair/Regenerate → Present
```

If any check fails, repair or regenerate — do not present content you know
fails a check. Do not assume LLM self-confidence is sufficient: verify by
re-reading the artifact against the checklist.
