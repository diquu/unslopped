# Patterns

Each one is a default choice a model makes for everyone at once. The rule is to
write for one reader on one subject.

Source: Wikipedia's "Signs of AI writing" (CC BY-SA 4.0) and reviews of model
prose. The descriptions here are paraphrased, not copied. See README.md.

## Staging

### not X but Y

The negative half names something nobody claimed, so the positive half sounds
bigger. Use the contrast only when the reader actually believes the wrong half.

```
It doesn't just block ads, it transforms your browsing experience.
Blocks ad trackers. Browsing gets faster.
```

Spanish: `no es solo X sino Y`, `nada más:` at the end of a sentence.

### One-line closers

A short paragraph that repeats the one before it. Keep it only if it adds a
consequence the reader can act on.

```
Caching cuts render time.
That distinction matters.
Delete it.
```

### Aphorisms

An ordinary point dressed as a hidden truth.

```
At its core, the real question is whether privacy survives convenience.
Privacy survives convenience when nothing blocking login is on the list.
```

### Staged openers

Announce the point instead of making it.

```
Let's dive in. Here's the thing. Honestly?
Here's what it blocks, and what it leaves alone.
```

### Arguing with no one

A rejection of an objection that appears nowhere else. Usually leftovers from a
previous draft.

```
This isn't mainly about speed, and I'm not saying the design is perfect.
It stops trackers that no page needs to render.
```

## Rhythm by rule

### Triads

Three items because three sounds finished. Use the number the content has.

```
Fast, private and reliable.
Blocks in under a millisecond. Nothing leaves the machine.
```

### Repeated openings

Three sentences starting the same way.

```
The list updates. The list is long. The list is GPL.
Lists refresh every 6h. EasyPrivacy has 43k hosts, so 28k load.
```

### Dashes

One dash per 500 words is the budget. A dash is a way to skip deciding how two
clauses relate.

```
The rules file — generated, not hand written — ships with the extension.
The rules file ships with the extension. `tools/icons.js` generates it.
```

Code, paths and identifiers keep their hyphens and dashes.

### Stacked qualifiers

```
It could potentially possibly be argued that this might have some effect.
This may reduce latency.
```

### Hyphenated pairs

Keep the hyphen before the noun, drop it after.

```
A well-documented, real-time, long-term solution.
The docs are well documented and the results arrive in real time.
```

### Passive

```
Configuration is done through the popup.
You configure it in the popup.
```

## Inflation

### Significance

```
This marks a major milestone in the evolution of extension privacy.
Chrome's rule cap forced a design decision, and here it is.
```

### Sales language

```
nestled, breathtaking, renowned, a rich heritage
Gonder is a town in the Thimphu district.
```

### Borrowed authority

```
Experts argue that blocking trackers matters.
Nobody in the thread measured it. Here is the measurement instead.
```

### -ing riders

```
showcasing, highlighting, ensuring, reflecting
The screenshot shows the blocked requests.
```

### Avoiding is/are/has

```
The extension offers support for custom rules.
The extension has custom rules.
```

## Formatting

### Bold as decoration

```
- **Performance:** fast
- **Privacy:** none
Cuts render time. Sends nothing.
```

### Decorative headings

Title Case every word, arrows next to items, a rule between sections.

```
## 🚀 Getting Started
```

Sentence case, no emoji, no horizontal rules.

### Heading repeated by the first line

```
## Performance
Rendering got faster.
Users hit 200ms where they used to hit 800ms.
```

### Writing about the document

```
This section explains how the rules were assembled.
The conversion drops lines whose options it cannot translate.
```

### Re-explaining what the reader knows

A reply that rebuilds the whole context before the decision. The reader already
has it. Lead with the decision, keep the one fact they'd change their mind
about.

## Code

| Trap | Write instead |
| --- | --- |
| `// Increment the counter` | nothing |
| `// TODO: refactor this` | the issue link |
| `// STEP 1: VALIDATE` | nothing |
| `// ===== Helpers =====` | a blank line |
| `userDataArray`, `configObject`, `resultList` | `user`, `config`, `results` |
| `getUserData(id)` that only forwards | `getUser(id)` or inline it |
| `isProcessing` flag with no second reader | delete the flag |
| emoji in a comment | nothing |
| docstring that restates the signature | the types are the signature |
| `try {} catch (e) {}` around a call that can't throw | delete |

## Commits

Subject is imperative, lowercase, under 72 chars, one change. The body explains
why, not what. No "fixed the bug", no restated diff, no emoji, no co-author
trailer, no bullet list of files.

```
webhook retries: stop after 5xx, keep going on 4xx

the api answered 422 for a malformed token and the loop kept retrying
for 40s. not worth a retry
```

## UI copy

Buttons name the action: "Guardar", not "Enviar". Errors say what happened and
what to do next. Empty states say why it's empty. No exclamation marks, no
"Invalid input!".

## Prompts

No "You are an expert", no "Let's think step by step", no "provide a detailed and
comprehensive response". Give the model the facts it lacks and the output shape
it owes.

## Logs and CLI

One line per event, no prose. Errors name the cause. Progress says what's
happening now, not what just happened. Exit codes do the explaining.