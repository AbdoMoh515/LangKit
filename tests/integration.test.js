import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeTempProject, writeJson, testProfile, sessionRecord, phaseTestResult } from './helpers.js';
import { main } from '../src/cli/index.js';

let root;

beforeEach(() => { root = makeTempProject(); });
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

function run(argv) {
  main(argv, root);
}

const iso = (d) => d.toISOString().slice(0, 10);
const day1 = iso(new Date(Date.now() - 86400000));
const day2 = iso(new Date(Date.now()));

test('end-to-end lifecycle: init â†’ profile â†’ plan â†’ phase â†’ sessions â†’ csv â†’ test â†’ merge â†’ next', () => {
  run(['profile', 'set', '--file', writeJson(root, 'p.json', testProfile())]);
  run(['plan', 'scaffold', '--file', writeJson(root, 'plan.json', { phases: [{ slug: 'foundations', title: 'Foundations', competencies: [{ id: 'vocab-basic', required: true, critical: false }, { id: 'listening-basic', required: true, critical: true }] }, { slug: 'everyday', title: 'Everyday', competencies: [{ id: 'everyday-core', required: true, critical: true }] }] })]);
  run(['phase', 'begin', '--id', 'phase-01']);

  run(['session', 'start', '--date', day1]);
  run(['vocab', 'add', '--file', writeJson(root, 'v.json', [
    { lemma: 'terima kasih', sense_id: 'thank-you', translation: 'thank you', language: 'id', examples: [{ sentence: 'Terima kasih banyak!', translation: 'Thank you very much!' }] }
  ]), '--session', '1', '--date', day1]);
  run(['vocab', 'record', '--lemma', 'terima kasih', '--sense', 'thank-you', '--type', 'recall', '--success', 'true', '--date', day1]);
  run(['csv', 'export', '--session', '1']);
  assert.ok(fs.existsSync(path.join(root, 'vocabulary', 'anki', 'session-001.csv')));

  run(['session', 'complete', '--file', writeJson(root, 's1.json', sessionRecord(1, 'phase-01', day1, { new_items: ['it-0001'], anki: true }))]);

  run(['state', 'anki-confirm', '--date', day2]);
  run(['session', 'start', '--date', day2]);
  run(['session', 'complete', '--file', writeJson(root, 's2.json', sessionRecord(2, 'phase-01', day2))]);

  run(['phase', 'test-result', '--file', writeJson(root, 't.json', phaseTestResult())]);
  run(['phase', 'merge', '--confirm']);
  run(['phase', 'next']);

  const state = JSON.parse(fs.readFileSync(path.join(root, 'learner', 'state.json'), 'utf8'));
  assert.equal(state.current_phase.id, 'phase-02');
  assert.equal(state.completed_sessions.length, 2);
  const merged = state.phases.find((p) => p.id === 'phase-01');
  assert.equal(merged.status, 'merged');
});

test('cli blocks session start on a new day without anki confirmation', () => {
  run(['profile', 'set', '--file', writeJson(root, 'p.json', testProfile())]);
  run(['plan', 'scaffold', '--file', writeJson(root, 'plan.json', { phases: [{ slug: 'foundations', competencies: [{ id: 'vocab-basic', required: true, critical: false }] }] })]);
  run(['phase', 'begin', '--id', 'phase-01']);
  run(['session', 'start', '--date', day1]);
  run(['session', 'complete', '--file', writeJson(root, 's.json', sessionRecord(1, 'phase-01', day1))]);
  assert.throws(() => run(['session', 'start', '--date', day2]), /ANKI_GATE_REQUIRED/);
});

test('cli rejects destructive expectations: merge without pass does nothing', () => {
  run(['profile', 'set', '--file', writeJson(root, 'p.json', testProfile())]);
  run(['plan', 'scaffold', '--file', writeJson(root, 'plan.json', { phases: [{ slug: 'foundations', competencies: [{ id: 'vocab-basic', required: true, critical: false }] }] })]);
  run(['phase', 'begin', '--id', 'phase-01']);
  const state = JSON.parse(fs.readFileSync(path.join(root, 'learner', 'state.json'), 'utf8'));
  assert.equal(state.current_phase.id, 'phase-01');
});
