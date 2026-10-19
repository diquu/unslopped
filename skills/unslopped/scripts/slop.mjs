#!/usr/bin/env node
// El checker. Lee un fichero o un directorio y falla la corrida cuando algo
// en el texto sigue oliendo a generado.
//
// Las reglas de vocabulario salen de `vocab.mjs`, que es la fuente unica.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, relative, resolve, sep, extname } from 'node:path';

import {
  WORDS_EN, WORDS_ES, PHRASES_EN, PHRASES_ES,
  OPENERS, STAGED, RESIDUE, LIMIT, CONTRAST_EN, CONTRAST_ES, CAPS_ALLOW,
} from './vocab.mjs';

const INSTRUCTIONS = new Set(['SKILL.md', 'README.md']);
const TEXT_EXT = new Set(['.md', '.mdx', '.markdown', '.txt', '.rst']);
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.svn', 'dist', 'build', 'out', 'vendor',
  'coverage', '.next', '.venv', '__pycache__', '.cache', 'target',
]);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// "highlighting" y "showcasing" cuelgan de una raiz, asi que el sufijo se
// acepta en la raiz y no solo en la forma completa.
const WORD_PATTERNS = [...WORDS_EN, ...WORDS_ES].map((word) => ({
  word,
  regex: new RegExp(`(?<![\\p{L}])${escapeRegex(word)}(?:s|es|d|ed|ing|ly)?(?![\\p{L}])`, 'iu'),
}));

const PHRASE_LIST = [...PHRASES_EN, ...PHRASES_ES].map((p) => p.toLowerCase());

const OPENER = new RegExp(
  `^\\s*(?:${OPENERS.map(escapeRegex).join('|')})(?=\\s|$|[.,;:!?])`,
  'i',
);
const STAGED_RE = new RegExp(`^\\s*(?:${STAGED.map(escapeRegex).join('|')})\\b[,:]`, 'i');
const RESIDUE_RE = new RegExp(`\\b(?:${RESIDUE.join('|')})\\b`, 'i');
const LIMIT_RE = new RegExp(`\\b(?:${LIMIT.join('|')})\\b`, 'i');

const BANNER = /^\s*(?:\/\/|#|\*|\/\*)\s*(?:=+|-{3,}|STEP\s*\d|\*{2,}\s*\w+\s*\*{2,})/;
const EMOJI_BULLET = /^\s*[-*]\s*[\u{1F300}-\u{1FAFF}\u{2190}-\u{27BF}\u{FE0F}]/u;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}\u{FE0F}\u{1F000}-\u{1F2FF}\u{2B00}-\u{2BFF}]/u;
const BOLD_LABEL = /^\s*[-*]\s+\*\*[^*]{1,40}:?\*\*/;
const AI_ATTRIBUTION =
  /co-authored-by:.*(claude|gpt|copilot|gemini|openai|anthropic|chatgpt)|\bgenerated with (claude|ai|copilot|chatgpt)\b/i;
const UNVERIFIED_TESTS = /\b(all )?tests? (pass|passed|passes|are green|green)\b/i;

// Un comando nombrado cerca de la afirmacion es lo que separa "los tests
// pasan" de la mentira. Sin esto el checker marcaba frases legitimas.
const COMMAND = new RegExp(
  [
    '(?:^|\\s)(?:npm|pnpm|yarn|bun)\\s+(?:run\\s+)?(?:test|check|lint|build)\\b',
    '(?:^|\\s)node\\s+[\\w\\-.]+\\.[a-z]{1,4}\\b',
    '(?:^|\\s)node\\s+[\\w\\-]*[\\\\/][\\w\\-./\\\\]+\\b',
    '(?:^|\\s)python3?\\s+[\\w\\-.]+\\.(?:py|sh)\\b',
    '(?:^|\\s)(?:pytest|tox|cargo\\s+test|go\\s+test|mvn\\s+test|gradlew?\\s+test|make\\s+test|dotnet\\s+test|rspec|phpunit)\\b',
    '(?:^|\\s)(?:jest|vitest|mocha|ava|tap)\\b',
    '^\\s*\\$\\s+\\S',
  ].join('|'),
  'im',
);

const RULES = [
  { id: 'dash', pattern: /(^|[\s(])[—–](?=[\s).,;:]|$)/, message: 'guion largo: usar coma, punto o parentesis' },
  { id: 'dash', pattern: / -- /, message: '" -- " comoraya: usar coma o punto' },
  { id: 'opener', pattern: OPENER, message: 'abertura de chatbot' },
  { id: 'staged', pattern: STAGED_RE, message: 'corrida de entrada' },
  { id: 'residue', pattern: RESIDUE_RE, message: 'resto de conversacion' },
  { id: 'limit', pattern: LIMIT_RE, message: 'admision de limite de conocimiento' },
  { id: 'contrast', pattern: CONTRAST_EN, message: 'contraste not X but Y' },
  { id: 'contrast', pattern: CONTRAST_ES, message: 'contraste no X sino Y' },
  { id: 'banner', pattern: BANNER, message: 'banners de seccion en codigo' },
  { id: 'emoji', pattern: EMOJI_BULLET, message: 'bullet con emoji' },
  { id: 'emoji', pattern: EMOJI, message: 'emoji en el texto' },
  { id: 'bold', pattern: BOLD_LABEL, message: 'lista con label en negrita' },
  { id: 'attribution', pattern: AI_ATTRIBUTION, message: 'trailer de coautoria de IA' },
  { id: 'tests', pattern: UNVERIFIED_TESTS, message: 'dice que los tests pasan sin nombrar el comando' },
];

// --- Commits ------------------------------------------------------------
// Las reglas de `references/git.md` que si se pueden mirar. El resto sigue
// siendo del juicio humano.

const COMMIT_PREFIXES = [
  'feat', 'fix', 'chore', 'docs', 'style', 'refactor', 'perf', 'test',
  'build', 'ci', 'revert',
];

const VAGUE_SUBJECT = [
  'update', 'updates', 'updated', 'update code', 'update files', 'updated files',
  'fix', 'fixes', 'fixed', 'fix bug', 'fix a bug', 'fixed a bug', 'bug fix',
  'bugfix', 'change', 'changes', 'changed files', 'minor changes',
  'misc', 'misc changes', 'wip', 'cleanup', 'clean up', 'tweaks',
  'improvements', 'initial commit', 'first commit', 'bump version',
];

const FILE_BULLET = /^\s*[-*]\s+`?[\w.\-/]+\.(?:ts|tsx|js|mjs|jsx|py|go|rs|java|kt|md|json|ya?ml|sh|toml|css|html)\b/i;
const ISSUE_CLAIM = /\b(?:this\s+)?(?:also\s+)?(?:fixes|closes|resolves)\s+#(\d+)/i;

// Reglas que nacen de una palabra de la lista: un fichero de reglas las nombra
// para explicarlas y no deberia marcarse a si mismo.
const FROM_VOCABULARY = new Set([
  'opener', 'staged', 'residue', 'limit', 'contrast', 'tests', 'attribution',
]);

const CODE_EXT = /\.(js|mjs|ts|tsx|jsx|c|cc|cpp|h|hpp|java|go|rs|py|sh|ps1|json|ya?ml)$/i;

function skillRootOf(abs) {
  let dir = dirname(abs);
  for (let i = 0; i < 4 && dir !== dirname(dir); i++) {
    if (existsSync(join(dir, 'SKILL.md'))) return dir;
    dir = dirname(dir);
  }
  return null;
}

function vocabularyApplies(name, strict) {
  const abs = resolve(name);
  const root = skillRootOf(abs);
  const rel = root ? relative(root, abs).split(/[\\/]/).join(sep) : '';

  // La lista de palabras es la unica excepcion de `--strict`: nombra cada
  // palabra baneada porque es su trabajo.
  if (rel === `references${sep}banned.md`) return false;

  if (strict) return true;
  if (!root) return true;

  return !(
    INSTRUCTIONS.has(rel) ||
    rel.startsWith(`references${sep}`) ||
    rel.startsWith(`scripts${sep}`)
  );
}

function strip(lines) {
  let fence = false;

  return lines.map((raw) => {
    if (/^\s*(```|~~~)/.test(raw)) {
      fence = !fence;
      return '';
    }
    if (fence) return '';
    return raw
      .replace(/`[^`]*`/g, (m) => ' '.repeat(m.length))
      .replace(/https?:\/\/\S+/g, (m) => ' '.repeat(m.length))
      .replace(/!?\[[^\]]*\]\([^)]*\)/g, (m) => ' '.repeat(m.length))
      .replace(/<!--[\s\S]*?-->/g, (m) => ' '.repeat(m.length))
      .replace(/^\s*>.*$/, (m) => ' '.repeat(m.length));
  });
}

function uniformRuns(lines) {
  const sentences = [];
  let len = 0;

  lines.forEach((line, i) => {
    const isProse = line.trim() && !/^\s*(#|\||\d+\.|[-*]\s)/.test(line);
    if (!isProse) {
      len = 0;
      return;
    }

    for (const part of line.split(/(?<=[.?!])\s+/)) {
      len += part.length;
      if (/[.?!]$/.test(part.trim())) {
        sentences.push({ line: i + 1, len });
        len = 0;
      }
    }
  });

  const out = [];
  for (let i = 3; i < sentences.length; i++) {
    const window = sentences.slice(i - 3, i + 1).map((s) => s.len);
    const min = Math.min(...window);
    const max = Math.max(...window);
    if (min > 0 && max / min < 1.15) {
      out.push(`${sentences[i].line}: cuatro frases del mismo largo`);
    }
  }
  return out;
}

export function checkFile(name, text, strict = false, options = {}) {
  const allowCaps = new Set([...CAPS_ALLOW, ...(options.allowCaps ?? [])]);
  const raw = text.split('\n');
  const lines = strip(raw);
  const isCode = CODE_EXT.test(name);
  const vocabulary = vocabularyApplies(name, strict);
  const namesCommand = COMMAND.test(text);
  const found = [];

  raw.forEach((line, i) => {
    const plain = lines[i];

    for (const rule of RULES) {
      if (isCode && !['banner', 'emoji'].includes(rule.id)) continue;
      if (FROM_VOCABULARY.has(rule.id) && !vocabulary) continue;
      // "los tests pasan" solo es mentira cuando el fichero no nombra el
      // comando. Con el comando nombrado, la afirmacion se sostiene.
      if (rule.id === 'tests' && namesCommand) continue;
      if (rule.pattern.test(plain)) found.push({ n: i + 1, rule: rule.id, message: rule.message, line: line.trim() });
    }

    if (!vocabulary) return;

    for (const { word, regex } of WORD_PATTERNS) {
      if (regex.test(plain)) {
        found.push({ n: i + 1, rule: 'banned-word', message: word, line: line.trim() });
      }
    }

    const lower = plain.toLowerCase();
    for (const phrase of PHRASE_LIST) {
      if (lower.includes(phrase)) {
        found.push({ n: i + 1, rule: 'banned-phrase', message: phrase, line: line.trim() });
      }
    }

    if (!isCode) {
      for (const word of plain.match(/\b[A-Z]{3,}\b/g) ?? []) {
        if (!allowCaps.has(word)) {
          found.push({ n: i + 1, rule: 'caps', message: `mayusculas sin contexto: ${word}`, line: line.trim() });
        }
      }
    }
  });

  if (!isCode) {
    for (const m of uniformRuns(lines)) {
      const [n, message] = m.split(': ');
      found.push({ n, rule: 'uniform', message, line: '' });
    }
  }

  return found;
}

// --- Commits -------------------------------------------------------------

export function checkCommit(name, text, options = {}) {
  const prefixes = options.commitPrefixes ?? COMMIT_PREFIXES;
  const lines = text.split('\n');
  const subject = (lines[0] ?? '').trim();
  const found = [];
  const add = (rule, message, n = 1) => found.push({ n, rule, message, line: lines[n - 1]?.trim() ?? '' });

  if (!subject) {
    add('commit-subject-empty', 'el mensaje no tiene asunto');
    return found;
  }

  if (subject.length > 72) {
    add('commit-subject-length', `el asunto son ${subject.length} caracteres, el tope son 72`);
  }

  if (/[.]$/.test(subject)) {
    add('commit-subject-period', 'el asunto no acaba en punto');
  }

  const prefix = subject.match(/^([a-z]+)(?:\([^)]*\))?!?:\s*/i);
  const hasPrefix = prefix && prefixes.includes(prefix[1].toLowerCase());

  if (/^[A-Z]/.test(subject) && !hasPrefix) {
    add('commit-subject-case', 'el asunto empieza en mayuscula');
  }

  if (VAGUE_SUBJECT.includes(subject.toLowerCase().replace(/\.$/, ''))) {
    add('commit-subject-vague', `el asunto "${subject}" no dice que cambio`);
  }

  if (/\band\b/i.test(subject)) {
    add('commit-subject-and', 'el asunto necesita la palabra "and": son dos cambios');
  }

  lines.forEach((line, i) => {
    if (i === 0) return;
    if (FILE_BULLET.test(line)) {
      add('commit-file-list', 'el cuerpo lista ficheros, que es lo que el diff ya enseña', i + 1);
    }
  });

  const breaking = lines.findIndex((line) => /no breaking changes/i.test(line));
  if (breaking > 0) {
    add('commit-no-breaking', '"no breaking changes" cuando nada se rompe no dice nada', breaking + 1);
  }

  const claimLine = lines.findIndex((line) => ISSUE_CLAIM.test(line));
  const claim = claimLine > 0 ? lines[claimLine].match(ISSUE_CLAIM) : null;
  if (claim && !subject.includes(`#${claim[1]}`)) {
    add('commit-issue', `el cuerpo cierra #${claim[1]} pero el asunto no lo nombra`, claimLine + 1);
  }

  // Las reglas de prosa tambien aplican al mensaje, y aqui el vocabulario
  // siempre cuenta: un mensaje de commit nunca es un fichero de reglas. La
  // extension se quita para que un mensaje guardado en un .js siga siendo
  // texto y no codigo.
  const proseName = name.replace(/\.[a-z0-9]{1,5}$/i, '') || 'commit';
  for (const f of checkFile(proseName, text, true, options)) {
    found.push(f);
  }

  return found;
}

// --- Configuracion del proyecto que se revisa ---------------------------
// `slop.config.json` en el directorio de trabajo:
//
//   { "allowCaps": ["K8S"], "ignore": ["docs/generated/**"] }

function globToRegExp(pattern) {
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*\//g, '\u0000')
    .replace(/\*\*/g, '\u0001')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '.');
  return new RegExp(`^${escaped.replace(/\u0000/g, '(?:.*/)?').replace(/\u0001/g, '.*')}$`);
}

export function loadConfig(cwd = process.cwd()) {
  const file = join(cwd, 'slop.config.json');
  if (!existsSync(file)) return { allowCaps: [], ignore: [], commitPrefixes: COMMIT_PREFIXES };

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'));
  } catch (err) {
    throw new Error(`slop.config.json no es JSON valido: ${err.message}`);
  }
  return {
    allowCaps: parsed.allowCaps ?? [],
    ignore: parsed.ignore ?? [],
    commitPrefixes: parsed.commitPrefixes ?? COMMIT_PREFIXES,
  };
}

function isIgnored(abs, cwd, patterns) {
  if (!patterns.length) return false;
  const rel = relative(cwd, abs).split(/[\\/]/).join('/');
  return patterns.some((p) => globToRegExp(p).test(rel));
}

// --- Recorrido ----------------------------------------------------------

export function collectFiles(target) {
  const st = statSync(target);
  if (st.isFile()) return [target];

  const out = [];
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name)) continue;
        walk(full);
      } else if (entry.isFile() && TEXT_EXT.has(extname(entry.name).toLowerCase())) {
        out.push(full);
      }
    }
  };
  walk(target);
  return out.sort();
}

// --- CLI ----------------------------------------------------------------

const USAGE = `usage: slop.mjs [options] <file|dir...>

  --stdin        lee el texto de la entrada estandar
  --strict       aplica el vocabulario tambien a los ficheros de reglas
  --commit       el fichero es un mensaje de commit
  --json         salida en JSON para CI
  --quiet        solo imprime el resumen
  --list-rules   lista las reglas y sale
`;

function main(argv) {
  const opts = { strict: false, format: 'text', quiet: false, listRules: false, stdin: false, commit: false };
  const targets = [];

  for (const arg of argv) {
    if (arg === '--strict') opts.strict = true;
    else if (arg === '--commit') opts.commit = true;
    else if (arg === '--json' || arg === '--format=json') opts.format = 'json';
    else if (arg === '--quiet') opts.quiet = true;
    else if (arg === '--list-rules') opts.listRules = true;
    else if (arg === '--stdin') opts.stdin = true;
    else if (arg.startsWith('--')) {
      console.error(`opcion desconocida: ${arg}\n\n${USAGE}`);
      return 2;
    } else targets.push(arg);
  }

  if (opts.listRules) {
    for (const rule of RULES) console.log(`${rule.id}\t${rule.message}`);
    return 0;
  }

  if (!opts.stdin && targets.length === 0) {
    console.error(USAGE);
    return 2;
  }

  let config;
  try {
    config = loadConfig();
  } catch (err) {
    console.error(err.message);
    return 2;
  }

  const cwd = process.cwd();
  let files = [];
  try {
    if (opts.stdin) {
      files = [['stdin', readFileSync(0, 'utf8')]];
    } else {
      for (const target of targets) {
        if (!existsSync(target)) {
          console.error(`no existe: ${target}`);
          return 2;
        }
        for (const file of collectFiles(target)) {
          if (isIgnored(resolve(file), cwd, config.ignore)) continue;
          files.push([file, readFileSync(file, 'utf8')]);
        }
      }
    }
  } catch (err) {
    console.error(`no se pudo leer: ${err.message}`);
    return 2;
  }

  const report = [];
  let errors = 0;

  for (const [name, text] of files) {
    const found = opts.commit
      ? checkCommit(name, text, config)
      : checkFile(name, text, opts.strict, config);
    if (!found.length) continue;
    errors += found.length;
    report.push({ file: name, findings: found });
  }

  if (opts.format === 'json') {
    const payload = {
      findings: errors,
      files: report.map((entry) => ({
        file: entry.file,
        findings: entry.findings.map((f) => ({
          line: f.n,
          rule: f.rule,
          message: f.message,
          text: f.line,
        })),
      })),
    };
    console.log(JSON.stringify(payload, null, 2));
    return errors ? 1 : 0;
  }

  for (const entry of report) {
    console.log(entry.file);
    for (const f of entry.findings) {
      const where = f.line ? `\n      ${f.line.slice(0, 100)}` : '';
      console.log(`  ${f.n}  ${f.rule}  ${f.message}${where}`);
    }
  }

  if (!opts.quiet) console.log(errors ? `\n${errors} para arreglar` : 'limpio');
  return errors ? 1 : 0;
}

export { checkFile as check, RULES, main };

if (import.meta.url === pathToFileURL(process.argv[1]).href) process.exit(main(process.argv.slice(2)));
