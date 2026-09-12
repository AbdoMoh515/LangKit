import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { runGit, createGitAdapter } from '../src/core/git.js';
import { makeTempDir } from './helpers.js';

test('destructive git operations are blocked', () => {
  const blocked = [
    ['push', 'origin', 'main'],
    ['reset', '--hard', 'HEAD~1'],
    ['reset'],
    ['clean', '-fd'],
    ['rebase', 'main'],
    ['filter-branch', '--all'],
    ['branch', '-D', 'phase-01'],
    ['branch', '--delete', 'phase-01'],
    ['commit', '--amend'],
    ['commit', '--amend', '--no-edit'],
    ['merge', '--force', 'main'],
    ['cherry-pick', 'abc']
  ];
  for (const args of blocked) {
    assert.throws(() => runGit('.', args), /not allowed|blocked/, `should block: ${args.join(' ')}`);
  }
});

test('non-allowlisted subcommands are blocked', () => {
  assert.throws(() => runGit('.', ['foobar']), /not allowed/);
});

test('allowlisted operations work against a real repo', () => {
  const dir = makeTempDir();
  try {
    const git = createGitAdapter(dir);
    git.init();
    assert.equal(git.currentBranch(), 'main');
    fs.writeFileSync(path.join(dir, 'a.txt'), 'hi');
    git.stageAndCommit('test: first', ['a.txt']);
    assert.match(git.logOneline(1), /test: first/);
    git.createBranch('phase-01-test', 'main');
    git.switchBranch('phase-01-test');
    assert.equal(git.currentBranch(), 'phase-01-test');
    assert.ok(git.branchExists('phase-01-test'));
    git.switchBranch('main');
    git.mergeNoFastForward('phase-01-test', 'merge: phase-01-test into main');
    assert.ok(git.workingTreeClean());
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('failed git commands raise LangError with stderr context', () => {
  const dir = makeTempDir();
  try {
    assert.throws(() => runGit(dir, ['status']), /git status failed/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
