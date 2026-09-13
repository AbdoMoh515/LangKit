import { parseArgs, requireOpts, todayOr } from '../args.js';
import { requireProjectRoot, readJson } from '../../core/paths.js';
import { createGitAdapter } from '../../core/git.js';
import { startOrResumeSession, saveSessionCheckpoint, completeSession, setSessionStage } from '../../core/session.js';

export function runSession(rest, cwd) {
  const [sub, ...restArgs] = rest;
  const opts = parseArgs(restArgs);
  const root = requireProjectRoot(cwd);
  const git = createGitAdapter(root);
  const date = todayOr(opts);

  if (sub === 'start') {
    const { resumed, record, gate } = startOrResumeSession(root, { date, git });
    if (resumed) {
      console.log(`RESUMED session ${record.number} (${record.phase_id}, ${record.date}, status was ${record.status === 'completed' ? 'completed' : record.status}, stage ${record.stage || 'teaching'})`);
      if (record.stage === 'testing') {
        console.log('STAGE: testing — continue the exercise phase; do not re-teach completed material unless needed.');
      } else {
        console.log('STAGE: teaching — continue the remaining teaching material; do not start testing until teaching is complete and the learner confirms readiness.');
      }
    } else {
      console.log(`STARTED session ${record.number} (${record.phase_id}, ${date})`);
      console.log('STAGE: teaching — present the new material first, then STOP and wait for the learner\'s readiness signal before testing.');
    }
    console.log(`record: phases/${record.phase_id}/sessions/session-${String(record.number).padStart(3, '0')}.json`);
    void gate;
    return;
  }

  if (sub === 'stage') {
    requireOpts(opts, ['stage']);
    const record = setSessionStage(root, { stage: opts.stage, git });
    console.log(`session ${record.number} stage -> ${record.stage}`);
    return;
  }

  if (sub === 'save' || sub === 'complete') {
    requireOpts(opts, ['file']);
    const record = readJson(opts.file);
    if (sub === 'save') {
      saveSessionCheckpoint(root, { record, git });
      console.log(`checkpoint saved for session ${record.number} (stage ${record.stage || 'teaching'})`);
    } else {
      completeSession(root, { record, git });
      console.log(`session ${record.number} completed and committed`);
    }
    return;
  }

  throw new Error('usage: lang session start | stage --stage teaching|testing | save --file r.json | complete --file r.json');
}
