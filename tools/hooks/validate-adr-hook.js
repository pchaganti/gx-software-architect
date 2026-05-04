#!/usr/bin/env node
/**
 * Claude Code PostToolUse hook for ADR validation.
 *
 * Reads JSON from stdin, extracts the edited/written file path, and runs
 * tools/lib/adr-validator.js against it if the path is under
 * .architecture/decisions/adrs/.
 *
 * Exit 0  = pass (or non-ADR file, ignored)
 * Exit 2  = ADR validation failed; stderr is shown to the model so it can fix.
 */

import { readFileSync } from 'node:fs';
import { basename, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { validateAdr } from '../lib/adr-validator.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

const ADR_DIR_FRAGMENT = `.architecture${sep}decisions${sep}adrs${sep}`;

(async () => {
  const raw = await readStdin();
  if (!raw.trim()) process.exit(0);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const filePath =
    payload?.tool_input?.file_path ||
    payload?.tool_input?.path ||
    payload?.params?.file_path;

  if (!filePath) process.exit(0);

  const absolute = resolve(filePath);
  if (!absolute.includes(ADR_DIR_FRAGMENT)) process.exit(0);

  let content;
  try {
    content = readFileSync(absolute, 'utf8');
  } catch (err) {
    console.error(`adr-validator: could not read ${absolute}: ${err.message}`);
    process.exit(0);
  }

  const result = validateAdr(basename(absolute), content);
  if (result.valid) process.exit(0);

  console.error(`ADR validation failed for ${basename(absolute)}:`);
  for (const err of result.errors) console.error(`  - ${err}`);
  console.error('\nSee .architecture/templates/adr-template.md for required structure.');
  process.exit(2);
})();
