# Internal CLI Reference

Public commands are `lang init --here` and `lang status`. Everything below is
used by the OpenCode lang skill for deterministic state transitions. The
agent never edits `state.json`, `profile.json`, or `registry.json` by hand.

All commands operate on the nearest project root (found via
`learner/state.json`). Dates default to today; pass `--date YYYY-MM-DD` for
deterministic runs.

## Profile

```bash
lang profile set --file p.json   # validate + save + regenerate profile.md, commit
lang profile get                 # print profile JSON ({"set": false} if unset)
```

## Planning

```bash
lang plan scaffold --file plan.json
# plan.json: {"phases":[{"slug":"foundations","title":"Foundations",
#   "competencies":[{"id":"greetings","required":true,"critical":true}, ...]}, ...]}
# registers phase-01..phase-NN (status pending) into state.json, commits.
# competencies are optional but strongly recommended: when registered, the
# phase test may only assess those ids with those exact flags.
```

## State

```bash
lang state get                          # dump state.json
lang state anki-confirm [--date D]      # record learner's Anki review confirmation
```

## Vocabulary

```bash
lang vocab add --file items.json --session N [--date D]
# items.json: [{"lemma","sense_id","translation","language","examples":[{"sentence","translation"}]}]
# same lemma+language+sense → duplicate error; same lemma new sense → new item

lang vocab record --lemma L --sense S --type recall|usage --success true|false [--date D] [--language X]
lang vocab list
lang vocab check --words a,b,c [--language X]   # advisory known/learning/unknown
lang vocab counts
```

Mastery rules (code constants, not configurable):
`mastered` = ≥3 successful recalls AND ≥1 successful usage AND successes on
≥2 distinct days AND exposure on ≥2 days. `familiar` = ≥1 successful recall
AND ≥2 exposure days.

## Sessions

```bash
lang session start [--date D]
# resumes an active/checkpoint session, or starts a new one.
# exits with ANKI_GATE_REQUIRED error on a new learning day (after the first)
# until `lang state anki-confirm` records the learner's confirmation.

lang session save --file record.json      # checkpoint; session stays resumable
lang session complete --file record.json  # completes, updates derived, commits
```

Record schema: see `templates/opencode/skills/lang/progress/state.md`.
Commit messages: `feat(progress): complete session NN` /
`checkpoint(progress): save session NN`.

## Anki CSV

```bash
lang csv export --session N
# writes vocabulary/anki/session-NNN.csv (Word,Translation,Sentence) for
# unexported items introduced in session N; no new items → no file
```

## Phases

```bash
lang phase begin --id phase-01 [--date D]    # branch phase-01-<slug> from main
lang phase test-result --file r.json         # evaluate + store + commit
# r.json: {"score":85,"competencies":[{"id","required","critical","score"}]}
# pass = score>=80 AND all required assessed AND no critical failed
#        AND at most one required non-critical below 80
# when the phase has registered competencies, result ids must match them
# exactly (same ids, same required/critical flags, none missing)

lang phase merge [--confirm]    # dry run by default; --confirm merges --no-ff
lang phase next [--date D]      # begin next pending phase from latest main
```

Merge preconditions: phase `passed`, on the phase branch, project paths
clean. Conflicts abort the merge safely and stop.

## Validation / diagnostics

```bash
lang validate   # schema + consistency checks; exit 2 on error
lang doctor     # environment + structure checks; exit 1 on failure
```

## Git safety

All git execution is allowlisted and uses structured argument arrays.
Blocked: `push`, `reset`, `rebase`, `clean`, `filter-branch`,
`cherry-pick`, `--force`, `--hard`, `-D`, `--delete`, `--amend`.
Commits stage explicit project paths only.
