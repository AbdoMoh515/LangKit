import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { makeTempProject } from './helpers.js';
import {
  emptyRegistry, addItem, findItem, recordEvidence, computeStatus,
  classifyWord, pendingAnkiItems, markAnkiExported, MASTERY_RULES
} from '../src/core/vocabulary.js';

let root;
let registry;

beforeEach(() => {
  root = makeTempProject();
  registry = emptyRegistry();
});
afterEach(() => { fs.rmSync(root, { recursive: true, force: true }); });

function add(lemma, sense, translation = '') {
  return addItem(root, registry, { lemma, sense_id: sense, translation, language: 'id', session: 1, date: '2026-09-12' });
}

test('add registers an item as learning with introduction evidence', () => {
  const item = add('makan', 'to-eat', 'to eat');
  assert.equal(item.status, 'learning');
  assert.equal(item.introduced_on, '2026-09-12');
  assert.deepEqual(item.exposure_days, ['2026-09-12']);
});

test('same lemma + same sense is a duplicate and rejected', () => {
  add('makan', 'to-eat');
  assert.throws(() => add('makan', 'to-eat'), /duplicate lexical item/);
});

test('same lemma + different sense is a new item', () => {
  add('makan', 'to-eat');
  const second = add('makan', 'meal-noun');
  assert.notEqual(second.id, findItem(registry, 'makan', 'to-eat', 'id').id);
});

test('single successful exposure never yields mastery (multi-day invariant)', () => {
  const item = add('makan', 'to-eat');
  for (let i = 0; i < MASTERY_RULES.MIN_SUCCESSFUL_RECALLS; i++) {
    recordEvidence(root, registry, { lemma: 'makan', sense_id: 'to-eat', language: 'id', type: 'recall', success: true, date: '2026-09-12' });
  }
  recordEvidence(root, registry, { lemma: 'makan', sense_id: 'to-eat', language: 'id', type: 'usage', success: true, date: '2026-09-12' });
  assert.equal(item.successful_recalls, MASTERY_RULES.MIN_SUCCESSFUL_RECALLS);
  assert.equal(item.successful_usage, 1);
  assert.notEqual(computeStatus(item), 'mastered');
  assert.equal(item.status, 'learning');
});

test('mastery requires spaced successes across multiple days', () => {
  const item = add('makan', 'to-eat');
  for (let i = 0; i < MASTERY_RULES.MIN_SUCCESSFUL_RECALLS; i++) {
    recordEvidence(root, registry, { lemma: 'makan', sense_id: 'to-eat', language: 'id', type: 'recall', success: true, date: '2026-09-12' });
  }
  recordEvidence(root, registry, { lemma: 'makan', sense_id: 'to-eat', language: 'id', type: 'usage', success: true, date: '2026-09-12' });
  recordEvidence(root, registry, { lemma: 'makan', sense_id: 'to-eat', language: 'id', type: 'recall', success: true, date: '2026-09-13' });
  assert.equal(computeStatus(item), 'mastered');
});

test('familiar requires a successful recall and two exposure days', () => {
  const item = add('makan', 'to-eat');
  recordEvidence(root, registry, { lemma: 'makan', sense_id: 'to-eat', language: 'id', type: 'recall', success: true, date: '2026-09-12' });
  assert.equal(item.status, 'learning');
  recordEvidence(root, registry, { lemma: 'makan', sense_id: 'to-eat', language: 'id', type: 'recall', success: true, date: '2026-09-13' });
  assert.equal(item.status, 'familiar');
});

test('failed attempts add exposure but not success evidence', () => {
  const item = add('makan', 'to-eat');
  recordEvidence(root, registry, { lemma: 'makan', sense_id: 'to-eat', language: 'id', type: 'recall', success: false, date: '2026-09-12' });
  assert.equal(item.successful_recalls, 0);
  assert.deepEqual(item.success_dates, []);
  assert.deepEqual(item.exposure_days, ['2026-09-12']);
});

test('recordEvidence rejects unknown items and bad types', () => {
  assert.throws(() => recordEvidence(root, registry, { lemma: 'x', sense_id: 'y', language: 'id', type: 'recall', success: true, date: '2026-09-12' }), /unknown lexical item/);
  add('makan', 'to-eat');
  assert.throws(() => recordEvidence(root, registry, { lemma: 'makan', sense_id: 'to-eat', language: 'id', type: 'nap', success: true, date: '2026-09-12' }), /recall.*usage/);
});

test('classifyWord is conservative: only familiar/mastered count as known', () => {
  add('makan', 'to-eat');
  assert.equal(classifyWord(registry, 'makan', 'id'), 'learning');
  assert.equal(classifyWord(registry, 'minum', 'id'), 'unknown');
  recordEvidence(root, registry, { lemma: 'makan', sense_id: 'to-eat', language: 'id', type: 'recall', success: true, date: '2026-09-12' });
  recordEvidence(root, registry, { lemma: 'makan', sense_id: 'to-eat', language: 'id', type: 'recall', success: true, date: '2026-09-13' });
  assert.equal(classifyWord(registry, 'makan', 'id'), 'known');
  assert.equal(classifyWord(registry, 'MAKAN', 'id'), 'known');
});

test('anki export selection: only unexported items of the session', () => {
  add('makan', 'to-eat');
  add('minum', 'to-drink');
  let pending = pendingAnkiItems(registry, 1);
  assert.equal(pending.length, 2);
  markAnkiExported(root, registry, pending, 1);
  pending = pendingAnkiItems(registry, 1);
  assert.equal(pending.length, 0);
});
