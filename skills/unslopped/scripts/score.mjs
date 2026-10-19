#!/usr/bin/env node
// Gradea un directorio de evals.
//
// Cada eval tiene dos carpetas: `with_skill` y `without_skill`, cada una con
// el fichero de salida. Las aserciones viven en `evals/evals.json`.
//
// La columna `without_skill` es informacion: se espera que falle. La que
// decide es `with_skill`, y por eso este script sale con 1 cuando algo de
// esa columna falla. Una tabla que no puede fallar no es una puerta.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { checkFile } from './slop.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const workspace = process.argv[2];

if (!workspace) {
  console.error('usage: node scripts/score.mjs <workspace-dir>');
  process.exit(2);
}

if (!existsSync(workspace)) {
  console.error(`no existe el directorio: ${workspace}`);
  process.exit(2);
}

const evals = JSON.parse(readFileSync(join(ROOT, 'evals', 'evals.json'), 'utf8')).evals;
const CONFIGS = ['with_skill', 'without_skill'];

const ASSERTS = {
  'no-findings': (text, findings) => (findings.length === 0 ? null : `${findings.length} hallazgos`),
  contains: (text, findings, value) => (text.includes(value) ? null : `falta "${value}"`),
  absent: (text, findings, value) => (text.includes(value) ? `aparece "${value}"` : null),
  'max-words': (text, findings, value) => {
    const words = text.split(/\s+/).filter(Boolean).length;
    return words <= value ? null : `${words} palabras, max ${value}`;
  },
  'max-lines': (text, findings, value) => {
    const lines = text.split('\n').filter((l) => l.trim()).length;
    return lines <= value ? null : `${lines} lineas, max ${value}`;
  },
  'min-lines': (text, findings, value) => {
    const lines = text.split('\n').filter((l) => l.trim()).length;
    return lines >= value ? null : `${lines} lineas, min ${value}`;
  },
};

function grade(text, path, assertions) {
  const findings = checkFile(path, text, false);
  const failures = [];

  for (const a of assertions) {
    const check = ASSERTS[a.kind];
    if (!check) {
      failures.push(`assertion desconocida: ${a.kind}`);
      continue;
    }
    const problem = check(text, findings, a.value);
    if (problem) failures.push(`${a.desc ?? a.kind}: ${problem}`);
  }

  return {
    findings: findings.length,
    words: text.split(/\s+/).filter(Boolean).length,
    failures,
  };
}

const rows = [];
for (const evalDef of evals) {
  const row = { name: evalDef.name };

  for (const config of CONFIGS) {
    const dir = join(workspace, evalDef.name, config);
    const file = join(dir, evalDef.output ?? 'output.md');

    if (!existsSync(dir) || !existsSync(file)) {
      row[config] = null;
      continue;
    }

    row[config] = grade(readFileSync(file, 'utf8'), file, evalDef.assertions ?? []);
  }

  rows.push(row);
}

const nameWidth = Math.max(4, ...rows.map((r) => r.name.length));
const cell = (r) => {
  if (!r) return 'sin correr';
  const status = r.failures.length ? 'FALLA' : 'ok';
  return `${status.padEnd(5)} ${String(r.findings).padStart(2)} hallazgos ${String(r.words).padStart(4)} pal`;
};

console.log(`${'eval'.padEnd(nameWidth)}  con skill${' '.repeat(12)}  sin skill`);
console.log('-'.repeat(nameWidth + 46));

let saved = 0;
let ran = 0;
let failed = 0;
let missing = 0;

for (const r of rows) {
  console.log(`${r.name.padEnd(nameWidth)}  ${cell(r.with_skill).padEnd(27)}  ${cell(r.without_skill)}`);

  for (const [config, label] of [['with_skill', 'con skill'], ['without_skill', 'sin skill']]) {
    for (const failure of r[config]?.failures ?? []) {
      console.log(`${' '.repeat(nameWidth)}  ${label}: ${failure}`);
    }
  }

  if (!r.with_skill) {
    missing++;
  } else {
    ran++;
    if (r.with_skill.failures.length) failed++;
  }

  if (r.with_skill && r.without_skill) {
    // Positivo cuando la skill quita hallazgos. El signo estaba al reves y
    // la tabla decia "de menos" con un numero negativo.
    const delta = r.without_skill.findings - r.with_skill.findings;
    saved += delta;
    console.log(`${' '.repeat(nameWidth)}  hallazgos que quita la skill: ${delta > 0 ? '+' : ''}${delta}`);
  }
}

console.log(`\nevals corridos: ${ran}, fallando: ${failed}, sin correr: ${missing}`);
console.log(`total de hallazgos que quita la skill: ${saved}`);
console.log('la columna sin skill es informativa: se espera que falle');

if (failed > 0) {
  console.log(`\nveredicto: ${failed} ${failed === 1 ? 'eval falla' : 'evals fallan'}`);
  process.exitCode = 1;
} else if (ran === 0) {
  console.log('\nveredicto: nada que graduar, ninguna carpeta con_skill');
  process.exitCode = 2;
} else {
  console.log('\nveredicto: la columna con_skill pasa sus aserciones');
}
