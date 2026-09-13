import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeTempProjectWithPhase, sessionRecord } from './helpers.js';
import { createGitAdapter } from '../src/core/git.js';
import { beginPhase } from '../src/core/phase.js';
import { loadState, saveState } from '../src/core/state.js';
import {
  startOrResumeSession, saveSessionCheckpoint, completeSession, setSessionStage, loadSessionRecord
} from '../src/core/session.js';

let root;
let git;

beforeEach(() => {
  root = makeTempProjectWithPhase();
  git = createGitAdapter(root);
  beginPhase(root, git, { idOrSlug: 'phase-01', date: '2026-09-12' });
});
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

test('new sessions start at stage teaching', () => {
  const { record } = startOrResumeSession(root, { date: '2026-09-12', git });
  assert.equal(record.stage, 'teaching');
  const state = loadState(root);
  assert.equal(state.current_session.stage, 'teaching');
});

test('stage transition teaching → testing persists and commits', () => {
  startOrResumeSession(root, { date: '2026-09-12', git });
  const record = setSessionStage(root, { stage: 'testing', git });
  assert.equal(record.stage, 'testing');
  const state = loadState(root);
  assert.equal(state.current_session.stage, 'testing');
  assert.match(git.logOneline(1), /checkpoint\(progress\): session 01 stage testing/);
  assert.equal(loadSessionRecord(root, 'phase-01', 1).stage, 'testing');
});

test('invalid stage transition testing → teaching is rejected', () => {
  startOrResumeSession(root, { date: '2026-09-12', git });
  setSessionStage(root, { stage: 'testing', git });
  assert.throws(() => setSessionStage(root, { stage: 'teaching', git }), /invalid stage transition/);
});

test('same-stage transition is a no-op', () => {
  startOrResumeSession(root, { date: '2026-09-12', git });
  assert.doesNotThrow(() => setSessionStage(root, { stage: 'teaching', git }));
  const state = loadState(root);
  assert.equal(state.current_session.stage, 'teaching');
});

test('bogus stage value is rejected', () => {
  startOrResumeSession(root, { date: '2026-09-12', git });
  assert.throws(() => setSessionStage(root, { stage: 'quizzing', git }), /stage must be/);
});

test('scenario F: checkpoint during teaching resumes at teaching', () => {
  startOrResumeSession(root, { date: '2026-09-12', git });
  saveSessionCheckpoint(root, { record: sessionRecord(1, 'phase-01', '2026-09-12', { status: 'active' }), git });
  const resumed = startOrResumeSession(root, { date: '2026-09-12', git });
  assert.equal(resumed.resumed, true);
  assert.equal(resumed.record.stage, 'teaching');
});

test('scenario F: checkpoint during testing resumes at testing', () => {
  startOrResumeSession(root, { date: '2026-09-12', git });
  setSessionStage(root, { stage: 'testing', git });
  saveSessionCheckpoint(root, { record: sessionRecord(1, 'phase-01', '2026-09-12', { status: 'active', stage: 'testing' }), git });
  const resumed = startOrResumeSession(root, { date: '2026-09-12', git });
  assert.equal(resumed.resumed, true);
  assert.equal(resumed.record.stage, 'testing');
});

test('legacy record without stage is accepted and treated as teaching on resume', () => {
  startOrResumeSession(root, { date: '2026-09-12', git });
  const rec = sessionRecord(1, 'phase-01', '2026-09-12', { status: 'active' });
  delete rec.stage;
  saveSessionCheckpoint(root, { record: rec, git });
  const resumed = startOrResumeSession(root, { date: '2026-09-12', git });
  assert.equal(resumed.record.stage, 'teaching');
});

test('completed session record keeps stage; complete requires current stage preserved', () => {
  startOrResumeSession(root, { date: '2026-09-12', git });
  setSessionStage(root, { stage: 'testing', git });
  const rec = sessionRecord(1, 'phase-01', '2026-09-12');
  delete rec.stage;
  completeSession(root, { record: rec, git });
  const state = loadState(root);
  assert.equal(state.current_session, null);
  const stored = JSON.parse(fs.readFileSync(
    path.join(root, 'phases', 'phase-01', 'sessions', 'session-001.json'), 'utf8'));
  assert.equal(stored.stage, 'testing', 'stage must survive the temp-file round trip');
});

test('stage persists across save when agent record includes it explicitly', () => {
  startOrResumeSession(root, { date: '2026-09-12', git });
  setSessionStage(root, { stage: 'testing', git });
  saveSessionCheckpoint(root, { record: sessionRecord(1, 'phase-01', '2026-09-12', { status: 'active', stage: 'testing' }), git });
  assert.equal(loadSessionRecord(root, 'phase-01', 1).stage, 'testing');
});

test('session stage rejects when no session is active', () => {
  assert.throws(() => setSessionStage(root, { stage: 'testing', git }), /no active session/);
});
