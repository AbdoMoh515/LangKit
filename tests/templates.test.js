import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeTempProject } from './helpers.js';
import { LAYOUT } from '../src/core/paths.js';

let root;

beforeEach(() => {
  root = makeTempProject();
});
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

const REQUIRED_FILES = [
  '.opencode/commands/lang-start.md',
  '.opencode/commands/lang-go.md',
  '.opencode/commands/lang-status.md',
  '.opencode/commands/lang-review.md',
  '.opencode/skills/lang/SKILL.md',
  '.opencode/skills/lang/core/orchestration.md',
  '.opencode/skills/lang/core/safety.md',
  '.opencode/skills/lang/planning/curriculum.md',
  '.opencode/skills/lang/planning/replanning.md',
  '.opencode/skills/lang/teaching/vocabulary-loop.md',
  '.opencode/skills/lang/teaching/difficulty.md',
  '.opencode/skills/lang/teaching/pronunciation.md',
  '.opencode/skills/lang/vocabulary/registry.md',
  '.opencode/skills/lang/vocabulary/anki.md',
  '.opencode/skills/lang/assessment/exercises.md',
  '.opencode/skills/lang/assessment/validation.md',
  '.opencode/skills/lang/assessment/weekly-review.md',
  '.opencode/skills/lang/assessment/phase-test.md',
  '.opencode/skills/lang/progress/state.md',
  '.opencode/skills/lang/progress/git.md'
];

test('all required opencode command and skill files are installed', () => {
  for (const rel of REQUIRED_FILES) {
    assert.ok(fs.existsSync(path.join(root, rel)), `missing installed template: ${rel}`);
  }
});

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

function flat(text) {
  return text.replace(/\s+/g, ' ');
}

test('SKILL.md carries the hard invariants and the CLI-only state rule', () => {
  const skill = flat(read('.opencode/skills/lang/SKILL.md'));
  for (const needle of [
    'Never assess mastery mainly using material the learner did not have a fair opportunity to learn',
    'Never make an exercise difficult mainly because of unrelated unknown vocabulary',
    'Never mark mastery from one isolated successful exposure',
    'Never silently delete learning history',
    'Never perform destructive git operations',
    'Never complete a phase without its phase test',
    'Never treat a git branch name as the sole source of learner progress truth',
    'Never assume a word is known without registry evidence',
    'Preserve resume capability',
    'Never hand-edit'
  ]) {
    assert.ok(skill.includes(needle), `SKILL.md missing invariant: "${needle}"`);
  }
});

test('lang-go template encodes the session flow and anki gate', () => {
  const go = read('.opencode/commands/lang-go.md');
  for (const needle of ['ANKI_GATE_REQUIRED', 'lang session complete', 'lang vocab record', 'lang csv export', 'session save', 'recognition', 'active recall', 'remediat']) {
    assert.ok(go.includes(needle), `lang-go.md missing: "${needle}"`);
  }
});

test('lang-start template gathers the required interview fields', () => {
  const start = read('.opencode/commands/lang-start.md');
  for (const needle of ['Target language', 'Daily available learning time', 'Skills of focus', 'lang profile set', 'lang plan scaffold', 'lang phase begin']) {
    assert.ok(start.includes(needle), `lang-start.md missing: "${needle}"`);
  }
});

test('phase-test skill encodes the pass policy', () => {
  const pt = read('.opencode/skills/lang/assessment/phase-test.md');
  for (const needle of ['80%', 'critical', 'at most one']) {
    assert.ok(pt.includes(needle), `phase-test.md missing: "${needle}"`);
  }
});

test('anki skill encodes minimal CSV fields and the no-verification rule', () => {
  const anki = read('.opencode/skills/lang/vocabulary/anki.md');
  assert.ok(anki.includes('Word,Translation,Sentence'));
  assert.ok(anki.includes('Never simulate or assume verification'));
});

test('git skill forbids destructive operations', () => {
  const gitDoc = read('.opencode/skills/lang/progress/git.md');
  for (const needle of ['force push', 'hard reset', 'rebase', 'never silently discard history']) {
    assert.ok(gitDoc.includes(needle), `git.md missing: "${needle}"`);
  }
});
