import fs from 'node:fs';
import { requireProjectRoot, LAYOUT, within } from '../../core/paths.js';
import { createGitAdapter } from '../../core/git.js';

export function runDoctor(rest, cwd) {
  void rest;
  const root = requireProjectRoot(cwd);
  const git = createGitAdapter(root);
  const checks = [];
  checks.push({ ok: !!git.version(), msg: `git available: ${git.version() || 'NOT FOUND'}` });
  checks.push({ ok: git.isRepo(), msg: 'inside a git repository' });
  for (const rel of [LAYOUT.stateJson, LAYOUT.registryJson, LAYOUT.planMd, LAYOUT.opencodeDir]) {
    checks.push({ ok: fs.existsSync(within(root, rel)), msg: `${rel} present` });
  }
  checks.push({ ok: git.currentBranch() === 'main' || git.currentBranch().startsWith('phase-'), msg: `on expected branch: ${git.currentBranch()}` });
  let failed = 0;
  for (const c of checks) {
    if (!c.ok) failed++;
    console.log(`[${c.ok ? 'ok' : 'FAIL'}] ${c.msg}`);
  }
  if (failed) process.exitCode = 1;
}
