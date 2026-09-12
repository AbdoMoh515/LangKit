# Git Lifecycle (spec §29, §30)

## Model

```text
main
  ↓ lang phase begin --id phase-01        → branch phase-01-<slug>
  ↓ session commits
  ↓ phase test (lang phase test-result)
  ↓ pass → lang phase merge --confirm     → merge into main (--no-ff)
  ↓ lang phase next                       → next branch from latest main
```

Every learner project is its own git repository. Merged phase history is
kept forever.

## Commit messages (made by the CLI, standardized)

```text
chore(init): initialize lang project
feat(progress): complete session 04
checkpoint(progress): save session 04
feat(progress): begin phase 01-foundations
feat(progress): phase phase-01 test passed
checkpoint(progress): phase phase-01 test failed
merge: phase-01-foundations into main
chore(progress): anki review confirmed 2026-09-13
```

Commits stage explicit project paths (`learner/ vocabulary/ phases/ plan.md
README.md .opencode/`) — never `git add -A`.

## Merge policy (spec §30)

A phase merges only when: test completed, pass criteria satisfied, working
tree clean, completion state saved. `lang phase merge` is a dry run by
default; `--confirm` executes. On conflict the CLI aborts the merge safely
and stops — resolve with the user; never silently discard history.

## What you must never do

Run git yourself for state changes; force push; hard reset; destructive
clean; delete branches; rebase; rewrite history. If git and state disagree,
`lang validate` explains it — repair only with the user's explicit consent.
