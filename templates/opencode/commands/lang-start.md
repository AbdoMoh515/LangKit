---
description: Set up the learner profile and generate the adaptive curriculum
---

Initialize this Lang project: gather the learner model, register the
curriculum, and begin phase 1. Load the project-local skill
`.opencode/skills/lang/SKILL.md` first, then `planning/curriculum.md`.

**Learner-facing language:** everything the learner sees during this
interview and afterwards follows `profile.source_language` (see
`core/learner-interaction.md`). Conduct the interview in the learner's
source language; never fall back to English silently.

## Interview (spec §8)

Ask via multiple-choice questions where possible. Gather, at minimum:

1. Target language
2. Source/explanation language (this becomes the default conversation language)
3. Current level in the target language (self-assessed; CEFR as reference only)
4. Current level in the source language
5. Daily available learning time (fixed amount / recommended / variable)
6. Desired total duration (user-defined / AI-recommended)
7. Skills of focus (selected skills or all)
8. Learning style preferences
9. Relevant goals
10. Anything else needed to remove material ambiguity

Stop asking as soon as information is sufficient. Never interrogate endlessly.
Current levels are not decorative: they constrain teaching difficulty.

## Then execute, in order

1. Write the profile JSON to `.lang-tmp-profile.json` (schema in
   `skills/lang/progress/state.md`) and run:
   `lang profile set --file .lang-tmp-profile.json`; delete the temp file.
2. Generate the overall plan into `plan.md` (phases, milestones, objectives,
   estimated effort, dependencies, exit criteria — spec §9) and a detailed
   plan for each phase folder later.
3. Write `.lang-tmp-plan.json` as
   `{"phases":[{"slug":"...","title":"...","competencies":[{"id":"...","required":true,"critical":false}]}]}`
   in learning order. **Competencies are required for every phase** — the CLI
   refuses to register a phase without them, because the phase test is
   enforced against them. Run:
   `lang plan scaffold --file .lang-tmp-plan.json`; delete the temp file.
4. Begin the first phase: `lang phase begin --id phase-01`
5. Write the full phase-01 plan into `phases/phase-01/plan.md` (objective,
   target competencies, topics, effort, timeline, progression criteria, and
   the phase test definition) and the test blueprint into
   `phases/phase-01/test.md`. The CLI already created stubs.
6. Summarize the curriculum to the learner: phases, what phase 1 covers,
   expected pace, and that the plan is adaptive (changes are explained, never
   silent).

## Constraints

- CEFR is a human-facing reference only; internal planning is
  competency/mastery based (spec §10).
- Do not promise specific dates as guarantees; estimates are estimates.
- Preserve learner history; never overwrite plan history silently (Git keeps it).
