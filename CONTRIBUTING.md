# Contributing to Lang

Thanks for helping. Lang's V1 philosophy is strict:

> a disciplined learning program operated by an adaptive AI agent —
> not a huge autonomous-agent framework that happens to teach languages.

## Ground rules

1. **Read `Lang_Project_Spec.md` first.** It is the authoritative V1
   specification. `docs/implementation-plan.md` records decisions; append
   new decisions there, never rewrite them silently.
2. **No new runtime dependencies** without strong justification. The CLI is
   zero-dependency on purpose.
3. **All state mutation goes through `src/core/` modules** with schema
   validation. Never bypass the validators.
4. **Determinism where reliability matters**: mastery rules, phase gates,
   git safety, and commit formats are code constants, not configuration.
5. **Tests alongside implementation.** Run `npm test` before submitting.
6. **Preserve the guardrails** (spec §33). If a change weakens an invariant,
   it needs explicit justification in the decision log.

## Development

```bash
npm test          # node --test, no setup needed
node bin/lang.js help
```

To try a learner project locally:

```bash
mkdir /tmp/lang-try && cd /tmp/lang-try
node <path-to-langkit>/bin/lang.js init --here
```

## Code style

- ES modules, no comments unless strictly necessary, small modules.
- CLI commands are thin wrappers; logic lives in `src/core/`.
- Git operations only via `src/core/git.js` (allowlisted, structured args).

## Submitting

- One logical change per PR.
- Include tests for behavior changes.
- Update `docs/` when architecture or commands change.
