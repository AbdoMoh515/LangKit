export function csvEscape(value) {
  const s = String(value ?? '');
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

export function ankiCsv(items) {
  const rows = items.map((i) => [
    i.lemma,
    i.translation,
    (i.examples && i.examples[0] && i.examples[0].sentence) || ''
  ].map(csvEscape).join(','));
  return 'Word,Translation,Sentence\n' + (rows.length ? rows.join('\n') + '\n' : '');
}
