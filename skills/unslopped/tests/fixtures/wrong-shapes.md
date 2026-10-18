# Shapes the checker cannot catch

The regex checker passes this file on purpose. These are the failures that read
fine and are still wrong, which is why they need judgment.

## Claims about a project that were never verified

From a landing page written for a blocker extension with no skill loaded:

```
Telemetry Blocker uses blocklists tested against real sites and only
intercepts what does not belong to the page. If a resource is essential, it
still loads.
```

Nothing tested the lists against real sites, and the extension does block
essential resources, which is why the list is conservative and why
`hosts.example` exists.

```
Does it work on banking and mail sites?

Yes. Sites that depend on third-party scripts are explicitly tested.
```

Nobody tested anything of the kind.

```
The extension shows every blocked request in the current tab.
```

It does not. The popup shows a count, and the answer to "what got blocked" is
DevTools.

## Fixes described as something other than what changed

```
## fixed
- duplicate or malformed rule ids were not applied and got overwritten by
  other rules
```

The ids were never malformed. They were derived from a list position, so
deleting one rule in the middle shifted every rule below it. Same genre of bug,
wrong specifics, and the release notes would have sent the next reader looking
in the wrong place.

## The absence of a fix

```
Tests are all passing and the change is ready to merge.
```

No test was run in that session. The honest version names the command:

```
node check.js
90 reglas estaticas ok
```

and says what was not checked:

```
could not verify in a browser: Chrome 155 ignores --load-extension on branded
builds, so the service worker was never exercised
```

## Quiet inflation

```
improved reliability
```

Which part, by how much, measured how. If the answer is "it is probably better",
the line does not go in.