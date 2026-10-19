#!/usr/bin/env node
// Puerta de commit.
//
// Revisa lo que se va a commitear: los ficheros de texto y el mensaje del
// commit. Es el mismo checker, ejecutado sobre lo que de verdad entra.
//
//   git config core.hooksPath .githooks
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';

import { checkFile, checkCommit } from './slop.mjs';

const TEXT_EXT = new Set(['.md', '.mdx', '.markdown', '.txt', '.rst']);

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' });
}

function main() {
  let root;
  try {
    root = git(['rev-parse', '--show-toplevel'], process.cwd()).trim();
  } catch {
    console.error('no se esta en un repositorio de git');
    return 2;
  }

  const staged = git(['diff', '--cached', '--name-only', '--diff-filter=ACM'], root)
    .split('\n')
    .map((f) => f.trim())
    .filter(Boolean)
    .filter((f) => TEXT_EXT.has(extname(f).toLowerCase()));

  let errors = 0;

  for (const file of staged) {
    const full = join(root, file);
    if (!existsSync(full)) continue;
    const found = checkFile(full, readFileSync(full, 'utf8'), false);
    if (!found.length) continue;
    errors += found.length;
    console.error(file);
    for (const f of found) console.error(`  ${f.n}  ${f.rule}  ${f.message}`);
  }

  const messagePath = git(['rev-parse', '--git-path', 'COMMIT_EDITMSG'], root).trim();
  if (messagePath && existsSync(messagePath)) {
    const message = readFileSync(messagePath, 'utf8');
    const found = checkCommit('COMMIT_EDITMSG', message, {});
    if (found.length) {
      errors += found.length;
      console.error('mensaje de commit');
      for (const f of found) console.error(`  ${f.n}  ${f.rule}  ${f.message}`);
    }
  }

  if (errors) {
    console.error(`\n${errors} para arreglar antes de commitear`);
    return 1;
  }

  return 0;
}

process.exit(main());
