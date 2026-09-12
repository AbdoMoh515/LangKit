import fs from 'node:fs';
import { LangError } from './errors.js';
import { LAYOUT, within, readJson, writeJson } from './paths.js';
import { validateProfile, SCHEMA_VERSION } from './schema.js';
import { loadState } from './state.js';

export function emptyProfile() {
  return {
    schema_version: SCHEMA_VERSION,
    target_language: null,
    source_language: null,
    target_level: null,
    source_level: null,
    daily_time: { mode: 'recommended', minutes: 30 },
    duration: { mode: 'recommended', months: 6 },
    skills: [],
    style_preferences: null,
    goals: null,
    strengths: [],
    weaknesses: []
  };
}

export function profilePath(root) {
  return within(root, LAYOUT.profileJson);
}

export function profileExists(root) {
  return fs.existsSync(profilePath(root));
}

export function loadProfile(root) {
  return validateProfile(readJson(profilePath(root)));
}

export function saveProfile(root, profile) {
  validateProfile(profile);
  writeJson(profilePath(root), profile);
  fs.writeFileSync(within(root, LAYOUT.profileMd), renderProfileMarkdown(profile), 'utf8');
  return profile;
}

export function renderProfileMarkdown(p) {
  const skills = p.skills.length ? p.skills.join(', ') : '(none selected)';
  const lines = [
    '# Learner Profile',
    '',
    '> Generated from `profile.json`. Edit preferences via `/lang-start` or by',
    '> asking the agent; the JSON file is the authoritative source.',
    '',
    `- **Target language:** ${p.target_language ?? '(not set)'}`,
    `- **Source/explanation language:** ${p.source_language ?? '(not set)'}`,
    `- **Target level (reference):** ${p.target_level ?? '(not set)'}`,
    `- **Source level (reference):** ${p.source_level ?? '(not set)'}`,
    `- **Daily time:** ${p.daily_time.mode}${p.daily_time.minutes ? ` (~${p.daily_time.minutes} min)` : ''}`,
    `- **Duration:** ${p.duration.mode}${p.duration.months ? ` (~${p.duration.months} months)` : ''}`,
    `- **Skills of focus:** ${skills}`,
    `- **Learning style preferences:** ${p.style_preferences ?? '(none recorded)'}`,
    `- **Goals:** ${p.goals ?? '(none recorded)'}`,
    `- **Strengths:** ${p.strengths.length ? p.strengths.join(', ') : '(none recorded)'}`,
    `- **Weaknesses:** ${p.weaknesses.length ? p.weaknesses.join(', ') : '(none recorded)'}`,
    ''
  ];
  return lines.join('\n');
}

export function setProfile(root, profileObj) {
  validateProfile(profileObj);
  const existing = profileExists(root) ? loadProfile(root) : null;
  const state = loadState(root);
  if (state.phases.length > 0 && existing) {
    if (existing.target_language !== profileObj.target_language ||
        existing.source_language !== profileObj.source_language) {
      throw new LangError(
        'refusing to change target/source language after the curriculum exists ' +
        `(registered phases: ${state.phases.length}). the existing curriculum was planned for ` +
        `"${existing.target_language}" from "${existing.source_language}". ` +
        'changing languages requires a new project or explicit replanning with the learner; ' +
        'never silently invalidate the curriculum.'
      );
    }
  }
  return saveProfile(root, profileObj);
}

export function assertProfileSet(root) {
  if (!profileExists(root)) {
    throw new LangError('learner profile is not set yet. run /lang-start first.', { code: 3 });
  }
}
