# Lang — OpenCode-Native Adaptive Language Learning System

## 0. Mission

Build **Lang**, an open-source, AI-driven adaptive language-learning system designed for **OpenCode first**, with an architecture that can support other agent runtimes in the future.

Lang is not an Anki clone, social platform, or generic chatbot. It is a persistent learning system that manages a learner profile, adaptive curriculum, phases/milestones, vocabulary mastery, sessions, assessment, progress, and Git-based history/recovery while delegating long-term spaced repetition to Anki.

Primary principle:

> **AI-driven + state-driven + constraint-driven + user-controlled.**

Learning effectiveness is the top priority, followed by reliability/predictability, then simplicity, then user control.

---

# 1. Product Scope

## V1 must include

- CLI bootstrapper.
- `lang init --here`.
- Git prerequisite detection.
- Creation of a new Git repository in an empty project folder.
- OpenCode-local commands and skills installed into the project.
- Learner profile.
- Adaptive curriculum planning.
- Curriculum organized into phases/milestones.
- Overall project plan.
- Detailed phase plans.
- Persistent progress state.
- Persistent vocabulary registry.
- Adaptive daily learning sessions.
- Vocabulary introduction and contextual examples.
- Listening/pronunciation guidance using a free external source where practical.
- Recognition exercises.
- Active-recall exercises.
- Remediation after errors.
- Spaced evidence of mastery across multiple days.
- Session save/resume.
- Anki CSV generation for newly learned vocabulary.
- Weekly review/assessment.
- Phase tests.
- Phase pass threshold: at least 80% plus coverage of almost all required phase competencies.
- Git session commits.
- Git phase branches.
- Phase-test-driven completion and merge to `main`.
- Basic status reporting.
- Adaptive replanning.
- Learning history preservation.
- Safety/validation rules that constrain agent behavior.

## V1 explicitly does NOT need

- Automatic Anki installation.
- Anki scheduling algorithm recreation.
- Direct integration with Tandem/HelloTalk/etc.
- Full ingestion/crawling of podcasts/books/articles.
- Multiple simultaneous target languages in one project.
- Multiple simultaneous source/explanation languages in one project.
- A database.
- Complex analytics dashboards.
- Full language-specific datasets for every language.
- Social features.
- Automatic external-resource ingestion.

Future compatibility may be considered, but V1 must stay simple.

---

# 2. Core Conceptual Model

Keep these concepts separate.

## Learner

Who the user is as a learner.

Includes:

- target language
- source/explanation language
- current target-language level
- current source-language level
- goals
- selected language skills
- learning preferences
- daily time preference
- timeline preference
- strengths
- weaknesses

## Curriculum

What the learner should learn.

Includes:

- phases
- milestones
- objectives
- competencies
- topics
- estimated effort
- exit criteria

## Learning State

What has actually happened.

Includes:

- current phase
- current session
- completed sessions
- vocabulary status
- mastery evidence
- weak areas
- recent performance
- next recommended work
- last activity

## Execution

What the agent should do right now.

Examples:

- teach
- test
- review
- remediate
- adapt
- save state
- commit session
- evaluate phase

---

# 3. Source of Truth Rules

Do NOT make Git branch names the sole source of learning truth.

Use:

- **Git branch/history** = curriculum lifecycle, version history, recovery.
- **Structured state** = current machine-readable learner/progress truth.
- **Markdown** = human-readable plans, logs, explanations, documentation.
- **Vocabulary registry** = lexical mastery and evidence.

The current phase can be inferred from the Git branch as a consistency check, but actual progress must come from persisted state.

If Git state and project state disagree:

1. Detect the inconsistency.
2. Inspect whether the user's edits destroyed or contradicted important state.
3. Explain the inconsistency.
4. Ask the user before destructive repair.
5. Never silently discard history.

---

# 4. Recommended Repository Architecture

The implementation may refine filenames, but preserve the separation of concerns.

```text
lang/
├── src/
│   └── cli/
├── templates/
│   └── opencode/
├── tests/
├── docs/
├── examples/
├── README.md
├── CONTRIBUTING.md
├── LICENSE
└── ...
```

The installed learner project should look approximately like:

```text
language-project/
├── .git/
├── .opencode/
│   ├── commands/
│   │   ├── lang-start.md
│   │   ├── lang-go.md
│   │   ├── lang-status.md
│   │   └── lang-review.md
│   └── skills/
│       └── lang/
│           ├── SKILL.md
│           ├── planning/
│           ├── teaching/
│           ├── assessment/
│           ├── vocabulary/
│           ├── progress/
│           └── core/
├── phases/
│   ├── phase-01-...
│   │   ├── plan.md
│   │   ├── test.md
│   │   └── sessions/
│   └── phase-02-...
├── learner/
│   ├── profile.md
│   └── state.json
├── vocabulary/
│   └── registry.json
├── plan.md
└── README.md
```

Do not create unnecessary files solely for appearance. Minimize complexity while retaining reliable state and human readability.

---

# 5. CLI Responsibilities

The CLI exists mainly for project/environment lifecycle, not teaching.

Required V1 commands:

```bash
lang init --here
lang status
```

Potential future/optional command:

```bash
lang doctor
lang upgrade
```

## `lang init --here`

Behavior:

1. Verify the current directory is suitable and expected to be empty/new.
2. If Git is missing:
   - explain that Git is required;
   - give clear installation instructions;
   - stop without damaging the directory.
3. If the directory already contains a conflicting project/repository, reject initialization and explain why.
4. Create a Git repository.
5. Install the OpenCode project-local commands and skills.
6. Create the initial learner/project state structure.
7. Create the initial project files.
8. Make an initial Git commit.

Do not create nested Git repositories by default.

The project should be self-contained in its own folder.

---

# 6. OpenCode Integration

V1 is OpenCode-first.

Use OpenCode-native project-local capabilities rather than inventing a parallel agent system.

Use:

- `.opencode/commands/` for slash commands.
- `.opencode/skills/` for reusable agent capabilities/instructions.
- Other OpenCode mechanisms only when genuinely necessary.

Required slash commands:

```text
/lang-start
/lang-go
/lang-status
/lang-review
```

`lang init --here` remains a CLI command.

Future runtimes should be possible by separating core concepts from OpenCode-specific templates, but do not implement multi-runtime support in V1.

---

# 7. Skill Architecture

Do not create dozens of tiny skills.

Recommended V1 capability groups:

```text
core
planning
teaching
vocabulary
assessment
progress
```

Git behavior may be implemented inside `progress`/`core` or extracted only if needed.

Responsibilities:

## core

- orchestration rules
- invariant enforcement
- session lifecycle coordination
- safe tool behavior

## planning

- initial curriculum creation
- phase planning
- adaptive replanning
- time estimation
- timeline adjustment

## teaching

- word/meaning/sense presentation
- usage examples
- controlled contexts
- pronunciation guidance
- pedagogical sequencing

## vocabulary

- lexical item tracking
- sense tracking
- mastery evidence
- known/learning/familiar/mastered states
- duplicate handling
- Anki CSV generation

## assessment

- exercises
- recognition
- active recall
- weekly reviews
- phase tests
- readiness assessment

## progress

- state loading/saving
- resume
- session logs
- consistency checks
- Git checkpoint/commit/branch/merge lifecycle

---

# 8. Initial `lang-start` Flow

The initialization conversation must gather enough information to build a useful learner model. The agent may ask additional MCQs whenever ambiguity materially affects the plan.

Core information:

1. Target language.
2. Source/explanation language.
3. Current level in target language.
4. Current level in source/explanation language.
5. Daily available learning time:
   - specific amount;
   - recommended;
   - variable.
6. Desired total learning duration:
   - user-defined;
   - AI-recommended.
7. Skills of focus:
   - selected skills;
   - all skills.
8. Learning style preferences.
9. Relevant learner goals.
10. Any additional information required to remove important ambiguity.

The agent must stop asking questions when the information is sufficient. It should not perform endless interrogation.

The source/explanation language is the normal language used to interact with the learner. The target language is teaching material, not the default conversation language, unless the system has enough evidence to progressively introduce more target-language interaction.

Current levels are not merely decorative; they constrain teaching difficulty.

---

# 9. Curriculum Generation

After `lang-start`, the agent creates:

## Overall plan

A human-readable plan listing:

- phases
- milestones
- objectives
- rough estimated effort
- dependencies where useful
- phase exit criteria

## Phase plans

Each phase should contain:

- phase objective
- target competencies
- relevant skills
- learning topics
- estimated study effort
- expected timeline
- progression criteria
- phase test definition

The plan is adaptive.

It may evolve when learning evidence shows that the current plan is too easy, too hard, too fast, or insufficient.

However:

- do not silently rewrite important milestones;
- preserve historical plans in Git;
- explain significant changes to the learner;
- preserve the learner's history.

Time estimates are estimates, not contracts.

---

# 10. CEFR Policy

CEFR (`A1`–`C2`) may be exposed to the learner as a familiar reference framework.

Internally, Lang should remain mastery/competency based rather than relying solely on CEFR labels.

Use:

```text
CEFR = human-facing/reference level
Mastery + competencies = internal learning state
```

Do not assume every language maps perfectly to CEFR descriptors.

---

# 11. Daily `/lang-go` Flow

On every `/lang-go`:

1. Load learner profile.
2. Load structured progress state.
3. Identify current phase.
4. Cross-check Git branch with stored phase state.
5. Inspect date/session history.
6. Determine whether this is a new learning day or continuation.
7. If it is a new day after the first day:
   - require the learner to confirm that they completed their Anki review before normal new learning begins.
8. Load the current phase objective.
9. Determine the available session budget.
10. Adapt session scope using:
    - available time
    - level
    - recent performance
    - mastery evidence
    - weak areas
    - progress through phase
11. Teach a small amount of new material.
12. Test it.
13. Remediate errors.
14. Update mastery evidence.
15. Generate Anki CSV for newly learned vocabulary when appropriate.
16. Save session artifact/state.
17. Commit the session to Git.
18. Provide a concise summary and next state.

Session boundaries are adaptive, not strict clock requirements.

The session ends when the intended learning/test target is adequately completed, while preserving save/resume behavior.

---

# 12. Vocabulary Teaching Loop

Default sequence:

```text
introduce
→ meaning/usage
→ pronunciation guidance
→ contextual example
→ recognition
→ active recall
→ remediation if needed
→ later spaced reassessment
```

This is a default, not an inflexible script. Adapt when learner performance requires it.

Typical new-word count should be approximately 5–10 when appropriate, but the actual number must depend on available time, level, retention, and performance rather than a hard count.

---

# 13. Lexical Model

The fundamental tracked object should be a **lexical item/sense**, not merely a raw token string.

A word may have multiple meanings/usages.

Do not force the learner to master every meaning simultaneously.

If a word has multiple senses:

- teach the sense appropriate to the current level/context;
- introduce additional senses later when useful;
- treat a meaning change as potentially meaningful new learning.

Recommended vocabulary state:

```text
new
learning
familiar
mastered
```

Store only the evidence needed for reliable mastery decisions; avoid analytics bloat.

Possible evidence fields:

- introduced_on
- exposure_days
- successful_recalls
- successful_usage
- spaced_successes
- current_status

The exact schema may be simplified during implementation if it preserves reliable decisions.

---

# 14. Known Vocabulary and Context Constraints

The system must maintain a known-vocabulary registry/history.

Definitions of "known" should be conservative.

For learning content, allowed vocabulary is:

```text
known vocabulary
+
current target material
+
small controlled amount of unknown/supporting material
```

For assessment:

- the exercise must primarily test the intended target;
- unrelated unknown vocabulary must not become the real difficulty of the test.

If a supporting unknown word is genuinely necessary:

- provide translation/help;
- or replace it with a known/control word;
- or clearly classify it as support rather than assessment target.

The agent must not assume a word is known simply because it appears plausible in conversation.

---

# 15. Difficulty Control

Difficulty has multiple dimensions:

- vocabulary difficulty
- grammar difficulty
- task difficulty
- listening difficulty
- speaking difficulty

Do not reduce language difficulty to vocabulary alone.

A sentence may contain only known words but still be too grammatically difficult.

The teaching/assessment system must validate all relevant dimensions within reasonable limits.

---

# 16. Example Sentences

For a new lexical item:

1. Present the word.
2. Present translation/meaning.
3. Explain practical usage.
4. Give pronunciation guidance.
5. Wait for learner acknowledgement when appropriate.
6. Give one strong example sentence by default.
7. Translate the sentence.
8. Add more examples only if the concept requires them.

Examples should primarily demonstrate the current target item rather than introduce a hidden vocabulary test.

---

# 17. Pronunciation

Use a free, practical pronunciation source where possible.

Google Translate may be used as a practical default instruction, but the implementation should not hard-code dependence on one service if an equivalent free source is better.

The learner should be instructed to listen to the word pronunciation before continuing when useful, but pronunciation playback is a recommendation rather than a universal blocking gate.

If a direct reliable link cannot be generated, give a concise instruction for how to hear the word.

---

# 18. Assessment Design

## Exercise types

At minimum:

### Recognition

Example:

```text
sentence with blank
meaning/context explanation
multiple choices
```

Distractors should be plausible but not unfair.

### Active recall

Prompt meaning → learner supplies target-language word.

Also target word → learner supplies meaning/translation.

Mix directions when useful.

### Usage

Optional sentence/use task to test whether the learner can use the lexical item appropriately.

### Conversation

Use only when appropriate for the learner's level and selected goals.

---

# 19. Error Handling

If the learner makes an error:

1. Identify the type of error.
2. Explain the relevant point.
3. Give another attempt.
4. If needed, defer and revisit the item later.
5. Do not blindly repeat the same question forever.

Correct once does NOT equal mastery.

Mastery requires evidence across time.

Recommended mastery principle:

```text
successful retrieval
+
appropriate usage
+
successful spaced retrieval across multiple days
→ mastered
```

The exact thresholds should be configurable and evidence-based rather than arbitrarily hard-coded.

---

# 20. Session Adaptation

The session engine must dynamically balance learning and review.

Examples:

- Very limited time → micro-session, fewer new items, preserve continuity.
- More available time → additional reinforcement and/or new material without destroying long-term pacing.
- Weak retention → increase review/remediation.
- Strong retention → slightly increase new content or challenge.
- Listening weakness → increase listening-related activities.
- Recall weakness → increase active recall.

Do not simply accelerate through the curriculum because extra time is available.

Do not force the learner to obey a rigid daily duration.

---

# 21. Anki Integration

Purpose of Anki:

> long-term spaced repetition and active recall retention.

Purpose of Lang:

> teaching, contextualization, adaptive curriculum, assessment, and mastery progression.

Do not recreate Anki's scheduler in Lang V1.

## V1 workflow

After a session containing genuinely new learned vocabulary, create a CSV artifact suitable for importing into the learner's dedicated Anki deck.

Minimum fields:

```csv
Word,Translation,Sentence
```

Do not add unnecessary metadata fields unless needed.

Create one CSV per session that actually introduces new vocabulary.

If no new vocabulary is introduced, no new CSV is required.

Duplicate handling:

- If a previously learned word appears with the same sense, do not create a duplicate Anki card solely because it appeared again in context.
- If it introduces a meaningfully different sense, it may become a new learning item/card.

Anki must remain external; V1 should not require direct API integration.

---

# 22. Daily Anki Gate

On a new learning day after the first day:

- the agent should ask the user to complete their Anki review before new learning;
- the user confirms completion;
- Lang proceeds.

V1 does not need direct Anki API verification.

Do not pretend to verify Anki completion automatically.

---

# 23. Weekly Review

Weekly review should combine:

- old vocabulary
- recently learned vocabulary
- contextual sentence usage
- recognition
- active recall
- optional short AI conversation when appropriate

The review should reveal:

- strengths
- weaknesses
- forgotten/weak items
- recommended adaptation

It should not automatically destroy or invalidate learning history.

---

# 24. Phase System

Phases are milestones.

Example lifecycle:

```text
Phase created
↓
Learning
↓
Reinforcement
↓
Periodic review
↓
Phase test
↓
PASS (>=80% + sufficient competency coverage)
↓
Phase complete
↓
Merge phase branch to main
↓
Create next phase branch from latest main
```

A phase may be extended if evidence shows a need for remediation or enrichment.

Prefer preserving the phase identity while extending its work rather than silently replacing it.

---

# 25. Phase Tests

A phase test must cover the phase's required competencies, not simply test random facts.

Minimum pass policy:

- overall score >= 80%
- nearly all required phase competencies covered adequately

Assessment should include relevant combinations of:

- vocabulary
- usage
- grammar
- listening
- reading
- writing
- speaking/conversation

Only include skills relevant to the phase and learner plan.

If the learner fails:

1. identify weak areas;
2. create remediation;
3. retest relevant weak areas;
4. preserve history.

Do not automatically repeat the entire phase if only one competency is weak.

---

# 26. Native Speaker / Real-World Transition

V1 only recommends external activities.

When the learner is ready, Lang can recommend:

- short conversations with native speakers;
- language exchange platforms;
- podcasts;
- articles;
- books;
- other level-appropriate real-world practice.

Readiness should be based on actual evidence, not merely a CEFR label.

Do not build integrations with external social platforms in V1.

External media should be recommendation-only in V1.

---

# 27. Learner Profile Memory

Persist long-term preferences such as:

- preferred explanation style
- learning preferences
- goals
- strengths
- weaknesses

The learner must be able to edit/override these preferences.

The system may remember preferences, but must not silently override explicit new user instructions.

---

# 28. Adaptive Planning Rules

Initial timeline depends on:

- current level
- target level/goal
- selected skills
- daily availability
- learning performance
- retention
- historical pace

The plan is adaptive.

If the learner falls behind:

- redistribute work;
- extend the timeline when necessary;
- avoid unrealistic cramming.

If the learner progresses faster:

- increase challenge and/or enrichment;
- do not skip mastery simply because the learner is fast.

Major plan changes should be briefly explained to the learner.

---

# 29. Git Architecture

Every learner project gets its own Git repository.

Main lifecycle:

```text
main
  ↓
phase-01-foundations
  ↓ session commit(s)
  ↓ phase test
  ↓ pass
merge → main
  ↓
phase-02-...
```

Each new phase branch is created from the latest `main`.

Keep merged phase history.

## Session commits

Commit after every session, including incomplete sessions.

The commit must represent the best valid saved checkpoint from that session.

Use a consistent readable or conventional message format. Prefer automatic standardized messages.

Example:

```text
feat(progress): complete session 04
```

or for incomplete work:

```text
checkpoint(progress): save session 04
```

## Permissions

The agent may:

- create branches;
- make commits;
- merge completed phases;
- inspect history.

The agent must not automatically perform destructive operations such as:

- force push
- hard reset that discards user work
- destructive deletion
- history rewriting

Without explicit user control.

---

# 30. Phase Merge Policy

A phase should only merge after:

1. phase test completed;
2. pass criteria satisfied;
3. project working tree is in a valid expected state;
4. completion state saved.

The default merge should require user confirmation if there is uncertainty or a conflict.

If a merge conflict occurs:

- attempt a safe resolution only when clearly mechanical and non-destructive;
- otherwise stop and request user intervention;
- never silently discard learning history.

---

# 31. State Management

Avoid a database in V1.

Prefer:

- human-readable Markdown for plans/logs;
- structured JSON/YAML for current machine state;
- Git for history.

The exact split may be optimized by implementation, but do not sacrifice recoverability.

Suggested logical state groups:

```text
learner profile
progress state
vocabulary registry
phase/session state
```

Do not duplicate the same source of truth unnecessarily.

---

# 32. Schema Versioning

V1 does not need elaborate migration infrastructure.

However, structured persistent state should carry a lightweight schema/version marker so future breaking changes can be recognized.

On incompatible future upgrades:

- preserve the original files in Git;
- detect the old schema;
- provide migration when necessary;
- never silently overwrite incompatible data.

---

# 33. Validation / Agent Guardrails

The following are hard invariants.

1. Never assess mastery mainly using material the learner did not have a fair opportunity to learn.
2. Never make an exercise difficult mainly because of unrelated unknown vocabulary.
3. Never mark mastery from one isolated successful exposure.
4. Never silently delete learning history.
5. Never perform destructive Git operations automatically.
6. Never complete a phase without its phase test.
7. Never silently violate important learner constraints during replanning.
8. Never treat a Git branch name as the sole source of learner progress truth.
9. Never assume a word is known without evidence.
10. Never let assessment drift away from the intended target competency.
11. Preserve resume capability after interrupted sessions.
12. Prefer simple, auditable behavior over unnecessary agent autonomy.

---

# 34. Content Validation

Generated teaching/assessment content should pass a validation stage before being shown whenever practical.

The validator should check:

- target item is present;
- target item has the intended meaning;
- supporting vocabulary is acceptable;
- difficulty is appropriate;
- exercise actually tests the intended skill;
- answer options are not accidentally ambiguous;
- translations are coherent;
- sentence usage is natural enough;
- no accidental answer leakage.

The architecture should support:

```text
Generator → Validator → Repair/Regenerate → Present
```

Do not assume that LLM self-confidence is sufficient.

---

# 35. Test Randomization

Assessment randomization should use a deterministic seed per session or assessment artifact when practical.

This improves reproducibility/debugging while retaining varied question ordering.

Do not treat randomization as a substitute for assessment quality.

---

# 36. User Interaction Philosophy

The agent should be:

- supportive;
- concise;
- motivating;
- clear;
- adaptive.

But correctness and learning effectiveness outrank friendliness.

If the learner asks for something that would materially damage the learning plan, explain the consequence and let the learner choose.

Example:

> “You can study 50 new words today, but that will likely reduce retention. I recommend 10–15 plus reinforcement. Continue with 50 anyway, or use the recommended load?”

Do not silently refuse reasonable user choices.

---

# 37. `/lang-status`

This is a useful V1 convenience command, though not core to teaching.

It should provide a concise overview such as:

```text
Target language: Indonesian
Current phase: 2/8
Current focus: Vocabulary + Listening
Recent mastery: ...
Current weak areas: ...
Last session: ...
Estimated phase progress: ...
```

Do not overload the output with analytics.

---

# 38. `/lang-review`

This should trigger an intentional review/assessment workflow when the learner asks for one.

It should NOT replace Anki's daily scheduling.

It may perform:

- Lang vocabulary consolidation
- weak-item review
- contextual usage review
- conversation practice
- weekly review

---

# 39. Language Extensibility

V1 must support arbitrary target/source language pairs conceptually.

Do not hard-code assumptions for English-only learning.

Architecture should allow optional language-specific configuration/skills later:

```text
universal learning engine
+
optional language-specific configuration
+
optional language-specific skills
```

Do not build profiles for every language in V1.

---

# 40. Output / Documentation Requirements

The project must ship with:

- professional README
- installation guide
- quick start
- architecture overview
- commands
- project structure
- learner workflow
- Git workflow
- Anki workflow
- contributing guide
- tests
- examples

README should be clear enough for a new open-source user to understand the project in a few minutes.

Avoid marketing fluff.

---

# 41. Testing Strategy

Use a mixture of:

## Deterministic tests

- CLI behavior
- file creation
- state schema validation
- migration handling
- Git safety rules
- CSV formatting
- command/template installation
- phase state transitions

## Prompt/behavior tests

- content generation constraints
- vocabulary-level constraints
- assessment targeting
- remediation behavior
- planner behavior

## Integration tests

- initialize project
- start learner profile
- generate plan
- run session
- save/resume
- generate CSV
- phase test
- successful merge lifecycle

The exact test framework is implementation-dependent.

---

# 42. Implementation Requirements for the Coding Agent

You are implementing this project, not merely describing it.

Before writing substantial code:

1. Inspect the repository.
2. Detect the available runtime/tooling.
3. Determine the simplest maintainable implementation language/toolchain.
4. Do not add dependencies without need.
5. Do not create abstractions that have no current use.
6. Prefer small composable modules.
7. Implement tests alongside core functionality.

When requirements are ambiguous:

- choose the simplest interpretation consistent with this specification;
- document the decision;
- do not block progress by asking unnecessary clarification questions.

Do not change the core product philosophy without explicit justification.

---

# 43. Suggested Development Order

Implement in this order unless repository constraints make another order clearly superior:

### Stage 1 — Bootstrap

- CLI package
- `lang init --here`
- Git checks
- project template installation
- initial commit

### Stage 2 — State

- learner profile
- structured progress state
- vocabulary registry
- validation

### Stage 3 — OpenCode integration

- commands
- skills
- loading/project conventions

### Stage 4 — `lang-start`

- learner interview
- MCQ follow-ups
- initial curriculum generation
- phase creation

### Stage 5 — Learning loop

- `/lang-go`
- session loading
- adaptive session planning
- teaching
- examples
- recognition
- active recall
- remediation

### Stage 6 — Persistence

- session artifacts
- progress update
- resume
- Git session commits

### Stage 7 — Anki

- CSV generation
- duplicate/sense handling

### Stage 8 — Review/assessment

- weekly review
- phase tests
- mastery/competency checks

### Stage 9 — Git phase lifecycle

- phase branches
- phase test gate
- merge
- next phase creation

### Stage 10 — Polish

- status
- docs
- tests
- error handling
- upgrade/migration hooks if justified

---

# 44. Definition of Done for V1

V1 is complete only when a clean project can do this end-to-end:

```text
install Lang
↓
lang init --here
↓
start learner profile
↓
answer adaptive MCQs
↓
receive curriculum + phases
↓
start first learning session
↓
teach new vocabulary
↓
practice context
↓
recognition test
↓
active recall
↓
remediation
↓
save progress
↓
generate Anki CSV
↓
commit session
↓
resume next day
↓
confirm Anki review
↓
continue learning
↓
weekly review
↓
phase test
↓
pass ≥80% + required competency coverage
↓
merge phase branch
↓
create next phase branch
```

A developer should be able to demonstrate this flow in tests and/or an example project.

---

# 45. Final Engineering Principle

Do not over-engineer this project.

The system should feel like:

> **a disciplined learning program operated by an adaptive AI agent**

not:

> a huge autonomous-agent framework that happens to teach languages.

Keep the core deterministic where reliability matters and adaptive where personalization creates real value.

The most important artifact is not the prompt. It is the combination of:

```text
learner state
+
curriculum state
+
vocabulary mastery evidence
+
assessment evidence
+
clear invariants
+
Git history
```

Everything else should serve those pieces.
