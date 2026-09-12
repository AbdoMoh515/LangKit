import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, requireOpts } from '../args.js';
import { requireProjectRoot, within, LAYOUT } from '../../core/paths.js';
import { loadRegistry, pendingAnkiItems, markAnkiExported } from '../../core/vocabulary.js';
import { ankiCsv } from '../../core/csv.js';

export function runCsv(rest, cwd) {
  const [sub, ...restArgs] = rest;
  const opts = parseArgs(restArgs);
  if (sub !== 'export') throw new Error('usage: lang csv export --session N');
  requireOpts(opts, ['session']);
  const root = requireProjectRoot(cwd);
  const session = Number(opts.session);
  const registry = loadRegistry(root);
  const items = pendingAnkiItems(registry, session);
  if (!items.length) {
    console.log(`no unexported new vocabulary for session ${session}; no CSV required`);
    return;
  }
  const dir = within(root, LAYOUT.ankiDir);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `session-${String(session).padStart(3, '0')}.csv`);
  fs.writeFileSync(file, ankiCsv(items), 'utf8');
  markAnkiExported(root, registry, items, session);
  console.log(`wrote ${file} (${items.length} card${items.length === 1 ? '' : 's'})`);
}
