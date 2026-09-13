---
description: Show a concise learner progress overview
---

Run:

```bash
lang status
```

Then briefly interpret the output for the learner (2–4 sentences max) **in
the learner's `source_language`** (see `core/learner-interaction.md`):
where they are, how the current phase is going, and the single most useful
next action. Do not dump analytics; this is an overview (spec §37).

If `lang status` reports the profile is not set, route the learner to
`/lang-start`.

If `lang validate` would report inconsistencies (e.g. git branch and stored
phase disagree), surface the inconsistency honestly and ask the user before
any repair — never repair destructively or silently.
