# Design catalog

50 card designs, each rendered in GitHub dark and light from the `garysassano` snapshot taken 2026-11-07. GitHub shows the variant that matches your theme.

Regenerate with `pnpm gallery`. Do not edit the files here by hand.

- [A · Ranked lists](#a--ranked-lists) (8)
- [B · Charts](#b--charts) (6)
- [C · Typographic](#c--typographic) (6)
- [D · Visual](#d--visual) (6)
- [E · Compact and dashboards](#e--compact-and-dashboards) (6)
- [F · Flows and networks](#f--flows-and-networks) (6)
- [G · Badges and collectibles](#g--badges-and-collectibles) (6)
- [H · Focus and stories](#h--focus-and-stories) (6)

## A · Ranked lists

Evolutions of a classic profile card: rows of repositories or owners with a breakdown of what you contributed to each.

### A01 · Repo leaderboard

Top 12 upstream repos ranked by PRs + issues + discussions, each with a stacked bar showing the mix (merged PRs, other PRs, issues, discussions) and the counts beside it. When the top repo has more than twice the runner-up's total, its bar is shortened and labeled with its true total and “not to scale”, so the other bars stay readable. With outcomes "none" PRs are one segment; "merged" highlights merged PRs within them; "full" splits them into merged, open and closed unmerged.

<picture><source media="(prefers-color-scheme: dark)" srcset="lists/A01-repo-leaderboard-dark.svg"><img alt="Repo leaderboard" src="lists/A01-repo-leaderboard-light.svg" width="840"></picture>

### A02 · Owner leaderboard

Top 12 orgs and people whose repos I contribute to, with repo count, a merged-PR gauge (merged of opened) and issue/discussion counts. Shows where PRs actually get merged versus where I mostly file issues. With outcomes "none" or "merged" the gauge becomes the PRs' share of each owner's total (merged highlighted at "merged"), with no rate; "full" splits the merge gauge into merged, open and closed unmerged.

<picture><source media="(prefers-color-scheme: dark)" srcset="lists/A02-owner-leaderboard-dark.svg"><img alt="Owner leaderboard" src="lists/A02-owner-leaderboard-light.svg" width="840"></picture>

### A03 · Repos | owners, side by side

Four headline numbers, then the top 10 repos and top 10 owners side by side. Each row has a 100% bar showing what kind of contribution it was (PR-heavy vs issue-heavy), so the number carries size and the bar carries character.

<picture><source media="(prefers-color-scheme: dark)" srcset="lists/A03-repos-and-owners-dark.svg"><img alt="Repos | owners, side by side" src="lists/A03-repos-and-owners-light.svg" width="840"></picture>

### A04 · Dense table

A compact 15-row table with explicit columns (stars, PRs, merged, issues, discussions, total, active years) and a totals row for all upstream repos. Nothing to decode: every number has a header. With outcomes "none" the merged column goes; "full" adds open and closed columns.

<picture><source media="(prefers-color-scheme: dark)" srcset="lists/A04-dense-table-dark.svg"><img alt="Dense table" src="lists/A04-dense-table-light.svg" width="840"></picture>

### A05 · Ecosystem roll-up

Groups related GitHub owners into ecosystems (AWS: aws, aws-samples, …) with the ecosystem total on top and member owners indented below, so an ecosystem spread across many orgs shows up as one line. A07 lists repos instead of owners, A08 both.

<picture><source media="(prefers-color-scheme: dark)" srcset="lists/A05-ecosystem-rollup-dark.svg"><img alt="Ecosystem roll-up" src="lists/A05-ecosystem-rollup-light.svg" width="840"></picture>

### A06 · Star tier vs my share

Star-tier letters (S+ to C) that say what they mean: the left side is the repo’s popularity (stars, log scale, tier letter), the right side is what I contributed there. Big repos with small bars and small repos with big bars become obvious. When the top repo has more than twice the runner-up's total, its bar is shortened and marked “not to scale”.

<picture><source media="(prefers-color-scheme: dark)" srcset="lists/A06-tier-vs-share-dark.svg"><img alt="Star tier vs my share" src="lists/A06-tier-vs-share-light.svg" width="840"></picture>

### A07 · Ecosystem roll-up by repo

A05 with repos instead of owners: each ecosystem's total on top and its top 3 repos by contributions indented below, each with its owner's avatar and its stars. An ecosystem with a single repo shows no rows below it.

<picture><source media="(prefers-color-scheme: dark)" srcset="lists/A07-ecosystem-rollup-repos-dark.svg"><img alt="Ecosystem roll-up by repo" src="lists/A07-ecosystem-rollup-repos-light.svg" width="840"></picture>

### A08 · Ecosystem tree

The full tree: each ecosystem, every owner in it, and each owner's top 3 repos by contributions. An owner with one repo names it on its own line instead; an ecosystem with one owner lists its top 3 repos directly.

<picture><source media="(prefers-color-scheme: dark)" srcset="lists/A08-ecosystem-tree-dark.svg"><img alt="Ecosystem tree" src="lists/A08-ecosystem-tree-light.svg" width="840"></picture>

## B · Charts

Bars, treemaps, donuts, scatter plots and stacked areas of the same numbers.

### B01 · Stacked bars + table

The top 12 upstream repos as horizontal stacked bars (merged PRs, other PRs, issues, discussions) with the exact counts in aligned columns that double as the legend. With outcomes "none" PRs are one segment and column, "merged" shows PRs with the merged ones as a subset, and "full" splits merged, open and closed-unmerged PRs.

<picture><source media="(prefers-color-scheme: dark)" srcset="charts/B01-stacked-bars-dark.svg"><img alt="Stacked bars + table" src="charts/B01-stacked-bars-light.svg" width="840"></picture>

### B02 · Treemap

Every upstream repo as a tile sized by contributions, nested ecosystem → owner → repo, so the shape of the whole footprint (a few dominant blocks, a wide ecosystem spread, a long tail) is visible at a glance. The seven largest groups get colors.

<picture><source media="(prefers-color-scheme: dark)" srcset="charts/B02-treemap-dark.svg"><img alt="Treemap" src="charts/B02-treemap-light.svg" width="840"></picture>

### B03 · Donut + ranked legend

Share of all upstream work by ecosystem or owner as a donut (seven largest groups plus everyone else), next to a ranked table with avatars, share and a PR/issue breakdown per group. The PR part of that breakdown follows the outcomes level: PRs only, PRs with merged ones, or merged, open and closed-unmerged.

<picture><source media="(prefers-color-scheme: dark)" srcset="charts/B03-donut-ranked-dark.svg"><img alt="Donut + ranked legend" src="charts/B03-donut-ranked-light.svg" width="840"></picture>

### B04 · Stars vs involvement

Each repo plotted by stars (log) against my contributions (log), colored by whether a PR was merged (with outcomes "none", only by whether I opened PRs; with "full", also open versus only closed-unmerged PRs); shows depth in mid-size repos versus drive-by issues on giant ones. Labels go to the 7 repos with most contributions, then the highest stars × contributions among repos with at least 3, up to 11 in all, each placed where it overlaps no other label and no other labelled repo's dot.

<picture><source media="(prefers-color-scheme: dark)" srcset="charts/B04-stars-scatter-dark.svg"><img alt="Stars vs involvement" src="charts/B04-stars-scatter-light.svg" width="840"></picture>

### B05 · Waffle

One square per contribution, grouped by ecosystem or owner, with merged PRs solid and everything else faded, so volume and code-vs-reports read together. With outcomes "none" every PR is solid; with "full" open PRs are outlined and closed-unmerged ones gray. Very large totals switch to one square per few contributions so the grid always fits.

<picture><source media="(prefers-color-scheme: dark)" srcset="charts/B05-waffle-dark.svg"><img alt="Waffle" src="charts/B05-waffle-light.svg" width="840"></picture>

### B06 · Contributions over time

Monthly contributions as a stacked area by ecosystem or owner, showing peaks and how the mix shifts between groups. It starts in the first year holding at least 5% of all contributions; anything earlier is counted in the footnote.

<picture><source media="(prefers-color-scheme: dark)" srcset="charts/B06-stacked-area-dark.svg"><img alt="Contributions over time" src="charts/B06-stacked-area-light.svg" width="840"></picture>

## C · Typographic

Type-led layouts: big numbers, terminal output, ledgers, logs and indexes.

### C01 · Big numbers

Four large, labeled headline figures for upstream work (PRs opened, merged, issues, owners), with the five most active owners underneath. Reads in one glance. With outcomes none the merged figure gives way to repos; merged drops the merge rate; full adds open and closed-unmerged PRs.

<picture><source media="(prefers-color-scheme: dark)" srcset="type/C01-big-numbers-dark.svg"><img alt="Big numbers" src="type/C01-big-numbers-light.svg" width="840"></picture>

### C02 · Terminal table

A fake `upstream --top 12` command that types itself out and prints an aligned monospace table of the top repos (language, stars, PRs, merged, issues, discussions), with a totals line. With outcomes none the merged column goes; full adds open and closed-unmerged columns.

<picture><source media="(prefers-color-scheme: dark)" srcset="type/C02-terminal-dark.svg"><img alt="Terminal table" src="type/C02-terminal-light.svg" width="840"></picture>

### C03 · Receipt

A till receipt itemized by owner, with ecosystems (several orgs under one name) rolled into one line each, a breakdown under each item and a grand total of every upstream PR, issue and discussion. The barcode is the last 53 weeks of activity. With outcomes none PRs are one line; merged keeps the merged sub-line without the open line or merge rate; full adds closed-unmerged PRs.

<picture><source media="(prefers-color-scheme: dark)" srcset="type/C03-receipt-dark.svg"><img alt="Receipt" src="type/C03-receipt-light.svg" width="440"></picture>

### C04 · Git log

The latest upstream PRs (merged and open; closed-unmerged ones are hidden) as a `git log --graph` timeline: date, repo#number, title and diffstat, so visitors see what you are working on right now. With outcomes none every node looks the same; merged fills merged nodes and leaves the rest plain; full lists closed-unmerged PRs too, each state with its own node.

<picture><source media="(prefers-color-scheme: dark)" srcset="type/C04-git-log-dark.svg"><img alt="Git log" src="type/C04-git-log-light.svg" width="840"></picture>

### C05 · In brief

A short paragraph written from the data: totals, merge count, the top three repos, the biggest ecosystem (the one with several owners and the most contributions) and this year's leading repo, with every figure set in bold. The merge count follows the outcomes level: left out for none, joined by open and closed-unmerged PRs for full.

<picture><source media="(prefers-color-scheme: dark)" srcset="type/C05-in-brief-dark.svg"><img alt="In brief" src="type/C05-in-brief-light.svg" width="840"></picture>

### C06 · Index

A typeset back-of-book index of the 30 most active owners, alphabetical with letter heads and dotted leaders to the contribution count. Calm, dense and easy to scan for a name.

<picture><source media="(prefers-color-scheme: dark)" srcset="type/C06-index-dark.svg"><img alt="Index" src="type/C06-index-light.svg" width="840"></picture>

## D · Visual

Picture-first ideas: orbits, mosaics, heatmaps, timelines and skylines.

### D01 · Orbit

You at the center, every owner (org or person) you contributed to on a ring by how much (40+, 16–39, 9–15, 6–8), avatar size by total; dotted lines join owners of one ecosystem from the ecosystem list.

<picture><source media="(prefers-color-scheme: dark)" srcset="visual/D01-orbit-dark.svg"><img alt="Orbit" src="visual/D01-orbit-light.svg" width="840"></picture>

### D02 · Avatar mosaic

A treemap wall of avatars: each tile’s area is that owner’s share of all upstream contributions, with the count on every tile, a PR/issue breakdown on the big ones, and one tile pooling everyone with 5 or fewer.

<picture><source media="(prefers-color-scheme: dark)" srcset="visual/D02-mosaic-dark.svg"><img alt="Avatar mosaic" src="visual/D02-mosaic-light.svg" width="840"></picture>

### D03 · Repo × month heatmap

The 12 upstream repos with the most contributions as rows and every month from January of the year the earliest of them started as columns, with a bar strip of all upstream contributions per month on top, so bursts and long-running work both show.

<picture><source media="(prefers-color-scheme: dark)" srcset="visual/D03-heatmap-dark.svg"><img alt="Repo × month heatmap" src="visual/D03-heatmap-light.svg" width="840"></picture>

### D04 · Swimlanes

One lane per top upstream repo in the order I started on it: a line from first to last contribution and a dot per month sized by that month’s count, so the hand-offs between repos read like a timeline.

<picture><source media="(prefers-color-scheme: dark)" srcset="visual/D04-swimlanes-dark.svg"><img alt="Swimlanes" src="visual/D04-swimlanes-light.svg" width="840"></picture>

### D05 · Skyline

Each building is one of the top 15 owners (orgs or people), its height is the number of contributions and its floors split them into merged PRs, other PRs, issues and discussions, on a real scale with round-number gridlines. With outcomes "none" PRs are one floor; "full" splits them into merged, open and closed unmerged.

<picture><source media="(prefers-color-scheme: dark)" srcset="visual/D05-skyline-dark.svg"><img alt="Skyline" src="visual/D05-skyline-light.svg" width="840"></picture>

### D06 · Year calendar + top upstream

The familiar 53-week activity calendar beside the five upstream repos with the most contributions in the months that window touches, so the year’s rhythm and where the upstream part went sit together.

<picture><source media="(prefers-color-scheme: dark)" srcset="visual/D06-calendar-dark.svg"><img alt="Year calendar + top upstream" src="visual/D06-calendar-light.svg" width="840"></picture>

## E · Compact and dashboards

Small tiles and badges, single-repository spotlights and full dashboards.

### E01 · Four stat tiles

Upstream PRs, merge rate, repos and owners as four equal 198px tiles in one 840px strip, each with a tiny supporting visual (contributions per year over the last four years, merge ring, top languages, top-owner avatars). Tiles rise in with a short staggered entrance. With outcomes "none" the merge tile goes and three tiles share the strip; "merged" shows merged PRs out of all PRs instead of a rate; "full" lists merged, open and closed beside the rate.

<picture><source media="(prefers-color-scheme: dark)" srcset="compact/E01-stat-tiles-dark.svg"><img alt="Four stat tiles" src="compact/E01-stat-tiles-light.svg" width="840"></picture>

### E02 · Owner badge strip

Shields.io-style pills, one per top owner (up to 24) with its avatar and a contribution count. Reads as a compact "who I contribute to" line and wraps to the README width.

<picture><source media="(prefers-color-scheme: dark)" srcset="compact/E02-owner-badges-dark.svg"><img alt="Owner badge strip" src="compact/E02-owner-badges-light.svg" width="840"></picture>

### E03 · Repo spotlight

One repo in focus: avatar, stars, language, PR/issue/discussion breakdown and a histogram of monthly contributions over the active span. It picks the repo with the most contributions among those not owned by the top owner. 410px, so two sit side by side.

<picture><source media="(prefers-color-scheme: dark)" srcset="compact/E03-repo-spotlight-dark.svg"><img alt="Repo spotlight" src="compact/E03-repo-spotlight-light.svg" width="410"></picture>

### E04 · Combined dashboard

Everything in one card: KPI strip, top owners with stacked contribution bars, top repos as a compact table, and a weekly activity strip for the last 12 months. Bars grow in on load.

<picture><source media="(prefers-color-scheme: dark)" srcset="compact/E04-dashboard-dark.svg"><img alt="Combined dashboard" src="compact/E04-dashboard-light.svg" width="840"></picture>

### E05 · Primer repo list

Looks like a native GitHub list: an issues-style header with octicon tabs and counters, Box rows with blue repo links, language/owner label pills, dates and per-type counts.

<picture><source media="(prefers-color-scheme: dark)" srcset="compact/E05-primer-list-dark.svg"><img alt="Primer repo list" src="compact/E05-primer-list-light.svg" width="840"></picture>

### E06 · Ecosystems (narrow)

A 420px card grouping work by ecosystem (several orgs under one name, such as AWS) with member-org avatars, scaled stacked bars and a written breakdown. Built to pair with another narrow card.

<picture><source media="(prefers-color-scheme: dark)" srcset="compact/E06-ecosystems-narrow-dark.svg"><img alt="Ecosystems (narrow)" src="compact/E06-ecosystems-narrow-light.svg" width="420"></picture>

## F · Flows and networks

How contributions flow from you through ecosystems and owners to repositories, and how rankings shift.

### F01 · Contribution Sankey

A Sankey from you through ecosystems and owners to repos, band height proportional to PRs + issues + discussions. The 7 biggest groups and 10 biggest repos are named; the rest are merged into one node per column so every band still adds up.

<picture><source media="(prefers-color-scheme: dark)" srcset="flows/F01-sankey-dark.svg"><img alt="Contribution Sankey" src="flows/F01-sankey-light.svg" width="840"></picture>

### F02 · PR outcomes

An alluvial from the ecosystems and owners you opened PRs with to how they ended: merged, still open or closed without merging (GitHub's purple, green and red). The 8 groups with the most PRs are named with their merge rate; the rest share one node.

<picture><source media="(prefers-color-scheme: dark)" srcset="flows/F02-pr-outcomes-dark.svg"><img alt="PR outcomes" src="flows/F02-pr-outcomes-light.svg" width="840"></picture>

### F03 · Metro map

A subway map where each line is one of the 6 ecosystems or owners with the most repos (ties by contributions), and its stations are up to 8 of its biggest repos in order of first contribution, sized by PRs + issues + discussions. Shows breadth: where you branched out, not just where you contributed most.

<picture><source media="(prefers-color-scheme: dark)" srcset="flows/F03-metro-dark.svg"><img alt="Metro map" src="flows/F03-metro-light.svg" width="840"></picture>

### F04 · Rank by year

A bump chart of the top 8 ecosystems and owners in each calendar year (from repos' monthly counts), so you can see who rose, who faded and who stayed. Years with fewer than 10 contributions are left out (the latest 6 are shown); the 7 biggest over those years get color, the rest stay gray.

<picture><source media="(prefers-color-scheme: dark)" srcset="flows/F04-bump-dark.svg"><img alt="Rank by year" src="flows/F04-bump-light.svg" width="840"></picture>

### F05 · First contact

How the network grew: owners grouped by the year of your first PR, issue or discussion with them (earliest repos[].first), with a bar for how many were new that year, the running total, and the biggest of each year's cohort. Leading years that each brought under 5% of owners fold into one column; at most 6 columns.

<picture><source media="(prefers-color-scheme: dark)" srcset="flows/F05-first-contact-dark.svg"><img alt="First contact" src="flows/F05-first-contact-light.svg" width="840"></picture>

### F06 · Contribution tree

A half-radial tree: you at the root, the 8 biggest ecosystems and owners on the inner ring, and up to 4 of each one's biggest repos as leaves, with stroke width proportional to PRs + issues + discussions. A compact picture of how the work branches out.

<picture><source media="(prefers-color-scheme: dark)" srcset="flows/F06-fan-tree-dark.svg"><img alt="Contribution tree" src="flows/F06-fan-tree-light.svg" width="840"></picture>

## G · Badges and collectibles

Playful formats such as trading cards, stamps and medals, with every number still real.

### G01 · Trading cards

The top three owners as collectible cards: avatar art, a stat block of PRs merged, PRs, issues and discussions, and a rarity tier from the total stars on the repos contributed to (thresholds printed in the legend). With outcomes none the merged row goes; full adds the merge rate and the open and closed-unmerged PRs beside the counts.

<picture><source media="(prefers-color-scheme: dark)" srcset="collectibles/G01-trading-cards-dark.svg"><img alt="Trading cards" src="collectibles/G01-trading-cards-light.svg" width="840"></picture>

### G02 · Achievement medals

A sheet of eight medals, each computed from the data (most merged PRs in one repo, repos in one ecosystem, owners, issues, languages, stars, longest run, merge rate) and struck in bronze, silver or gold against thresholds printed under it. With outcomes none the merge medals count PRs instead and the merge rate becomes PRs opened; merged swaps the merge rate for merged PRs.

<picture><source media="(prefers-color-scheme: dark)" srcset="collectibles/G02-achievement-medals-dark.svg"><img alt="Achievement medals" src="collectibles/G02-achievement-medals-light.svg" width="840"></picture>

### G03 · Periodic table of owners

The top 54 owners laid out in the first five periods of the periodic table: atomic number = rank, a unique two-letter symbol from the login, mass = PRs + issues + discussions. Ecosystems color their owners like element series; other owners are shown as orgs or people.

<picture><source media="(prefers-color-scheme: dark)" srcset="collectibles/G03-periodic-table-dark.svg"><img alt="Periodic table of owners" src="collectibles/G03-periodic-table-light.svg" width="840"></picture>

### G04 · Passport stamps

A passport page with one ink stamp for each of the top 12 owners by contributions, dated with my first PR, issue or discussion there and placed in order of that date; shape, ink and tilt come from a hash of the login so they never change between renders.

<picture><source media="(prefers-color-scheme: dark)" srcset="collectibles/G04-passport-stamps-dark.svg"><img alt="Passport stamps" src="collectibles/G04-passport-stamps-light.svg" width="840"></picture>

### G05 · Ticket stubs

The top six repos by contributions as admission tickets: the repo is the show, its stars and language the billing, PRs, merged, issues and discussions the printed fields, and the stub keeps the rank and total. The colored edge is the repo's language color. With outcomes none the merged field goes; full adds open and closed-unmerged fields.

<picture><source media="(prefers-color-scheme: dark)" srcset="collectibles/G05-ticket-stubs-dark.svg"><img alt="Ticket stubs" src="collectibles/G05-ticket-stubs-light.svg" width="840"></picture>

### G06 · Arcade high scores

A retro arcade high-score table in a bitmap font drawn from SVG pixels: the top ten owners ranked by score (PRs + issues + discussions in their repos) with PRs, merged PRs, issues and discussions as extra columns; the header shows the player, the top score and how many owners are on the board. With outcomes none the merged column goes; full adds open and closed-unmerged columns.

<picture><source media="(prefers-color-scheme: dark)" srcset="collectibles/G06-arcade-high-scores-dark.svg"><img alt="Arcade high scores" src="collectibles/G06-arcade-high-scores-light.svg" width="840"></picture>

## H · Focus and stories

Deep dives into one ecosystem or repository, milestones and year-in-review stories.

### H01 · Ecosystem deep-dive

One ecosystem in depth: its member orgs, its repos and the PR, issue and discussion split, so a cluster like AWS reads as one relationship. Rule: the ecosystem with the most contributions (a lone top owner if no ecosystems are defined); up to 8 owners and 10 repos, the rest summed.

<picture><source media="(prefers-color-scheme: dark)" srcset="focus/H01-ecosystem-deep-dive-dark.svg"><img alt="Ecosystem deep-dive" src="focus/H01-ecosystem-deep-dive-light.svg" width="840"></picture>

### H02 · Selected repos

A headline tile per notable repo, led by its total contribution count, each with its PR, issue and discussion counts and a strip of monthly contributions. Rule: the top 5 repos with at least 1,000 stars by contributions; if fewer than 3 qualify, the biggest remaining repos fill up to 3.

<picture><source media="(prefers-color-scheme: dark)" srcset="focus/H02-selected-repos-dark.svg"><img alt="Selected repos" src="focus/H02-selected-repos-light.svg" width="840"></picture>

### H03 · Merge funnel

What happens to the PRs I open upstream: opened, decided (merged or closed), merged, with the drop at each step, then the same split for each ecosystem next to everyone else. Rule: ecosystems ranked by PRs opened, up to 7, the remaining owners summed in one row.

<picture><source media="(prefers-color-scheme: dark)" srcset="focus/H03-merge-funnel-dark.svg"><img alt="Merge funnel" src="focus/H03-merge-funnel-light.svg" width="840"></picture>

### H04 · Year in review

A wrapped-style story of one year upstream: contributions per month, the busiest month, the top repo and ecosystem, owners and repos contributed to for the first time, and the same months a year earlier. Rule: the year of the snapshot, or the latest year with contributions if it has none; a partial year is compared with the same months of the year before.

<picture><source media="(prefers-color-scheme: dark)" srcset="focus/H04-year-in-review-dark.svg"><img alt="Year in review" src="focus/H04-year-in-review-light.svg" width="840"></picture>

### H05 · Milestones

A timeline of firsts and round numbers derived from the data: the first upstream contribution, the 100th and 500th, the 10th and 100th repo, the first repo with 1k+ and with 10k+ stars, the first contribution to the biggest ecosystem, the busiest month, on a cumulative curve. Rule: at most 12 milestones, firsts kept before round numbers; month-only dates come from monthly counts; months without contributions are drawn at a fifth of the width on the axis.

<picture><source media="(prefers-color-scheme: dark)" srcset="focus/H05-milestones-dark.svg"><img alt="Milestones" src="focus/H05-milestones-light.svg" width="840"></picture>

### H06 · Ecosystem versus ecosystem

The three biggest ecosystems side by side: total and share, each contribution kind on one shared scale with the leader in bold, merge rate, active span, top repo and member owners. Rule: the top 3 ecosystems by contributions; when there are fewer than 3, the biggest independent owners fill the remaining columns as groups of one.

<picture><source media="(prefers-color-scheme: dark)" srcset="focus/H06-ecosystem-versus-dark.svg"><img alt="Ecosystem versus ecosystem" src="focus/H06-ecosystem-versus-light.svg" width="840"></picture>
