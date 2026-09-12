# Phase Tests (spec §24, §25, §30)

## When

A phase becomes test-eligible when its plan's progression criteria are met
(learning + reinforcement + periodic review done). Never test before the
learner had a fair opportunity to learn the material.

## Design

The test covers the phase's **required competencies** (defined in
`phases/<phase>/test.md`), combining relevant skills: vocabulary, usage,
grammar, listening, reading, writing, speaking/conversation — only skills
relevant to the phase and learner plan. Mark each required competency and
whether it is **critical** in the test blueprint.

## Pass policy (enforced by CLI)

```text
overall score >= 80%
AND every required competency assessed
AND no critical required competency failed
AND at most one required non-critical competency below threshold
```

A high vocabulary score alone must not pass a phase whose listening/speaking/
reading/writing/grammar competencies are materially missing.

## Recording

Write `.lang-tmp-test.json`:

```json
{
  "score": 84,
  "competencies": [
    {"id": "vocab-greetings", "required": true, "critical": false, "score": 90},
    {"id": "listening-basic", "required": true, "critical": true, "score": 82}
  ]
}
```

then `lang phase test-result --file .lang-tmp-test.json`; delete the temp
file. The CLI evaluates, stores `test-result-NN.json`, and commits.

## On failure

1. identify weak areas (CLI records them into `state.derived.weak_areas`);
2. create targeted remediation — do not automatically repeat the entire phase
   for one weak competency;
3. retest the relevant weak areas with a new attempt;
4. history is preserved (every attempt is a separate `test-result-NN.json`).

## On pass

1. `lang phase merge` (dry run) — show the learner the preconditions;
2. with consent: `lang phase merge --confirm`;
3. `lang phase next` — creates the next phase branch from latest main.
