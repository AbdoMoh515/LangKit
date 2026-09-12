import { parseArgs } from '../args.js';
import { requireProjectRoot } from '../../core/paths.js';
import { loadState } from '../../core/state.js';
import { loadRegistry, masteryCounts } from '../../core/vocabulary.js';
import { profileExists, loadProfile } from '../../core/profile.js';

export function runStatus(rest, cwd) {
  const opts = parseArgs(rest);
  const root = requireProjectRoot(cwd);
  const state = loadState(root);
  const registry = loadRegistry(root);
  const profile = profileExists(root) ? loadProfile(root) : null;

  if (opts.json) {
    console.log(JSON.stringify({ state, counts: masteryCounts(registry), profile }, null, 2));
    return;
  }

  const counts = masteryCounts(registry);
  const lines = [];
  if (!profile) {
    lines.push('Profile: not set — run /lang-start in OpenCode to begin');
  } else {
    lines.push(`Target language: ${profile.target_language}`);
    lines.push(`Source/explanation language: ${profile.source_language}`);
  }
  if (state.current_phase) {
    const total = state.phases.length;
    const phase = state.phases.find((p) => p.id === state.current_phase.id);
    lines.push(`Current phase: ${phase ? phase.order : '?'}/${total} — ${state.current_phase.id}-${state.current_phase.slug} (${phase ? phase.status : '?'})`);
  } else {
    lines.push('Current phase: none (run /lang-start or finish the current phase)');
  }
  if (profile && profile.skills.length) {
    lines.push(`Current focus: ${profile.skills.join(' + ')}`);
  }
  lines.push(`Vocabulary: ${counts.mastered} mastered, ${counts.familiar} familiar, ${counts.learning} learning, ${counts.new} new`);
  lines.push(`Current weak areas: ${state.derived.weak_areas.length ? state.derived.weak_areas.join(', ') : '(none recorded)'}`);
  if (state.current_session) {
    lines.push(`Last session: #${state.current_session.number} ${state.current_session.status} (started ${state.current_session.started_at}) — resumable with /lang-go`);
  } else {
    const last = state.completed_sessions[state.completed_sessions.length - 1];
    lines.push(last ? `Last session: #${last.number} ${last.status} ${last.date}` : 'Last session: none yet');
  }
  const phaseSessions = state.current_phase
    ? state.completed_sessions.filter((s) => s.phase_id === state.current_phase.id).length
    : 0;
  if (state.current_phase) {
    lines.push(`Estimated phase progress: ${phaseSessions} session(s) completed in current phase`);
  }
  if (state.derived.next_recommended_work) {
    lines.push(`Next recommended work: ${state.derived.next_recommended_work}`);
  }
  console.log(lines.join('\n'));
}
