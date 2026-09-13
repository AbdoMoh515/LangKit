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
# competencies are REQUIRED for every phase: the phase test is enforced
# against them. legacy phases without competencies keep no-op enforcement.
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
# resumes an active/checkpoint session, or starts a new one (stage: teaching).
# prints the restored STAGE on resume:
#   teaching → continue remaining teaching material
#   testing  → continue the exercise phase directly
# exits with ANKI_GATE_REQUIRED error on a new learning day (after the first)
# until `lang state anki-confirm` records the learner's confirmation.

lang session stage --stage teaching|testing
# persists the interaction stage of the current session (teaching → testing
# only after the learner's explicit readiness signal); commits a checkpoint

lang session save --file record.json      # checkpoint; session + stage stay resumable
lang session complete --file record.json  # completes, updates derived, commits
```

Record schema: see `templates/opencode/skills/lang/progress/state.md`.
`stage` (`teaching|testing`) is optional in records; when omitted, the CLI
preserves the stage already stored. Commit messages:
`feat(progress): complete session NN` / `checkpoint(progress): save session NN`.

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
clean. Conflicts abort the merge safely and stop. On failure the phase state
is **restored automatically** with a checkpoint commit on the phase branch
(`checkpoint(progress): phase NN merge failed, state restored`) — the phase
returns to `passed`/active and the merge can be retried after the user
resolves the conflict. No history is rewritten.

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
