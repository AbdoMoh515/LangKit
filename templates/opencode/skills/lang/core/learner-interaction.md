# Learner Interaction Policy

Two binding contracts: the learner-facing language, and the teaching/testing
stage separation. Both apply to every command (`/lang-start`, `/lang-go`,
`/lang-status`, `/lang-review`), to phase tests, weekly reviews, remediation,
error feedback, and progress summaries.

## 1. Learner-facing language rule

`profile.source_language` is the authoritative learner-facing communication
language.

- Explain, instruct, test, correct, motivate, and summarize in
  `source_language`.
- The `target_language` appears naturally as the material being learned:
  target words/phrases, example sentences, exercise answer options.
- Headings, explanations, grammar notes, usage notes, test instructions,
  feedback, corrections, error explanations, motivation, progress summaries —
  all in `source_language`.
- Never use English as a fallback learner-facing language unless English is
  the learner's source language or the learner explicitly asks for English.
- The English used inside this skill, the command templates, the project
  documentation, and CLI output is developer-facing. It is NEVER permission to
  address the learner in English.
- Before producing any learner-facing content, explicitly inspect
  `learner/profile.json → source_language` (e.g. via `lang profile get`).
- Do not hard-code any particular source language; the rule is generic and
  applies automatically if the source language ever changes.

### Priority order

1. The language the learner explicitly requested in the current message.
2. `profile.source_language`.
3. If neither is available, ask the learner which language they prefer.

Never silently fall back to English.

### Example — source: Arabic, target: Indonesian

Correct:

```text
### 1. selamat pagi — صباح الخير

تُستخدم للتحية في الصباح، عادةً من الصباح وحتى حوالي العاشرة،
وتصلح في المواقف الرسمية وغير الرسمية.

🔊 اسمع النطق:
[الرابط]

**مثال:**
Selamat pagi, Pak.
صباح الخير يا أستاذ.

"Pak" كلمة احترام للرجل.
```

Incorrect (mixed English scaffolding even though translations are Arabic):

```text
New items, each with meaning, usage, pronunciation
```

or headings/instructions/test labels in English.

Test framing follows the same rule:

```text
### الاختبار الأول — اختيار من متعدد

أنت ترى جارَك في الصباح. ماذا تقول؟
```

with Indonesian material in the choices.

## 2. Teaching/testing stage contract

Teaching and testing are separate interactive stages, not sections of one
response.

```text
/lang-go
    ↓
Teaching stage — present the complete new-word set, then STOP
    ↓
learner signals readiness
    ↓
lang session stage --stage testing
    ↓
Testing stage — recognition → active recall → remediation
```

### Teaching stage output

For each item, in the learner's source language:

```text
target word / phrase
meaning in source_language
usage explanation in source_language
pronunciation instruction/link
example in target language
translation of the example in source_language
```

Finish presenting ALL selected new items. Then STOP. Do not start a test in
the same response. End with a short readiness prompt in `source_language`,
e.g. (Arabic):

```text
لما تخلص قراءة الكلمات والأمثلة وتسمع النطق، قل لي «تمام» أو «جاهز» ونبدأ الاختبار.
```

(wording adapts to the source language)

### Readiness signals

Recognize natural affirmative signals in the learner's source language —
equivalents of: okay, ready, start, finished, go, تمام, جاهز, ابدأ, خلصت.
Do not require one exact magic phrase.

### Do not advance on unrelated replies

If the learner replies with a question, correction, or clarification request
rather than readiness: answer the learner, remain in the teaching stage, and
do not begin testing until readiness is expressed.

### Batch vs single item

A learner saying "okay" after one word's explanation does not mean they are
ready for the test. The readiness signal applies to completion of the
teaching batch — unless you deliberately chose a smaller teaching unit, in
which case readiness applies to that unit.

### Stage persistence and resume

The session record carries a `stage` field owned by the CLI:

```json
{ "status": "active", "stage": "teaching" }
```

Transitions:

```text
teaching → testing → completed
teaching → checkpoint
testing  → checkpoint
```

- Mark the transition when the learner confirms readiness:
  `lang session stage --stage testing`.
- On resume (`lang session start`):
  - `stage: teaching` → continue the REMAINING teaching material; do not
    restart completed teaching.
  - `stage: testing` → continue testing directly; do not re-teach all
    vocabulary unless genuinely needed.
  - `status: checkpoint` → restore the exact saved stage and continue.
- Never infer the teaching/test boundary from the human-readable log alone;
  the machine stage is authoritative.
