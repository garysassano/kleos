# 0012 · A design can declare settings; A07 and A08 became settings of A05

Date: 2026-11-07

## Context

A05 (ecosystem roll-up, owners under each ecosystem) was followed by A07 (top repos under each ecosystem) and A08 (owners with their top repos). All three were one renderer with two hard-coded choices: whether owners are listed, and how many repos go under each line. [0009](0009-outcomes-option.md) kept layout choices out of configuration, but three near-identical catalog entries, each fixing a different combination, scale worse than letting the card's user choose.

## Decision

- **A design may declare settings** (`settings` in `src/designs/types.ts`): a name, a description, a default, and bounds for numbers. A setting is a switch (yes or no) or a whole number. Most designs declare none.
- **Settings follow the design's id** in the Action's `designs` input: `designs: D01 A05 owners=no repos=3`. A setting a design doesn't declare, a value of the wrong kind or out of bounds, a setting before any id, or a design listed twice fails the run with an error naming the design and the setting.
- **A05 has two settings:** `owners` (default yes: every owner under its ecosystem) and `repos` (default 0, at most 10: top repos under each owner, or under the ecosystem when there is no owner line). The defaults are A05 as it was. `owners=no repos=3` is A07 and `repos=3` is A08, byte for byte apart from the card's accessible title.
- **A07 and A08 are retired** and never reused (`RETIRED` in `src/designs/index.ts`). Asking for one fails with the A05 settings that replace it.
- **The catalog shows each design once, at its defaults,** with its settings in a table under the picture and one example of the syntax. Extra pictures per combination would make the catalog longer without telling a reader more than the table does.
- **The tests render every design at its defaults and at each combination in its `testedSettings`,** in both themes, from all three fixtures, at every outcomes level.

## Why

- The variants were real and already built; one design with two settings keeps them all without three catalog entries to keep in step.
- Settings sit next to the card they change, so a workflow reads as a list of cards, each with its own adjustments.
- Settings are added per design only when a design has variants worth choosing between. Colors, titles and general row counts are still left out, for the reasons in 0009.
