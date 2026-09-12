# State Files and Authority (spec §3, §31, §32)

## Files

| File | Role |
|---|---|
| `learner/profile.json` | authoritative learner model (machine) |
| `learner/profile.md` | generated human view of the profile |
| `learner/state.json` | authoritative progress state (machine) |
| `vocabulary/registry.json` | lexical mastery + evidence |
| `phases/<phase>/sessions/session-NNN.json` | session machine record |
| `phases/<phase>/sessions/session-NNN.md` | human session log (you write this) |
| `plan.md`, `phases/<phase>/plan.md`, `test.md` | human plans |

## Authority tiers

- **Authoritative**: current phase, current session, completed sessions,
  phase registry, last activity, anki confirmation date, profile, vocabulary
  status.
- **Historical evidence**: recalls, usage results, assessment results, session
  records. Evidence is append-only; never rewrite it.
- **Derived** (`state.derived`): weak areas, next recommended work, recent
  performance, estimated remaining. Recomputed by the CLI from evidence.
  Never treat a derived field as authority and never hand-edit it.

## Schema versioning (spec §32)

All JSON state carries `schema_version`. The CLI rejects unknown or
incompatible versions instead of overwriting. On a future upgrade, restore
from git history and migrate explicitly.

## State machine access

```bash
lang state get                 # dump state.json
lang status                    # human overview
lang validate                  # consistency check (state vs git vs files)
```

If `lang validate` reports a mismatch (e.g. branch vs stored phase):
1. detect (the CLI did), 2. inspect whether user edits destroyed state,
3. explain the inconsistency to the learner, 4. ask before any repair,
5. never silently discard history.

## Session record schema

```json
{
  "schema_version": 1,
  "number": 4,
  "phase_id": "phase-01",
  "date": "2026-09-12",
  "status": "active|checkpoint|completed",
  "summary": "...",
  "new_items": ["it-0001"],
  "weak_areas": ["listening-basic"],
  "next_recommended_work": "...",
  "performance": [{"type": "recognition", "score": 80}],
  "anki": true
}
```
