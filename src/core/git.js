import { execFileSync } from 'node:child_process';
import { LangError } from './errors.js';

const ALLOWED_SUBCOMMANDS = new Set([
  'init', 'add', 'commit', 'branch', 'switch', 'merge', 'log',
  'status', 'rev-parse', 'symbolic-ref', 'config', 'diff', 'show'
]);

const BLOCKED_EXACT = new Set([
  'rebase', 'filter-branch', 'clean', 'push', 'cherry-pick', 'reset'
]);

const BLOCKED_FLAGS = ['--force', '--hard', '-D', '--delete', '--amend', '--prune'];

function guard(args) {
  if (!args.length) throw new LangError('empty git invocation');
  const sub = args[0];
  if (!ALLOWED_SUBCOMMANDS.has(sub)) {
    throw new LangError(`git subcommand not allowed: "${sub}". lang only permits safe, allowlisted git operations`);
  }
  if (BLOCKED_EXACT.has(sub)) {
    throw new LangError(`destructive git operation blocked: "${sub}"`);
  }
  for (const a of args) {
    const s = String(a);
    if (BLOCKED_EXACT.has(s)) {
      throw new LangError(`destructive git operation blocked: "${s}"`);
    }
    for (const flag of BLOCKED_FLAGS) {
      if (s === flag || s.startsWith(flag + '=') || (flag.startsWith('--') && s.startsWith(flag))) {
        throw new LangError(`destructive git flag blocked: "${s}"`);
      }
    }
    if (s === '-f') {
      throw new LangError('destructive git flag blocked: "-f"');
    }
  }
}

export function runGit(repoPath, args, { gitBin = 'git' } = {}) {
  guard(args);
  try {
    return execFileSync(gitBin, args, { cwd: repoPath, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch (err) {
    const detail = [err.stderr, err.stdout].map((s) => (s ? String(s).trim() : '')).filter(Boolean).join(' | ');
    throw new LangError(`git ${args[0]} failed: ${detail || err.message}`);
  }
}

export function createGitAdapter(repoPath, opts = {}) {
  const run = (args) => runGit(repoPath, args, opts);
  return {
    run,
    version() {
      try {
        return execFileSync(opts.gitBin || 'git', ['--version'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
      } catch {
        return null;
      }
    },
    isRepo() {
      try {
        run(['rev-parse', '--is-inside-work-tree']);
        return true;
      } catch {
        return false;
      }
    },
    repoTopLevel() {
      try {
        return run(['rev-parse', '--show-toplevel']);
      } catch {
        return null;
      }
    },
    init() {
      run(['init', '-b', 'main']);
    },
    add(paths) {
      if (paths.length) run(['add', '--', ...paths]);
    },
    hasStagedChanges(paths) {
      const out = run(['status', '--porcelain', '--', ...paths]);
      return out.length > 0;
    },
    commit(message) {
      run(['commit', '-m', message]);
    },
    commitIfChanged(message, paths) {
      if (this.hasStagedChanges(paths)) {
        this.add(paths);
        this.commit(message);
        return true;
      }
      return false;
    },
    stageAndCommit(message, paths) {
      this.add(paths);
      return this.commitIfChanged(message, paths);
    },
    currentBranch() {
      try {
        return run(['symbolic-ref', '--short', 'HEAD']);
      } catch {
        return run(['rev-parse', '--abbrev-ref', 'HEAD']);
      }
    },
    branchExists(name) {
      try {
        run(['rev-parse', '--verify', '--quiet', `refs/heads/${name}`]);
        return true;
      } catch {
        return false;
      }
    },
    createBranch(name, from) {
      if (from) run(['branch', name, from]);
      else run(['branch', name]);
    },
    switchBranch(name) {
      run(['switch', name]);
    },
    workingTreeClean() {
      return run(['status', '--porcelain']).length === 0;
    },
    projectPathsClean(paths) {
      const out = run(['status', '--porcelain', '--', ...paths]);
      return out.length === 0;
    },
    mergeNoFastForward(branch, message) {
      run(['merge', '--no-ff', '--no-edit', '-m', message, branch]);
    },
    logOneline(limit = 10) {
      return run(['log', '--oneline', `-n`, String(limit)]);
    }
  };
}
