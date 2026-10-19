// Fuente unica del vocabulario.
//
// Las palabras, las frases y la tabla de sustituciones viven aqui. El checker
// las usa y `scripts/gen-banned.mjs` genera `references/banned.md` a partir de
// ellas. Antes eran dos copias a mano y por eso se drifting: la lista del
// script tenia ocho palabras que el documento no mencionaba, y el documento
// tenia una frase ("here's what you need to know") que el script no buscaba.
//
// Edita este fichero, no `references/banned.md`. Despues: `npm run banned`.

export const WORDS_EN = [
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
];

export const WORDS_ES = [
  'aprovechando', 'potenciando', 'revolucionario', 'sin precedentes',
  'en el mundo actual', 'en el mundo de hoy', 'en resumen', 'en conclusión',
  'vale la pena destacar', 'es importante destacar', 'sin duda alguna',
];

export const PHRASES_EN = [
  "in today's", "let's dive", 'at its core', 'in the realm of', "here's the thing",
  "here's the deal", 'here\'s what you need to know', 'without further ado',
  'in a nutshell', 'buckle up', 'the bottom line is', 'at the end of the day',
  "it's worth noting", "it's important to note", 'when it comes to', 'this is where',
  'unlock the power', 'take it to the next level', 'streamline your',
  'supercharge your', 'bridge the gap', 'move the needle', 'in conclusion',
];

export const PHRASES_ES = [
  'nada más:', 'solo eso:', 'aprovechando el avance',
];

// Aberturas. Se comparan con un limite de palabra al final, asi que "sure" no
// casa con "surely".
export const OPENERS = [
  'certainly', 'sure', 'of course', 'absolutely', 'great question', 'great point',
  "i'd be happy to", 'honestly?', 'honestly', 'look', 'real talk', "here's the thing",
  "here's what you need to know", 'without further ado',
];

// Corridas de entrada. Llevan coma o dos puntos detras, asi que "Overall" al
// final de un parrafo no salta.
export const STAGED = [
  'overall', 'in conclusion', 'firstly', 'secondly', 'thirdly', 'additionally',
  'moreover', 'furthermore', 'notably', 'importantly', 'interestingly', 'indeed',
];

// Resto de conversacion. Fuente de regex, no palabras sueltas: "let me know if"
// solo es resto cuando sigue un "you want/need/have".
export const RESIDUE = [
  'i hope this helps',
  'hope this helps',
  'i hope this finds you well',
  'i hope this email finds you well',
  'as per my last email',
  "please don't hesitate",
  'let me know if you (want|need|have)',
];

// Admision de limite de conocimiento.
export const LIMIT = [
  'as of (my last|my knowledge)',
  'up to my last training',
  'to my (best )?knowledge',
  'based on available information',
  'is not publicly available',
  'likely',
];

export const CONTRAST_EN =
  /\b(?:not|doesn'?t|isn'?t|aren'?t) (just|only|merely)\b|\bit'?s not [^.]{0,60}, it'?s\b|\bnot only\b[^.]{0,80}\bbut\b/i;

export const CONTRAST_ES =
  /\bno es (solo|sólo)\b[^.]{0,80}\bsino\b|\bnada m[áa]s:\s|\bs[óo]lo (eso|esto):/i;

// Siglas que se aceptan sin explicar. Las del proyecto salen de
// `slop.config.json`.
export const CAPS_ALLOW = [
  'API', 'APIS', 'URL', 'URLS', 'CSS', 'JSON', 'HTTP', 'HTTPS', 'HTML', 'XML', 'DNS',
  'TLS', 'SSL', 'MV2', 'MV3', 'PNG', 'JPG', 'SVG', 'GIF', 'GPL', 'MIT', 'AI', 'UI',
  'UX', 'ID', 'PR', 'CI', 'CD', 'CLI', 'TUI', 'SDK', 'QA', 'CPU', 'GPU', 'RAM', 'OS',
  'DNR', 'DNT', 'SSR', 'CSRF', 'KV', 'SQL', 'CSV', 'RSS', 'IPC', 'TTY', 'EOF', 'PID',
  'ERR', 'DB', 'ORM', 'CRUD', 'GC', 'JVM', 'DNS', 'TLS', 'MIME', 'UTF8', 'UTF-8',
  'README', 'ADR', 'CHANGELOG', 'LICENSE', 'JSONL', 'TOML', 'YAML', 'MD',
  'TODO', 'FIXME', 'NOTE', 'WIP',
];

// Sustituciones. Una regla que prohibe sin dejar alternativa escribe un
// relleno; esta tabla es la alternativa.
export const REPLACEMENTS = [
  ['delve into', 'look at, read'],
  ['leverage', 'use'],
  ['robust', 'works, handles, the failure mode is'],
  ['seamless', 'works without config'],
  ['comprehensive', 'the full list is in X'],
  ['underscore / highlight', 'name it, or drop the sentence'],
  ['at its core', 'the thing is'],
  ['in conclusion', 'cut it, or state the fact'],
  ["it's worth noting", 'cut it, or state the fact'],
  ['robust and scalable', 'what it does and what breaks'],
  ['game-changer / game-changing', 'delete the adjective'],
  ['groundbreaking / unprecedented', 'delete it'],
  ['excited / thrilled / delighted', 'cut the line'],
  ['proud to announce', 'cut it'],
  ['milestone', 'name the change'],
  ['thank you to our amazing community', 'cut the thanks list'],
  ['peace of mind', 'name the guarantee'],
  ['likely', 'drop it, or say what you measured'],
  ['showcasing / highlighting / emphasizing', 'name it, or drop the sentence'],
  ['sin duda alguna', 'delete'],
  ['en resumen', 'delete, or the last line was already the summary'],
  ['vale la pena destacar', 'delete'],
  ['aprovechando / potenciando', 'name the thing you used'],
];
