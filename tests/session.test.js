import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeTempProjectWithPhase, sessionRecord } from './helpers.js';
import { createGitAdapter } from '../src/core/git.js';
import { beginPhase } from '../src/core/phase.js';
import { loadState, saveState } from '../src/core/state.js';
import { startOrResumeSession, saveSessionCheckpoint, completeSession, allSessionRecords } from '../src/core/session.js';

let root;
let git;

beforeEach(() => {
  root = makeTempProjectWithPhase();
  git = createGitAdapter(root);
  beginPhase(root, git, { idOrSlug: 'phase-01', date: '2026-09-12' });
});
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

test('session start cross-checks git branch against stored phase state (spec §11.4)', () => {
  const state = loadState(root);
  state.current_phase.branch = 'phase-99-bogus';
  saveState(root, state);
  assert.throws(
    () => startOrResumeSession(root, { date: '2026-09-12', git }),
    /consistency check, not the source of truth/
  );
});

test('session start creates an active record and state pointer', () => {
  const { resumed, record } = startOrResumeSession(root, { date: '2026-09-12', git });
  assert.equal(resumed, false);
  assert.equal(record.number, 1);
  assert.equal(record.status, 'active');
  const state = loadState(root);
  assert.equal(state.current_session.number, 1);
  assert.ok(fs.existsSync(path.join(root, 'phases', 'phase-01', 'sessions', 'session-001.json')));
});

test('second start on the same state resumes instead of creating a new session', () => {
  startOrResumeSession(root, { date: '2026-09-12', git });
  const second = startOrResumeSession(root, { date: '2026-09-12', git });
  assert.equal(second.resumed, true);
  assert.equal(second.record.number, 1);
});

test('first day does not require the anki gate', () => {
  assert.doesNotThrow(() => startOrResumeSession(root, { date: '2026-09-12', git }));
});

test('new learning day without anki confirmation is blocked (spec §22)', () => {
  startOrResumeSession(root, { date: '2026-09-12', git });
  completeSession(root, { record: sessionRecord(1, 'phase-01', '2026-09-12'), git });
  assert.throws(
    () => startOrResumeSession(root, { date: '2026-09-13', git }),
    /ANKI_GATE_REQUIRED/
  );
});

test('anki confirmation on the new day unlocks the session', () => {
  startOrResumeSession(root, { date: '2026-09-12', git });
  completeSession(root, { record: sessionRecord(1, 'phase-01', '2026-09-12'), git });
  const state = loadState(root);
  state.last_anki_confirmed_date = '2026-09-13';
  saveState(root, state);
  const { resumed } = startOrResumeSession(root, { date: '2026-09-13', git });
  assert.equal(resumed, false);
});

test('checkpoint save keeps session resumable and commits standardized message', () => {
  startOrResumeSession(root, { date: '2026-09-12', git });
  saveSessionCheckpoint(root, { record: sessionRecord(1, 'phase-01', '2026-09-12', { status: 'active' }), git });
  assert.match(git.logOneline(1), /checkpoint\(progress\): save session 01/);
  const again = startOrResumeSession(root, { date: '2026-09-12', git });
  assert.equal(again.resumed, true);
  const state = loadState(root);
  assert.equal(state.current_session.status, 'checkpoint');
});

test('complete session commits feat message, clears current session, feeds derived state', () => {
  startOrResumeSession(root, { date: '2026-09-12', git });
  completeSession(root, {
    record: sessionRecord(1, 'phase-01', '2026-09-12', { weak_areas: ['listening-basic'], next_recommended_work: 'drill listening' }),
    git
  });
  assert.match(git.logOneline(1), /feat\(progress\): complete session 01/);
  const state = loadState(root);
  assert.equal(state.current_session, null);
  assert.equal(state.completed_sessions.length, 1);
  assert.ok(state.derived.weak_areas.includes('listening-basic'));
  assert.equal(state.derived.next_recommended_work, 'drill listening');
  assert.equal(allSessionRecords(root, state).length, 1);
});

test('complete requires the current session', () => {
  assert.throws(() => completeSession(root, { record: sessionRecord(9, 'phase-01', '2026-09-12'), git }), /not the current session/);
});

test('session numbering continues across days', () => {
  startOrResumeSession(root, { date: '2026-09-12', git });
  completeSession(root, { record: sessionRecord(1, 'phase-01', '2026-09-12'), git });
  const state = loadState(root);
  state.last_anki_confirmed_date = '2026-09-13';
  saveState(root, state);
  const second = startOrResumeSession(root, { date: '2026-09-13', git });
  assert.equal(second.record.number, 2);
});
