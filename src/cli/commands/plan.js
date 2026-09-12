import { parseArgs, requireOpts } from '../args.js';
import { requireProjectRoot, readJson } from '../../core/paths.js';
import { scaffoldPlan } from '../../core/phase.js';
import { createGitAdapter } from '../../core/git.js';
import { stageAndCommitState } from '../../core/commits.js';
export function runPlan(rest, cwd) {
  const [sub, ...restArgs] = rest;
  const opts = parseArgs(restArgs);
  const root = requireProjectRoot(cwd);
  if (sub !== 'scaffold') throw new Error('usage: lang plan scaffold --file plan.json');
  requireOpts(opts, ['file']);
  const plan = readJson(opts.file);
  const phases = scaffoldPlan(root, plan);
  stageAndCommitState(createGitAdapter(root), root, `feat(planning): curriculum registered (${phases.length} phases)`);
  console.log(phases.map((p) => `${p.id} ${p.slug} — ${p.title}`).join('\n'));
}
