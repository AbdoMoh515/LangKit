# Phase Test — phase-01: Foundations

> Written by the agent during planning. The test must cover the required
> phase competencies. Pass policy: overall >= 80%, every required
> competency assessed, no critical competency failed, at most one
> required non-critical competency below threshold.

## Required competencies

- greetings-courtesy (critical)
- numbers-prices (critical)
- listening-basic (critical)
- reading-basic
- vocab-travel-core

## Sections

1. **Vocabulary recognition** (→ vocab-travel-core, greetings-courtesy)
   10 fill-in-the-blank sentences, 4 options each; distractors plausible but
   fair; only known + target vocabulary used (verified with
   `lang vocab check`).
2. **Active recall** (→ greetings-courtesy, numbers-prices)
   8 items, mixed directions: meaning→word and word→meaning.
3. **Listening** (→ listening-basic)
   6 short spoken items (agent reads aloud / learner uses TTS): learner
   selects or writes the meaning. Slower, clear speech only.
4. **Reading** (→ reading-basic)
   4 short sign/label comprehension items using known vocabulary.
5. **Guided conversation** (→ greetings-courtesy, numbers-prices)
   3-turn exchange: greet, ask price, thank. Scored on task completion, not
   accent.

## Scoring

Each section maps to competencies; overall score is the weighted mean.
Results recorded via `lang phase test-result --file …`; every attempt is
stored as a separate `test-result-NN.json` (history preserved).
