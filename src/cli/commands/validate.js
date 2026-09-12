import { requireProjectRoot } from '../../core/paths.js';
import { createGitAdapter } from '../../core/git.js';
import { validateProject } from '../../core/consistency.js';

export function runValidate(rest, cwd) {
  void rest;
  const root = requireProjectRoot(cwd);
  const git = createGitAdapter(root);
  const { ok, issues } = validateProject(root, git);
  if (!issues.length) {
    console.log('project state consistent');
    return;
  }
  for (const i of issues) console.log(`[${i.severity}] ${i.msg}`);
  if (!ok) process.exitCode = 2;
}
