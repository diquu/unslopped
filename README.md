# unslopped

<img src="https://skills.sh/b/fxledev/unslopped" alt="Skills" height="28">

One skill that has to be loaded before anything a human reads, including
everything that lands in git, plus a checker that fails the run when a draft
still smells generated.

The rules were already here, scattered across six skills. Two things were
wrong. Nothing enforced them, so a banned list in a second file went unread and
a prohibition like "never say that word" left nothing to write instead. And the
failures that mattered were not style: a PR body claiming a service worker had
been reviewed by hand when it had never been run.

## install

```
npx skills add fxledev/unslopped -g
```

The `-g` matters. Without it the CLI picks the scope from your current
directory, so running it inside a repo drops the skill in `.agents/skills/` of
that repo and writes a `skills-lock.json` next to it.

Works on opencode, Claude Code, Cursor, Codex and the rest of the agents the CLI
knows about. It installs to `~/.agents/skills/unslopped`, and opencode loads
that path on startup along with `AGENTS.md`. Restart after installing.

`npx skills update` reports this skill as not installed, because the install
does not land in `skills-lock.json`. Refresh by running the add command again.

Prefer the repo by hand? Copy the folder to `~/.config/opencode/skills/unslopped`.
One copy only: two installs of the same skill both show up in the agent's skill
list with the same name.

## layout

The skill lives under `skills/unslopped/`, which is the layout the registry
indexes.

```
skills/unslopped/
├── SKILL.md                the gate, the invention rule, the prose rules, routing
├── references/banned.md    vocabulary and what to write instead (generated)
├── references/patterns.md  the prose tells with before/after, per area
├── references/git.md       commits, READMEs, repo descriptions, PRs, releases, branches, issues
├── scripts/vocab.mjs       the vocabulary, the single source
├── scripts/slop.mjs        the checker
├── scripts/gen-banned.mjs  writes references/banned.md from the table
├── scripts/score.mjs       grades an eval directory against assertions
├── scripts/hook.mjs        the pre-commit gate
├── tests/run.mjs           the suite that keeps the rules alive
├── tests/fixtures/         bad drafts the checker has to fail, and the ones that pass
└── evals/evals.json        the prompts, including the ones that should not trigger
```

## usage

From the repo root:

```
node skills/unslopped/scripts/slop.mjs README.md
node skills/unslopped/scripts/slop.mjs --stdin < draft.txt
node skills/unslopped/scripts/slop.mjs --strict README.md
node skills/unslopped/scripts/slop.mjs --json README.md
node skills/unslopped/scripts/slop.mjs --commit .git/COMMIT_EDITMSG
node skills/unslopped/scripts/slop.mjs docs/
node skills/unslopped/scripts/score.mjs <workspace-dir>
```

From the installed copy the path is `~/.agents/skills/unslopped/scripts/slop.mjs`.

| flag | does |
| --- | --- |
| `--stdin` | reads the draft from the standard input |
| `--strict` | applies the vocabulary to files that are themselves rule files |
| `--commit` | the file is a commit message, not prose |
| `--json` | output a machine can read, for CI |
| `--quiet` | prints the count and nothing else |
| `--list-rules` | prints the rule ids and exits |

A directory is walked, and only `.md`, `.mdx`, `.markdown`, `.txt` and `.rst`
files are read. `node_modules`, `.git`, `dist`, `build`, `out`, `vendor` and
friends are skipped.

Exit codes: `0` clean, `1` there are findings, `2` the run could not happen
(missing file, bad option, unreadable config). The difference between `1` and
`2` matters in CI, where `1` is a red build and `2` is a broken script.

`--strict` forces the vocabulary rules onto files that are themselves rule
files, which is how you lint the other skills in your config. The vocabulary
list stays exempt in every mode: it names every banned word because that is
its job.

## the gate on a commit

The rules in `references/git.md` that can be looked at are now looked at.
`--commit` reads a commit message and complains about an uppercase subject, a
subject over 72 characters, a subject that only says "fix a bug", a subject
that needs the word "and", a body that lists the changed files, "no breaking
changes", and an issue closed in the body but not named in the subject. The
vocabulary rules apply to the message too.

To have the gate run on every commit of a repo:

```
git config core.hooksPath .githooks
```

The hook checks the staged text files and the message. It exits with `1` and
prints what to fix.

## project config

A project can say what it means. `slop.config.json` in the working directory:

```json
{
  "allowCaps": ["K8S", "ORM"],
  "ignore": ["docs/generated/**"],
  "commitPrefixes": ["feat", "fix", "chore"]
}
```

`allowCaps` adds acronyms to the list that passes without explanation.
`ignore` drops paths from the run. `commitPrefixes` are the prefixes a subject
may carry, and the default list is the usual one.

## what the checker catches

Em dashes and `--`, banned words and phrases in English and Spanish, chatbot
openers, staged openers, chat residue, knowledge-limit admissions, "not X but Y"
in both languages, section banners in code, emoji, bold labels on list items,
unexplained acronyms in caps, `Co-Authored-By` trailers naming a model, and a
claim that the suite is green when the file names no command.

That last one needs a command to sit next to. "All tests pass." in a file that
also runs `npm test` is a claim with evidence, and the checker leaves it alone.
The same sentence in a file with no command is flagged.

## what it does not catch, and the four rounds that proved it

Sales language, borrowed authority, significance dressing, headings that repeat
their first line, code that reads like a template, and any fact about your
project that nobody verified. Those need the by-hand pass in `patterns.md` and
`git.md`.

Four A/B rounds, ten subagents per round at most, on his own projects:

| round | prompt | result |
| --- | --- | --- |
| 1 | release notes | 104 words became 50. The no-skill draft invented two changelog details |
| 1 | landing page | 366 words became 220. The no-skill draft claimed the lists were tested against real sites and that the extension showed each blocked request |
| 2 | repo description | the no-skill draft was silent about History storing visit times, not attention time |
| 3 | five git surfaces | zero difference on the checker. Ten outputs, all clean, with and without the skill |
| 4 | two evals with the answer removed from the prompt | no measurable difference, and the with-skill commit refused to write a message because the diff was not there |

Round 3 is the important one. The model default on git metadata is already
decent, the mechanical rules catch almost none of it, and an eval whose prompt
hands over the caveat just measures whether the model repeats itself. What the
skill actually fixed, across all four rounds:

- a fabricated verification claim in a PR body
- an invented rationale attached to real numbers: "the margin of 2000 leaves
  room for your own rules"
- output drifting into English on a Spanish request
- a PR body opening with its own title as a subject line
- a mirrored tautology: "the ones that must not be the ones lost"

It also introduced two failures of its own, both now fixed in `git.md`: a PR body
2.6 times longer than the baseline, and a claim that the checker had not been
run against the two filter lists when it had.

## tests

```
npm test
```

`tests/run.mjs` is the suite. It holds the checker to the numbers in this
README, and when a rule stops working it says which one instead of printing a
total that moved for no visible reason.

`tests/fixtures/slop.md`, `pr-body.md` and `release-notes.md` are the AI
defaults. The checker has to fail all three, and the contract is the count per
rule, not the total: 25 findings on the first one, 7 on the second and 12 on
the third. A rule that stops firing changes one of those numbers and the suite
names it.

`tests/fixtures/wrong-shapes.md` passes the checker on purpose. It reads fine and
is still wrong, which is the part that needs judgment. Its "Tests are all passing
and the change is ready to merge" sits next to a real command and its output, and
the commit that follows admits nothing was run in the session.

`tests/fixtures/clean.md` is the other side: prose that has to stay clean, so a
rule that starts shouting at normal sentences fails the suite.

`tests/fixtures/tests-with-command.md` and `tests-without-command.md` are the
same sentence with and without the command next to it. The pair is what proves
the verification rule discriminates instead of flagging every mention of a test
suite.

`tests/fixtures/commit-bad.txt` and `commit-good.txt` do the same for commit
messages. The bad one carries the defaults: an uppercase subject, a body that
lists the files, "no breaking changes", a claim that the suite is green, an
issue closed in the body and a co-author trailer. The good one is a commit
that says what changed and why.

The suite also covers the parts that are easy to break and hard to notice: a
missing file has to exit with `2` and a message instead of a stack trace, a
directory has to be walked, an empty file has to be read without a crash, the
JSON output has to parse, the pre-commit gate has to block a bad commit in a
real repository, and `score.mjs` has to be able to fail.

`npm run banned` rewrites `references/banned.md` from the table in
`scripts/vocab.mjs`. The suite fails when the committed file and the generated
one differ, so the list in the document and the list in the checker cannot
drift apart.

## resolved drift

`anti-ai-slop-writing/references/banned-words.md` used to be a second copy of
the vocabulary list, and `no-fluff-review` pointed at it. Both now point here and
the copy is gone. If a second list shows up again, one of them is going to drift.

The same hazard was inside this repo: `references/banned.md` was a hand written
copy of the list inside `scripts/slop.mjs`, and it had already drifted. The
script had eight words the document did not mention, and the document had a
phrase the script never looked for. Now there is one list, in
`scripts/vocab.mjs`, and the document is generated from it.

## credits

The tells are not mine. They come from Wikipedia's
[Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing)
and reviews of model prose, both CC BY-SA 4.0, paraphrased rather than copied.
The git conventions come from the `commit-messages` and `readme-and-prs` skills
that used to cover this surface separately.

## license

MIT.

Share-alike applies if you copy substantial text from Wikipedia into this
folder or into anything you distribute from it. The attribution above stays
either way.
