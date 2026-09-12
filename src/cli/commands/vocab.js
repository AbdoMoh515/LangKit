import { parseArgs, requireOpts, todayOr, boolOpt } from '../args.js';
import { requireProjectRoot, readJson } from '../../core/paths.js';
import { loadRegistry, addItem, recordEvidence, classifyWords, masteryCounts } from '../../core/vocabulary.js';

export function runVocab(rest, cwd) {
  const [sub, ...restArgs] = rest;
  const opts = parseArgs(restArgs);
  const root = requireProjectRoot(cwd);

  if (sub === 'add') {
    requireOpts(opts, ['file']);
    const payload = readJson(opts.file);
    const items = Array.isArray(payload) ? payload : payload.items;
    if (!Array.isArray(items) || !items.length) throw new Error('items file must be an array of {lemma, sense_id, translation, language, examples?}');
    const date = todayOr(opts);
    const session = opts.session !== undefined ? Number(opts.session) : null;
    const registry = loadRegistry(root);
    const added = [];
    for (const entry of items) {
      added.push(addItem(root, registry, {
        lemma: entry.lemma,
        sense_id: entry.sense_id || 'primary',
        translation: entry.translation,
        language: entry.language,
        examples: entry.examples || [],
        session,
        date
      }));
    }
    console.log(added.map((i) => `${i.id} ${i.lemma} (${i.sense_id}) -> ${i.status}`).join('\n'));
    return;
  }

  if (sub === 'record') {
    requireOpts(opts, ['lemma', 'type']);
    const registry = loadRegistry(root);
    const item = recordEvidence(root, registry, {
      lemma: opts.lemma,
      sense_id: opts.sense !== undefined ? opts.sense : (opts.sense_id !== undefined ? opts.sense_id : 'primary'),
      language: opts.language,
      type: opts.type,
      success: boolOpt(opts, 'success'),
      date: todayOr(opts)
    });
    console.log(`${item.id} ${item.lemma} (${item.sense_id}) ${opts.type} success=${boolOpt(opts, 'success')} -> ${item.status}`);
    return;
  }

  if (sub === 'list') {
    const registry = loadRegistry(root);
    for (const i of registry.items) {
      console.log(`${i.id}\t${i.status}\t${i.lemma}\t${i.sense_id}\t${i.translation}`);
    }
    if (!registry.items.length) console.log('(registry empty)');
    return;
  }

  if (sub === 'check') {
    requireOpts(opts, ['words']);
    const registry = loadRegistry(root);
    const words = String(opts.words).split(',').map((w) => w.trim()).filter(Boolean);
    console.log(JSON.stringify(classifyWords(registry, words, opts.language), null, 2));
    return;
  }

  if (sub === 'counts') {
    console.log(JSON.stringify(masteryCounts(loadRegistry(root)), null, 2));
    return;
  }

  throw new Error('usage: lang vocab add|record|list|check|counts');
}
