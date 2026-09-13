import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeTempProject } from './helpers.js';

let root;

beforeEach(() => { root = makeTempProject(); });
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function flat(text) {
  return text.replace(/\s+/g, ' ');
}

// --- Scenario A/B: source_language authoritative, no hard-coded language ---

test('scenario A/B: SKILL.md makes source_language authoritative for all learner-facing output', () => {
  const skill = flat(read('.opencode/skills/lang/SKILL.md'));
  assert.ok(skill.includes('`profile.source_language` is the default language of ALL communication with the learner'));
  assert.ok(skill.includes('Never use English as a fallback learner-facing language unless English is the learner\'s source language'));
  assert.ok(skill.includes('Priority:'));
  assert.ok(skill.includes('(1) language the learner explicitly requested in the current message'));
  assert.ok(skill.includes('(2) `profile.source_language`'));
  assert.ok(skill.includes('inspect `learner/profile.json → source_language`'));
});

test('scenario A/B: policy doc forbids silent English fallback and hard-coding', () => {
  const policy = flat(read('.opencode/skills/lang/core/learner-interaction.md'));
  assert.ok(policy.includes('Never silently fall back to English'));
  assert.ok(policy.includes('Do not hard-code any particular source language'));
  assert.ok(policy.includes('if the source language ever changes'));
  assert.ok(policy.includes('developer-facing. It is NEVER permission'));
});

test('scenario A: Arabic appears only as example, never as a rule', () => {
  const skill = read('.opencode/skills/lang/SKILL.md');
  assert.ok(!skill.includes('Arabic'), 'SKILL.md must not hard-code Arabic');
  const policy = read('.opencode/skills/lang/core/learner-interaction.md');
  assert.ok(policy.includes('Arabic'), 'policy doc may use Arabic in examples');
  assert.ok(policy.includes('source: Arabic, target: Indonesian'), 'labeled as an example');
});

test('all four commands reference the learner-facing language rule', () => {
  for (const cmd of ['lang-start.md', 'lang-go.md', 'lang-status.md', 'lang-review.md']) {
    const text = flat(read(`.opencode/commands/${cmd}`));
    assert.ok(
      text.includes('source_language') || text.includes('learner-facing language') || text.includes('learner-interaction'),
      `${cmd} must reference the learner-facing language rule`
    );
  }
});

// --- Scenario C: teaching does not auto-start testing ---

test('scenario C: lang-go forbids test questions in the teaching response', () => {
  const go = flat(read('.opencode/commands/lang-go.md'));
  assert.ok(go.includes('STAGE 1 — Teaching only'));
  assert.ok(go.includes('Do NOT start a test in this response'));
  assert.ok(go.includes('Teaching response and first test question are never in the same response'));
  assert.ok(go.includes('STOP'));
});

test('scenario C: SKILL.md stage rule requires separate interactive stages', () => {
  const skill = flat(read('.opencode/skills/lang/SKILL.md'));
  assert.ok(skill.includes('Teaching and testing are separate interactive stages'));
  assert.ok(skill.includes('Never place a test question in the same response as the vocabulary lesson'));
});

// --- Scenario D: readiness transition ---

test('scenario D: readiness signals documented, no magic phrase required', () => {
  const go = flat(read('.opencode/commands/lang-go.md'));
  assert.ok(go.includes('lang session stage --stage testing'));
  assert.ok(go.includes('no'));
  assert.ok(go.includes('single magic phrase required'));
  const policy = flat(read('.opencode/skills/lang/core/learner-interaction.md'));
  assert.ok(policy.includes('تمام') && policy.includes('جاهز') && policy.includes('ابدأ') && policy.includes('خلصت'));
  assert.ok(policy.includes('okay') && policy.includes('ready') && policy.includes('go'));
});

test('scenario D: stage persisted before testing begins', () => {
  const go = flat(read('.opencode/commands/lang-go.md'));
  assert.match(go, /persist the transition FIRST: `lang session stage --stage testing`\. Then begin the exercise phase/);
});

// --- Scenario E: non-readiness replies ---

test('scenario E: unrelated replies keep the teaching stage', () => {
  const policy = flat(read('.opencode/skills/lang/core/learner-interaction.md'));
  assert.ok(policy.includes('If the learner replies with a question, correction, or clarification request'));
  assert.ok(policy.includes('remain in the teaching stage'));
  assert.ok(policy.includes('do not begin testing until readiness is expressed'));
  const go = flat(read('.opencode/commands/lang-go.md'));
  assert.ok(go.includes('answer it, remain in the teaching stage, do not begin testing'));
});

// --- Resume behavior ---

test('resume behavior: stage-based continuation documented', () => {
  const go = flat(read('.opencode/commands/lang-go.md'));
  assert.ok(go.includes('continue the REMAINING teaching material'));
  assert.ok(go.includes('continue the exercise phase directly'));
  assert.ok(go.includes('do not re-teach all vocabulary unless genuinely needed'));
  const stateDoc = flat(read('.opencode/skills/lang/progress/state.md'));
  assert.ok(stateDoc.includes('teaching → testing → completed'));
  assert.ok(stateDoc.includes('stage'));
});

test('batch vs single-item readiness distinction documented', () => {
  const policy = flat(read('.opencode/skills/lang/core/learner-interaction.md'));
  assert.ok(policy.includes('does not mean they are ready for the test'));
  assert.ok(policy.includes('applies to completion of the'));
});

test('teaching output example follows source-language structure', () => {
  const policy = flat(read('.opencode/skills/lang/core/learner-interaction.md'));
  assert.ok(policy.includes('target word / phrase'));
  assert.ok(policy.includes('meaning in source_language'));
  assert.ok(policy.includes('usage explanation in source_language'));
  assert.ok(policy.includes('translation of the example in source_language'));
});
