# Anki Workflow (spec §21, §22)

## Division of labor

- **Anki**: long-term spaced repetition and retention.
- **Lang**: teaching, contextualization, adaptive curriculum, assessment,
  mastery progression. Lang does not recreate Anki's scheduler.

## CSV export

After a session with genuinely new learned vocabulary:

```bash
lang csv export --session N
```

- Output: `vocabulary/anki/session-NNN.csv`, fields exactly
  `Word,Translation,Sentence` (first example sentence).
- One CSV per session that introduces new vocabulary; no new vocabulary →
  no CSV.
- Duplicate handling: same sense is never re-exported; a new sense becomes a
  new card. The CLI marks exported items in the registry.

Tell the learner to import the CSV into their dedicated Lang deck.

## Daily gate

On a new learning day after the first, `lang session start` fails with
`ANKI_GATE_REQUIRED` until `lang state anki-confirm` is run. Ask the learner
to complete their Anki review, accept their explicit confirmation, record it,
and proceed. Never simulate or assume verification.
