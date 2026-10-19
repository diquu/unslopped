#!/usr/bin/env node
// La suite del checker.
//
// El repositorio es una puerta y no tenia puerta: los numeros del README
// vivian en prosa y nada fallaba cuando una regla dejaba de funcionar. Aqui
// cada regla tiene una consecuencia comprobable.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';

import { checkFile, checkCommit, collectFiles } from '../scripts/slop.mjs';
import { renderBanned } from '../scripts/gen-banned.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SKILL = dirname(HERE);
const REPO = dirname(dirname(SKILL));
const CHECKER = join(SKILL, 'scripts', 'slop.mjs');
const FIXTURES = join(HERE, 'fixtures');

function fixture(name) {
  return readFileSync(join(FIXTURES, name), 'utf8');
}

function byRule(findings) {
  const out = {};
  for (const f of findings) out[f.rule] = (out[f.rule] ?? 0) + 1;
  return out;
}

function run(args, opts = {}) {
  return spawnSync(process.execPath, [CHECKER, ...args], { encoding: 'utf8', ...opts });
}

function tempDir(files) {
  const dir = mkdtempSync(join(tmpdir(), 'slop-'));
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(dir, name), content, 'utf8');
  }
  return dir;
}

// --- Los fixtures que tienen que fallar ---------------------------------
// El contrato son los RECUENTOS POR REGLA, no el total. Si una regla deja de
// funcionar, el fallo dice cual, en vez de decir "26" cuando antes eran 25.

const EXPECTED = {
  'slop.md': {
    dash: 1,
    opener: 1,
    'banned-word': 14,
    'banned-phrase': 2,
    contrast: 1,
    staged: 1,
    residue: 1,
    emoji: 1,
    bold: 3,
  },
  'pr-body.md': {
    'banned-word': 5,
    tests: 1,
    attribution: 1,
  },
  'release-notes.md': {
    'banned-word': 8,
    bold: 3,
    emoji: 1,
  },
};

for (const [name, expected] of Object.entries(EXPECTED)) {
  test(`fixture ${name} falla con las reglas esperadas`, () => {
    const found = checkFile(join(FIXTURES, name), fixture(name), false);
    assert.deepEqual(byRule(found), expected);
  });
}

// --- Los fixtures que tienen que pasar ----------------------------------

for (const name of ['clean.md', 'wrong-shapes.md', 'tests-with-command.md']) {
  test(`fixture ${name} pasa el checker`, () => {
    const found = checkFile(join(FIXTURES, name), fixture(name), false);
    assert.deepEqual(found, [], `hallazgos inesperados: ${JSON.stringify(found, null, 2)}`);
  });
}

test('la afirmacion de tests solo se marca cuando no hay comando', () => {
  const found = checkFile(
    join(FIXTURES, 'tests-without-command.md'),
    fixture('tests-without-command.md'),
    false,
  );
  assert.equal(found.length, 1);
  assert.equal(found[0].rule, 'tests');
});

// --- La lista y el documento no pueden separarse -------------------------

test('references/banned.md coincide con la tabla generada', () => {
  const current = readFileSync(join(SKILL, 'references', 'banned.md'), 'utf8');
  assert.equal(
    current,
    renderBanned(),
    'banned.md no coincide con lo generado. Corre: npm run banned',
  );
});

test('la lista de palabras cubre las dos listas del documento', () => {
  const doc = readFileSync(join(SKILL, 'references', 'banned.md'), 'utf8');
  const missing = ['excited', 'milestone', 'peace of mind', "here's what you need to know", 'likely']
    .filter((entry) => !doc.includes(entry));
  assert.deepEqual(missing, [], `la lista no nombra: ${missing.join(', ')}`);
});

// --- La CLI --------------------------------------------------------------

test('sale con 0 cuando no hay hallazgos', () => {
  const result = run([join(FIXTURES, 'clean.md')]);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /limpio/);
});

test('sale con 1 cuando hay hallazgos', () => {
  const result = run([join(FIXTURES, 'slop.md')]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /para arreglar/);
});

test('sale con 2 y mensaje cuando el fichero no existe', () => {
  const result = run([join(FIXTURES, 'no-existe.md')]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /no existe/);
  assert.doesNotMatch(result.stderr, /at Object\.|at Module\./, 'no debe escupir una traza');
});

test('sale con 2 y mensaje cuando la opcion no existe', () => {
  const result = run(['--inventada']);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /opcion desconocida/);
  assert.doesNotMatch(result.stderr, /at Object\./, 'no debe escupir una traza');
});

test('sale con 2 cuando no hay nada que revisar', () => {
  const result = run([]);
  assert.equal(result.status, 2);
  assert.match(result.stderr, /usage/);
});

test('la salida json trae los hallazgos', () => {
  const result = run(['--json', join(FIXTURES, 'pr-body.md')]);
  assert.equal(result.status, 1);
  const data = JSON.parse(result.stdout);
  assert.equal(data.findings, 7);
  assert.equal(data.files.length, 1);
  assert.equal(data.files[0].file, join(FIXTURES, 'pr-body.md'));
  assert.ok(data.files[0].findings.every((f) => typeof f.line === 'number' && typeof f.rule === 'string'));
});

test('un directorio se recorre y encuentra los fixtures', () => {
  const files = collectFiles(FIXTURES).map((f) => f.split(/[\\/]/).pop());
  assert.ok(files.includes('slop.md'));
  assert.ok(files.includes('clean.md'));
});

test('la entrada estandar se revisa', () => {
  const result = run(['--stdin'], { input: 'Certainly! This is a robust solution.' });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /opener/);
});

// --- Robustez ------------------------------------------------------------

test('no revienta con ficheros raros', () => {
  const cases = {
    'vacio.md': '',
    'crlf.md': 'Hola.\r\nAdios.\r\n',
    'bom.md': '\uFEFFHola.\n',
    'sin-nueva-linea.md': 'Hola.',
    'unicode.md': 'Acentos: ñ, á, é, í, ó, ú. Emoji fuera: no.\n',
    'solo-espacios.md': '   \n\t\n',
  };

  for (const [name, content] of Object.entries(cases)) {
    const found = checkFile(join(FIXTURES, name), content, false);
    assert.ok(Array.isArray(found), `${name} devolvio algo que no es una lista`);
  }
});

test('el resultado es el mismo dos veces', () => {
  const text = fixture('slop.md');
  assert.deepEqual(checkFile('a.md', text, false), checkFile('a.md', text, false));
});

// --- Commits -------------------------------------------------------------
// Las reglas de `references/git.md` que se pueden mirar sin un humano.

test('el mensaje de commit con los defaults falla con las reglas esperadas', () => {
  const found = checkCommit(join(FIXTURES, 'commit-bad.txt'), fixture('commit-bad.txt'));
  assert.deepEqual(byRule(found), {
    'commit-subject-case': 1,
    'commit-file-list': 2,
    'commit-no-breaking': 1,
    'commit-issue': 1,
    'banned-word': 1,
    tests: 1,
    attribution: 1,
  });
});

test('el mensaje de commit bueno pasa', () => {
  assert.deepEqual(checkCommit('commit.txt', fixture('commit-good.txt')), []);
});

test('un asunto sin substance se marca', () => {
  const found = checkCommit('commit.txt', 'fix a bug.\n');
  assert.deepEqual(byRule(found), { 'commit-subject-period': 1, 'commit-subject-vague': 1 });
});

test('un asunto con dos cambios se marca', () => {
  const found = checkCommit('commit.txt', 'add dark mode and light mode to the settings screen\n');
  assert.deepEqual(byRule(found), { 'commit-subject-and': 1 });
});

test('un asunto largo se marca', () => {
  const subject = 'rewrite the whole rules pipeline so every filter list is converted in one pass';
  assert.ok(subject.length > 72, 'el sujeto del test tiene que pasar de 72');
  const found = checkCommit('commit.txt', `${subject}\n`);
  assert.deepEqual(byRule(found), { 'commit-subject-length': 1 });
});

test('un prefijo convencional cuenta como el que es', () => {
  assert.deepEqual(checkCommit('commit.txt', 'feat(api): add the missing endpoint\n'), []);
});

test('la CLI revisa un mensaje de commit', () => {
  const result = run(['--commit', join(FIXTURES, 'commit-bad.txt')]);
  assert.equal(result.status, 1);
  assert.match(result.stdout, /commit-subject-case/);

  const good = run(['--commit', join(FIXTURES, 'commit-good.txt')]);
  assert.equal(good.status, 0, good.stdout + good.stderr);
});

// --- La puerta de commit -------------------------------------------------

function git(args, cwd) {
  return spawnSync('git', args, { cwd, encoding: 'utf8' });
}

test('la puerta de commit bloquea un fichero con problemas', () => {
  const dir = tempDir({
    'nota.md': 'Certainly! This is a seamless and robust solution.\n',
  });

  try {
    const init = git(['init', '-q'], dir);
    assert.equal(init.status, 0, init.stderr);
    assert.equal(git(['config', 'user.email', 'a@b.c'], dir).status, 0);
    assert.equal(git(['config', 'user.name', 'test'], dir).status, 0);
    assert.equal(git(['add', 'nota.md'], dir).status, 0);

    const hook = spawnSync(process.execPath, [join(SKILL, 'scripts', 'hook.mjs')], {
      encoding: 'utf8',
      cwd: dir,
    });
    assert.equal(hook.status, 1, hook.stdout + hook.stderr);
    assert.match(hook.stderr, /para arreglar antes de commitear/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('la puerta de commit deja pasar un fichero limpio', () => {
  const dir = tempDir({ 'nota.md': 'El clusor corre en segundo plano.\n' });

  try {
    git(['init', '-q'], dir);
    git(['config', 'user.email', 'a@b.c'], dir);
    git(['config', 'user.name', 'test'], dir);
    git(['add', 'nota.md'], dir);

    const hook = spawnSync(process.execPath, [join(SKILL, 'scripts', 'hook.mjs')], {
      encoding: 'utf8',
      cwd: dir,
    });
    assert.equal(hook.status, 0, hook.stdout + hook.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('la puerta de commit dice que no cuando no hay repositorio', () => {
  const dir = tempDir({});
  try {
    const hook = spawnSync(process.execPath, [join(SKILL, 'scripts', 'hook.mjs')], {
      encoding: 'utf8',
      cwd: dir,
    });
    assert.equal(hook.status, 2);
    assert.match(hook.stderr, /no se esta en un repositorio/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- Configuracion del proyecto ------------------------------------------
test('slop.config.json anade siglas y descarta ficheros', () => {
  const dir = tempDir({
    'slop.config.json': JSON.stringify({ allowCaps: ['K8S'], ignore: ['skipme.md'] }),
    'nota.md': 'El clusor K8S no se configura todavia.\n',
    'skipme.md': 'Comprehensive and seamless.\n',
  });

  try {
    const result = spawnSync(process.execPath, [CHECKER, '--json', dir], {
      encoding: 'utf8',
      cwd: dir,
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('un slop.config.json roto sale con 2 y dice por que', () => {
  const dir = tempDir({ 'slop.config.json': '{ no es json' });
  try {
    const result = spawnSync(process.execPath, [CHECKER, dir], { encoding: 'utf8', cwd: dir });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /no es JSON valido/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

// --- El repo se revisa a si mismo ----------------------------------------

test('la prosa del repo pasa el checker', () => {
  const files = [
    join(REPO, 'README.md'),
    join(SKILL, 'SKILL.md'),
    join(SKILL, 'references', 'banned.md'),
    join(SKILL, 'references', 'patterns.md'),
    join(SKILL, 'references', 'git.md'),
  ].filter(existsSync);

  for (const file of files) {
    const found = checkFile(file, readFileSync(file, 'utf8'), false);
    assert.deepEqual(found, [], `${file}: ${JSON.stringify(found, null, 2)}`);
  }
});

test('la lista de palabras queda exenta incluso en strict', () => {
  const file = join(SKILL, 'references', 'banned.md');
  const found = checkFile(file, readFileSync(file, 'utf8'), true);
  assert.deepEqual(found, [], 'la lista nombra las palabras, es su trabajo');
});
