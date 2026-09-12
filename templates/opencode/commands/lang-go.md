---
description: Run today's adaptive learning session
---

Run one adaptive learning session. Load `skills/lang/SKILL.md`, then
`teaching/vocabulary-loop.md`, `teaching/difficulty.md`, and
`assessment/exercises.md` as needed.

## Session procedure (spec §11)

1. Run `lang session start`. Interpret the result:
   - `RESUMED session N` → continue the interrupted session from its record
     and log; do not restart material the learner already covered.
   - error `ANKI_GATE_REQUIRED` → it is a new learning day (after the first).
     Ask the learner to complete their Anki review first. When they confirm,
     run `lang state anki-confirm` and re-run `lang session start`. Never
     pretend to verify Anki automatically.
   - error "no active phase" → the curriculum is not set up; route to
     `/lang-start` or `lang phase next` as appropriate.
2. Load `learner/profile.json` and `learner/state.json` (via
   `lang state get`), the current phase plan, and recent session records.
3. Determine the session budget from the profile's daily time, recent
   performance, mastery evidence, weak areas, and progress through the phase
   (spec §20). Very limited time → micro-session with fewer new items.
   Weak retention → more review/remediation. Strong retention → slightly more
   challenge. Never just accelerate the curriculum because time is available.
4. Teach a small amount of new material following the vocabulary loop
   (spec §12): introduce → meaning/usage → pronunciation guidance →
   contextual example → recognition → active recall → remediation if needed.
   Typical new-word load is ~5–10 when appropriate, adapted to time, level,
   and performance — never a hard count.
5. For each new item: follow the example protocol (spec §16) and give
   pronunciation guidance (spec §17, e.g. Google Translate listen link or
   concise instructions; recommendation, not a blocking gate).
6. Test what was taught (recognition + active recall at minimum). Respect the
   vocabulary constraints (spec §14): exercises must primarily test the
   target; unrelated unknown vocabulary must not become the difficulty.
   Use `lang vocab check --words ...` as an advisory known/unknown check.
7. Remediate errors: identify the error type, explain, give another attempt;
   defer instead of repeating the same question forever (spec §19).
8. Record evidence deterministically as it happens:
   - new items: write `.lang-tmp-vocab.json` =
     `[{"lemma":"...","sense_id":"...","translation":"...","language":"<target>","examples":[{"sentence":"...","translation":"..."}]}]`
     then `lang vocab add --file .lang-tmp-vocab.json --session N --date <today>`;
     delete the temp file.
   - each recall/usage result:
     `lang vocab record --lemma L --sense S --type recall|usage --success true|false --date <today>`
9. When the session's intended target is adequately completed (adaptive
   boundary, not a clock), finish:
   - If new vocabulary was introduced and confirmed learned, run
     `lang csv export --session N` (creates `vocabulary/anki/session-NNN.csv`).
   - Write the human-readable log `phases/<phase>/sessions/session-NNN.md`
     (what was taught, results, errors, remediation, next steps).
   - Write `.lang-tmp-session.json`:
     `{"schema_version":1,"number":N,"phase_id":"<phase>","date":"<today>","status":"completed","summary":"...","new_items":["it-0001",...],"weak_areas":[...],"next_recommended_work":"...","performance":[{"type":"recognition","score":80}],"anki":true|false}`
     then `lang session complete --file .lang-tmp-session.json`; delete the temp file.
     If the learner must stop early, use `lang session save --file ...` with
     `"status":"checkpoint"` instead — the session stays resumable.
10. End with a concise summary: what was learned, evidence recorded, Anki CSV
    (if any), and what comes next.

## Hard rules

- Every session ends in a Git commit made by the CLI (complete →
  `feat(progress): complete session NN`; checkpoint →
  `checkpoint(progress): save session NN`). Never leave a session uncommitted.
- Correct once ≠ mastery. Mastery needs spaced evidence across days.
- Never assess with material the learner had no fair chance to learn.
