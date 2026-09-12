import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { makeTempProjectWithPhase } from './helpers.js';
import { createGitAdapter, runGit } from '../src/core/git.js';
import { beginPhase } from '../src/core/phase.js';
import { crossCheck } from '../src/core/consistency.js';
import { loadState, saveState } from '../src/core/state.js';

let root;
let git;

beforeEach(() => {
  root = makeTempProjectWithPhase();
  git = createGitAdapter(root);
});
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

test('consistent project passes cross-check', () => {
  beginPhase(root, git, { idOrSlug: 'phase-01', date: '2026-09-12' });
  const { ok, issues } = crossCheck(root, git);
  assert.equal(ok, true);
  assert.deepEqual(issues, []);
});

test('hand-edited state that contradicts git is detected and explained, never auto-repaired', () => {
  beginPhase(root, git, { idOrSlug: 'phase-01', date: '2026-09-12' });
  const state = loadState(root);
  state.current_phase.branch = 'phase-99-bogus';
  saveState(root, state);
  const { ok, issues } = crossCheck(root, git);
  assert.equal(ok, false);
  assert.ok(issues.some((i) => i.severity === 'error' && /consistency check, not the source of truth/.test(i.msg)));
});

test('being on a non-main branch with no active phase is a warning, not an error', () => {
  git.createBranch('phase-02-everyday', 'main');
  git.switchBranch('phase-02-everyday');
  const { ok, issues } = crossCheck(root, git);
  assert.equal(ok, true);
  assert.ok(issues.some((i) => i.severity === 'warning' && /expected "main"/.test(i.msg)));
});

test('state referencing a nonexistent branch is flagged', () => {
  beginPhase(root, git, { idOrSlug: 'phase-01', date: '2026-09-12' });
  const state = loadState(root);
  state.phases.find((p) => p.id === 'phase-01').branch = 'phase-01-ghost';
  saveState(root, state);
  const { issues } = crossCheck(root, git);
  assert.ok(issues.some((i) => /does not exist/.test(i.msg)));
});
