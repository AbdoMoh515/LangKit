import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeTempProjectWithPhase, phaseTestResult } from './helpers.js';
import { createGitAdapter, runGit } from '../src/core/git.js';
import { beginPhase, recordTestResult, mergePhase } from '../src/core/phase.js';
import { LAYOUT } from '../src/core/paths.js';

let root;
let git;

beforeEach(() => {
  root = makeTempProjectWithPhase();
  git = createGitAdapter(root);
  // helpers scaffold via core calls (no commit); commit state so main knows the phases
  git.stageAndCommit('test: register curriculum state on main', [LAYOUT.learnerDir]);
});
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

function readState() {
  return JSON.parse(fs.readFileSync(path.join(root, LAYOUT.stateJson), 'utf8'));
}

function mainStateFile() {
  return runGit(root, ['show', 'main:learner/state.json']);
}

test('merge failure restores phase state and keeps retry path valid', () => {
  beginPhase(root, git, { idOrSlug: 'phase-01', date: '2026-09-12' });
  recordTestResult(root, git, { result: phaseTestResult() });

  // create a genuine conflict: main and the phase branch both change plan.md
  runGit(root, ['switch', 'main']);
  fs.writeFileSync(path.join(root, 'phases', 'phase-01', 'plan.md'), 'main version\n', 'utf8');
  runGit(root, ['add', '--', 'phases/phase-01/plan.md']);
  runGit(root, ['commit', '-m', 'chore(test): conflicting edit on main']);
  runGit(root, ['switch', 'phase-01-foundations']);
  fs.writeFileSync(path.join(root, 'phases', 'phase-01', 'plan.md'), 'phase version\n', 'utf8');
  runGit(root, ['add', '--', 'phases/phase-01/plan.md']);
  runGit(root, ['commit', '-m', 'chore(test): conflicting edit on phase branch']);

  assert.throws(() => mergePhase(root, git, { confirm: true }), /state was restored/);

  // 1. working-tree state.json is back to passed + active phase
  const state = readState();
  assert.equal(state.phases.find((p) => p.id === 'phase-01').status, 'passed');
  assert.equal(state.current_phase.branch, 'phase-01-foundations');

  // 2. the phase branch contains the restoration checkpoint
  const branchLog = runGit(root, ['log', '--oneline', '-n', '3']);
  assert.match(branchLog, /checkpoint\(progress\): phase phase-01 merge failed, state restored/);

  // 3. main did NOT receive the failed terminal state
  const mainState = JSON.parse(mainStateFile());
  assert.equal(mainState.phases.find((p) => p.id === 'phase-01').status, 'pending',
    'main must never see the merged-status commit from the failed attempt');
  const mainLog = runGit(root, ['log', '--oneline', '-n', '3', 'main']);
  assert.ok(!/record phase phase-01 merged/.test(mainLog), 'main must not contain the terminal-state commit');

  // retry path is intact: preconditions pass again after resolving the conflict
  runGit(root, ['switch', 'main']);
  fs.writeFileSync(path.join(root, 'phases', 'phase-01', 'plan.md'), 'resolved version\n', 'utf8');
  runGit(root, ['add', '--', 'phases/phase-01/plan.md']);
  runGit(root, ['commit', '-m', 'chore(test): resolve conflict on main']);
  runGit(root, ['switch', 'phase-01-foundations']);
  fs.writeFileSync(path.join(root, 'phases', 'phase-01', 'plan.md'), 'resolved version\n', 'utf8');
  runGit(root, ['add', '--', 'phases/phase-01/plan.md']);
  runGit(root, ['commit', '-m', 'chore(test): resolve conflict on phase branch']);

  const pre = mergePhase(root, git, { confirm: false });
  assert.equal(pre.ok !== false && pre.dryRun === true, true, 'dry run should succeed post-restore');
  const outcome = mergePhase(root, git, { confirm: true });
  assert.equal(outcome.merged, true);
  assert.equal(git.currentBranch(), 'main');
});

test('happy-path merge still lands terminal state inside the merge commit', () => {
  beginPhase(root, git, { idOrSlug: 'phase-01', date: '2026-09-12' });
  recordTestResult(root, git, { result: phaseTestResult() });
  const outcome = mergePhase(root, git, { confirm: true });
  assert.equal(outcome.merged, true);
  const mainState = JSON.parse(mainStateFile());
  assert.equal(mainState.phases.find((p) => p.id === 'phase-01').status, 'merged');
  assert.equal(mainState.current_phase, null);
});
