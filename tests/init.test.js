import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeTempDir } from './helpers.js';
import { initProject } from '../src/core/init.js';
import { createGitAdapter, runGit } from '../src/core/git.js';
import { LAYOUT } from '../src/core/paths.js';

let dir;

beforeEach(() => { dir = makeTempDir(); });
afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

test('init creates full project layout, git repo, and initial commit', () => {
  const { root, branch } = initProject(dir);
  assert.equal(root, dir);
  assert.equal(branch, 'main');
  for (const rel of [
    LAYOUT.stateJson, LAYOUT.registryJson, LAYOUT.planMd, LAYOUT.readmeMd,
    LAYOUT.opencodeDir,
    'learner', 'vocabulary/anki', 'phases',
    '.opencode/commands/lang-start.md',
    '.opencode/commands/lang-go.md',
    '.opencode/commands/lang-status.md',
    '.opencode/commands/lang-review.md',
    '.opencode/skills/lang/SKILL.md'
  ]) {
    assert.ok(fs.existsSync(path.join(dir, rel)), `missing: ${rel}`);
  }
  const git = createGitAdapter(dir);
  assert.equal(git.currentBranch(), 'main');
  const log = git.logOneline(1);
  assert.match(log, /chore\(init\): initialize lang project/);
});

test('init rejects a non-empty directory without modifying it', () => {
  fs.writeFileSync(path.join(dir, 'hello.txt'), 'x');
  assert.throws(() => initProject(dir), /not empty/);
  assert.ok(fs.existsSync(path.join(dir, 'hello.txt')));
  assert.ok(!fs.existsSync(path.join(dir, LAYOUT.stateJson)));
});

test('init rejects a directory inside an existing repository', () => {
  const parent = initProject(dir);
  void parent;
  const sub = path.join(dir, 'sub');
  fs.mkdirSync(sub);
  assert.throws(() => initProject(sub), /nested|inside an existing git repository/i);
});

test('init explains missing git and stops before touching the directory', () => {
  assert.throws(
    () => initProject(dir, { gitBin: 'lang-definitely-not-git-xyz' }),
    /git is required/
  );
  assert.equal(fs.readdirSync(dir).length, 0);
});

test('init sets repo-local identity fallback only when unset and reports it', () => {
  const { identitySet } = initProject(dir);
  const git = createGitAdapter(dir);
  const name = git.run(['config', 'user.name']);
  const email = git.run(['config', 'user.email']);
  assert.ok(name.length > 0);
  assert.ok(email.length > 0);
  if (identitySet) {
    assert.equal(name, 'Lang Learner');
    assert.equal(email, 'learner@lang.local');
  }
  assert.doesNotThrow(() => runGit(dir, ['config', '--global', '--list']));
});
