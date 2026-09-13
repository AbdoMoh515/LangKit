# Lang — Implementation Plan (V1)

Authoritative product spec: `Lang_Project_Spec.md`. This document records the
implementation plan, the approved corrections, and every ambiguity decision.
It is a working document: decisions are appended, never rewritten silently.

## 1. Stack

- **Node.js (>= 18), ES modules, zero runtime dependencies.**
- CLI entry: `bin/lang.js`, exposed as `lang` via `package.json` `bin`.
- Tests: Node built-in test runner (`node --test`), `node:assert`.
- No database, no agent framework, no web layer.

Rationale: repo inspection found Node 24 / npm 11 / git 2.52 available. A
zero-dependency Node CLI is the simplest maintainable stack that satisfies
spec §42 (no unneeded dependencies, small composable modules).

## 2. Repository layout

```text
LangKit/
├── package.json            # bin: lang -> bin/lang.js
├── bin/lang.js
├── src/
│   ├── cli/                # arg parsing + thin command wrappers
│   │   ├── index.js
│   │   └── commands/       # init, status, profile, plan, state, vocab,
│   │                       # session, csv, phase, validate, doctor
│   └── core/               # deterministic logic (no I/O decisions in CLI)
│       ├── errors.js  paths.js  schema.js  git.js
│       ├── profile.js state.js vocabulary.js session.js
│       ├── csv.js  phase.js  random.js  init.js  templates.js
│       └── consistency.js
├── templates/opencode/     # installed into learner projects
│   ├── commands/           # lang-start, lang-go, lang-status, lang-review
│   └── skills/lang/        # SKILL.md + core/planning/teaching/
│                           # vocabulary/assessment/progress
├── tests/
├── docs/                   # this plan, architecture, CLI reference
├── examples/               # sample artifacts + walkthrough
├── README.md  CONTRIBUTING.md  LICENSE
```

## 3. Installed learner project layout

Per spec §4. Sessions live **inside their phase** (approved correction #3):

```text
language-project/
├── .git/
├── .opencode/{commands,skills/lang}/...
├── phases/
│   └── phase-01-<slug>/
│       ├── plan.md
│       ├── test.md
│       ├── test-result-NN.json
│       └── sessions/
│           ├── session-NNN.json   (machine record)
│           └── session-NNN.md     (human log, agent-written)
├── learner/
│   ├── profile.json   (authoritative machine profile)
│   ├── profile.md     (generated human-readable view)
│   └── state.json     (authoritative progress state)
├── vocabulary/
│   ├── registry.json
│   └── anki/session-NNN.csv
├── plan.md
└── README.md
```

## 4. Public CLI vs internal CLI (approved correction #1)

**Public V1 surface** (what the README documents):

```text
lang init --here
lang status
```

**Internal deterministic operations** — the OpenCode skill layer calls these
so that all state mutation is validated and auditable. The agent never edits
JSON by hand. They are documented in `docs/commands.md`, not in the README:

```text
lang profile set --file p.json | get
lang plan scaffold --file plan.json
lang state get | anki-confirm [--date D]
lang vocab add --file items.json --session N --date D
lang vocab record --lemma L --sense S --type recall|usage --success true|false [--date D]
lang vocab list | check --words a,b,c
lang session start [--date D] | save --file r.json | complete --file r.json
lang csv export --session N
lang phase begin --id phase-01 | test-result --file r.json | merge [--confirm] | next
lang validate
lang doctor
```

Rule: every internal subcommand must have a caller in a command/skill
template; otherwise it gets deleted (spec §45 anti-bloat).

## 5. State authority model (approved correction #4)

Three tiers, strictly separated:

| Tier | Contents | Location |
|---|---|---|
| Authoritative | current phase, current session, completed sessions, phase registry, last activity, Anki confirmation date, learner profile, vocabulary status | `state.json`, `profile.json`, `registry.json` |
| Historical evidence | recalls, usage results, assessment results, session records | `phases/*/sessions/*`, `test-result-*.json`, registry evidence fields |
| Derived | weak areas, next recommended work, recent performance, estimated remaining | `state.json` → `derived` block with `computed_at` |

Rules:

- `state.json` has a strict top-level schema; derived fields exist **only**
  inside `derived`. Unknown top-level keys are rejected.
- `derived` is recomputed from evidence on session completion / test results;
  it is never consulted for phase/session truth.
- Git branch is a **consistency check** on the current phase, never the
  source of truth (spec §3, §33.8). `lang validate` reports mismatches and
  stops; destructive repair requires the user.

## 6. Mastery rules (approved correction #5)

Thresholds are **code constants**, not user configuration:

```text
MASTERY_RULES = {
  MIN_SUCCESSFUL_RECALLS: 3,
  MIN_SUCCESSFUL_USAGE: 1,
  MIN_SPACED_SUCCESS_DAYS: 2,   # successes on >= 2 distinct calendar days
  MIN_EXPOSURE_DAYS: 2
}
```

- `mastered` requires all four conditions; a single-day session can never
  produce mastery (hard invariant, spec §33.3). Enforced + tested.
- Status ladder: `new → learning → familiar → mastered`.
- Lexical unit = lemma + language + sense. Same lemma, new sense = new item.
  Same lemma + same sense = duplicate, rejected (spec §13, §21).

## 7. Phase lifecycle and pass rule (approved corrections #6, #9)

```text
pending → active → (test recorded) → passed → merged
                       │
                       └─ fail: phase stays active, weak areas recorded
```

- `completed` as a distinct state is not used: a phase goes from `passed`
  directly to `merged`; nothing is "complete" before the test passes.
- Pass rule (spec §25 + correction #6):
  - overall score >= 80 **AND**
  - every required competency assessed **AND**
  - no critical required competency failed **AND**
  - at most one required non-critical competency below threshold.
- Interpretation of "almost all required competencies demonstrated": at most
  one required non-critical competency may score < 80. A high vocabulary
  score cannot mask missing listening/speaking/reading/writing/grammar.
- Merge preconditions: phase `passed`, clean working tree, on the phase
  branch, state saved. Dry-run by default; `--confirm` executes.
  Conflicts: only mechanical resolution; otherwise stop and ask.

## 8. Git architecture (approved corrections #7, #8)

- `src/core/git.js` is the **only** code that executes git. It is consumed
  as an adapter interface by `phase.js` / `session.js` (Phase Engine ↓ Git
  Adapter). Tests inject fakes; production uses `execFileSync`.
- All invocation uses **structured argument arrays**. No shell, no string
  interpolation of model-generated commands.
- Allowlisted subcommands only: `init add commit branch switch merge log
  status rev-parse config diff show`.
- Blocked everywhere: `--force`, `-f`, `--hard`, `-D`, `--delete`, `rebase`,
  `filter-branch`, `clean`, `push`, `--amend` (spec §29 permissions).
- Staging: commits stage explicit project paths only
  (`learner/ vocabulary/ phases/ plan.md README.md .opencode/`), never
  `git add -A`.
- Standardized commit messages (spec §29):
  - `chore(init): initialize lang project`
  - `feat(progress): complete session NN` / `checkpoint(progress): save session NN`
  - `feat(progress): begin phase NN-slug` / `feat(progress): phase NN test passed`
  - `checkpoint(progress): phase NN test failed`
  - `merge: phase-NN-slug into main`
  - `chore(progress): anki review confirmed YYYY-MM-DD`
- `git init -b main` so the branch model in spec §29 always holds.
- Identity fallback: if no git identity is configured, `init` sets a
  **repo-local** `user.name`/`user.email` so the required initial commit
  (spec §5.8) can succeed. Never touches global config.

## 9. OpenCode integration (spec §6, §7; correction #2)

- One project-local skill: `.opencode/skills/lang/SKILL.md` = orchestrator;
  capability material in `core/ planning/ teaching/ vocabulary/ assessment/
  progress/` subdirectories, loaded on demand.
- Slash commands: `/lang-start`, `/lang-go`, `/lang-status`, `/lang-review`.
- The skill layer drives pedagogy (LLM work); the CLI performs state
  transitions (deterministic work). All 12 guardrails of spec §33 are stated
  in `SKILL.md`/`core/safety.md` and enforced in code where deterministic.

## 10. Deterministic support for agent workflows

- `lang vocab check --words ...` classifies words known/learning/unknown
  against the registry — **advisory** for the vocabulary budget of spec §14
  (string/lemma match only; inflections may false-negative, so the skill
  layer must not treat a miss as "unknown").
- `lang plan scaffold --file plan.json` registers phase metadata only
  (id, order, slug, title). Curriculum content lives in markdown.
- Assessment randomization: seeded mulberry32 PRNG (`src/core/random.js`),
  seed recorded in the assessment artifact (spec §35).
- Anki gate: `lang session start` reports `ANKI_GATE_REQUIRED=true|false`
  (new learning day after the first, spec §11.7/§22);
  `lang state anki-confirm` records the learner's confirmation. Lang never
  pretends to verify Anki automatically.

## 11. Decisions log

1. Node.js zero-dependency CLI; `node --test` for tests.
2. CLI extended beyond the two public commands with internal deterministic
   state operations (spec §41/§45 justify determinism; README stays minimal).
3. `profile.json` (authoritative) + generated `profile.md` (human view).
   Slight deviation from the spec §4 tree, justified by correction #4.
4. Mastery thresholds are code constants, not user-configurable.
5. Anki CSVs written to `vocabulary/anki/session-NNN.csv`.
6. Prompt/behavior tests are implemented as structural conformance tests of
   templates/skills (required rules present) — no LLM in CI. Teaching
   behavior itself is not machine-verified in V1.
7. Seeded PRNG: mulberry32; seed = session id + date.
8. `init` rejects any non-empty directory and any directory inside an
   existing git repository; no `--force` escape hatch.
9. Repo-local git identity fallback on init (see §8).
10. `examples/` contains sample artifacts + a walkthrough transcript rather
    than a pre-generated git repo (no nested repos in the source tree).
11. Session numbering is global and monotonic across phases (simple, matches
    commit message format `session NN`).
12. Git checkout semantics mean `state.json` is snapshotted per branch:
    switching branches legitimately swaps state files. The consistency model
    therefore targets hand-edits and corruption (branch vs stored phase,
    missing directories, ghost branches) rather than checkout-induced
    "mismatches", which are self-consistent by construction.

## 13. Post-review corrections (external review round 1)

13. Semantic guards beyond schema validation (schema-valid ≠ logically
    valid): `profile set` refuses target/source language changes once phases
    are registered; `anki-confirm` refuses future dates; `vocab record`
    refuses evidence dated before introduction; session save/complete refuse
    records claiming a different phase than the current session.
14. Merge lifecycle: completion state is committed on the phase branch
    *before* the `--no-ff` merge, so the merge commit itself carries the
    final state; no post-merge chore commit.
15. Git identity fallback retained (spec §5.8 requires an initial commit and
    many machines have none) but disclosed loudly in `init` output with the
    exact replacement commands.
16. Anki export eligibility is deterministic: items introduced in session N
    and not yet exported. The agent never gates export on its own belief
    that a word was "learned".
17. `new` registry status means "registered but not yet actively taught"
    (reserved for future import); taught items start at `learning`.
18. README no longer advertises exact test counts; it instructs running
    `npm test` (counts rot, output does not lie).

## 14. Post-review corrections (external review round 2)

19. Merge-failure recovery: the terminal state commit (status `merged`,
    `current_phase = null`) is made on the phase branch before the
    `--no-ff` merge so the merge commit carries it — but if the merge
    fails, the pre-merge `state.json` is restored on the phase branch with
    an explicit checkpoint commit
    (`checkpoint(progress): phase NN merge failed, state restored`).
    The phase returns to `passed`/active and the merge is retryable after
    the user resolves the conflict. Append-only; no history rewriting.
    `main` never receives the failed terminal state.
20. Competencies are **mandatory for newly registered phases**
    (`scaffoldPlan` rejects phases without them). Rationale: without
    registered competencies the test-result gate is a no-op, so the strongest
    protection against an easier-than-planned phase test could be bypassed
    by omission. Legacy phases registered before this rule keep no-op
    enforcement for compatibility; prefer re-registering them with
    competencies at the next replanning point.
21. CI is deliberately deferred until after the real OpenCode learner
    workflow survives: commit N = correctness, commit N+1 = infrastructure.

## 15. Learner-workflow corrections (real workflow test round)

22. Learner-facing language: `profile.source_language` is the authoritative
    language of ALL learner-facing communication (explanations, instructions,
    tests, feedback, motivation, summaries). Priority: learner's explicit
    request in the current message > `profile.source_language` > ask. Never
    silently fall back to English; English in skill/docs/CLI output is
    developer-facing only. No language is hard-coded. Enforced via skill
    invariant 0 + `core/learner-interaction.md`.
23. Teaching and testing are separate interactive stages. The teaching
    response presents the complete batch and STOPS with a readiness prompt in
    the source language; testing begins only after an explicit readiness
    signal; unrelated replies keep the teaching stage; readiness applies to
    the batch, not a single item.
24. Session stage persistence: session records (and
    `state.current_session`) carry `stage: teaching|testing` (additive,
    optional — schema_version unchanged). Transitions enforced by the CLI:
    `teaching → testing` via `lang session stage --stage testing`; reverse
    rejected; same-stage no-op; records omitting `stage` preserve the stored
    value; legacy records without `stage` resume as `teaching`.

## 12. Build order (spec §43)

Stages 1–10 as specified: bootstrap → state → OpenCode integration →
lang-start → learning loop → persistence → Anki → review/assessment →
git phase lifecycle → polish. Tests written alongside each stage; suite run
and failures fixed before continuing.
