#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

import { checkFile } from './slop.mjs';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const workspace = process.argv[2];
if (!workspace) {
  console.error('usage: node scripts/score.mjs <workspace-dir>');
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
    if (!existsSync(dir)) {
      row[config] = null;
      continue;
    }

    const file = join(dir, evalDef.output ?? 'output.md');
    if (!existsSync(file)) {
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

let deltas = 0;
for (const r of rows) {
  console.log(`${r.name.padEnd(nameWidth)}  ${cell(r.with_skill).padEnd(27)}  ${cell(r.without_skill)}`);

  for (const [config, label] of [['with_skill', 'con skill'], ['without_skill', 'sin skill']]) {
    for (const failure of r[config]?.failures ?? []) {
      console.log(`${' '.repeat(nameWidth)}  ${label}: ${failure}`);
    }
  }

  if (r.with_skill && r.without_skill) {
    const better = r.with_skill.findings - r.without_skill.findings;
    if (better !== 0) deltas += better;
    console.log(`${' '.repeat(nameWidth)}  delta de hallazgos: ${better > 0 ? '+' : ''}${better}`);
  }
}

console.log(`\ntotal de hallazgos de menos con la skill: ${deltas}`);