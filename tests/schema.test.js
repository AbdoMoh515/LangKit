import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateProfile, validateState, validateRegistry, validateSessionRecord, validatePhaseTestResult
} from '../src/core/schema.js';
import { emptyState } from '../src/core/state.js';
import { emptyRegistry } from '../src/core/vocabulary.js';
import { testProfile, sessionRecord, phaseTestResult } from './helpers.js';

test('valid profile passes validation', () => {
  assert.equal(validateProfile(testProfile()).target_language, 'Indonesian');
});

test('profile with wrong schema_version is rejected, never silently accepted', () => {
  const p = { ...testProfile(), schema_version: 99 };
  assert.throws(() => validateProfile(p), /schema_version/);
});

test('profile with unknown key is rejected', () => {
  const p = { ...testProfile(), mystery: 1 };
  assert.throws(() => validateProfile(p), /unknown key "mystery"/);
});

test('profile with missing required field is rejected', () => {
  const p = { ...testProfile() };
  delete p.target_language;
  assert.throws(() => validateProfile(p), /target_language/);
});

test('empty state passes validation', () => {
  assert.equal(validateState(emptyState()).current_phase, null);
});

test('state rejects unknown top-level keys (derived fields must stay inside derived)', () => {
  const s = emptyState();
  s.weak_areas = ['x'];
  assert.throws(() => validateState(s), /unknown key "weak_areas"/);
});

test('state rejects malformed phase entries', () => {
  const s = emptyState();
  s.phases.push({ id: 'phase-01', order: 1, slug: 'x', title: 'x', status: 'bogus', branch: null });
  assert.throws(() => validateState(s), /malformed|invalid status/);
});

test('valid registry passes; duplicate lemma+sense is rejected', () => {
  const r = emptyRegistry();
  r.items.push({
    id: 'it-0001', lemma: 'makan', language: 'id', sense_id: 'to-eat', translation: 'eat',
    status: 'learning', introduced_on: '2026-09-12', introduced_session: 1,
    exposure_days: ['2026-09-12'], success_dates: [], successful_recalls: 0,
    successful_usage: 0, anki_exported_session: null, examples: []
  });
  validateRegistry(r);
  r.items.push({ ...r.items[0], id: 'it-0002' });
  assert.throws(() => validateRegistry(r), /duplicate lexical item/);
});

test('registry item with invalid status is rejected', () => {
  const r = emptyRegistry();
  r.items.push({
    id: 'it-0001', lemma: 'makan', language: 'id', sense_id: 'to-eat', translation: 'eat',
    status: 'legendary', introduced_on: null, introduced_session: null,
    exposure_days: [], success_dates: [], successful_recalls: 0,
    successful_usage: 0, anki_exported_session: null, examples: []
  });
  assert.throws(() => validateRegistry(r), /invalid status/);
});

test('valid session record passes; bad status rejected', () => {
  validateSessionRecord(sessionRecord(1, 'phase-01', '2026-09-12'));
  assert.throws(() => validateSessionRecord(sessionRecord(1, 'phase-01', '2026-09-12', { status: 'zapped' })));
});

test('phase test result validation', () => {
  validatePhaseTestResult(phaseTestResult());
  assert.throws(() => validatePhaseTestResult(phaseTestResult({ score: 150 })), /0\.\.100/);
  assert.throws(() => validatePhaseTestResult(phaseTestResult({ competencies: [{ id: 'x', required: 'yes', critical: false, score: 50 }] })));
});
