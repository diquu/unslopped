# Banned vocabulary

Generated from `scripts/vocab.mjs` by `scripts/gen-banned.mjs`. Edit the
table, not this file: `npm run banned` rewrites it, and the test fails when
the committed file and the generated one drift apart.

If the script flags a word that is correct in context, argue with the word, not
the rule: use the concrete alternative.

## Words

delve, tapestry, testament, vibrant, pivotal, crucial, intricate
meticulous, bolster, garner, underscore, interplay, multifaceted, nuanced
foster, leverage, utilize, commence, facilitate, encompass, paramount
groundbreaking, cutting-edge, game-changer, game-changing, transformative
seamless, robust, comprehensive, endeavor, endeavour, revolutionize
revolutionise, disruptive, holistic, synergy, excited, thrilled, delighted
proud to announce, milestone, thank you to our amazing, amazing community
peace of mind, aforementioned, harnessing, spearheading, showcasing
highlighting, emphasizing, enhancing, unprecedented, remarkable, stunning
profound, thought leader, value proposition, moving forward, circle back
rest assured, goes without saying

Spanish:

aprovechando, potenciando, revolucionario, sin precedentes
en el mundo actual, en el mundo de hoy, en resumen, en conclusión
vale la pena destacar, es importante destacar, sin duda alguna

## Phrases

"in today's", "let's dive", "at its core", "in the realm of"
"here's the thing", "here's the deal", "here's what you need to know"
"without further ado", "in a nutshell", "buckle up", "the bottom line is"
"at the end of the day", "it's worth noting", "it's important to note"
"when it comes to", "this is where", "unlock the power"
"take it to the next level", "streamline your", "supercharge your"
"bridge the gap", "move the needle", "in conclusion"

Spanish:

"nada más:", "solo eso:", "aprovechando el avance"

## Openers

certainly, sure, of course, absolutely, great question, great point
i'd be happy to, honestly?, honestly, look, real talk, here's the thing
here's what you need to know, without further ado

## Staged openers

overall, in conclusion, firstly, secondly, thirdly, additionally, moreover
furthermore, notably, importantly, interestingly, indeed

## Chat residue

"i hope this helps", "hope this helps", "i hope this finds you well"
"i hope this email finds you well", "as per my last email"
"please don't hesitate", "let me know if you (want|need|have)"

## Knowledge-limit

"as of (my last|my knowledge)", "up to my last training"
"to my (best )?knowledge", "based on available information"
"is not publicly available", "likely"

## Replacements

| Instead of | Write |
| --- | --- |
| delve into | look at, read |
| leverage | use |
| robust | works, handles, the failure mode is |
| seamless | works without config |
| comprehensive | the full list is in X |
| underscore / highlight | name it, or drop the sentence |
| at its core | the thing is |
| in conclusion | cut it, or state the fact |
| it's worth noting | cut it, or state the fact |
| robust and scalable | what it does and what breaks |
| game-changer / game-changing | delete the adjective |
| groundbreaking / unprecedented | delete it |
| excited / thrilled / delighted | cut the line |
| proud to announce | cut it |
| milestone | name the change |
| thank you to our amazing community | cut the thanks list |
| peace of mind | name the guarantee |
| likely | drop it, or say what you measured |
| showcasing / highlighting / emphasizing | name it, or drop the sentence |
| sin duda alguna | delete |
| en resumen | delete, or the last line was already the summary |
| vale la pena destacar | delete |
| aprovechando / potenciando | name the thing you used |
