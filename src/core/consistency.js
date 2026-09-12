import fs from 'node:fs';
import path from 'node:path';
import { LangError } from './errors.js';
import { LAYOUT, within } from './paths.js';
import { loadState, saveState } from './state.js';
import { loadRegistry } from './vocabulary.js';
import { loadProfile, profileExists } from './profile.js';

export function crossCheck(root, git) {
  const issues = [];
  let state;
  try {
    state = loadState(root);
  } catch (err) {
    issues.push({ severity: 'error', msg: `state.json invalid: ${err.message}` });
    return { ok: false, issues };
  }

  try {
    loadRegistry(root);
  } catch (err) {
    issues.push({ severity: 'error', msg: `registry.json invalid: ${err.message}` });
  }

  if (profileExists(root)) {
    try {
      loadProfile(root);
    } catch (err) {
      issues.push({ severity: 'error', msg: `profile.json invalid: ${err.message}` });
    }
  }

  const actualBranch = git.currentBranch();
  if (state.current_phase) {
    if (actualBranch !== state.current_phase.branch) {
      issues.push({
        severity: 'error',
        msg: `git branch is "${actualBranch}" but state says current phase branch is "${state.current_phase.branch}". ` +
          'git is a consistency check, not the source of truth. inspect what happened, explain to the learner, ' +
          'and ask before any repair. never silently discard history.'
      });
    }
    const dir = within(root, path.join(LAYOUT.phasesDir, state.current_phase.id));
    if (!fs.existsSync(dir)) {
      issues.push({ severity: 'error', msg: `current phase directory missing: ${state.current_phase.id}` });
    }
  } else if (actualBranch !== 'main') {
    issues.push({
      severity: 'warning',
      msg: `no active phase but git is on branch "${actualBranch}" (expected "main")`
    });
  }

  for (const phase of state.phases) {
    if (phase.branch && !git.branchExists(phase.branch)) {
      issues.push({ severity: 'warning', msg: `state references branch "${phase.branch}" which does not exist` });
    }
  }

  return { ok: issues.every((i) => i.severity !== 'error'), issues, state };
}

export function validateProject(root, git) {
  const result = crossCheck(root, git);
  if (result.ok) saveState(root, result.state);
  return result;
}
