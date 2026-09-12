import fs from 'node:fs';
import path from 'node:path';
import { LangError } from './errors.js';
import {
  LAYOUT, within, sessionsDir, sessionRecordPath, readJson, writeJson
} from './paths.js';
import { validateSessionRecord, SCHEMA_VERSION } from './schema.js';
import {
  loadState, saveState, nextSessionNumber, ankiGateRequired, markActivity,
  computeDerived, assertNoActiveSession, getPhase
} from './state.js';
import { assertProfileSet } from './profile.js';

export function emptySessionRecord(number, phaseId, date) {
  return {
    schema_version: SCHEMA_VERSION,
    number,
    phase_id: phaseId,
    date,
    status: 'active',
    summary: null,
    new_items: [],
    weak_areas: [],
    next_recommended_work: null,
    performance: [],
    anki: false
  };
}

export function loadSessionRecord(root, phaseId, number) {
  return validateSessionRecord(readJson(sessionRecordPath(root, phaseId, number)));
}

export function saveSessionRecord(root, record) {
  validateSessionRecord(record);
  const file = sessionRecordPath(root, record.phase_id, record.number);
  writeJson(file, record);
  return file;
}

export function allSessionRecords(root, state) {
  const records = [];
  for (const phase of state.phases) {
    const dir = sessionsDir(root, phase.id);
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir)) {
      if (entry.endsWith('.json') && entry.startsWith('session-')) {
        try {
          records.push(validateSessionRecord(readJson(path.join(dir, entry))));
        } catch {
          records.push(null);
        }
      }
    }
  }
  return records.filter(Boolean).sort((a, b) => a.number - b.number);
}

export function startOrResumeSession(root, { date, git }) {
  assertProfileSet(root);
  const state = loadState(root);

  if (state.current_phase && git) {
    const actual = git.currentBranch();
    if (actual !== state.current_phase.branch) {
      throw new LangError(
        `inconsistency: git is on branch "${actual}" but state says the current phase branch is "${state.current_phase.branch}". ` +
        'git is a consistency check, not the source of truth. inspect what happened, explain to the learner, and ask before any repair. ' +
        'never silently discard history. run "lang validate" for details.',
        { code: 8 }
      );
    }
  }

  if (state.current_session) {
    const record = loadSessionRecord(root, state.current_session.phase_id, state.current_session.number);
    return { resumed: true, record, state, gate: { required: false, reason: 'continuation of an existing session' } };
  }

  assertNoActiveSession(state);
  const phase = state.current_phase
    ? getPhase(state, state.current_phase.id)
    : null;
  if (!phase || phase.status !== 'active') {
    throw new LangError('no active phase. run /lang-start to create the curriculum, or "lang phase begin" to start the next phase.', { code: 5 });
  }

  if (ankiGateRequired(state, date)) {
    throw new LangError(
      'ANKI_GATE_REQUIRED: new learning day. the learner must confirm their Anki review before new learning begins. ' +
      'ask the learner, then run "lang state anki-confirm --date ' + date + '" and retry.',
      { code: 6 }
    );
  }

  const number = nextSessionNumber(state);
  const record = emptySessionRecord(number, phase.id, date);
  saveSessionRecord(root, record);
  state.current_session = { number, phase_id: phase.id, started_at: date, status: 'active' };
  markActivity(state, date);
  saveState(root, state);
  return { resumed: false, record, state, gate: { required: false, reason: 'first day or already confirmed' } };
}

function applyRecordToState(root, state, record) {
  const idx = state.completed_sessions.findIndex((s) => s.number === record.number);
  const entry = { number: record.number, phase_id: record.phase_id, date: record.date, status: record.status };
  if (idx >= 0) state.completed_sessions[idx] = entry;
  else state.completed_sessions.push(entry);
  state.current_session = null;
  markActivity(state, record.date);
  computeDerived(state, allSessionRecords(root, state));
}

export function saveSessionCheckpoint(root, { record, git }) {
  const state = loadState(root);
  if (!state.current_session || state.current_session.number !== record.number) {
    throw new LangError(`session ${record.number} is not the current session. start or resume it first`);
  }
  if (record.status === 'completed') {
    throw new LangError('use "lang session complete" to complete a session');
  }
  record.status = 'checkpoint';
  saveSessionRecord(root, record);
  state.current_session.status = 'checkpoint';
  markActivity(state, record.date);
  saveState(root, state);
  git.stageAndCommit(`checkpoint(progress): save session ${pad(record.number)}`, trackedPaths(root));
  return record;
}

export function completeSession(root, { record, git }) {
  const state = loadState(root);
  if (!state.current_session || state.current_session.number !== record.number) {
    throw new LangError(`session ${record.number} is not the current session. start or resume it first`);
  }
  record.status = 'completed';
  saveSessionRecord(root, record);
  applyRecordToState(root, state, record);
  saveState(root, state);
  git.stageAndCommit(`feat(progress): complete session ${pad(record.number)}`, trackedPaths(root));
  return record;
}

export function pad(n) {
  return String(n).padStart(2, '0');
}

export function trackedPaths(root) {
  const existing = [];
  for (const rel of [LAYOUT.learnerDir, LAYOUT.vocabularyDir, LAYOUT.phasesDir, LAYOUT.planMd, LAYOUT.readmeMd, LAYOUT.opencodeDir]) {
    if (fs.existsSync(within(root, rel))) existing.push(rel);
  }
  return existing;
}
