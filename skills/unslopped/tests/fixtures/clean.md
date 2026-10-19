# The checker reads this file, so it has to be clean. If it is not, every
# other test in the suite is measuring a broken baseline.
#
# The rules live in two places. The words and the phrases are in one table, and
# the replacements travel with them so a ban never leaves you with nothing to
# write instead.

## What the checker reads

Inline code stays out of the way. A command inside backticks is not a finding,
and neither is a path like `skills/unslopped/scripts/slop.mjs`.

Code blocks are skipped too.

```
node skills/unslopped/scripts/slop.mjs README.md
```

Lists are read as prose only when the items are sentences.

- The first item says something.
- The second item says something else.
- The third item closes the list.

## What it does not read

Quoted lines are skipped, because licenses and inherited notices live there.

> Copyright someone else.

The end.
