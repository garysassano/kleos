# 0009 · An `outcomes` option controls how much PR outcome detail a card shows

Date: 2026-11-07

## Context

Showing how many PRs were not merged, or were closed, can read as a list of failures on a public profile. Some people are happy to show it, and others aren't. 34 of the 48 designs show merge data in some form.

## Decision

A card takes one option, `outcomes`:

| Level      | Shows                                                            | Never shows                                                       |
| ---------- | ---------------------------------------------------------------- | ----------------------------------------------------------------- |
| `original` | each design exactly as designed; this is what the catalog shows  | n/a                                                               |
| `none`     | PRs as one number                                                | merged, open, closed, merge rates                                 |
| `merged`   | PRs, with merged PRs highlighted as a subset ("of which merged") | labels for the rest ("not merged", "closed", "open"), merge rates |
| `full`     | merged, still open, and closed without merging, separately       | nothing hidden; merge rates allowed                               |

`original` is what you get when nothing is set, and it can also be chosen explicitly, so it stays available whatever the config default becomes. It keeps each design's own framing (some say "not merged", some show merge rates). The other three levels converge: they go through one shared helper, so every design reads and colours them the same way. A test checks that `original` is byte-identical to the committed catalog, so adding levels can never change how the designs look by default. Which level a config uses by default is decided with the config file. If the converged levels prove enough, `original` can be removed later.

- **One helper decides what each level shows:** `src/kit/outcomes.ts` (`prParts`, `prLegend`, `mergeRate`). Designs keep their own colours and map each part to one.
- **Closed-unmerged PRs are a neutral grey,** not red, so even `full` doesn't paint them as failures.
- **Designs whose whole subject is outcomes** (F02 PR outcomes, H03 merge funnel) declare the levels they support. Asking for an unsupported level is a config error.
- **The tests render every design at every level it supports,** and check the visible wording: `none` may not mention merging, and `merged` may not label PRs as not merged, closed or open.

## Why

- It's the one display choice that's about how a person wants to come across rather than about looks, so it belongs in config.
- Visual options such as colours, titles, row counts and show/hide were left out on purpose. The owner can change code directly, and every extra option multiplies the combinations to keep looking right across 48 designs. They can be added later without breaking configs.

## Update, 2026-11-07: `original` removed, `full` is the default

`original` meant "whatever this design showed before the option existed", which differs from card to card, so its name told a reader nothing. Measured against the three levels, 18 designs show no PR outcomes at all, 7 already looked exactly like `merged`, and most of the other 23 showed merged against "not merged". That is `full`'s information, without the split into open and closed.

- **Three levels remain:** `none`, `merged` and `full`, and `full` is the default for the catalog and the Action.
- **Every design must support `full`.** F02 and H03 support only `full`.
- **The per-design code for the old look was deleted.** Before deleting it, every design was rendered at all three levels from all three fixtures, and the output was byte-identical before and after.
- The catalog now shows `full`, so some cards changed wherever a design had its own wording, such as "PRs open or closed" or a merge rate.
