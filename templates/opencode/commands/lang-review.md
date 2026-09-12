---
description: Intentional review / assessment workflow (weekly review, weak items, conversation practice)
---

Run an intentional review. Load `skills/lang/SKILL.md`, then
`assessment/exercises.md` and `assessment/weekly-review.md`.

This command does NOT replace Anki's daily scheduling (spec §38). It may:

- consolidate vocabulary learned in Lang (recognition + active recall, mixed
  directions, spec §18);
- review weak items from `state.derived.weak_areas` and recent session records;
- practice contextual sentence usage;
- hold a short target-language conversation when appropriate for level/goals;
- perform the weekly review when the learner asks for it or a week of sessions
  has passed.

## Weekly review contents (spec §23)

Combine old vocabulary, recently learned vocabulary, contextual usage,
recognition, active recall, and optional short conversation. It must reveal
strengths, weaknesses, forgotten/weak items, and a recommended adaptation.

## Rules

- Only assess material the learner had a fair opportunity to learn.
- Keep exercises on-target; unrelated unknown vocabulary must not dominate
  difficulty (spec §14).
- A review never destroys or invalidates learning history.
- If the review reveals a phase test is imminent and readiness is low, say so
  and recommend remediation first; readiness is evidence-based, not label-based.
- After the review, record results like a session (vocab evidence via
  `lang vocab record`, summary via `lang session complete` when this replaces
  a session, or include findings in the next session's record).
