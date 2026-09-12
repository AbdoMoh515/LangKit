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

test('end-to-end lifecycle: init → profile → plan → phase → sessions → csv → test → merge → next', () => {
  run(['profile', 'set', '--file', writeJson(root, 'p.json', testProfile())]);
  run(['plan', 'scaffold', '--file', writeJson(root, 'plan.json', { phases: [{ slug: 'foundations', title: 'Foundations' }, { slug: 'everyday', title: 'Everyday' }] })]);
  run(['phase', 'begin', '--id', 'phase-01']);

  run(['session', 'start', '--date', '2026-09-12']);
  run(['vocab', 'add', '--file', writeJson(root, 'v.json', [
    { lemma: 'terima kasih', sense_id: 'thank-you', translation: 'thank you', language: 'id', examples: [{ sentence: 'Terima kasih banyak!', translation: 'Thank you very much!' }] }
  ]), '--session', '1', '--date', '2026-09-12']);
  run(['vocab', 'record', '--lemma', 'terima kasih', '--sense', 'thank-you', '--type', 'recall', '--success', 'true', '--date', '2026-09-12']);
  run(['csv', 'export', '--session', '1']);
  assert.ok(fs.existsSync(path.join(root, 'vocabulary', 'anki', 'session-001.csv')));

  run(['session', 'complete', '--file', writeJson(root, 's1.json', sessionRecord(1, 'phase-01', '2026-09-12', { new_items: ['it-0001'], anki: true }))]);

  run(['state', 'anki-confirm', '--date', '2026-09-13']);
  run(['session', 'start', '--date', '2026-09-13']);
  run(['session', 'complete', '--file', writeJson(root, 's2.json', sessionRecord(2, 'phase-01', '2026-09-13'))]);

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
  run(['plan', 'scaffold', '--file', writeJson(root, 'plan.json', { phases: [{ slug: 'foundations' }] })]);
  run(['phase', 'begin', '--id', 'phase-01']);
  run(['session', 'start', '--date', '2026-09-12']);
  run(['session', 'complete', '--file', writeJson(root, 's.json', sessionRecord(1, 'phase-01', '2026-09-12'))]);
  assert.throws(() => run(['session', 'start', '--date', '2026-09-13']), /ANKI_GATE_REQUIRED/);
});

test('cli rejects destructive expectations: merge without pass does nothing', () => {
  run(['profile', 'set', '--file', writeJson(root, 'p.json', testProfile())]);
  run(['plan', 'scaffold', '--file', writeJson(root, 'plan.json', { phases: [{ slug: 'foundations' }] })]);
  run(['phase', 'begin', '--id', 'phase-01']);
  const state = JSON.parse(fs.readFileSync(path.join(root, 'learner', 'state.json'), 'utf8'));
  assert.equal(state.current_phase.id, 'phase-01');
});
