import fs from 'node:fs';
import path from 'node:path';
import { TRACKED_PATHS } from './paths.js';

export function stageAndCommitState(git, root, message) {
  const existing = TRACKED_PATHS.filter((p) => fs.existsSync(path.join(root, p)));
  git.stageAndCommit(message, existing);
}
