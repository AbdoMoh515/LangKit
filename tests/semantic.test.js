import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeTempProjectWithPhase, testProfile, sessionRecord, phaseTestResult } from './helpers.js';
import { createGitAdapter } from '../src/core/git.js';
import { beginPhase, mergePhase, recordTestResult } from '../src/core/phase.js';
import { setProfile, loadProfile } from '../src/core/profile.js';
import { confirmAnki } from '../src/core/state.js';
import { emptyRegistry, addItem, recordEvidence } from '../src/core/vocabulary.js';
import { startOrResumeSession, completeSession } from '../src/core/session.js';

let root;
let git;

beforeEach(() => {
  root = makeTempProjectWithPhase();
  git = createGitAdapter(root);
});
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

test('profile set refuses language change after curriculum exists (semantic guard)', () => {
  const profile = testProfile();
  setProfile(root, profile);
  beginPhase(root, git, { idOrSlug: 'phase-01', date: '2026-09-12' });
  const swapped = { ...profile, target_language: 'Swahili' };
  assert.throws(() => setProfile(root, swapped), /refusing to change target\/source language/);
  assert.equal(loadProfile(root).target_language, 'Indonesian');
});

test('profile set allows preference edits (same languages) after curriculum exists', () => {
  const profile = testProfile();
  setProfile(root, profile);
  beginPhase(root, git, { idOrSlug: 'phase-01', date: '2026-09-12' });
  const edited = { ...profile, goals: 'work in Jakarta', daily_time: { mode: 'fixed', minutes: 45 } };
  assert.doesNotThrow(() => setProfile(root, edited));
  assert.equal(loadProfile(root).goals, 'work in Jakarta');
});

test('anki-confirm rejects future dates', () => {
  assert.throws(() => confirmAnki(root, '2099-01-01', { today: '2026-09-12' }), /in the future/);
  assert.doesNotThrow(() => confirmAnki(root, '2026-09-12', { today: '2026-09-12' }));
});

test('vocab record rejects evidence dated before introduction', () => {
  const registry = emptyRegistry();
  addItem(root, registry, { lemma: 'makan', sense_id: 'to-eat', translation: 'eat', language: 'id', session: 1, date: '2026-09-12' });
  assert.throws(
    () => recordEvidence(root, registry, { lemma: 'makan', sense_id: 'to-eat', language: 'id', type: 'recall', success: true, date: '2026-09-11' }),
    /precedes introduction date/
  );
  const item = registry.items[0];
  assert.deepEqual(item.exposure_days, ['2026-09-12']);
  assert.equal(item.successful_recalls, 0);
});

test('session complete rejects a record claiming a different phase', () => {
  beginPhase(root, git, { idOrSlug: 'phase-01', date: '2026-09-12' });
  startOrResumeSession(root, { date: '2026-09-12', git });
  const forged = { ...sessionRecord(1, 'phase-02', '2026-09-12'), phase_id: 'phase-02' };
  assert.throws(() => completeSession(root, { record: forged, git }), /refusing to record cross-phase session data/);
});

test('session checkpoint rejects a record claiming a different phase', () => {
  beginPhase(root, git, { idOrSlug: 'phase-01', date: '2026-09-12' });
  startOrResumeSession(root, { date: '2026-09-12', git });
  const forged = { ...sessionRecord(1, 'phase-01', '2026-09-12', { status: 'active' }), phase_id: 'phase-99' };
  assert.throws(() => completeSession(root, { record: forged, git }), /cross-phase/);
});

test('merge records state on the phase branch before merging; no post-merge commit', () => {
  beginPhase(root, git, { idOrSlug: 'phase-01', date: '2026-09-12' });
  recordTestResult(root, git, { result: phaseTestResult() });

  const merged = mergePhase(root, git, { confirm: true });
  assert.equal(merged.merged, true);
  assert.equal(git.currentBranch(), 'main');
  const log = git.logOneline(3).split('\n');
  assert.match(log[0], /merge: phase-01-foundations into main/, 'HEAD must be the merge commit itself');
  assert.match(log[1], /chore\(progress\): record phase phase-01 merged/, 'state change committed on the phase branch before the merge');
  const state = JSON.parse(fs.readFileSync(path.join(root, 'learner', 'state.json'), 'utf8'));
  assert.equal(state.phases.find((p) => p.id === 'phase-01').status, 'merged');
  assert.equal(state.current_phase, null);
});
