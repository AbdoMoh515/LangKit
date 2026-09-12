# Vocabulary Teaching Loop (spec §12, §13, §16)

## Default sequence

```text
introduce → meaning/usage → pronunciation guidance → contextual example
→ recognition → active recall → remediation if needed → later spaced reassessment
```

This is a default, not a script. Adapt when performance requires it.

## Load

Typical new-word count ≈ 5–10 when appropriate, but the actual number depends
on available time, level, retention, and performance — never a hard count.

## Example protocol (spec §16)

For each new lexical item:

1. present the word
2. present translation/meaning
3. explain practical usage
4. give pronunciation guidance
5. wait for acknowledgement when appropriate
6. give one strong example sentence by default
7. translate the sentence
8. add more examples only if the concept requires them

Examples demonstrate the current target item; they must not smuggle in a
hidden vocabulary test.

## Senses, not tokens (spec §13)

The tracked unit is a lexical item/sense: `lemma + language + sense_id`.
A word with multiple meanings gets the sense appropriate to the current
level/context now; additional senses are introduced later as genuinely new
learning. Never force all senses at once.

## Recording

- New items → `lang vocab add --file .lang-tmp-vocab.json --session N --date D`
  (same lemma + same sense is rejected as a duplicate; same lemma + new sense
  is a new item).
- Evidence → `lang vocab record --lemma L --sense S --type recall|usage
  --success true|false --date D`, immediately after each attempt, not batched
  from memory at session end.

## Mastery (enforced by CLI, restated for honesty)

`mastered` requires: ≥3 successful recalls, ≥1 successful usage, successes
spread over ≥2 distinct days, exposure on ≥2 days. Correct once ≠ mastery.
Never tell the learner an item is mastered before the registry says so.
