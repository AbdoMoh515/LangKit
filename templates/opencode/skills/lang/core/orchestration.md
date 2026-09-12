# Core Orchestration

## Session lifecycle

```text
/lang-go
  → lang session start        (resume | new | ANKI_GATE_REQUIRED error)
  → teach small → test → remediate → record evidence (lang vocab record)
  → lang csv export --session N        (only if new vocabulary was learned)
  → write session-NNN.md log
  → lang session complete --file ...   (or session save for a checkpoint)
  → concise summary to learner
```

- A session ends when its intended learning/test target is adequately
  completed — adaptive boundary, not a clock.
- An interrupted session is always saved (`session save`), never abandoned.
  The next `/lang-go` resumes it.
- New learning day after the first: the learner must confirm their Anki review
  before new material. The CLI enforces this (`ANKI_GATE_REQUIRED`); ask,
  get confirmation, run `lang state anki-confirm`, retry. Never fake
  verification.

## Decision shortcuts

- No profile → route to `/lang-start`.
- No active phase, previous merged → `lang phase next`.
- Phase test passed → propose merge: `lang phase merge` (dry run), explain,
  then `lang phase merge --confirm` with the learner's consent, then
  `lang phase next`.
- Derived weak areas growing across sessions → shift session mix toward
  review/remediation (spec §20).

## Adaptation levers (spec §20)

| Signal | Response |
|---|---|
| Very limited time | micro-session, fewer new items, preserve continuity |
| Extra time | more reinforcement/challenge, not curriculum acceleration |
| Weak retention | increase review and remediation |
| Strong retention | slightly increase new content or difficulty |
| Listening weakness | more listening-oriented activities |
| Recall weakness | more active recall |
