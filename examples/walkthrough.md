# Walkthrough: a week of learning Indonesian with Lang

This walkthrough shows the exact command sequence and artifacts of the
deterministic lifecycle (the pedagogy itself is agent-driven inside OpenCode).
All commands below were executed against a real temp project during
development; see `npm test` for the automated equivalent
(`tests/integration.test.js`).

## 1. Initialize

```bash
mkdir belajar-indonesia && cd belajar-indonesia
lang init --here
# Lang project initialized in …/belajar-indonesia
# git repository created (branch: main), initial commit made.
# next step: open this folder in OpenCode and run /lang-start
```

## 2. `/lang-start` — interview and curriculum

The agent asks MCQs (languages, levels, daily time, duration, skills, style,
goals), then runs:

```bash
lang profile set --file .lang-tmp-profile.json   # → learner/profile.json + profile.md
lang plan scaffold --file .lang-tmp-plan.json    # registers phases in state.json
lang phase begin --id phase-01                   # branch phase-01-foundations from main
```

The agent writes `plan.md`, `phases/phase-01/plan.md`, and
`phases/phase-01/test.md`. See `sample-plan.md` and `sample-profile.json`.

## 3. `/lang-go` — day 1 session

```bash
lang session start --date 2026-09-12
# STARTED session 1 (phase-01, 2026-09-12)
```

The agent teaches 6 greeting words with the vocabulary loop, then records
evidence as exercises happen:

```bash
lang vocab add --file .lang-tmp-vocab.json --session 1 --date 2026-09-12
lang vocab record --lemma "terima kasih" --sense thank-you --type recall --success true --date 2026-09-12
lang vocab record --lemma selamat --sense greeting --type recall --success false --date 2026-09-12
```

New vocabulary learned → Anki CSV:

```bash
lang csv export --session 1
# wrote vocabulary/anki/session-001.csv (2 cards)
```

The agent writes the human log `phases/phase-01/sessions/session-001.md`
(see `sample-session-log.md`) and completes:

```bash
lang session complete --file .lang-tmp-session.json
# session 1 completed and committed
```

Git history now contains:

```text
feat(progress): complete session 01
feat(progress): begin phase-01-foundations
feat(planning): curriculum registered (3 phases)
chore(init): initialize lang project
```

## 4. Day 2 — the Anki gate

```bash
lang session start --date 2026-09-13
# error: ANKI_GATE_REQUIRED: new learning day. …
```

The agent asks the learner to do their Anki review; the learner confirms:

```bash
lang state anki-confirm --date 2026-09-13
lang session start --date 2026-09-13
# STARTED session 2 (phase-01, 2026-09-13)
```

Interrupted mid-session? `lang session save --file …` commits
`checkpoint(progress): save session 02`; the next `/lang-go` resumes it.

## 5. Phase test and merge

When phase-01 competencies are ready, the agent runs the phase test and
records the result:

```bash
lang phase test-result --file .lang-tmp-test.json
# pass: true
```

Pass policy: overall ≥ 80%, every required competency assessed, no critical
competency failed, at most one required non-critical competency below
threshold.

```bash
lang phase merge            # dry run: shows preconditions
lang phase merge --confirm  # merge: phase-01-foundations into main
lang phase next             # branch phase-02-everyday from latest main
```

## 6. Anytime

```bash
lang status      # target language, phase, focus, vocabulary counts, weak areas
lang validate    # state vs git consistency check
lang doctor      # environment + structure check
```

## Sample artifacts

- `sample-profile.json` — learner profile
- `sample-plan.md` — overall curriculum plan excerpt
- `sample-session-log.md` — human session log
- `sample-anki.csv` — Anki export
