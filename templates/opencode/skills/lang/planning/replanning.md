# Adaptive Replanning (spec §28)

The plan is adaptive. Replan when learning evidence shows the plan is too
easy, too hard, too fast, or insufficient.

## Inputs

- recent performance (`state.derived.recent_performance`)
- weak areas (`state.derived.weak_areas`)
- mastery evidence (`vocabulary/registry.json`)
- historical pace (completed sessions per phase)

## Falling behind

- redistribute work across remaining sessions;
- extend the timeline when necessary — say so explicitly;
- never compensate with unrealistic cramming.

## Progressing faster

- increase challenge and/or enrichment;
- never skip mastery requirements because the learner is fast — the CLI
  multi-day mastery rule cannot be bypassed and you must not pretend it can.

## Rules for changing the plan

- Do not silently rewrite important milestones. Explain significant changes
  to the learner before applying them.
- Preserve the phase's identity when extending its work (same phase id/branch);
  prefer extension over replacement.
- Preserve history: edit markdown forward; git keeps the old versions.
- After restructuring phases, update `plan.md` and, if phase metadata changed,
  reflect it in the phase plans. Machine phase registration only changes via
  CLI commands; never hand-edit `state.json`.
