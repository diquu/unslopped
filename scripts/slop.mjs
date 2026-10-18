#!/usr/bin/env node
// Mechanical AI-slop check. Rules a model can forget get enforced here instead.
//
//   node slop.mjs <file...>
//   node slop.mjs --stdin < draft.txt
//   node slop.mjs --strict <file>
//
// Exit 1 if anything error-level was found.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, relative, resolve, sep } from 'node:path';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const INSTRUCTIONS = new Set(['SKILL.md', 'README.md']);

const BANNED_WORDS = [
  'delve', 'tapestry', 'testament', 'vibrant', 'pivotal', 'crucial', 'intricate',
  'meticulous', 'bolster', 'garner', 'underscore', 'interplay', 'multifaceted',
  'nuanced', 'foster', 'leverage', 'utilize', 'commence', 'facilitate', 'encompass',
  'paramount', 'groundbreaking', 'cutting-edge', 'game-changer', 'game-changing',
  'transformative', 'seamless', 'robust', 'comprehensive', 'endeavor', 'endeavour',
  'revolutionize', 'revolutionise', 'disruptive', 'holistic', 'synergy',
  'excited', 'thrilled', 'delighted', 'proud to announce', 'milestone',
  'thank you to our amazing', 'amazing community', 'peace of mind',
  'aforementioned', 'harnessing', 'spearheading', 'showcasing', 'highlighting',
  'emphasizing', 'enhancing', 'unprecedented', 'remarkable', 'stunning', 'profound',
  'thought leader', 'value proposition', 'moving forward', 'circle back',
  'rest assured', 'goes without saying',
  'aprovechando', 'potenciando', 'revolucionario', 'sin precedentes',
  'en el mundo actual', 'en el mundo de hoy', 'en resumen', 'en conclusión',
  'vale la pena destacar', 'es importante destacar', 'sin duda alguna',
];

const BANNED_PHRASES = [
  'in today\'s', "let's dive", 'at its core', 'in the realm of', "here's the thing",
  "here's the deal", 'without further ado', 'in a nutshell', 'buckle up',
  'the bottom line is', 'at the end of the day', 'it\'s worth noting',
  'it\'s important to note', 'i hope this helps', "i hope this finds you well",
  "i hope this email finds you well", 'as per my last email',
  "please don't hesitate", 'let me know if', 'move the needle', 'bridge the gap',
  'unlock the power', 'take it to the next level', 'streamline your',
  'supercharge your', 'when it comes to', 'this is where', 'in conclusion',
];

const BANNED_OPENERS = /^\s*(certainly|sure|of course|absolutely|great question|great point|i'd be happy to|honestly\?|honestly|look|real talk|here's the thing)\b/i;

const STAGED = /^\s*(overall|in conclusion|firstly|secondly|thirdly|additionally|moreover|furthermore|notably|importantly|interestingly|indeed)\b[,:]/i;

const RESIDUE = /\b(i hope this helps|let me know if you (want|need|have)|hope this helps)\b/i;

const LIMIT = /\b(as of (my last|my knowledge)|up to my last training|to my (best )?knowledge|based on available information|is not publicly available)\b/i;

const CONTRAST_EN = /\b(?:not|doesn'?t|isn'?t|aren'?t) (just|only|merely)\b|\bit'?s not [^.]{0,60}, it'?s\b|\bnot only\b[^.]{0,80}\bbut\b/i;
const CONTRAST_ES = /\bno es (solo|sólo)\b[^.]{0,80}\bsino\b|\bnada m[áa]s:\s|\bs[óo]lo (eso|esto):/i;

const BANNER = /^\s*(?:\/\/|#|\*|\/\*)\s*(?:=+|-{3,}|STEP\s*\d|\*{2,}\s*\w+\s*\*{2,})/;

const EMOJI_BULLET = /^\s*[-*]\s*[\u{1F300}-\u{1FAFF}\u{2190}-\u{27BF}\u{FE0F}]/u;
const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}\u{FE0F}\u{1F000}-\u{1F2FF}]/u;

const BOLD_LABEL = /^\s*[-*]\s+\*\*[^*]{1,40}:?\*\*/;

const AI_ATTRIBUTION = /co-authored-by:.*(claude|gpt|copilot|gemini|openai|anthropic|chatgpt)|\bgenerated with (claude|ai|copilot|chatgpt)\b/i;

const UNVERIFIED_TESTS = /\b(all )?tests? (pass|passed|passes|are green|green)\b/i;

const CODE_EXT = /\.(js|mjs|ts|tsx|jsx|c|cc|cpp|h|hpp|java|go|rs|py|sh|ps1|json|ya?ml)$/i;

const CAPS_ALLOW = new Set([
  'API', 'APIS', 'URL', 'URLS', 'CSS', 'JSON', 'HTTP', 'HTTPS', 'HTML', 'XML', 'DNS',
  'TLS', 'SSL', 'MV2', 'MV3', 'PNG', 'JPG', 'SVG', 'GIF', 'GPL', 'MIT', 'AI', 'UI',
  'UX', 'ID', 'PR', 'CI', 'CD', 'CLI', 'TUI', 'SDK', 'QA', 'CPU', 'GPU', 'RAM', 'OS',
  'DNR', 'DNT', 'SSR', 'CSRF', 'KV', 'SQL', 'CSV', 'RSS', 'IPC', 'TTY',
  'README', 'ADR', 'CHANGELOG', 'LICENSE', 'JSONL', 'TOML', 'YAML', 'MD',
  'TODO', 'FIXME', 'NOTE', 'WIP', 'A', 'I', 'X', 'AN', 'AS', 'IF', 'TO', 'ON',
]);

const CHECKS = [
  ['dash', /(^|[\s(])[—–](?=[\s).,;:]|$)/, 'guion largo: usar coma, punto o parentesis'],
  ['dash', / -- /, '" -- " comoraya: usar coma o punto'],
  ['opener', BANNED_OPENERS, 'abertura de chatbot'],
  ['staged', STAGED, 'corrida de entrada'],
  ['residue', RESIDUE, 'resto de conversacion'],
  ['limit', LIMIT, 'admision de limite de conocimiento'],
  ['contrast', CONTRAST_EN, 'contraste not X but Y'],
  ['contrast', CONTRAST_ES, 'contraste no X sino Y'],
  ['banner', BANNER, 'banners de seccion en codigo'],
  ['emoji', EMOJI_BULLET, 'bullet con emoji'],
  ['emoji', EMOJI, 'emoji en el texto'],
  ['bold', BOLD_LABEL, 'lista con label en negrita'],
  ['attribution', AI_ATTRIBUTION, 'trailer de coautoria de IA'],
  ['tests', UNVERIFIED_TESTS, 'dice que los tests pasan sin nombrar el comando'],
];

// Reglas que salen de la lista de palabras: no aplican a los archivos de
// instrucciones de una skill, porque esos las nombran para explicarlas.
const FROM_VOCABULARY = new Set([
  'opener', 'staged', 'residue', 'limit', 'contrast', 'tests', 'attribution',
]);

function skillRootOf(abs) {
  let dir = dirname(abs);
  for (let i = 0; i < 4 && dir !== dirname(dir); i++) {
    if (existsSync(join(dir, 'SKILL.md'))) return dir;
    dir = dirname(dir);
  }
  return null;
}

function vocabularyApplies(name, strict) {
  if (strict) return true;

  const abs = resolve(name);
  const root = skillRootOf(abs);
  if (!root) return true;

  const rel = relative(root, abs).split(/[\\/]/).join(sep);
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

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function checkFile(name, text, strict) {
  const raw = text.split('\n');
  const lines = strip(raw);
  const isCode = CODE_EXT.test(name);
  const vocabulary = vocabularyApplies(name, strict);
  const found = [];

  raw.forEach((line, i) => {
    const plain = lines[i];

    for (const [rule, pattern, message] of CHECKS) {
      if (isCode && !['banner', 'emoji'].includes(rule)) continue;
      if (FROM_VOCABULARY.has(rule) && !vocabulary) continue;
      if (pattern.test(plain)) found.push({ n: i + 1, rule, message, line: line.trim() });
    }

    if (!vocabulary) return;

    for (const word of BANNED_WORDS) {
      if (new RegExp(`(?<![\\p{L}])${escape(word)}(?:s|es|d|ed|ing)?(?![\\p{L}])`, 'iu').test(plain)) {
        found.push({ n: i + 1, rule: 'banned-word', message: word, line: line.trim() });
      }
    }

    const lower = plain.toLowerCase();
    for (const phrase of BANNED_PHRASES) {
      if (lower.includes(phrase)) {
        found.push({ n: i + 1, rule: 'banned-phrase', message: phrase, line: line.trim() });
      }
    }

    if (!isCode) {
      for (const word of plain.match(/\b[A-Z]{3,}\b/g) ?? []) {
        if (!CAPS_ALLOW.has(word)) {
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

export { checkFile, BANNED_WORDS };

function main(argv) {
  const strict = argv.includes('--strict');
  const files = argv.filter((a) => a !== '--strict');
  const targets =
    files.length && files[0] !== '--stdin'
      ? files.map((f) => [f, readFileSync(f, 'utf8')])
      : [['stdin', readFileSync(0, 'utf8')]];

  let errors = 0;
  for (const [name, text] of targets) {
    const found = checkFile(name, text, strict);
    if (!found.length) continue;

    console.log(`${name}`);
    for (const f of found) {
      errors++;
      const where = f.line ? `\n      ${f.line.slice(0, 100)}` : '';
      console.log(`  ${f.n}  ${f.rule}  ${f.message}${where}`);
    }
  }

  console.log(errors ? `\n${errors} para arreglar` : 'limpio');
  process.exit(errors ? 1 : 0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));