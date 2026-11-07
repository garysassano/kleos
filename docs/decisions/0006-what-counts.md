# 0006 · What counts as a contribution, and what is grouped together

Date: 2026-11-07

## Context

The point of the cards is to show where the user's open-source work goes: "100 for aws/aws-cdk", or how much went to AWS as a whole across aws, aws-cloudformation, aws-samples and its other organizations.

The previous card (github-contribution-card) showed commit contributions only. Its S+/A/B letters were the repository's star tier, not the user's share of the work, which readers easily misread.

## Decision

- **A contribution is a PR, issue or discussion the user opened.** `total = prs + issues + discussions`, per repository, then summed per owner and per family.
- **Merged PRs are counted separately** (`prsMerged`) and shown as the strongest signal. Open PRs (`prsOpen`) are also tracked. The rest are PRs closed without merging.
- **External only.** Cards show repositories the user doesn't own (`owner !== user`), and only public ones. Activity in the user's own repositories is kept as one number, `ownRepoActivity`.
- **Owners** are organizations or users, aggregated from their repositories.
- **Families** group several organizations under one vendor by a regular expression on the owner login. For example, AWS = `^(aws|awslabs|aws-.*|amazon-.*)$`. The defaults live in `DEFAULT_FAMILIES` in [`src/stats/aggregate.ts`](../../src/stats/aggregate.ts) and will become config.
- **Commits and reviews** from `contributionsCollection` are kept per repository as context but are not part of `total`. Commits double-count merged PRs, and the API only counts default-branch commits.
- **The calendar** is the last 371 days up to the fetch, and it includes private contributions, as GitHub's own graph does. Designs that show it next to public-only numbers must say so.
- **Stars describe the repository, not the user.** A design may show them as context, such as how big the project is, never as the user's rank.

## Not used

- **Lines added and removed** are fetched only for the recent PRs a card lists (C04). Generated files make totals misleading (two open aws-cdk PRs show about +119,000 lines each), and computing them for every PR doubled fetch time.
- **"Contributor rank"**, the user's percentile among a repository's contributors, would need the contributor list of every repository: hundreds of extra REST calls, and GitHub caps the list at 500. It may come back for a handful of chosen repositories.
