import fs from 'node:fs';
import { LangError } from './errors.js';
import { LAYOUT, within, readJson, writeJson } from './paths.js';
import { validateState, SCHEMA_VERSION } from './schema.js';

export function emptyState() {
  return {
    schema_version: SCHEMA_VERSION,
    current_phase: null,
    current_session: null,
    completed_sessions: [],
    phases: [],
    last_activity: null,
    last_anki_confirmed_date: null,
    derived: {
      weak_areas: [],
      next_recommended_work: null,
      recent_performance: [],
      estimated_remaining: null,
      computed_at: null
    }
  };
}

export function statePath(root) {
  return within(root, LAYOUT.stateJson);
}

export function loadState(root) {
  return validateState(readJson(statePath(root)));
}

export function saveState(root, state) {
  validateState(state);
  writeJson(statePath(root), state);
  return state;
}

export function findPhase(state, idOrSlug) {
  return state.phases.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null;
}

export function getPhase(state, id) {
  const phase = state.phases.find((p) => p.id === id);
  if (!phase) throw new LangError(`unknown phase "${id}" in state`);
  return phase;
}

export function nextSessionNumber(state) {
  const nums = state.completed_sessions.map((s) => s.number);
  if (state.current_session) nums.push(state.current_session.number);
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

export function isSameDay(a, b) {
  return a === b;
}

export function assertNotFutureDate(date, today = new Date().toISOString().slice(0, 10)) {
  if (date > today) {
    throw new LangError(`date "${date}" is in the future (today is ${today}). confirmation dates must be real`);
  }
}

export function confirmAnki(root, date, { today } = {}) {
  assertNotFutureDate(date, today);
  const state = loadState(root);
  state.last_anki_confirmed_date = date;
  saveState(root, state);
  return state;
}

export function isNewLearningDay(state, today) {
  if (state.completed_sessions.length === 0) return false;
  return !isSameDay(state.last_activity, today);
}

export function ankiGateRequired(state, today) {
  if (!isNewLearningDay(state, today)) return false;
  return state.last_anki_confirmed_date !== today;
}

export function computeDerived(state, records) {
  const weak = new Set();
  const performance = [];
  let nextWork = null;
  for (const rec of records) {
    for (const w of rec.weak_areas || []) weak.add(w);
    for (const perf of rec.performance || []) performance.push({ session: rec.number, ...perf });
    if (rec.next_recommended_work) nextWork = rec.next_recommended_work;
  }
  state.derived.weak_areas = [...weak];
  state.derived.next_recommended_work = nextWork;
  state.derived.recent_performance = performance.slice(-10);
  state.derived.computed_at = new Date().toISOString().slice(0, 10);
  return state;
}

export function markActivity(state, date) {
  state.last_activity = date;
}

export function assertNoActiveSession(state) {
  if (state.current_session) {
    throw new LangError(
      `session ${state.current_session.number} is still ${state.current_session.status}. ` +
      'resume it with "lang session start" or complete it before starting a new one.',
      { code: 4 }
    );
  }
}
