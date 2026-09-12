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
  const { root, branch } = initProject(cwd);
  console.log(`Lang project initialized in ${root}`);
  console.log(`git repository created (branch: ${branch}), initial commit made.`);
  console.log('');
  console.log('next step: open this folder in OpenCode and run /lang-start');
}
