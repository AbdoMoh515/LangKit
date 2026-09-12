import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { initProject } from '../src/core/init.js';
import { setProfile } from '../src/core/profile.js';
import { scaffoldPlan } from '../src/core/phase.js';

export function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'lang-test-'));
}

export function makeTempProject() {
  const dir = makeTempDir();
  initProject(dir);
  return dir;
}

export function makeTempProjectWithPhase() {
  const dir = makeTempProject();
  setProfile(dir, testProfile());
  scaffoldPlan(dir, {
    phases: [
      {
        slug: 'foundations',
        title: 'Foundations',
        competencies: [
          { id: 'vocab-basic', required: true, critical: false },
          { id: 'listening-basic', required: true, critical: true }
        ]
      },
      {
        slug: 'everyday',
        title: 'Everyday',
        competencies: [{ id: 'everyday-core', required: true, critical: true }]
      }
    ]
  });
  return dir;
}

export function testProfile() {
  return {
    schema_version: 1,
    target_language: 'Indonesian',
    source_language: 'English',
    target_level: 'beginner',
    source_level: 'native',
    daily_time: { mode: 'fixed', minutes: 30 },
    duration: { mode: 'user', months: 6 },
    skills: ['vocabulary', 'listening'],
    style_preferences: 'examples first',
    goals: 'travel',
    strengths: [],
    weaknesses: ['listening']
  };
}

export function writeJson(root, name, obj) {
  const file = path.join(root, name);
  fs.writeFileSync(file, JSON.stringify(obj), 'utf8');
  return file;
}

export function sessionRecord(number, phaseId, date, overrides = {}) {
  return {
    schema_version: 1,
    number,
    phase_id: phaseId,
    date,
    status: 'completed',
    summary: 'test session',
    new_items: [],
    weak_areas: [],
    next_recommended_work: null,
    performance: [{ type: 'recognition', score: 85 }],
    anki: false,
    ...overrides
  };
}

export function phaseTestResult(overrides = {}) {
  return {
    score: 85,
    competencies: [
      { id: 'vocab-basic', required: true, critical: false, score: 90 },
      { id: 'listening-basic', required: true, critical: true, score: 82 }
    ],
    ...overrides
  };
}
