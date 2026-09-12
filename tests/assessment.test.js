import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluatePhaseTest, PASS_SCORE } from '../src/core/assessment.js';
import { phaseTestResult } from './helpers.js';

test('passing result: score >= 80, all required competencies ok', () => {
  const { passed, failures } = evaluatePhaseTest(phaseTestResult());
  assert.equal(passed, true);
  assert.deepEqual(failures, []);
});

test('overall score below 80 fails even with good competencies', () => {
  const { passed, failures } = evaluatePhaseTest(phaseTestResult({ score: 79 }));
  assert.equal(passed, false);
  assert.ok(failures.some((f) => /below 80/.test(f)));
});

test('critical competency failure fails the phase regardless of overall score', () => {
  const result = phaseTestResult({
    score: 95,
    competencies: [
      { id: 'vocab', required: true, critical: false, score: 95 },
      { id: 'speaking-basic', required: true, critical: true, score: 40 }
    ]
  });
  const { passed, failures } = evaluatePhaseTest(result);
  assert.equal(passed, false);
  assert.ok(failures.some((f) => /critical required competency failed: speaking-basic/.test(f)));
});

test('a high vocabulary score cannot mask two missing non-critical competencies', () => {
  const result = phaseTestResult({
    score: 90,
    competencies: [
      { id: 'vocab', required: true, critical: false, score: 100 },
      { id: 'reading', required: true, critical: false, score: 50 },
      { id: 'writing', required: true, critical: false, score: 60 }
    ]
  });
  const { passed, failures } = evaluatePhaseTest(result);
  assert.equal(passed, false);
  assert.ok(failures.some((f) => /more than one required competency/.test(f)));
});

test('exactly one non-critical required competency below threshold still passes', () => {
  const result = phaseTestResult({
    score: 84,
    competencies: [
      { id: 'vocab', required: true, critical: false, score: 95 },
      { id: 'reading', required: true, critical: false, score: 70 },
      { id: 'listening', required: true, critical: true, score: 88 }
    ]
  });
  assert.equal(evaluatePhaseTest(result).passed, true);
});

test('a test with no required competencies fails', () => {
  const result = phaseTestResult({
    score: 100,
    competencies: [{ id: 'optional-bonus', required: false, critical: false, score: 100 }]
  });
  const { passed } = evaluatePhaseTest(result);
  assert.equal(passed, false);
});

test('non-required competencies never gate the result', () => {
  const result = phaseTestResult({
    score: 85,
    competencies: [
      { id: 'vocab', required: true, critical: false, score: 90 },
      { id: 'listening', required: true, critical: true, score: 85 },
      { id: 'bonus', required: false, critical: false, score: 10 }
    ]
  });
  assert.equal(evaluatePhaseTest(result).passed, true);
});

test('pass score constant is 80 per spec', () => {
  assert.equal(PASS_SCORE, 80);
});
