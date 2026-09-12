# Lang

**An OpenCode-native adaptive language learning system.**

Lang is not a flashcard app or a chatbot. It is a persistent learning system
that manages a learner profile, an adaptive curriculum organized into phases,
vocabulary mastery with evidence, daily adaptive sessions, assessment, and a
Git-based history — while delegating long-term spaced repetition to
[Anki](https://apps.ankiweb.net/).

Core principle:

> **AI-driven + state-driven + constraint-driven + user-controlled.**

Lang runs *inside* [OpenCode](https://opencode.ai): the AI agent teaches,
assesses, and adapts; a small deterministic CLI owns all state transitions so
that progress, mastery, and history are reliable and auditable.

---

## Installation

Requirements: **Node.js ≥ 18** and **git**.

```bash
git clone <this-repository> langkit
cd langkit
npm install          # no runtime dependencies; installs nothing external
npm link             # exposes the `lang` command on your PATH
```

Verify:

```bash
lang help
```

## Quick start

```bash
mkdir my-indonesian && cd my-indonesian
lang init --here
```

This verifies the folder is empty, checks git, creates the project structure,
installs OpenCode commands and skills, and makes an initial commit.

Then open the folder in OpenCode and run:

```text
/lang-start      → learner interview, curriculum + phase 1 created
/lang-go         → today's adaptive learning session
/lang-status     → concise progress overview
/lang-review     → intentional review / weekly assessment
```

## How it works (architecture overview)

```text
OpenCode agent (pedagogy, adaptive decisions)
        │  uses
        ▼
lang CLI (deterministic state transitions, validation, git safety)
        │  maintains
        ▼
learner state + curriculum + vocabulary evidence + git history
```

- The **agent** teaches, generates exercises, validates content, and adapts
  the plan — guided by the installed skill (`.opencode/skills/lang/`).
- The **CLI** owns every mutation of machine state: schema validation,
  mastery rules, the Anki gate, phase test gates, and git operations
  (allowlisted, structured, destructive operations blocked).
- **Git** stores history: one branch per phase, a commit per session, merge
  on phase completion. It is the recovery mechanism, never the source of
  truth for progress.
- **Anki** stays external: Lang emits one `Word,Translation,Sentence` CSV per
  session with new vocabulary; you import it into your deck.

## Project structure (installed learner project)

```text
language-project/
├── .opencode/            # slash commands + the lang skill
├── phases/               # one folder per phase: plan, test, sessions
├── learner/              # profile.json/.md + state.json
├── vocabulary/           # registry.json + anki/ CSV exports
├── plan.md               # overall curriculum plan
└── README.md
```

## Learner workflow

1. `/lang-start` — interview (target/source language, level, daily time,
   duration, skills, style, goals) → adaptive curriculum with phases.
2. `/lang-go` each day — the agent checks your Anki review on new days,
   teaches a small amount of new material, tests it (recognition + active
   recall), remediates errors, records evidence, exports the Anki CSV, and
   commits the session.
3. Sessions are resumable: interrupted work is saved as a checkpoint and
   continued next time.
4. When a phase's competencies are ready, the agent runs the phase test.
   Passing requires **≥ 80% overall, every required competency assessed, no
   critical competency failed**. Then the phase branch merges to `main` and
   the next phase begins.
5. Mastery is conservative: an item becomes `mastered` only after successful
   retrieval and usage evidence spread across **multiple days** — never from
   a single session.

## Git workflow

```text
main
  ↓ phase-01-foundations        (branch per phase)
  ↓ feat(progress): complete session 01 …
  ↓ phase test → pass
  ↓ merge: phase-01-foundations into main
  ↓ phase-02-…                  (next branch from latest main)
```

The CLI blocks force push, hard reset, destructive clean, branch deletion,
rebase, and history rewriting. Conflicts abort safely and ask for you.

## Anki workflow

1. Study with `/lang-go`; new vocabulary is recorded with evidence.
2. `vocabulary/anki/session-NNN.csv` is generated per session with new words.
3. Import the CSV into your dedicated Anki deck.
4. Each new learning day, Lang asks you to confirm your Anki review before
   new material — Lang never pretends to verify it automatically.

## Commands

Public CLI:

```bash
lang init --here    # initialize a Lang project in the current empty folder
lang status         # concise progress overview
```

The OpenCode slash commands (`/lang-start`, `/lang-go`, `/lang-status`,
`/lang-review`) are the primary interface for learning. Internal CLI
subcommands used by the skill are documented in `docs/commands.md`.

## Tests

```bash
npm test
```

76 deterministic tests cover CLI behavior, file creation, schema validation,
mastery invariants, git safety rules, CSV formatting, template installation,
phase state transitions, session lifecycle, consistency checks, and the full
end-to-end lifecycle.

## Documentation

- `docs/implementation-plan.md` — implementation plan and decision log
- `docs/architecture.md` — module map and state authority model
- `docs/commands.md` — internal CLI reference
- `examples/` — sample artifacts and a full walkthrough

## Contributing

See `CONTRIBUTING.md`. Keep V1 simple: no databases, no agent frameworks, no
speculative abstractions.

## License

MIT — see `LICENSE`.
