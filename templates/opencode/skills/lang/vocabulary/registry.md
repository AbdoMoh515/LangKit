# Vocabulary Registry (spec §13, §14)

`vocabulary/registry.json` is the lexical source of truth. Access it via the
CLI only.

## Item shape

```json
{
  "id": "it-0001",
  "lemma": "makan",
  "language": "id",
  "sense_id": "to-eat",
  "translation": "to eat",
  "status": "learning",
  "introduced_on": "2026-09-12",
  "introduced_session": 3,
  "exposure_days": ["2026-09-12"],
  "success_dates": [],
  "successful_recalls": 0,
  "successful_usage": 0,
  "anki_exported_session": null,
  "examples": [{"sentence": "...", "translation": "..."}]
}
```

## States

```text
new → learning → familiar → mastered
```

`new` means **registered but not yet actively taught** (reserved for future
import of known vocabulary). Items introduced through a teaching session
start directly at `learning` — being taught is what moves an item out of
`new`.

`mastered` requires (enforced by CLI, not configurable): ≥3 successful
recalls, ≥1 successful usage, successes on ≥2 distinct days, exposure on
≥2 days. `familiar` requires ≥1 successful recall and ≥2 exposure days.

## Commands

```bash
lang vocab add --file items.json --session N --date YYYY-MM-DD
lang vocab record --lemma L --sense S --type recall|usage --success true|false --date YYYY-MM-DD
lang vocab list
lang vocab check --words a,b,c [--language xx]
lang vocab counts
```

## Duplicate / sense handling

- Same lemma + same sense → rejected as duplicate. Re-encountering it in
  context is practice, not a new card.
- Same lemma + meaningfully different sense → add as a new item; treat it as
  potentially meaningful new learning.
- Definitions of "known" are conservative: only `familiar`/`mastered` counts
  as known for content-planning purposes.
