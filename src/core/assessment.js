import { LangError } from './errors.js';

export const PASS_SCORE = 80;

export function evaluatePhaseTest(result) {
  const failures = [];
  if (typeof result.score !== 'number' || Number.isNaN(result.score)) {
    throw new LangError('phase test result.score must be a number');
  }
  if (result.score < PASS_SCORE) {
    failures.push(`overall score ${result.score} is below ${PASS_SCORE}`);
  }
  const competencies = result.competencies || [];
  const required = competencies.filter((c) => c.required);
  if (!required.length) {
    failures.push('no required competencies were assessed');
  }
  const failedRequired = required.filter((c) => c.score < PASS_SCORE);
  const failedCritical = failedRequired.filter((c) => c.critical);
  if (failedCritical.length) {
    failures.push(`critical required competency failed: ${failedCritical.map((c) => c.id).join(', ')}`);
  }
  const failedNonCritical = failedRequired.filter((c) => !c.critical);
  if (failedNonCritical.length > 1) {
    failures.push(`more than one required competency below threshold: ${failedNonCritical.map((c) => c.id).join(', ')}`);
  }
  return { passed: failures.length === 0, failures };
}
