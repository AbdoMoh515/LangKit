#!/usr/bin/env node
import { main } from '../src/cli/index.js';
import { LangError } from '../src/core/errors.js';

try {
  main(process.argv.slice(2));
} catch (err) {
  if (err instanceof LangError) {
    console.error(`error: ${err.message}`);
    if (err.usage) console.error(err.usage);
    process.exit(err.code || 1);
  }
  console.error(`unexpected error: ${err && err.stack ? err.stack : err}`);
  process.exit(70);
}
