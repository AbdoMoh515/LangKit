import fs from 'node:fs';
import path from 'node:path';
import { LangError } from './errors.js';
import { phaseDir, sessionsDir, within, writeJson, LAYOUT } from './paths.js';
import { loadState, saveState, getPhase, findPhase, markActivity } from './state.js';
import { evaluatePhaseTest } from './assessment.js';
import { validatePhaseTestResult } from './schema.js';

export const PHASE_PASS_SCORE = 80;

export { evaluatePhaseTest } from './assessment.js';

export function scaffoldPlan(root, { phases }) {
  const state = loadState(root);
  if (!Array.isArray(phases) || phases.length === 0) {
    throw new LangError('plan scaffold requires a non-empty "phases" array');
  }
  const existingIds = new Set(state.phases.map((p) => p.id));
  const existingSlugs = new Set(state.phases.map((p) => p.slug));
  for (let i = 0; i < phases.length; i++) {
    const entry = phases[i];
    if (!entry || typeof entry.slug !== 'string' || !entry.slug.trim()) {
      throw new LangError(`phases[${i}] must have a "slug" string`);
    }
    const competencies = validateCompetencyList(entry.competencies, `phases[${i}]`);
    const order = typeof entry.order === 'number' ? entry.order : i + 1;
    const id = `phase-${String(order).padStart(2, '0')}`;
    if (existingIds.has(id) || existingSlugs.has(entry.slug)) {
      throw new LangError(`phase "${id}" / "${entry.slug}" is already registered`);
    }
    state.phases.push({
      id,
      order,
      slug: entry.slug,
      title: typeof entry.title === 'string' ? entry.title : entry.slug,
      status: 'pending',
      branch: null,
      competencies
    });
    existingIds.add(id);
    existingSlugs.add(entry.slug);
  }
  state.phases.sort((a, b) => a.order - b.order);
  saveState(root, state);
  return state.phases;
}

export function validateCompetencyList(competencies, label) {
  if (competencies === undefined || (Array.isArray(competencies) && competencies.length === 0)) {
    throw new LangError(
      `${label}.competencies is required and must be a non-empty array of ` +
      '{id, required, critical}. competencies are what the phase test is checked ' +
      'against; without them the test could quietly become easier than the plan. ' +
      'legacy phases registered before this rule keep their no-op behavior'
    );
  }
  if (!Array.isArray(competencies)) {
    throw new LangError(`${label}.competencies must be an array`);
  }
  const seen = new Set();
  for (const c of competencies) {
    if (!c || typeof c.id !== 'string' || !c.id.trim()) {
      throw new LangError(`${label}.competencies entries must have a non-empty "id" string`);
    }
    if (typeof c.required !== 'boolean' || typeof c.critical !== 'boolean') {
      throw new LangError(`competency "${c.id}" must have boolean "required" and "critical" flags`);
    }
    if (seen.has(c.id)) {
      throw new LangError(`${label} has duplicate competency id "${c.id}"`);
    }
    seen.add(c.id);
  }
  if (!competencies.some((c) => c.required)) {
    throw new LangError(`${label}.competencies must include at least one required competency`);
  }
  return competencies.map((c) => ({ id: c.id, required: c.required, critical: c.critical }));
}

export function phaseBranchName(phase) {
  return `${phase.id}-${phase.slug}`;
}

export function beginPhase(root, git, { idOrSlug, date }) {
  const state = loadState(root);
  if (state.current_phase) {
    throw new LangError(`phase ${state.current_phase.id} is already active. finish or merge it first`);
  }
  const phase = findPhase(state, idOrSlug);
  if (!phase) throw new LangError(`unknown phase "${idOrSlug}"`);
  if (phase.status !== 'pending') {
    throw new LangError(`phase ${phase.id} has status "${phase.status}", expected "pending"`);
  }
  if (git.currentBranch() !== 'main') {
    throw new LangError(`must begin a phase from "main" (currently on "${git.currentBranch()}")`);
  }
  const branch = phaseBranchName(phase);
  git.createBranch(branch, 'main');
  git.switchBranch(branch);

  const dir = phaseDir(root, phase.id);
  fs.mkdirSync(sessionsDir(root, phase.id), { recursive: true });
  if (!fs.existsSync(path.join(dir, 'plan.md'))) {
    fs.writeFileSync(path.join(dir, 'plan.md'), phasePlanStub(phase), 'utf8');
  }
  if (!fs.existsSync(path.join(dir, 'test.md'))) {
    fs.writeFileSync(path.join(dir, 'test.md'), phaseTestStub(phase), 'utf8');
  }
  if (phase.competencies && phase.competencies.length) {
    fs.writeFileSync(path.join(dir, 'competencies.json'), JSON.stringify(phase.competencies, null, 2) + '\n', 'utf8');
  }

  phase.status = 'active';
  phase.branch = branch;
  state.current_phase = { id: phase.id, slug: phase.slug, branch };
  markActivity(state, date);
  saveState(root, state);
  git.stageAndCommit(`feat(progress): begin ${phase.id}-${phase.slug}`, [LAYOUT.phasesDir, LAYOUT.learnerDir]);
  return { phase, branch };
}

function competencyTable(phase) {
  const comps = phase.competencies || [];
  if (!comps.length) return '';
  const rows = comps.map((c) => `| ${c.id} | ${c.required ? 'yes' : 'no'} | ${c.critical ? 'yes' : 'no'} |`);
  return [
    '| Competency | Required | Critical |',
    '|---|---|---|',
    ...rows,
    ''
  ].join('\n');
}

function phasePlanStub(phase) {
  return [
    `# Phase Plan — ${phase.id}: ${phase.title}`,
    '',
    '> Written by the agent during planning. This file is the human-readable',
    '> phase plan; machine state lives in learner/state.json.',
    '',
    '## Objective',
    '',
    '(to be filled by /lang-start planning)',
    '',
    '## Target competencies',
    '',
    competencyTable(phase),
    '## Learning topics',
    '',
    '## Estimated effort and timeline',
    '',
    '## Progression criteria',
    '',
    '## Phase test definition',
    ''
  ].join('\n');
}

function phaseTestStub(phase) {
  return [
    `# Phase Test — ${phase.id}: ${phase.title}`,
    '',
    '> Written by the agent during planning. The test must cover the required',
    '> phase competencies. Pass policy: overall >= 80%, every required',
    '> competency assessed, no critical competency failed, at most one',
    '> required non-critical competency below threshold.',
    '> Only competencies registered for this phase may be assessed.',
    '',
    '## Required competencies',
    '',
    competencyTable(phase),
    '## Sections',
    ''
  ].join('\n');
}

export function getRegisteredPhase(state, idOrSlug) {
  return findPhase(state, idOrSlug);
}

export function validateResultAgainstPhase(phase, result) {
  const registered = phase.competencies || [];
  if (!registered.length) return;
  const registeredById = new Map(registered.map((c) => [c.id, c]));
  for (const c of result.competencies) {
    if (!registeredById.has(c.id)) {
      throw new LangError(
        `competency "${c.id}" is not registered for ${phase.id}. ` +
        'the phase test may only assess competencies from the registered phase plan ' +
        '(registered: ' + registered.map((r) => r.id).join(', ') + '). ' +
        'if the curriculum changed, replan and update the phase registration first — ' +
        'never invent an easier test'
      );
    }
    const reg = registeredById.get(c.id);
    if (c.required !== reg.required || c.critical !== reg.critical) {
      throw new LangError(
        `competency "${c.id}" flags (required=${c.required}, critical=${c.critical}) contradict the ` +
        `registered phase plan (required=${reg.required}, critical=${reg.critical}). ` +
        'flags come from the phase plan, not from the test author'
      );
    }
  }
  const missing = registered.filter((r) => r.required && !result.competencies.some((c) => c.id === r.id));
  if (missing.length) {
    throw new LangError(
      `phase test result is missing required competencies: ${missing.map((m) => m.id).join(', ')}. ` +
      'every required competency must be assessed'
    );
  }
}

export function nextTestResultPath(root, phaseId) {
  const dir = phaseDir(root, phaseId);
  let n = 1;
  while (fs.existsSync(path.join(dir, `test-result-${String(n).padStart(2, '0')}.json`))) n++;
  return path.join(dir, `test-result-${String(n).padStart(2, '0')}.json`);
}

export function recordTestResult(root, git, { result }) {
  validatePhaseTestResult(result);
  const state = loadState(root);
  if (!state.current_phase) throw new LangError('no active phase to record a test result for');
  const phase = getPhase(state, state.current_phase.id);
  if (!['active', 'passed'].includes(phase.status)) {
    throw new LangError(`phase ${phase.id} has status "${phase.status}"; a test can only be recorded for an active phase`);
  }
  validateResultAgainstPhase(phase, result);
  const evaluation = evaluatePhaseTest(result);
  const file = nextTestResultPath(root, phase.id);
  writeJson(file, { ...result, evaluation, recorded_at: new Date().toISOString() });

  if (evaluation.passed) {
    phase.status = 'passed';
    saveState(root, state);
    git.stageAndCommit(`feat(progress): phase ${phase.id} test passed`, [LAYOUT.phasesDir, LAYOUT.learnerDir]);
  } else {
    const weak = new Set(state.derived.weak_areas);
    for (const f of evaluation.failures) weak.add(f);
    for (const c of result.competencies) {
      if (c.required && c.score < PHASE_PASS_SCORE) weak.add(c.id);
    }
    state.derived.weak_areas = [...weak];
    state.derived.computed_at = new Date().toISOString().slice(0, 10);
    saveState(root, state);
    git.stageAndCommit(`checkpoint(progress): phase ${phase.id} test failed`, [LAYOUT.phasesDir, LAYOUT.learnerDir]);
  }
  return { evaluation, file, phase };
}

export function checkMergePreconditions(root, git) {
  const state = loadState(root);
  const checks = [];
  if (!state.current_phase) {
    checks.push({ ok: false, msg: 'no active phase' });
    return { ok: false, checks, state };
  }
  const phase = getPhase(state, state.current_phase.id);
  checks.push({ ok: phase.status === 'passed', msg: `phase status is "${phase.status}" (needs "passed")` });
  const onBranch = git.currentBranch() === state.current_phase.branch;
  checks.push({ ok: onBranch, msg: onBranch ? `on phase branch "${state.current_phase.branch}"` : `not on the phase branch (on "${git.currentBranch()}")` });
  const clean = git.projectPathsClean([LAYOUT.phasesDir, LAYOUT.learnerDir, LAYOUT.vocabularyDir, LAYOUT.planMd, LAYOUT.readmeMd, LAYOUT.opencodeDir].filter((p) => fs.existsSync(within(root, p))));
  checks.push({ ok: clean, msg: clean ? 'project paths clean' : 'project paths have uncommitted changes (commit or remove them first)' });
  return { ok: checks.every((c) => c.ok), checks, state, phase };
}

export function mergePhase(root, git, { confirm }) {
  const { ok, checks, state, phase } = checkMergePreconditions(root, git);
  if (!ok) {
    return { merged: false, dryRun: !confirm, checks };
  }
  if (!confirm) {
    return { merged: false, dryRun: true, checks };
  }

  const preMergeStateJson = JSON.stringify(state, null, 2) + '\n';
  const stateFile = within(root, LAYOUT.stateJson);

  try {
    phase.status = 'merged';
    state.current_phase = null;
    saveState(root, state);
    git.stageAndCommit(`chore(progress): record phase ${phase.id} merged`, [LAYOUT.learnerDir]);
    git.switchBranch('main');
    git.mergeNoFastForward(phase.branch, `merge: ${phase.branch} into main`);
  } catch (err) {
    try {
      git.run(['merge', '--abort']);
    } catch {
      /* nothing to abort */
    }
    try {
      git.switchBranch(phase.branch);
      fs.writeFileSync(stateFile, preMergeStateJson, 'utf8');
      git.stageAndCommit(
        `checkpoint(progress): phase ${phase.id} merge failed, state restored`,
        [LAYOUT.learnerDir]
      );
    } catch (restoreErr) {
      throw new LangError(
        'phase merge failed AND automatic state restoration failed. ' +
        'do NOT hand-edit state files; ask the user to inspect git history. ' +
        `original merge error: ${err.message}. restoration error: ${restoreErr.message}`,
        { code: 9 }
      );
    }
    throw new LangError(
      `phase merge failed (possible conflict). the merge was aborted and the phase state was ` +
      `restored on branch "${phase.branch}" (status "passed", phase still active) — ` +
      'the phase can be retried once the conflict is resolved with the user. ' +
      'nothing was lost and no history was rewritten: ' + err.message,
      { code: 7 }
    );
  }
  return { merged: true, dryRun: false, checks, phase };
}

export function nextPhase(root, git, { date }) {
  const state = loadState(root);
  if (state.current_phase) {
    throw new LangError(`phase ${state.current_phase.id} is still active`);
  }
  const pending = state.phases
    .filter((p) => p.status === 'pending')
    .sort((a, b) => a.order - b.order);
  if (!pending.length) throw new LangError('no pending phases remain. use /lang-start replanning to extend the curriculum');
  return beginPhase(root, git, { idOrSlug: pending[0].id, date });
}
