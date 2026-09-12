import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeTempProjectWithPhase, writeJson, sessionRecord, phaseTestResult } from './helpers.js';
import { createGitAdapter } from '../src/core/git.js';
import { loadState, saveState } from '../src/core/state.js';
import { beginPhase, recordTestResult, mergePhase, nextPhase, evaluatePhaseTest, scaffoldPlan } from '../src/core/phase.js';
import { startOrResumeSession, completeSession } from '../src/core/session.js';

let root;
let git;

beforeEach(() => {
  root = makeTempProjectWithPhase();
  git = createGitAdapter(root);
});
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

test('phase begin creates branch from main, scaffolds phase dir, sets state', () => {
  const { phase, branch } = beginPhase(root, git, { idOrSlug: 'phase-01', date: '2026-09-12' });
  assert.equal(phase.status, 'active');
  assert.equal(branch, 'phase-01-foundations');
  assert.equal(git.currentBranch(), branch);
  assert.ok(fs.existsSync(path.join(root, 'phases', 'phase-01', 'plan.md')));
  assert.ok(fs.existsSync(path.join(root, 'phases', 'phase-01', 'test.md')));
  assert.ok(fs.existsSync(path.join(root, 'phases', 'phase-01', 'sessions')));
  const state = loadState(root);
  assert.equal(state.current_phase.branch, branch);
  assert.match(git.logOneline(1), /feat\(progress\): begin phase-01-foundations/);
});

test('phase begin requires main and rejects double activation', () => {
  beginPhase(root, git, { idOrSlug: 'phase-01', date: '2026-09-12' });
  assert.throws(() => beginPhase(root, git, { idOrSlug: 'phase-02', date: '2026-09-12' }), /already active/);
});

test('phase cannot merge before test passes (spec Â§33.6)', () => {
  beginPhase(root, git, { idOrSlug: 'phase-01', date: '2026-09-12' });
  const outcome = mergePhase(root, git, { confirm: true });
  assert.equal(outcome.merged, false);
  assert.ok(outcome.checks.some((c) => /status is "active"/.test(c.msg)));
});

test('failed test keeps phase active and records weak areas; passed test gates merge', () => {
  beginPhase(root, git, { idOrSlug: 'phase-01', date: '2026-09-12' });
  const failing = phaseTestResult({
    score: 50,
    competencies: [
      { id: 'vocab-basic', required: true, critical: false, score: 40 },
      { id: 'listening-basic', required: true, critical: true, score: 55 }
    ]
  });
  const r1 = recordTestResult(root, git, { result: failing });
  assert.equal(r1.evaluation.passed, false);
  assert.equal(r1.phase.status, 'active');
  const state1 = loadState(root);
  assert.ok(state1.derived.weak_areas.includes('vocab-basic'));

  const passing = phaseTestResult();
  const r2 = recordTestResult(root, git, { result: passing });
  assert.equal(r2.evaluation.passed, true);
  assert.equal(r2.phase.status, 'passed');
  assert.ok(fs.existsSync(path.join(root, 'phases', 'phase-01', 'test-result-02.json')));
});

test('merge dry-run does not merge; confirm merges into main and next phase starts from main', () => {
  beginPhase(root, git, { idOrSlug: 'phase-01', date: '2026-09-12' });
  recordTestResult(root, git, { result: phaseTestResult() });

  const dry = mergePhase(root, git, { confirm: false });
  assert.equal(dry.merged, false);
  assert.equal(dry.dryRun, true);
  assert.equal(git.currentBranch(), 'phase-01-foundations');

  const merged = mergePhase(root, git, { confirm: true });
  assert.equal(merged.merged, true);
  assert.equal(git.currentBranch(), 'main');
  const state = loadState(root);
  assert.equal(state.current_phase, null);
  assert.equal(state.phases.find((p) => p.id === 'phase-01').status, 'merged');
  assert.ok(git.logOneline(5).includes('merge: phase-01-foundations into main'));

  const next = nextPhase(root, git, { date: '2026-09-13' });
  assert.equal(next.branch, 'phase-02-everyday');
  assert.equal(git.currentBranch(), 'phase-02-everyday');
});

test('evaluatePhaseTest is exposed and consistent', () => {
  assert.equal(evaluatePhaseTest(phaseTestResult()).passed, true);
});

test('scaffoldPlan rejects duplicate registration', () => {
  assert.throws(
    () => scaffoldPlan(root, { phases: [{ slug: 'foundations', competencies: [{ id: 'vocab-basic', required: true, critical: false }] }] }),
    /already registered/
  );
});
