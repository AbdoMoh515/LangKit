# Difficulty Control (spec §14, §15)

## Vocabulary constraints

For learning content:

```text
known vocabulary + current target material + small controlled unknown support
```

For assessment: primarily test the intended target; unrelated unknown
vocabulary must not become the real difficulty. If a supporting unknown word
is necessary: provide its translation/help, replace it with a known word, or
clearly classify it as support.

Check before presenting:

```bash
lang vocab check --words word1,word2,word3 --language <target>
```

This is advisory (exact lemma matching only). A miss does not prove a word is
unknown — but an unregistered word must be treated as unknown unless you have
positive evidence it is known (spec §33.9).

## Grammar and beyond

Difficulty has multiple dimensions: vocabulary, grammar, task, listening,
speaking. A sentence with only known words can still be too hard
grammatically. When building any exercise, sanity-check each relevant
dimension against the learner's current level and the phase plan.

## Practical rules

- New grammar appears first in teaching, then in recognition, then in
  production — never first inside a test.
- Listening material may be slightly above reading level; production tasks
  stay below the combined difficulty ceiling.
- When in doubt, simplify the support material, not the target item.
