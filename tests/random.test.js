import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32, shuffle, hashSeed, sessionRng } from '../src/core/random.js';

test('mulberry32 is deterministic for the same seed', () => {
  const a = mulberry32(42);
  const b = mulberry32(42);
  const seqA = [a(), a(), a(), a()];
  const seqB = [b(), b(), b(), b()];
  assert.deepEqual(seqA, seqB);
});

test('different seeds produce different sequences', () => {
  const a = mulberry32(1);
  const b = mulberry32(2);
  assert.notEqual(a(), b());
});

test('shuffle is deterministic per seed and preserves elements', () => {
  const items = [1, 2, 3, 4, 5, 6, 7, 8];
  const s1 = shuffle(items, mulberry32(hashSeed('session-3-2026-09-12')));
  const s2 = shuffle(items, mulberry32(hashSeed('session-3-2026-09-12')));
  assert.deepEqual(s1, s2);
  assert.deepEqual([...s1].sort((x, y) => x - y), items);
});

test('sessionRng varies by session and date', () => {
  const a = sessionRng(3, '2026-09-12');
  const b = sessionRng(4, '2026-09-12');
  assert.notEqual(a(), b());
});
