---
description: Run today's adaptive learning session
---

Run one adaptive learning session. Load `skills/lang/SKILL.md`, then
`core/learner-interaction.md` (binding: learner-facing language + stage
contract), `teaching/vocabulary-loop.md`, `teaching/difficulty.md`, and
`assessment/exercises.md` as needed.

**Before any learner-facing output:** read `learner/profile.json` and use
`source_language` for everything the learner sees (explanations,
instructions, tests, feedback, summaries). Target language appears only as
taught material and examples. Never fall back to English silently.

## Session procedure (spec §11)

1. Run `lang session start`. Interpret the result:
   - `RESUMED session N` → jump to the reported STAGE:
     - `STAGE: teaching` → continue the REMAINING teaching material; do not
       restart completed teaching; do not test until teaching is complete
       and the learner confirms readiness.
     - `STAGE: testing` → continue the exercise phase directly; do not
       re-teach all vocabulary unless genuinely needed.
   - `STARTED session N` → begin at the teaching stage.
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

## STAGE 1 — Teaching only (no test questions in this response)

4. Present the complete new-word set first. For each item, in the learner's
   `source_language`:
   - the target word / phrase
   - meaning in `source_language`
   - usage explanation in `source_language`
   - pronunciation guidance (spec §17, e.g. Google Translate listen link or
     concise instructions; recommendation, not a blocking gate)
   - one example sentence in the target language (spec §16)
   - translation of the example in `source_language`
   Typical new-word load is ~5–10 when appropriate, adapted to time, level,
   and performance — never a hard count.
5. After ALL items are presented, STOP. Do NOT start a test in this response.
   End with a short readiness prompt in `source_language` (e.g. for Arabic:
   «لما تخلص قراءة الكلمات وتسمع النطق، قل لي «تمام» أو «جاهز» ونبدأ
   الاختبار» — wording adapts to the source language).
6. While presenting, record the new items deterministically:
   write `.lang-tmp-vocab.json` =
   `[{"lemma":"...","sense_id":"...","translation":"...","language":"<target>","examples":[{"sentence":"...","translation":"..."}]}]`
   then `lang vocab add --file .lang-tmp-vocab.json --session N --date <today>`;
   delete the temp file.

### Waiting for readiness

- Affirmative readiness signals in the learner's source language (equivalents
  of okay / ready / start / finished / go / تمام / جاهز / ابدأ / خلصت) — no
  single magic phrase required.
- If the learner asks a question or requests clarification instead: answer
  it, remain in the teaching stage, do not begin testing.
- "Okay" after a single word's explanation is not batch readiness (unless you
  deliberately chose a smaller teaching unit).

## STAGE 2 — Testing (only after explicit readiness)

7. When the learner signals readiness, persist the transition FIRST:
   `lang session stage --stage testing`. Then begin the exercise phase
   (recognition → active recall → remediation when needed). Test framing,
   instructions, and feedback are in `source_language`; target-language
   material appears in the exercise content. Respect the vocabulary
   constraints (spec §14): exercises must primarily test the target;
   unrelated unknown vocabulary must not become the difficulty.
   Use `lang vocab check --words ...` as an advisory known/unknown check.
8. Remediate errors: identify the error type, explain in `source_language`,
   give another attempt; defer instead of repeating the same question forever
   (spec §19).
9. Record evidence deterministically as it happens — each recall/usage result:
   `lang vocab record --lemma L --sense S --type recall|usage --success true|false --date <today>`

## Finishing the session

10. When the session's intended target is adequately completed (adaptive
    boundary, not a clock), finish:
    - If new vocabulary was introduced this session, run
      `lang csv export --session N` after the session is completed (creates
      `vocabulary/anki/session-NNN.csv`). Eligibility is deterministic: the
      CLI exports every item introduced in session N that has not been
      exported yet. Do not editorialize about whether a word was "learned" —
      introduction + recorded evidence is the gate; spaced mastery is Anki's
      and the registry's job, decided by evidence across days.
    - Write the human-readable log `phases/<phase>/sessions/session-NNN.md`
      in `source_language` where learner-facing (what was taught, results,
      errors, remediation, next steps).
    - Write `.lang-tmp-session.json`:
      `{"schema_version":1,"number":N,"phase_id":"<phase>","date":"<today>","status":"completed","stage":"testing","summary":"...","new_items":["it-0001",...],"weak_areas":[...],"next_recommended_work":"...","performance":[{"type":"recognition","score":80}],"anki":true|false}`
      then `lang session complete --file .lang-tmp-session.json`; delete the temp file.
      If the learner must stop early, use `lang session save --file ...` with
      `"status":"checkpoint"` instead — the session stays resumable and the
      saved stage is restored on resume.
11. End with a concise summary in `source_language`: what was learned,
    evidence recorded, Anki CSV (if any), and what comes next.

## Hard rules

- Every session ends in a Git commit made by the CLI (complete →
  `feat(progress): complete session NN`; checkpoint →
  `checkpoint(progress): save session NN`). Never leave a session uncommitted.
- Correct once ≠ mastery. Mastery needs spaced evidence across days.
- Never assess with material the learner had no fair chance to learn.
- Teaching response and first test question are never in the same response.
- All learner-facing text follows `source_language` (or the learner's
  explicit request in the current message).
