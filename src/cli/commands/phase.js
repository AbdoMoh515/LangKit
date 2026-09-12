import path from 'node:path';
import { parseArgs, requireOpts, todayOr, boolOpt } from '../args.js';
import { requireProjectRoot, readJson } from '../../core/paths.js';
import { createGitAdapter } from '../../core/git.js';
import { beginPhase, recordTestResult, mergePhase, nextPhase } from '../../core/phase.js';

export function runPhase(rest, cwd) {
  const [sub, ...restArgs] = rest;
  const opts = parseArgs(restArgs);
  const root = requireProjectRoot(cwd);
  const git = createGitAdapter(root);
  const date = todayOr(opts);

  if (sub === 'begin') {
    requireOpts(opts, ['id']);
    const { phase, branch } = beginPhase(root, git, { idOrSlug: opts.id, date });
    console.log(`phase ${phase.id}-${phase.slug} active on branch ${branch}`);
    return;
  }

  if (sub === 'test-result') {
    requireOpts(opts, ['file']);
    const result = readJson(opts.file);
    const { evaluation, file } = recordTestResult(root, git, { result });
    console.log(`result written: ${path.relative(root, file)}`);
    console.log(`pass: ${evaluation.passed}`);
    for (const f of evaluation.failures) console.log(`  - ${f}`);
    if (!evaluation.passed) {
      console.log('phase remains active: create remediation for weak areas, then retest.');
    }
    return;
  }

  if (sub === 'merge') {
    const confirm = boolOpt(opts, 'confirm');
    const outcome = mergePhase(root, git, { confirm });
    for (const c of outcome.checks) console.log(`[${c.ok ? 'ok' : 'NO'}] ${c.msg}`);
    if (outcome.merged) {
      console.log(`phase ${outcome.phase.id} merged into main`);
    } else if (outcome.dryRun) {
      console.log('dry run only — re-run with --confirm to merge');
      if (!outcome.checks.every((c) => c.ok)) process.exitCode = 1;
    } else {
      process.exitCode = 1;
    }
    return;
  }

  if (sub === 'next') {
    const { phase, branch } = nextPhase(root, git, { date });
    console.log(`phase ${phase.id}-${phase.slug} active on branch ${branch}`);
    return;
  }

  throw new Error('usage: lang phase begin --id phase-01 | test-result --file r.json | merge [--confirm] | next');
}
