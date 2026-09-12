import fs from 'node:fs';
import path from 'node:path';
import { LangError } from './errors.js';

export const LAYOUT = Object.freeze({
  learnerDir: 'learner',
  profileJson: 'learner/profile.json',
  profileMd: 'learner/profile.md',
  stateJson: 'learner/state.json',
  vocabularyDir: 'vocabulary',
  registryJson: 'vocabulary/registry.json',
  ankiDir: 'vocabulary/anki',
  phasesDir: 'phases',
  planMd: 'plan.md',
  readmeMd: 'README.md',
  opencodeDir: '.opencode'
});

export const TRACKED_PATHS = Object.freeze([
  LAYOUT.learnerDir,
  LAYOUT.vocabularyDir,
  LAYOUT.phasesDir,
  LAYOUT.planMd,
  LAYOUT.readmeMd,
  LAYOUT.opencodeDir
]);

export function projectRoot(startDir = process.cwd()) {
  let dir = path.resolve(startDir);
  for (;;) {
    if (fs.existsSync(path.join(dir, LAYOUT.stateJson))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

export function requireProjectRoot(startDir = process.cwd()) {
  const root = projectRoot(startDir);
  if (!root) {
    throw new LangError('not a Lang project (no learner/state.json found). run "lang init --here" first.');
  }
  return root;
}

export function within(root, rel) {
  return path.join(root, rel);
}

export function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

export function readJson(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch (err) {
    throw new LangError(`cannot read ${file}: ${err.message}`);
  }
  try {
    return JSON.parse(raw.replace(/^\uFEFF/, ''));
  } catch (err) {
    throw new LangError(`invalid JSON in ${file}: ${err.message}`);
  }
}

export function writeJson(file, obj) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

export function phaseDir(root, phaseId) {
  return path.join(root, LAYOUT.phasesDir, phaseId);
}

export function sessionsDir(root, phaseId) {
  return path.join(phaseDir(root, phaseId), 'sessions');
}

export function sessionRecordPath(root, phaseId, number) {
  return path.join(sessionsDir(root, phaseId), `session-${String(number).padStart(3, '0')}.json`);
}
