import { LangError } from './errors.js';

export const SCHEMA_VERSION = 1;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isStr(v) { return typeof v === 'string'; }
function isStrOrNull(v) { return v === null || typeof v === 'string'; }
function isNum(v) { return typeof v === 'number' && Number.isFinite(v); }
function isArr(v) { return Array.isArray(v); }
function isObj(v) { return v !== null && typeof v === 'object' && !Array.isArray(v); }

function check(cond, msg) {
  if (!cond) throw new LangError(`schema validation failed: ${msg}`);
}

function checkVersion(obj, label) {
  check(isObj(obj), `${label} must be a JSON object`);
  check(obj.schema_version === SCHEMA_VERSION,
    `${label} has schema_version ${JSON.stringify(obj.schema_version)}, expected ${SCHEMA_VERSION}. ` +
    'incompatible state is never silently overwritten; migrate or restore from git history');
}

function checkOnlyKeys(obj, keys, label) {
  const known = new Set(keys);
  for (const k of Object.keys(obj)) {
    check(known.has(k), `${label} has unknown key "${k}"`);
  }
}

export function validateProfile(p) {
  checkVersion(p, 'profile');
  checkOnlyKeys(p, [
    'schema_version', 'target_language', 'source_language', 'target_level',
    'source_level', 'daily_time', 'duration', 'skills', 'style_preferences',
    'goals', 'strengths', 'weaknesses'
  ], 'profile');
  check(isStr(p.target_language) && p.target_language.length > 0, 'profile.target_language must be a non-empty string');
  check(isStr(p.source_language) && p.source_language.length > 0, 'profile.source_language must be a non-empty string');
  check(isStrOrNull(p.target_level), 'profile.target_level must be a string or null');
  check(isStrOrNull(p.source_level), 'profile.source_level must be a string or null');
  check(isObj(p.daily_time), 'profile.daily_time must be an object');
  checkOnlyKeys(p.daily_time, ['mode', 'minutes'], 'profile.daily_time');
  check(['fixed', 'recommended', 'variable'].includes(p.daily_time.mode), 'profile.daily_time.mode must be fixed|recommended|variable');
  check(isNum(p.daily_time.minutes) && p.daily_time.minutes > 0, 'profile.daily_time.minutes must be a positive number');
  check(isObj(p.duration), 'profile.duration must be an object');
  checkOnlyKeys(p.duration, ['mode', 'months'], 'profile.duration');
  check(['user', 'recommended'].includes(p.duration.mode), 'profile.duration.mode must be user|recommended');
  check(isNum(p.duration.months) && p.duration.months > 0, 'profile.duration.months must be a positive number');
  check(isArr(p.skills) && p.skills.length > 0 && p.skills.every(isStr), 'profile.skills must be a non-empty array of strings');
  check(isStrOrNull(p.style_preferences), 'profile.style_preferences must be a string or null');
  check(isStrOrNull(p.goals), 'profile.goals must be a string or null');
  check(isArr(p.strengths) && p.strengths.every(isStr), 'profile.strengths must be an array of strings');
  check(isArr(p.weaknesses) && p.weaknesses.every(isStr), 'profile.weaknesses must be an array of strings');
  return p;
}

export function validateState(s) {
  checkVersion(s, 'state');
  checkOnlyKeys(s, [
    'schema_version', 'current_phase', 'current_session', 'completed_sessions',
    'phases', 'last_activity', 'last_anki_confirmed_date', 'derived'
  ], 'state');

  if (s.current_phase !== null) {
    check(isObj(s.current_phase), 'state.current_phase must be null or an object');
    checkOnlyKeys(s.current_phase, ['id', 'slug', 'branch'], 'state.current_phase');
    check(isStr(s.current_phase.id) && isStr(s.current_phase.slug) && isStr(s.current_phase.branch),
      'state.current_phase must have id/slug/branch strings');
  }
  if (s.current_session !== null) {
    check(isObj(s.current_session), 'state.current_session must be null or an object');
    checkOnlyKeys(s.current_session, ['number', 'phase_id', 'started_at', 'status'], 'state.current_session');
    check(isNum(s.current_session.number) && isStr(s.current_session.phase_id) &&
      isStr(s.current_session.started_at) && ['active', 'checkpoint'].includes(s.current_session.status),
      'state.current_session is malformed');
  }
  check(isArr(s.completed_sessions), 'state.completed_sessions must be an array');
  for (const c of s.completed_sessions) {
    check(isObj(c), 'completed_sessions entries must be objects');
    checkOnlyKeys(c, ['number', 'phase_id', 'date', 'status'], 'completed_sessions entry');
    check(isNum(c.number) && isStr(c.phase_id) && ISO_DATE.test(c.date || '') &&
      ['completed', 'checkpoint'].includes(c.status), 'completed_sessions entry is malformed');
  }
  check(isArr(s.phases), 'state.phases must be an array');
  for (const ph of s.phases) {
    check(isObj(ph), 'phases entries must be objects');
    checkOnlyKeys(ph, ['id', 'order', 'slug', 'title', 'status', 'branch', 'competencies'], 'phases entry');
    check(isStr(ph.id) && isNum(ph.order) && isStr(ph.slug) && isStr(ph.title) &&
      ['pending', 'active', 'passed', 'merged'].includes(ph.status) && isStrOrNull(ph.branch),
      'phases entry is malformed');
    if (ph.competencies !== undefined) {
      check(isArr(ph.competencies), 'phases competencies must be an array');
      for (const c of ph.competencies) {
        check(isObj(c), 'competency entries must be objects');
        checkOnlyKeys(c, ['id', 'required', 'critical'], 'competency');
        check(isStr(c.id) && c.id.length > 0 && typeof c.required === 'boolean' && typeof c.critical === 'boolean',
          'competency entries must have id/required/critical');
      }
    }
  }
  check(s.last_activity === null || ISO_DATE.test(s.last_activity), 'state.last_activity must be an ISO date or null');
  check(s.last_anki_confirmed_date === null || ISO_DATE.test(s.last_anki_confirmed_date),
    'state.last_anki_confirmed_date must be an ISO date or null');

  check(isObj(s.derived), 'state.derived must be an object');
  checkOnlyKeys(s.derived, ['weak_areas', 'next_recommended_work', 'recent_performance', 'estimated_remaining', 'computed_at'], 'state.derived');
  check(isArr(s.derived.weak_areas) && s.derived.weak_areas.every(isStr), 'derived.weak_areas must be an array of strings');
  check(isStrOrNull(s.derived.next_recommended_work), 'derived.next_recommended_work must be a string or null');
  check(isArr(s.derived.recent_performance), 'derived.recent_performance must be an array');
  check(s.derived.estimated_remaining === null || isStr(s.derived.estimated_remaining), 'derived.estimated_remaining must be a string or null');
  check(s.derived.computed_at === null || ISO_DATE.test(s.derived.computed_at), 'derived.computed_at must be an ISO date or null');
  return s;
}

export function validateRegistry(r) {
  checkVersion(r, 'registry');
  checkOnlyKeys(r, ['schema_version', 'items'], 'registry');
  check(isArr(r.items), 'registry.items must be an array');
  const seen = new Set();
  for (const item of r.items) {
    check(isObj(item), 'registry items must be objects');
    checkOnlyKeys(item, [
      'id', 'lemma', 'language', 'sense_id', 'translation', 'status',
      'introduced_on', 'introduced_session', 'exposure_days', 'success_dates',
      'successful_recalls', 'successful_usage', 'anki_exported_session', 'examples'
    ], 'registry item');
    check(isStr(item.id) && item.id.length > 0, 'item.id must be a non-empty string');
    check(isStr(item.lemma) && item.lemma.length > 0, 'item.lemma must be a non-empty string');
    check(isStr(item.language) && item.language.length > 0, 'item.language must be a non-empty string');
    check(isStr(item.sense_id) && item.sense_id.length > 0, 'item.sense_id must be a non-empty string');
    check(isStr(item.translation), 'item.translation must be a string');
    check(['new', 'learning', 'familiar', 'mastered'].includes(item.status), `item ${item.id} has invalid status`);
    check(item.introduced_on === null || ISO_DATE.test(item.introduced_on), 'item.introduced_on must be an ISO date or null');
    check(item.introduced_session === null || isNum(item.introduced_session), 'item.introduced_session must be a number or null');
    check(isArr(item.exposure_days) && item.exposure_days.every((d) => ISO_DATE.test(d)), 'item.exposure_days must be ISO dates');
    check(isArr(item.success_dates) && item.success_dates.every((d) => ISO_DATE.test(d)), 'item.success_dates must be ISO dates');
    check(isNum(item.successful_recalls) && item.successful_recalls >= 0, 'item.successful_recalls must be >= 0');
    check(isNum(item.successful_usage) && item.successful_usage >= 0, 'item.successful_usage must be >= 0');
    check(item.anki_exported_session === null || isNum(item.anki_exported_session), 'item.anki_exported_session must be a number or null');
    check(isArr(item.examples), 'item.examples must be an array');
    const key = `${item.language}::${item.lemma.toLowerCase()}::${item.sense_id}`;
    check(!seen.has(key), `duplicate lexical item in registry: ${key}`);
    seen.add(key);
  }
  return r;
}

export function validateSessionRecord(rec) {
  checkVersion(rec, 'session record');
  checkOnlyKeys(rec, [
    'schema_version', 'number', 'phase_id', 'date', 'status', 'summary',
    'new_items', 'weak_areas', 'next_recommended_work', 'performance', 'anki'
  ], 'session record');
  check(isNum(rec.number) && rec.number > 0, 'session record.number must be a positive number');
  check(isStr(rec.phase_id) && rec.phase_id.length > 0, 'session record.phase_id must be a non-empty string');
  check(ISO_DATE.test(rec.date || ''), 'session record.date must be an ISO date');
  check(['active', 'checkpoint', 'completed'].includes(rec.status), 'session record.status must be active|checkpoint|completed');
  check(isStrOrNull(rec.summary), 'session record.summary must be a string or null');
  check(isArr(rec.new_items) && rec.new_items.every(isStr), 'session record.new_items must be an array of strings');
  check(isArr(rec.weak_areas) && rec.weak_areas.every(isStr), 'session record.weak_areas must be an array of strings');
  check(isStrOrNull(rec.next_recommended_work), 'session record.next_recommended_work must be a string or null');
  check(isArr(rec.performance), 'session record.performance must be an array');
  check(typeof rec.anki === 'boolean', 'session record.anki must be a boolean');
  return rec;
}

export function validatePhaseTestResult(res) {
  check(isObj(res), 'phase test result must be a JSON object');
  checkOnlyKeys(res, ['score', 'competencies'], 'phase test result');
  check(isNum(res.score) && res.score >= 0 && res.score <= 100, 'phase test result.score must be 0..100');
  check(isArr(res.competencies), 'phase test result.competencies must be an array');
  for (const c of res.competencies) {
    check(isObj(c), 'competencies entries must be objects');
    checkOnlyKeys(c, ['id', 'required', 'critical', 'score'], 'competency');
    check(isStr(c.id) && c.id.length > 0, 'competency.id must be a non-empty string');
    check(typeof c.required === 'boolean', 'competency.required must be a boolean');
    check(typeof c.critical === 'boolean', 'competency.critical must be a boolean');
    check(isNum(c.score) && c.score >= 0 && c.score <= 100, 'competency.score must be 0..100');
  }
  return res;
}
