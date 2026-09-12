import { parseArgs, todayOr } from '../args.js';
import { requireProjectRoot } from '../../core/paths.js';
import { confirmAnki, loadState } from '../../core/state.js';
import { createGitAdapter } from '../../core/git.js';
import { stageAndCommitState } from '../../core/commits.js';

export function runState(rest, cwd) {
  const [sub, ...restArgs] = rest;
  const opts = parseArgs(restArgs);
  const root = requireProjectRoot(cwd);
  if (sub === 'get') {
    console.log(JSON.stringify(loadState(root), null, 2));
    return;
  }
  if (sub === 'anki-confirm') {
    const date = todayOr(opts);
    confirmAnki(root, date);
    stageAndCommitState(createGitAdapter(root), root, `chore(progress): anki review confirmed ${date}`);
    console.log(`anki review confirmed for ${date}`);
    return;
  }
  throw new Error('usage: lang state get | anki-confirm [--date YYYY-MM-DD]');
}
