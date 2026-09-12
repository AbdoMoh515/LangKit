import { parseArgs, requireOpts, todayOr } from '../args.js';
import { requireProjectRoot, readJson } from '../../core/paths.js';
import { createGitAdapter } from '../../core/git.js';
import { startOrResumeSession, saveSessionCheckpoint, completeSession } from '../../core/session.js';

export function runSession(rest, cwd) {
  const [sub, ...restArgs] = rest;
  const opts = parseArgs(restArgs);
  const root = requireProjectRoot(cwd);
  const git = createGitAdapter(root);
  const date = todayOr(opts);

  if (sub === 'start') {
    const { resumed, record, gate } = startOrResumeSession(root, { date, git });
    if (resumed) {
      console.log(`RESUMED session ${record.number} (${record.phase_id}, ${record.date}, status was ${record.status === 'completed' ? 'completed' : record.status})`);
      console.log(`record: phases/${record.phase_id}/sessions/session-${String(record.number).padStart(3, '0')}.json`);
    } else {
      console.log(`STARTED session ${record.number} (${record.phase_id}, ${date})`);
      console.log(`record: phases/${record.phase_id}/sessions/session-${String(record.number).padStart(3, '0')}.json`);
    }
    return;
  }

  if (sub === 'save' || sub === 'complete') {
    requireOpts(opts, ['file']);
    const record = readJson(opts.file);
    if (sub === 'save') {
      saveSessionCheckpoint(root, { record, git });
      console.log(`checkpoint saved for session ${record.number}`);
    } else {
      completeSession(root, { record, git });
      console.log(`session ${record.number} completed and committed`);
    }
    return;
  }

  throw new Error('usage: lang session start | save --file r.json | complete --file r.json');
}
