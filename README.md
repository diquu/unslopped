# unslopped

One skill that has to be loaded before anything a human reads, including
everything that lands in git, plus a checker that fails the run when a draft
still smells generated.

The rules were already here, scattered across six skills. Two things were
wrong. Nothing enforced them, so a banned list in a second file went unread and
a prohibition like "never say seamless" left nothing to write instead. And the
failures that mattered were not style: a PR body claiming a service worker had
been reviewed by hand when it had never been run.

## install

Copy this folder to `~/.config/opencode/skills/unslopped` and restart
opencode. Skills and `AGENTS.md` load at startup.

## layout

```
SKILL.md                the gate, the invention rule, the prose rules, routing
references/banned.md    vocabulary and what to write instead
references/patterns.md  the prose tells with before/after, per area
references/git.md       commits, READMEs, repo descriptions, PRs, releases, branches, issues
scripts/slop.mjs        the checker
scripts/score.mjs       grades an eval directory against assertions
tests/fixtures/         bad drafts the checker has to fail, and one that passes
evals/evals.json        the prompts, including the ones that should not trigger
```

## usage

```
node scripts/slop.mjs README.md
node scripts/slop.mjs --stdin < draft.txt
node scripts/slop.mjs --strict README.md
node scripts/score.mjs <workspace-dir>
```

`--strict` forces the vocabulary rules onto files that are themselves rule
files, which is how you lint this repo and the other skills in your config.

## what the checker catches

Em dashes and `--`, banned words and phrases in English and Spanish, chatbot
openers, staged openers, chat residue, knowledge-limit admissions, "not X but Y"
in both languages, section banners in code, emoji, bold labels on list items,
unexplained ALL CAPS, `Co-Authored-By` trailers naming a model, and "all tests
pass" with no command in sight.

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

`tests/fixtures/slop.md`, `pr-body.md` and `release-notes.md` are the AI
defaults. The checker has to fail all three: 26, 7 and 12 findings.

`tests/fixtures/wrong-shapes.md` passes the checker on purpose. It reads fine and
is still wrong, which is the part that needs judgment. Its "Tests are all passing
and the change is ready to merge" sits next to a real command and its output, and
the commit that follows admits nothing was run in the session.

## resolved drift

`anti-ai-slop-writing/references/banned-words.md` used to be a second copy of
the vocabulary list, and `no-fluff-review` pointed at it. Both now point here and
the copy is gone. If a second list shows up again, one of them is going to drift.

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