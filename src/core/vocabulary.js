import { LangError } from './errors.js';
import { LAYOUT, within, readJson, writeJson } from './paths.js';
import { validateRegistry, SCHEMA_VERSION } from './schema.js';

export const MASTERY_RULES = Object.freeze({
  MIN_SUCCESSFUL_RECALLS: 3,
  MIN_SUCCESSFUL_USAGE: 1,
  MIN_SPACED_SUCCESS_DAYS: 2,
  MIN_EXPOSURE_DAYS: 2
});

export function emptyRegistry() {
  return { schema_version: SCHEMA_VERSION, items: [] };
}

export function registryPath(root) {
  return within(root, LAYOUT.registryJson);
}

export function loadRegistry(root) {
  return validateRegistry(readJson(registryPath(root)));
}

export function saveRegistry(root, registry) {
  validateRegistry(registry);
  writeJson(registryPath(root), registry);
  return registry;
}

export function makeItemId(registry) {
  const n = registry.items.length + 1;
  let candidate = `it-${String(n).padStart(4, '0')}`;
  const used = new Set(registry.items.map((i) => i.id));
  let k = n;
  while (used.has(candidate)) candidate = `it-${String(++k).padStart(4, '0')}`;
  return candidate;
}

export function findItem(registry, lemma, senseId, language) {
  const norm = String(lemma).toLowerCase();
  return registry.items.find(
    (i) => i.lemma.toLowerCase() === norm && i.sense_id === senseId &&
      (!language || i.language === language)
  ) || null;
}

export function addItem(root, registry, { lemma, sense_id, translation, language, examples = [], session = null, date = null }) {
  if (!lemma || !sense_id || !language) {
    throw new LangError('vocab add requires lemma, sense_id and language');
  }
  const existing = findItem(registry, lemma, sense_id, language);
  if (existing) {
    throw new LangError(
      `duplicate lexical item: "${lemma}" (sense "${sense_id}") already registered as ${existing.id}. ` +
      'the same sense must not become a duplicate card; introduce a different sense instead.'
    );
  }
  const item = {
    id: makeItemId(registry),
    lemma,
    language,
    sense_id,
    translation: translation || '',
    status: 'learning',
    introduced_on: date,
    introduced_session: session,
    exposure_days: date ? [date] : [],
    success_dates: [],
    successful_recalls: 0,
    successful_usage: 0,
    anki_exported_session: null,
    examples
  };
  registry.items.push(item);
  saveRegistry(root, registry);
  return item;
}

function distinctDays(dates) {
  return new Set(dates).size;
}

export function computeStatus(item) {
  if (item.status === 'mastered') return 'mastered';
  const spacedDays = distinctDays(item.success_dates || []);
  if (
    item.successful_recalls >= MASTERY_RULES.MIN_SUCCESSFUL_RECALLS &&
    item.successful_usage >= MASTERY_RULES.MIN_SUCCESSFUL_USAGE &&
    spacedDays >= MASTERY_RULES.MIN_SPACED_SUCCESS_DAYS &&
    (item.exposure_days || []).length >= MASTERY_RULES.MIN_EXPOSURE_DAYS
  ) {
    return 'mastered';
  }
  if (item.successful_recalls >= 1 && (item.exposure_days || []).length >= 2) {
    return 'familiar';
  }
  return 'learning';
}

export function recordEvidence(root, registry, { lemma, sense_id, language, type, success, date }) {
  const item = findItem(registry, lemma, sense_id, language);
  if (!item) {
    throw new LangError(`unknown lexical item "${lemma}" (sense "${sense_id}"). add it with "lang vocab add" first`);
  }
  if (!['recall', 'usage'].includes(type)) {
    throw new LangError('evidence type must be "recall" or "usage"');
  }
  if (typeof success !== 'boolean') {
    throw new LangError('--success must be true or false');
  }
  if (item.introduced_on && date < item.introduced_on) {
    throw new LangError(
      `evidence date ${date} precedes introduction date ${item.introduced_on} for "${lemma}" (${sense_id}). ` +
      'evidence cannot exist before the item was taught'
    );
  }
  if (!item.exposure_days.includes(date)) item.exposure_days.push(date);
  if (success) {
    if (type === 'recall') item.successful_recalls += 1;
    else item.successful_usage += 1;
    if (!item.success_dates.includes(date)) item.success_dates.push(date);
  }
  item.status = computeStatus(item);
  saveRegistry(root, registry);
  return item;
}

export function classifyWord(registry, word, language) {
  const norm = String(word).toLowerCase();
  const matches = registry.items.filter(
    (i) => i.lemma.toLowerCase() === norm && (!language || i.language === language)
  );
  if (!matches.length) return 'unknown';
  if (matches.some((i) => i.status === 'mastered' || i.status === 'familiar')) return 'known';
  return 'learning';
}

export function classifyWords(registry, words, language) {
  const out = {};
  for (const w of words) out[w] = classifyWord(registry, w, language);
  return out;
}

export function vocabularyBudget(registry, words, language) {
  const classification = classifyWords(registry, words, language);
  const unknownWords = Object.keys(classification).filter((w) => classification[w] === 'unknown');
  const learningWords = Object.keys(classification).filter((w) => classification[w] === 'learning');
  const knownWords = Object.keys(classification).filter((w) => classification[w] === 'known');
  return {
    classification,
    knownWords,
    learningWords,
    unknownWords,
    unknownCount: unknownWords.length,
    fairForAssessment: unknownWords.length <= MAX_SUPPORTING_UNKNOWN
  };
}

export const MAX_SUPPORTING_UNKNOWN = 2;

export function itemsIntroducedInSession(registry, sessionNumber) {
  return registry.items.filter((i) => i.introduced_session === sessionNumber);
}

export function pendingAnkiItems(registry, sessionNumber) {
  return itemsIntroducedInSession(registry, sessionNumber).filter(
    (i) => i.anki_exported_session !== sessionNumber
  );
}

export function markAnkiExported(root, registry, items, sessionNumber) {
  for (const item of items) item.anki_exported_session = sessionNumber;
  saveRegistry(root, registry);
}

export function masteryCounts(registry) {
  const counts = { new: 0, learning: 0, familiar: 0, mastered: 0 };
  for (const i of registry.items) counts[i.status] += 1;
  return counts;
}
