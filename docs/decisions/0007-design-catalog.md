# 0007 · Designs are a catalog of stable ids rendered from committed fixtures

Date: 2026-11-07

## Context

The first round produced 30 prototype designs across five directions. The owner wanted to keep all of them, grouped by category and named, and add more.

## Decision

- **One module per design**: `src/designs/<category>/<ID>-<slug>.ts`, exporting a `Design` with `id`, `slug`, `title`, `idea` and `render(stats, theme)`. Each category folder has an `index.ts` listing its designs in order, and an optional `_shared.ts` for helpers only that category uses.
- **Stable ids**: a category letter plus two digits (`A01`). Configs and conversations refer to ids, so an id is never reused or renumbered. A retired design keeps its id in the history.
- **Categories:**

  | Letter | Folder         | Name                    |
  | ------ | -------------- | ----------------------- |
  | A      | `lists`        | Ranked lists            |
  | B      | `charts`       | Charts                  |
  | C      | `type`         | Typographic             |
  | D      | `visual`       | Visual                  |
  | E      | `compact`      | Compact and dashboards  |
  | F      | `flows`        | Flows and networks      |
  | G      | `collectibles` | Badges and collectibles |
  | H      | `focus`        | Focus and stories       |

- **Fixtures are committed.** `fixtures/garysassano.json` is a real snapshot (2026-11-07), and `fixtures/sample-small.json` is a synthetic account: 6 repositories, 5 owners, 1 ecosystem, no avatars, no discussions. Every design must render from both, so no design depends on one person's data.
- **No user-specific literals in designs.** Where a design must choose something, such as which repository to spotlight or whether to break an axis, it picks by a rule stated in its `idea`. That rule can later become a config option.
- **The catalog is generated.** `pnpm gallery` writes `gallery/<category>/<ID>-<slug>-{dark,light}.svg`, `gallery/README.md` (every design with `<picture>`, so GitHub shows the matching theme) and `gallery/gallery.json`. The files are committed, so the catalog can be browsed on GitHub. They are never edited by hand.

## Update, 2026-11-07

The README and the catalog render from `fixtures/demo.json`, a fictional account with made-up users, organizations, repositories and generated avatars, built by `scripts/demo-fixture.ts`. Public examples shouldn't show the owner's own activity, and a fictional account can show every feature (two ecosystems, a long tail, discussions). The real snapshot stays as a test fixture.

Later the same day the owner chose to keep the real snapshot in the README and catalog while the designs are still being worked on, because judging a design is easier with familiar numbers. `DEFAULT_FIXTURE` in `src/stats/fixture.ts` switches to `demo` before launch.

## Why

- Stable ids let the owner say "A03 and D06" and mean the same thing a year from now.
- Committed fixtures make rendering reproducible and reviewable. A design change shows up as an SVG diff without network access.
- The synthetic fixture catches the most common failure of profile cards, which is looking right for the author and broken for everyone else.

## History

- **The 30 prototypes** (A–E) were written as plain JavaScript generators during exploration, then ported to TypeScript modules. Their output from the real fixture was compared byte for byte with the prototype output, and every intentional difference is listed in the commit that ported it.
- **F–H were added afterwards** to cover flows, playful formats and focused deep dives, especially contributions to one chosen ecosystem or repository.
