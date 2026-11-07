# 0004 · GraphQL user connections instead of search or REST

Date: 2026-11-07

## Context

The cards need every PR, issue and discussion the user opened, with the repository, owner, stars and state of each, plus commits and reviews per repository and the daily calendar.

## Decision

Use the GraphQL API ([`src/github/fetch.ts`](../../src/github/fetch.ts)):

| Data                                         | Query                                                                    | Requests     |
| -------------------------------------------- | ------------------------------------------------------------------------ | ------------ |
| PRs (state, merged, lines, repository)       | `user.pullRequests(first: 100)`                                          | total ÷ 100  |
| Issues                                       | `user.issues(first: 100)`                                                | total ÷ 100  |
| Discussions                                  | `user.repositoryDiscussions(first: 100)`                                 | total ÷ 100  |
| Commits and reviews per repository, calendar | `contributionsCollection(from, to)`, one per year in `contributionYears` | one per year |

For the owner's account (738 PRs, 586 issues, 38 discussions, 12 years) that's 32 requests and about 30 points of the 5000/hour budget, and takes about 14 seconds.

What makes it fast (measured 2026-11-07; it took 36 seconds before):

- **Each connection is read from both ends at once,** with `first/after` and `last/before`, until the two walks meet. Pages within one walk have to wait for the previous cursor, so this halves the requests made one after another, and the PR list is the slowest part. At most one page per connection overlaps, and it's deduplicated by node id.
- **Line counts are fetched only where a card shows them.** `additions` and `deletions` doubled the time of every PR page, because GitHub computes them per PR. They're now fetched in one `nodes(ids:)` request, only for the 30 PRs in `Stats.recentPRs`.
- **Everything else runs in parallel:** the three connections and the yearly collections. A request costs about 1.8 s whatever its size, so the number of requests made one after another matters more than payload size.

Authentication: in CI the action passes `GITHUB_TOKEN`. Locally, with no token set, requests go through `gh api graphql` (the request body as JSON on stdin), so the account the GitHub CLI is signed in to is used and no token is ever exported into the shell.

## Why

- **Not search.** `search(type: ISSUE, query: "author:…")` stops at 1000 results, which this account already passes for PRs + issues. The user connections aren't capped.
- **Not REST.** REST would need per-repository calls for stars and owners. GraphQL returns the repository inline with each item.
- **Not only `contributionsCollection`.** It counts commits by repository but limits each window to 100 repositories and one year. github-contribution-card uses only commit contributions, so PRs that merged as squashed commits and all issues and discussions are invisible to it. Here it's used for the parts it is good at: commits, reviews and the calendar.

## Completeness check

On 2026-11-07 the results were compared with GitHub search (`author:… type:pr|issue -user:…`). Every PR and issue that search finds is in the connections. The connections also have 6 items search can't see: 2 PRs and 1 issue on `mlugg/setup-zig`, and 3 issues on `cursor/cursor`. For discussions, search returns 24 and the connection 38. So the connections alone are complete, and search isn't needed as a fallback.

## Known gaps

- `contributionsCollection` counts only commits on the default branch. Commits are informational here, not part of `total`.
- Comments on issues, PRs and discussions aren't fetched yet. `user.repositoryDiscussionComments` and `issueComments` would add one or two more paginated connections each.
