import { LangError } from '../core/errors.js';
import { requireProjectRoot } from '../core/paths.js';
import { createGitAdapter } from '../core/git.js';
import { runInit } from './commands/init.js';
import { runStatus } from './commands/status.js';
import { runProfile } from './commands/profile.js';
import { runPlan } from './commands/plan.js';
import { runState } from './commands/state.js';
import { runVocab } from './commands/vocab.js';
import { runSession } from './commands/session.js';
import { runCsv } from './commands/csv.js';
import { runPhase } from './commands/phase.js';
import { runValidate } from './commands/validate.js';
import { runDoctor } from './commands/doctor.js';

const COMMANDS = {
  init: runInit,
  status: runStatus,
  profile: runProfile,
  plan: runPlan,
  state: runState,
  vocab: runVocab,
  session: runSession,
  csv: runCsv,
  phase: runPhase,
  validate: runValidate,
  doctor: runDoctor
};

export function main(argv, cwd = process.cwd()) {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') {
    printHelp();
    return;
  }
  const handler = COMMANDS[cmd];
  if (!handler) {
    throw new LangError(`unknown command "${cmd}". run "lang help" for usage`);
  }
  handler(rest, cwd);
}

export function gitFor(cwd) {
  const root = requireProjectRoot(cwd);
  return { root, git: createGitAdapter(root) };
}

function printHelp() {
  console.log(`lang — OpenCode-native adaptive language learning

public commands:
  lang init --here      initialize a Lang project in the current (empty) directory
  lang status           show learner progress overview

internal commands (used by the OpenCode lang skill):
  lang profile set --file p.json | get
  lang plan scaffold --file plan.json
  lang state get | anki-confirm [--date YYYY-MM-DD]
  lang vocab add --file items.json --session N | record --lemma L --sense S --type recall|usage --success true|false
  lang vocab list | check --words a,b,c
  lang session start | save --file r.json | complete --file r.json
  lang csv export --session N
  lang phase begin --id phase-01 | test-result --file r.json | merge [--confirm] | next
  lang validate
  lang doctor`);
}
