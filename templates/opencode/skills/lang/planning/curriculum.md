# Curriculum Planning (initial)

Applies after the `/lang-start` interview. Spec §9, §10, §28.

## Overall plan (`plan.md`)

Produce a human-readable plan listing:

- phases, in learning order
- milestones per phase
- objectives
- rough estimated effort (hours/sessions, clearly labeled as estimates)
- dependencies where useful
- phase exit criteria

## Phase plans (`phases/phase-NN-<slug>/plan.md`)

Each phase plan contains: phase objective; target competencies; relevant
skills; learning topics; estimated study effort; expected timeline;
progression criteria; phase test definition (also mirrored in `test.md`).

The test definition must name the required competencies and mark which are
**critical**. Pass policy (enforced by the CLI): overall ≥ 80%, every required
competency assessed, no critical competency failed, at most one required
non-critical competency below threshold.

## CEFR policy (spec §10)

CEFR (A1–C2) may be shown to the learner as a familiar reference. Internally,
plan and assess in competencies/mastery, not CEFR labels. Do not assume the
target language maps cleanly onto CEFR descriptors.

## Timeline (spec §28)

Base the initial timeline on: current level, target level/goal, selected
skills, daily availability. Keep estimates honest and adjustable; they are
not contracts. Prefer spreading material over more days over cramming —
mastery requires spaced evidence by design.

## Registering the plan

Write the phase registry, including per-phase competencies:

```json
{"phases":[
  {"slug":"foundations","title":"Foundations",
   "competencies":[
     {"id":"greetings-courtesy","required":true,"critical":true},
     {"id":"listening-basic","required":true,"critical":true},
     {"id":"reading-basic","required":true,"critical":false}
   ]}
]}
```

then `lang plan scaffold --file .lang-tmp-plan.json`.
Phase ids are assigned by order (phase-01, phase-02, ...). Curriculum detail
lives in markdown; the phase registry (ids, order, competencies) is machine
state. **Competencies are mandatory for every newly registered phase** — the
CLI rejects scaffolds without them. The CLI then refuses phase test results
that assess unregistered competencies, drop required ones, or tamper with
criticality flags — the test cannot quietly become easier than the plan.
(Phases registered before this rule existed may have no competencies; for
those the enforcement is a no-op. Prefer replanning them with competencies
at the next natural replanning point.)
