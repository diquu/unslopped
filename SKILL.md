---
name: unslopped
description: Mandatory before any output a human reads or ships. Use when writing or editing prose, code, comments, commits, READMEs, PRs, release notes, branch names, issue titles, repo descriptions, UI strings, prompts, logs, or chat replies. Catches the AI defaults (seamless, robust, delve, "not X but Y", forced triads, em dashes, summary closers, bold label lists, Co-Authored-By trailers, "all tests pass" with no command) in English and Spanish, stops invention about your own project, and verifies the result with a mechanical checker. Load it even when the diff looks trivial, because that is exactly when the default output is worst.
license: MIT
---

# Stop AI-SLOP

Model prose drifts toward the token the average reader expects, and it invents
facts about your project to fill a sentence. The output reads like a template,
reads as confident, and neither is intentional. This skill swaps the default for
a specific choice, and checks the result with a script instead of leaving it to
judgment.

Anything a human will read counts, and that includes everything in git. Load this
before the channel skill.

## Procedure

1. Draft with the channel skill in hand.
2. Check it before delivering:

   ```
   node scripts/slop.mjs <file>
   node scripts/slop.mjs --stdin < draft.txt
   ```

   Exit 1 means something needs fixing. Fix it and run it again. `--strict`
   forces the vocabulary rules on files that are themselves rule files.
3. For anything longer than a screen, do the by-hand pass with
   `references/patterns.md`.
4. Deliver. Mention the check only when it failed and you need a decision from
   the user.

## Language

Write the artifact in the language the request came in. A Spanish request
answered in English is a bug. It is also the symptom of answering the shape of
the artifact instead of the question: one A/B run produced a flawless commit
message in the wrong language, and in English it also produced "its 150 curated
hosts are the ones that must not be the ones lost", which is the mirrored
tautology described below.

## Do not invent facts about your own project

This outranks every other rule here, because it survives all of them. It arrives
in fluent, confident prose and the reader has no way to tell.

Three rounds of A/B runs produced, without the skill: a landing page claiming the
filter lists were tested against real sites, a PR body claiming the service
worker output had been reviewed by hand when it had never been run, a repo
description silent about the fact that Chrome's History stores visit times and
not attention time, and a commit claiming green tests with no command.

So:

- A metric, a version, a vendor or a browser name only goes in if you saw it in
  the source, the git log, or the output of a command you ran.
- "Tests pass" only if you ran them here. Name the command and what it printed,
  and say what you could not check.
- Real numbers with a made up reason are the hardest case. Nobody decided the
  rule cap was 28000 instead of 30000, yet a PR body explained the missing 2000
  as headroom for the user's own rules. When you write "so that" or "which
  leaves", check whether anything actually decided that.
- Limitations belong in the README. They are the part readers trust.
- Do not write what you wish were true about your own project.

## Why each prose rule is here

Every rule is a reliable tell. Breaking one means choosing what the average
reader expects over what this reader needs.

**Vocabulary.** `references/banned.md` holds the words and the replacement
table, so a rule never leaves you with nothing to write instead.

**Contrast.** "Not X but Y" and "nada más:" inflate the positive half, because
the negative half names a belief nobody held.

**Closers.** A final line that restates the paragraph above asks the reader to
pause instead of telling them anything.

**Rhythm.** Four sentences of the same length in a row is the most measurable
tell there is. The script flags the runs.

**Triads.** Three items because three sounds finished. Use the count the content
has.

**Dashes.** One em dash per 500 words. A dash lets you skip deciding how two
clauses relate. Code, paths and identifiers keep theirs.

**Sales language and borrowed authority.** Experts argue, industry reports,
nestled in, a testament to.

**Formatting.** Bold labels on list items, decorative headings, emoji, and a
heading that repeats its first line.

**Mirrored tautology.** Two halves saying the same thing with different words. It
reads as emphasis and carries nothing.

## Git and GitHub

Commit messages, READMEs, repo descriptions, PR bodies, release notes, branch
names, issue titles, and any question about what the project does. The rules and
the worked examples are in `references/git.md`. Read it before writing any of
them: that surface has its own failure modes, and the two that matter are the
subject line that names a file and stops, and the verification claim nobody ran.

## Conflicts

`~/.config/opencode/voice.md` wins for chat replies and DMs. His clipped
lowercase is his register, not a defect, and this skill does not get to fix it.
Banned vocabulary applies everywhere.

## Routing

| Output | Load after this |
| --- | --- |
| chat replies, DMs | `voice-match`, `brevity` |
| docs, posts, articles, email | `anti-ai-slop-writing`, `plain-language` |
| source code, comments, tests | `anti-ai-slop-code`, `ponytail` |
| commits, PRs, releases, branches, issues, repo description | `references/git.md` |
| prompts, system messages, rubrics | `prompts` |
| endpoints, JSON, status codes, migrations | `api-design` |
| UI strings, buttons, errors, empty states | `ui-microcopy` |
| log lines, CLI help, errors, progress | `terminal-output` |
| UI and frontend systems | `ui-ux-pro-max` |
| auditing an existing artifact | `no-fluff-review` |

## Files

- `references/banned.md`: vocabulary and replacements.
- `references/patterns.md`: the prose tells with before/after, split by area.
- `references/git.md`: every surface that lands in git or GitHub.
- `scripts/slop.mjs`: the checker.
- `scripts/score.mjs`: grades an eval directory into a table.
- `tests/fixtures/`: bad drafts the checker has to fail, plus the one that
  passes on purpose because it needs judgment.
- `evals/evals.json`: the prompts, including the ones where the right answer is
  to leave the text alone.