import { LangError } from '../../core/errors.js';
import { parseArgs } from '../args.js';
import { initProject } from '../../core/init.js';

export function runInit(rest, cwd) {
  const opts = parseArgs(rest);
  if (!opts.here) {
    throw new LangError('"lang init" must be run with --here (V1 initializes the current directory)', {
      usage: 'usage: lang init --here'
    });
  }
  const { root, branch, identitySet } = initProject(cwd);
  console.log(`Lang project initialized in ${root}`);
  console.log(`git repository created (branch: ${branch}), initial commit made.`);
  if (identitySet) {
    console.log('');
    console.log('NOTE: no git identity was configured on this machine, so a repo-local');
    console.log('placeholder identity was set for this repository only:');
    console.log('  user.name  = Lang Learner');
    console.log('  user.email = learner@lang.local');
    console.log('your commit history will show this placeholder until you replace it:');
    console.log('  git config user.name  "Your Name"');
    console.log('  git config user.email "you@example.com"');
  }
  console.log('');
  console.log('next step: open this folder in OpenCode and run /lang-start');
}
