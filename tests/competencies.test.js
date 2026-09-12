import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  makeTempProjectWithPhase, testProfile, phaseTestResult
} from './helpers.js';
import { createGitAdapter } from '../src/core/git.js';
import { beginPhase, recordTestResult, scaffoldPlan, validateResultAgainstPhase, getRegisteredPhase } from '../src/core/phase.js';
import { phaseDir } from '../src/core/paths.js';
import { loadState, saveState } from '../src/core/state.js';
import { emptyRegistry, addItem, vocabularyBudget, recordEvidence } from '../src/core/vocabulary.js';

let root;
let git;

beforeEach(() => {
  root = makeTempProjectWithPhase();
  git = createGitAdapter(root);
});
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

test('scaffoldPlan registers per-phase competency metadata', () => {
  const phases = scaffoldPlan(root, {
    phases: [{
      slug: 'extra',
      title: 'Extra',
      order: 3,
      competencies: [
        { id: 'comp-a', required: true, critical: true },
        { id: 'comp-b', required: true, critical: false }
      ]
    }]
  });
  void phases;
  const state = loadState(root);
  const phase = state.phases.find((p) => p.slug === 'extra');
  assert.equal(phase.competencies.length, 2);
  assert.equal(phase.competencies[0].critical, true);
});

test('scaffoldPlan rejects duplicate competency ids and zero-required lists', () => {
  assert.throws(
    () => scaffoldPlan(root, { phases: [{ slug: 'x1', competencies: [{ id: 'a', required: true, critical: false }, { id: 'a', required: false, critical: false }] }] }),
    /duplicate competency id/
  );
  assert.throws(
    () => scaffoldPlan(root, { phases: [{ slug: 'x2', competencies: [{ id: 'a', required: false, critical: false }] }] }),
    /at least one required/
  );
});

test('test-result rejects competencies not registered for the phase (no invented easy tests)', () => {
  scaffoldPlan(root, {
    phases: [{
      slug: 'foundations2',
      order: 3,
      title: 'Foundations 2',
      competencies: [
        { id: 'vocab-core', required: true, critical: false },
        { id: 'listening-core', required: true, critical: true }
      ]
    }]
  });
  beginPhase(root, git, { idOrSlug: 'foundations2', date: '2026-09-12' });

  const invented = phaseTestResult({
    competencies: [{ id: 'trivia-easy', required: true, critical: false, score: 100 }]
  });
  assert.throws(() => recordTestResult(root, git, { result: invented }), /not registered for phase/);

  const flagSwap = phaseTestResult({
    competencies: [{ id: 'vocab-core', required: true, critical: true, score: 90 }]
  });
  assert.throws(() => recordTestResult(root, git, { result: flagSwap }), /contradict the registered phase plan/);

  const incomplete = phaseTestResult({
    competencies: [{ id: 'vocab-core', required: true, critical: false, score: 90 }]
  });
  assert.throws(() => recordTestResult(root, git, { result: incomplete }), /missing required competencies: listening-core/);

  const complete = phaseTestResult({
    competencies: [
      { id: 'vocab-core', required: true, critical: false, score: 90 },
      { id: 'listening-core', required: true, critical: true, score: 85 }
    ]
  });
  const recorded = recordTestResult(root, git, { result: complete });
  assert.equal(recorded.evaluation.passed, true);
});

test('validateResultAgainstPhase passes through when phase has no registered competencies (backward compat)', () => {
  beginPhase(root, git, { idOrSlug: 'phase-01', date: '2026-09-12' });
  const state = loadState(root);
  const phase = state.phases.find((p) => p.id === 'phase-01');
  assert.doesNotThrow(() => validateResultAgainstPhase(phase, phaseTestResult()));
});

test('beginPhase writes competencies.json artifact when registered', () => {
  scaffoldPlan(root, {
    phases: [{
      slug: 'with-comp',
      order: 4,
      title: 'With Comp',
      competencies: [{ id: 'c1', required: true, critical: true }]
    }]
  });
  beginPhase(root, git, { idOrSlug: 'with-comp', date: '2026-09-12' });
  const state = loadState(root);
  const phase = state.phases.find((p) => p.slug === 'with-comp');
  assert.ok(fs.existsSync(phaseDir(root, phase.id) + '/competencies.json'));
});

test('golden scenario: A1 learner, known set, target item — budget classification', () => {
  const registry = emptyRegistry();
  for (const [lemma, sense, translation] of [
    ['saya', 'pronoun-i', 'I'],
    ['makan', 'to-eat', 'to eat'],
    ['rumah', 'house', 'house']
  ]) {
    addItem(root, registry, { lemma, sense_id: sense, translation, language: 'id', session: 1, date: '2026-09-12' });
    recordEvidence(root, registry, { lemma, sense_id: sense, language: 'id', type: 'recall', success: true, date: '2026-09-12' });
    recordEvidence(root, registry, { lemma, sense_id: sense, language: 'id', type: 'recall', success: true, date: '2026-09-13' });
  }
  const budget = vocabularyBudget(
    registry,
    ['saya', 'makan', 'rumah', 'nasi', 'warung'],
    'id'
  );
  assert.deepEqual(budget.knownWords, ['saya', 'makan', 'rumah']);
  assert.deepEqual(budget.unknownWords, ['nasi', 'warung']);
  assert.equal(budget.unknownCount, 2);
  assert.equal(budget.fairForAssessment, true, 'two supporting unknown words is the allowed small controlled amount');
});

test('golden scenario: too many unknown words make an exercise unfair', () => {
  const registry = emptyRegistry();
  addItem(root, registry, { lemma: 'makan', sense_id: 'to-eat', translation: 'eat', language: 'id', session: 1, date: '2026-09-12' });
  const budget = vocabularyBudget(registry, ['makan', 'pergi', 'datang', 'tidur'], 'id');
  assert.equal(budget.unknownCount, 3);
  assert.equal(budget.fairForAssessment, false);
});

test('golden scenario: assessment with target + controlled support stays fair', () => {
  const registry = emptyRegistry();
  for (const [lemma, sense] of [
    ['saya', 'pronoun-i'],
    ['makan', 'to-eat'],
    ['rumah', 'house'],
    ['nasi', 'rice']
  ]) {
    addItem(root, registry, { lemma, sense_id: sense, translation: '', language: 'id', session: 1, date: '2026-09-12' });
  }
  const budget = vocabularyBudget(registry, ['saya', 'makan', 'rumah', 'nasi'], 'id');
  assert.equal(budget.unknownCount, 0);
  assert.equal(budget.fairForAssessment, true);
  assert.ok(budget.classification['makan'] === 'learning', 'target item in learning state is assessable');
});

test('golden scenario: unseen grammar words are unknown and must not dominate difficulty', () => {
  const registry = emptyRegistry();
  addItem(root, registry, { lemma: 'makan', sense_id: 'to-eat', translation: 'eat', language: 'id', session: 1, date: '2026-09-12' });
  const budget = vocabularyBudget(registry, ['makan', 'memasak', 'dimakan', 'termakan'], 'id');
  assert.equal(budget.unknownCount, 3, 'morphological variants are unknown without lemma handling (documented limitation)');
  assert.equal(budget.fairForAssessment, false);
});

test('getRegisteredPhase helper exposes competencies for skill layer', () => {
  scaffoldPlan(root, {
    phases: [{ slug: 'meta', title: 'Meta', order: 5, competencies: [{ id: 'c1', required: true, critical: true }] }]
  });
  const phase = getRegisteredPhase(loadState(root), 'meta');
  assert.equal(phase.competencies[0].id, 'c1');
});

test('profile unchanged guard: testProfile matches schema', () => {
  const profile = testProfile();
  assert.equal(profile.schema_version, 1);
});
