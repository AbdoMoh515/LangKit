export function parseArgs(rest) {
  const opts = { _: [] };
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = rest[i + 1];
      if (next === undefined || next.startsWith('--')) {
        opts[key] = true;
      } else {
        opts[key] = next;
        i++;
      }
    } else {
      opts._.push(a);
    }
  }
  return opts;
}

export function requireOpts(opts, names) {
  const missing = names.filter((n) => opts[n] === undefined || opts[n] === true || opts[n] === '');
  if (missing.length) {
    const err = new Error(`missing required option(s): --${missing.join(', --')}`);
    err.usage = true;
    throw err;
  }
  return opts;
}

export function todayOr(opts) {
  if (opts.date !== undefined && opts.date !== true) return opts.date;
  return new Date().toISOString().slice(0, 10);
}

export function boolOpt(opts, name, fallback = false) {
  if (opts[name] === undefined) return fallback;
  if (opts[name] === true) return true;
  return ['true', 'yes', '1'].includes(String(opts[name]).toLowerCase());
}
