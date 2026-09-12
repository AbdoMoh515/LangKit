# Architecture

## Module map

```text
bin/lang.js                 entry; error handling, exit codes
src/cli/index.js            dispatch; public + internal commands
src/cli/args.js             minimal flag parsing
src/cli/commands/*          thin wrappers (no business logic)
src/core/
  errors.js                 LangError with exit codes
  paths.js                  project layout constants, root discovery, JSON I/O
  schema.js                 schema_version + strict validators for all state
  git.js                    ONLY place git runs: allowlist + blocked flags,
                            structured arg arrays, adapter interface
  init.js                   init checks (git present, empty dir, no nested
                            repo), scaffolding, initial commit
  templates.js              installs templates/opencode into the project
  profile.js                learner profile: load/save/validate/render .md
  state.js                  progress state, authority tiers, derived recompute,
                            anki gate logic
  vocabulary.js             lexical items/senses, evidence, mastery engine,
                            classification, anki selection
  session.js                session start/resume/checkpoint/complete, records
  csv.js                    RFC4180 Anki CSV (Word,Translation,Sentence)
  phase.js                  phase state machine, test recording, merge gate
  assessment.js             phase test pass evaluation
  consistency.js            cross-checks state vs git vs files
  random.js                 seeded mulberry32 for assessment randomization
templates/opencode/         installed into learner projects (commands + skill)
```

## Design principles

1. **Agent decides, CLI commits.** The LLM layer (OpenCode commands + skill)
   owns pedagogy and adaptive judgment. Every durable state transition goes
   through validated CLI operations so behavior is auditable and recoverable.
2. **Separation of truth** (spec §3): git = lifecycle/history/recovery;
   JSON = machine state; markdown = human plans/logs; registry = lexical
   mastery. Branch names are a consistency check only.
3. **Git adapter boundary**: phase/session logic never shells out directly;
   tests inject fakes, production uses `execFileSync` with argument arrays.
4. **No database.** Human-readable files + git history are the store.
5. **Strict schemas**: unknown keys rejected, `schema_version` required,
   incompatible versions refused (never silently overwritten).

## State authority model

| Tier | Where | Examples |
|---|---|---|
| Authoritative | `state.json`, `profile.json`, `registry.json` | current phase/session, completed sessions, profile, vocabulary status |
| Evidence | `phases/*/sessions/*`, `test-result-*.json`, registry counters | recalls, usage, assessment results |
| Derived | `state.json.derived` (with `computed_at`) | weak areas, next work, recent performance |

Derived fields are recomputed from evidence by the CLI and never consulted
for authoritative decisions.

## Key invariants and their enforcement points

| Invariant (spec §33) | Enforcement |
|---|---|
| no mastery from single exposure | `vocabulary.js` multi-day rule (code constant) |
| no destructive git ops | `git.js` allowlist + blocked flags |
| no phase completion without test | `phase.js` merge preconditions |
| branch ≠ source of truth | `consistency.js` cross-check + skill docs |
| fair assessment / vocabulary budget | skill docs + advisory `vocab check` |
| resume capability | session checkpoints + `session start` resume |
| anki gate on new days | `state.js` gate + `session start` error |

## Branch/checkout semantics (decision 12)

`state.json` is committed per branch. Switching branches legitimately swaps
state snapshots (git checkout semantics). The consistency checker therefore
detects hand-edits, ghost branches, and missing directories — not
checkout-induced state swaps, which are self-consistent.

## Testing strategy

- Deterministic unit + integration tests (`node --test`) for everything the
  CLI owns; real git used against temp repositories.
- Prompt/behavior rules are tested structurally: required rules must be
  present in installed skill/command templates.
- LLM teaching behavior itself is out of scope for CI (no model in tests).
