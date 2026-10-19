#!/usr/bin/env node
// Genera `references/banned.md` a partir de `scripts/vocab.mjs`.
//
// El documento era una segunda copia a mano de la lista del script y por eso
// se separaron. Ahora hay una sola fuente: el script. `npm run banned` escribe
// el fichero y el test falla si el fichero commiteado no coincide con el
// generado, asi que la deriva no puede volver.
import { writeFileSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

import {
  WORDS_EN, WORDS_ES, PHRASES_EN, PHRASES_ES,
  OPENERS, STAGED, RESIDUE, LIMIT, REPLACEMENTS,
} from './vocab.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
export const TARGET = join(ROOT, 'references', 'banned.md');

function wrap(items, width = 76) {
  const lines = [];
  let line = '';
  for (const item of items) {
    const piece = line ? `, ${item}` : item;
    if (line && line.length + piece.length + 1 > width) {
      lines.push(line);
      line = item;
    } else {
      line += piece;
    }
  }
  if (line) lines.push(line);
  return lines.join('\n');
}

function quoted(items) {
  return wrap(items.map((p) => `"${p}"`));
}

export function renderBanned() {
  return `# Banned vocabulary

Generated from \`scripts/vocab.mjs\` by \`scripts/gen-banned.mjs\`. Edit the
table, not this file: \`npm run banned\` rewrites it, and the test fails when
the committed file and the generated one drift apart.

If the script flags a word that is correct in context, argue with the word, not
the rule: use the concrete alternative.

## Words

${wrap(WORDS_EN)}

Spanish:

${wrap(WORDS_ES)}

## Phrases

${quoted(PHRASES_EN)}

Spanish:

${quoted(PHRASES_ES)}

## Openers

${wrap(OPENERS)}

## Staged openers

${wrap(STAGED)}

## Chat residue

${wrap(RESIDUE.map((r) => `"${r}"`))}

## Knowledge-limit

${wrap(LIMIT.map((l) => `"${l}"`))}

## Replacements

| Instead of | Write |
| --- | --- |
${REPLACEMENTS.map(([from, to]) => `| ${from} | ${to} |`).join('\n')}
`;
}

function main() {
  const next = renderBanned();

  if (process.argv.includes('--check')) {
    const current = readFileSync(TARGET, 'utf8');
    if (current === next) {
      console.log('banned.md al dia');
      return 0;
    }
    console.error('banned.md no coincide con el generado. Corre: npm run banned');
    return 1;
  }

  writeFileSync(TARGET, next, 'utf8');
  console.log(`escrito ${TARGET}`);
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main());
