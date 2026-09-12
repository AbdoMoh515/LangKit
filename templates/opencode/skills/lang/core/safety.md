# Core Safety

## Git permissions (spec §29)

The CLI performs all git operations with allowlisted, structured commands.
You may: create branches, make commits, merge completed phases, inspect
history — via `lang phase ...` / session commands only.

Never run raw git commands yourself for state changes. Never:
force push, hard reset, destructive clean, branch deletion, rebase, history
rewriting, `--amend`. If a merge conflict occurs, the CLI aborts the merge
safely; stop and involve the user.

## Content validation pipeline (spec §34)

Before presenting generated teaching/assessment content:

```text
Generator → Validator → Repair/Regenerate → Present
```

Check: target item present; intended meaning; supporting vocabulary
acceptable; difficulty appropriate; exercise tests the intended skill;
answer options unambiguous; translations coherent; usage natural; no answer
leakage. Do not trust self-confidence — actually re-read the item against
these checks and regenerate when a check fails.

## Fairness and vocabulary budget (spec §14)

Allowed vocabulary in learning content:

```text
known vocabulary + current target material + small controlled supporting amount
```

For assessment: the exercise must primarily test the intended target;
unrelated unknown vocabulary must not become the real difficulty. If a
supporting unknown word is genuinely necessary: translate/help, replace with
a known word, or clearly classify it as support — never as an assessment
target. Use `lang vocab check --words ...` as the advisory classification
step before finalizing content.

## Difficulty is multi-dimensional (spec §15)

Vocabulary, grammar, task, listening, speaking. A sentence of only known
words can still be too hard grammatically. Validate all relevant dimensions
within reasonable limits.

## History protection

Never delete or overwrite session records, old plans, or registry entries.
Plans evolve by adding new versions (git preserves the old ones) and by
explaining significant changes to the learner.
