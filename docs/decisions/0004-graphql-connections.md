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

For the owner's account (737 PRs, 586 issues, 38 discussions, 12 years) that's about 30 requests and about 30 points of the 5000/hour budget. It takes about 40 seconds and runs once a day.

Authentication: in CI the action passes `GITHUB_TOKEN`. Locally, with no token set, requests go through `gh api graphql`, so the account the GitHub CLI is signed in to is used and no token is ever exported into the shell.

## Why

- **Not search.** `search(type: ISSUE, query: "author:…")` stops at 1000 results, which this account already passes for PRs + issues. The user connections aren't capped.
- **Not REST.** REST would need per-repository calls for stars and owners. GraphQL returns the repository inline with each item.
- **Not only `contributionsCollection`.** It counts commits by repository but limits each window to 100 repositories and one year. github-contribution-card uses only commit contributions, so PRs that merged as squashed commits and all issues and discussions are invisible to it. Here it's used for the parts it is good at: commits, reviews and the calendar.

## Known gaps

- `contributionsCollection` counts only commits on the default branch. Commits are informational here, not part of `total`.
- Comments on issues, PRs and discussions aren't fetched yet. `user.repositoryDiscussionComments` and `issueComments` would add one or two more paginated connections each.
