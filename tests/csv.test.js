import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ankiCsv, csvEscape } from '../src/core/csv.js';

test('csv has exact minimal header', () => {
  assert.ok(ankiCsv([]).startsWith('Word,Translation,Sentence\n'));
});

test('csv rows use first example sentence', () => {
  const csv = ankiCsv([
    { lemma: 'makan', translation: 'to eat', examples: [{ sentence: 'Saya makan nasi.', translation: 'I eat rice.' }] }
  ]);
  assert.equal(csv, 'Word,Translation,Sentence\nmakan,to eat,Saya makan nasi.\n');
});

test('csv escapes commas, quotes, newlines per RFC4180', () => {
  assert.equal(csvEscape('a,b'), '"a,b"');
  assert.equal(csvEscape('say "hi"'), '"say ""hi"""');
  assert.equal(csvEscape('line\nbreak'), '"line\nbreak"');
  assert.equal(csvEscape('plain'), 'plain');
});

test('empty examples produce empty sentence field', () => {
  const csv = ankiCsv([{ lemma: 'x', translation: 'y', examples: [] }]);
  assert.equal(csv, 'Word,Translation,Sentence\nx,y,\n');
});
