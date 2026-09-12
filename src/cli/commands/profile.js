import { parseArgs, requireOpts } from '../args.js';
import { requireProjectRoot, readJson } from '../../core/paths.js';
import { setProfile, loadProfile, profileExists } from '../../core/profile.js';
import { createGitAdapter } from '../../core/git.js';
import { stageAndCommitState } from '../../core/commits.js';

export function runProfile(rest, cwd) {
  const [sub, ...restArgs] = rest;
  const root = requireProjectRoot(cwd);
  const git = createGitAdapter(root);
  if (sub === 'set') {
    const opts = requireOpts(parseArgs(restArgs), ['file']);
    const profile = readJson(opts.file);
    setProfile(root, profile);
    stageAndCommitState(git, root, 'feat(profile): learner profile set');
    console.log(`profile saved (${profile.target_language} from ${profile.source_language})`);
  } else if (sub === 'get') {
    if (!profileExists(root)) {
      console.log(JSON.stringify({ set: false }, null, 2));
      return;
    }
    console.log(JSON.stringify(loadProfile(root), null, 2));
  } else {
    throw new Error('usage: lang profile set --file p.json | get');
  }
}
