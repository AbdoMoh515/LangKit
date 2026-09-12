# Exercise Design (spec §18, §35)

## Types

- **Recognition**: sentence with blank + meaning/context explanation +
  multiple choices. Distractors plausible but not unfair.
- **Active recall**: meaning → target word, and target word → meaning.
  Mix directions when useful.
- **Usage** (optional): sentence-production task for appropriate use of the
  item.
- **Conversation**: only when appropriate for level and selected goals.

## Design rules

- The exercise must test the intended target, not peripheral knowledge
  (spec §33.10). Run the validation pipeline (`assessment/validation.md`)
  before presenting.
- Respect the vocabulary constraints (`teaching/difficulty.md`).
- On error: identify the error type, explain the relevant point, give another
  attempt; defer the item instead of looping the same question (spec §19).

## Randomization (spec §35)

Use a deterministic seed per session/assessment artifact:

```js
// seed = session number + date; algorithm: mulberry32
```

Vary question ordering across learners/sessions while keeping runs
reproducible for debugging. Randomization is not a substitute for quality.

## Scoring

Score exercises per competency. Session records carry
`performance: [{"type":"recognition","score":80}, ...]` which feeds
`state.derived.recent_performance`.
