# Git and GitHub

Everything here lands in a repository, which means it gets read by strangers,
reviewed by people with no context, and trusted more than it should be. The
failure mode is not bad grammar. It is a commit that sounds conclusive about code
nobody ran.

## Language

Write the artifact in the language the request came in. He writes in Spanish and
English, sometimes mid-sentence, and a Spanish request answered in English is a
bug, not a style choice.

## Invented rationale

The version that survives every round of fixes: real numbers attached to a made
up reason.

```
The margin of 2000 rules above Chrome's limit leaves room for your own rules.
```

Nobody decided the cap was 28000 instead of 30000, and no margin was designed.
The number was real and the reason was invented, which is harder to notice than
an invented number.

When you catch yourself writing "so that", "which leaves", "to leave room for",
check whether anything actually decided that. If not, cut the clause.

The mirror image costs the same trust. A PR body from a run with this skill
loaded said the checker "was not run against privacy.txt or easyprivacy.txt",
which was false, because it had been run against both. Inventing a gap to look
careful is not rigour.

## Length

Another run produced a PR body 2.6 times longer than the one without the skill,
most of it a file-by-file tour in bullets. Thoroughness is not usefulness. For a
change this size, roughly 170 words; a body that needs more is usually carrying
a number nobody measured.

A bullet list earns its place only when each bullet carries a reason. Otherwise
it is the list of changed files that the pull request section forbids.

## Repo description

One line of plain words. The most slop-prone line in the repo and the least
often reviewed.

```
Blocks analytics, crash reporters, session replay and ad pixels. MV3, no build step.
A CLI that converts CSV to a markdown table.
```

If it needs a feature list, that is the README's job.

## Commits

Subject: imperative, lowercase, under 72 characters, no period, one change.

```
webhook retries stop after 5xx and keep going on 4xx
```

Not `Update Webhook Handler`. Not `Fixed a bug where the webhook would retry on
4xx`. Not `feat: add robust retry logic with exponential backoff for resilience`,
which is the AI default: a prefix, an adjective, and a noun that could belong to
twenty other repos. If the repo already uses conventional commits, match it. If
it does not, do not import one.

Body: what the reader cannot get from the diff. The cause, the constraint, the
thing that was measured, the thing that turned out to be wrong.

```
stop retrying on 4xx instead of 5xx

the api answered 422 for a malformed token and the loop kept going for
40s before giving up. not worth a retry
```

Skip: a bullet list of changed files, "this also fixes #412" when the subject
links it, "no breaking changes" when nothing is breaking, "all tests pass" with
no command, and `Co-Authored-By` trailers. They did not co-author it.

Three lines is usually the whole body. A body that always exists ends up
restating the subject in longer words.

A refactor and a bug fix are two commits even when they touch the same file. A
subject that needs the word "and" is two commits.

Mirrored tautology, two halves saying the same thing with different words:

```
its 150 curated hosts are the ones that must not be the ones lost when the
list gets cut
```

The curated hosts are not the ones that get lost. Stop there.

## README

Four questions, in order. Stop when they are answered: what it is, how to run
it, how to configure it, where to file a bug.

Never: a centered logo header, a wall of badges, a features section that
restates the description, a "why?" section that sells, a table of contents under
200 lines, emoji in a heading, a horizontal rule between sections, "coming soon".

Every project has limits, and limits are what a reader checks before installing.
A README with no limits reads like marketing.

Numbers come from something you ran. When a limit forced a decision, say it with
the number, because that is the interesting part.

## Release notes

One line per change a user would notice, grouped under `added`, `changed`,
`fixed`. No version-number story, no "we're excited to announce", no thanks list
duplicating `git log`, no sentence saying the release is out.

```
## 0.2.0

added
- popup with a master switch and a field for your own domains
- subscription to the uBlock and EasyPrivacy lists, refreshed every 6h

fixed
- deleting a custom rule left the rules below it registered under the wrong id
```

## Pull requests

Three sections at most: what changed, why if the title does not say it, how you
verified it. The third is what makes a PR reviewable, and it means naming the
command and its output. Say what you did not verify too.

Do not open by restating the title as a sentence. The title is the title.

Skip `## Summary` with a bulleted list of files, "this PR addresses #412",
checklists of things that did not change, and screenshots for a change with no
UI.

## Issue titles and branches

Issue titles carry the symptom, so they stay searchable:

```
Adding a rule leaves a blank row and the delete button does nothing
```

Not `Bug in popup list rendering`, which matches a hundred closed issues.

Branches: lowercase, slash separated, naming the change. No `feature/` prefix
unless the repo uses them everywhere, no ticket number unless asked.

## Before committing

1. Run the checker on anything that became a file.
2. `git status`, `git diff`, `git log --oneline -10`. Match the repo's existing
   subject style instead of importing one from here.
3. Read the subject alone. It should say what changed without the body.
4. `.gitignore` before the first commit. Never commit `.env`, keys, tokens,
   build output, or whatever the tooling dropped in the folder.