# 0010 · One name per concept on every card

Date: 2026-11-07

## Context

The designs were written in several rounds by different hands, so the same concept had several names: owner, org, organization, user and people for an account; family, vendor, brand, company and group for a vendor's set of organizations; upstream and external for other people's repos.

## Decision

Cards, design titles and design descriptions name these concepts this way:

| Concept                                                                      | Name                                           |
| ---------------------------------------------------------------------------- | ---------------------------------------------- |
| An account that owns repositories                                            | **owner**: an **org** or a **person** (people) |
| A vendor's set of orgs (AWS: aws, aws-samples, …)                            | **ecosystem**                                  |
| An ecosystem, or an owner outside any ecosystem, when a chart groups by both | **group**, only in that sense                  |
| Other people's repos                                                         | **upstream**                                   |
| A PR that was accepted                                                       | **merged**                                     |
| A PR, issue or discussion the user opened                                    | **contribution**                               |
| Daily counts from GitHub's calendar (they include private work)              | **activity**, only for those                   |

- The code uses the same names: `Stats.ecosystems`, `EcosystemStats`, `DEFAULT_ECOSYSTEMS`.
- `test/designs.test.ts` rejects the other names (organization, user, family, vendor, brand, company, external) in every design's visible text, title and description, at every outcomes level. Repo names, owner logins and PR titles are data and are ignored.
- Word choice that doesn't name a concept, such as repo or repository and PR or pull request, is left to each design. The README and the docs are prose and are not bound by this list.

## Colors

The same holds for color. Every card colors the contribution types the same way, from `PALETTES` in `src/kit/svg.ts`; the category palettes take these entries from it instead of defining their own:

| Type                                | Color                                                                |
| ----------------------------------- | -------------------------------------------------------------------- |
| Merged PRs, or all PRs at `none`    | purple (`merged`)                                                    |
| Other PRs (at `merged`)             | a softer tint of the same purple (`pr`)                              |
| Open PRs (at `full`)                | a light purple (`open`)                                              |
| PRs closed without merging (`full`) | neutral gray (`closed`), never red ([0009](0009-outcomes-option.md)) |
| Issues                              | green (`issue`)                                                      |
| Discussions                         | blue (`discussion`)                                                  |

Purple for PRs and green for issues follow GitHub's icons. Discussions have no color on GitHub, so they take blue. Colors that stand for something else, such as one color per ecosystem in a treemap or a donut, are free, but a total or other neutral figure next to these types uses a neutral color, not blue.

## Why

The catalog is browsed card by card, and a profile shows several cards side by side. When one card says "families" and the next "ecosystems", readers wonder whether they're different things. The test exists because designs are often edited by agents, which reliably fix a failing test but don't always read a decision record.
