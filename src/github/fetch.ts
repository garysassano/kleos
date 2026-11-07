/**
 * Fetches everything a user opened on GitHub, using as few requests as possible.
 *
 * PRs, issues and discussions come from the user's own connections (`user.pullRequests`,
 * `user.issues`, `user.repositoryDiscussions`), 100 per page. Unlike the search API these are not
 * capped at 1000 results. Commits, reviews and the daily calendar come from one
 * `contributionsCollection` request per contribution year. For an account with ~1400 items over
 * 12 years that is ~30 requests and ~30 rate-limit points of the 5000/hour budget.
 * See docs/decisions/0004-graphql-connections-not-search.md.
 */
import type { GraphQL } from "./graphql.ts";

export interface RawRepo {
  nameWithOwner: string;
  name: string;
  isPrivate: boolean;
  stargazerCount: number;
  owner: { login: string; __typename: "Organization" | "User"; avatarUrl: string };
  primaryLanguage: { name: string; color: string | null } | null;
}

export interface RawPullRequest {
  number: number;
  title: string;
  state: "OPEN" | "CLOSED" | "MERGED";
  merged: boolean;
  createdAt: string;
  additions: number;
  deletions: number;
  repository: RawRepo;
}

export interface RawIssue {
  number: number;
  title: string;
  state: "OPEN" | "CLOSED";
  createdAt: string;
  repository: RawRepo;
}

export interface RawDiscussion {
  number: number;
  title: string;
  createdAt: string;
  repository: RawRepo;
}

export interface RawByRepo {
  contributions: { totalCount: number };
  repository: RawRepo;
}

export interface RawYear {
  year: number;
  totalCommitContributions: number;
  restrictedContributionsCount: number;
  commitContributionsByRepository: RawByRepo[];
  pullRequestReviewContributionsByRepository: RawByRepo[];
  contributionCalendar: {
    totalContributions: number;
    weeks: { contributionDays: { date: string; contributionCount: number }[] }[];
  };
}

export interface RawData {
  login: string;
  fetchedAt: string;
  pullRequests: RawPullRequest[];
  issues: RawIssue[];
  discussions: RawDiscussion[];
  years: RawYear[];
}

const REPO = `repository {
  nameWithOwner name isPrivate stargazerCount
  owner { login __typename avatarUrl(size: 64) }
  primaryLanguage { name color }
}`;

const CONNECTIONS = {
  pullRequests: `number title state merged createdAt additions deletions ${REPO}`,
  issues: `number title state createdAt ${REPO}`,
  repositoryDiscussions: `number title createdAt ${REPO}`,
} as const;

interface Page<T> {
  user: {
    conn: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: T[] };
  } | null;
}

async function paginate<T>(gql: GraphQL, login: string, field: keyof typeof CONNECTIONS) {
  const query = `query($login: String!, $after: String) {
    user(login: $login) {
      conn: ${field}(first: 100, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes { ${CONNECTIONS[field]} }
      }
    }
  }`;
  const nodes: T[] = [];
  let after: string | null = null;
  do {
    const page: Page<T> = await gql<Page<T>>(query, { login, after });
    if (!page.user) throw new Error(`GitHub user "${login}" not found`);
    nodes.push(...page.user.conn.nodes);
    after = page.user.conn.pageInfo.hasNextPage ? page.user.conn.pageInfo.endCursor : null;
  } while (after);
  return nodes;
}

const BY_REPO = `contributions { totalCount } ${REPO}`;

async function fetchYear(gql: GraphQL, login: string, year: number): Promise<RawYear> {
  const query = `query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        totalCommitContributions
        restrictedContributionsCount
        commitContributionsByRepository(maxRepositories: 100) { ${BY_REPO} }
        pullRequestReviewContributionsByRepository(maxRepositories: 100) { ${BY_REPO} }
        contributionCalendar { totalContributions weeks { contributionDays { date contributionCount } } }
      }
    }
  }`;
  const data = await gql<{ user: { contributionsCollection: Omit<RawYear, "year"> } }>(query, {
    login,
    from: `${year}-01-01T00:00:00Z`,
    to: `${year}-12-31T23:59:59Z`,
  });
  return { year, ...data.user.contributionsCollection };
}

export async function fetchUser(gql: GraphQL, login: string): Promise<RawData> {
  const fetchedAt = new Date().toISOString();
  const meta = await gql<{
    user: { contributionsCollection: { contributionYears: number[] } } | null;
  }>(
    `query($login: String!) { user(login: $login) { contributionsCollection { contributionYears } } }`,
    { login },
  );
  if (!meta.user) throw new Error(`GitHub user "${login}" not found`);
  const [pullRequests, issues, discussions, years] = await Promise.all([
    paginate<RawPullRequest>(gql, login, "pullRequests"),
    paginate<RawIssue>(gql, login, "issues"),
    paginate<RawDiscussion>(gql, login, "repositoryDiscussions"),
    Promise.all(
      meta.user.contributionsCollection.contributionYears.map((y) => fetchYear(gql, login, y)),
    ),
  ]);
  return { login, fetchedAt, pullRequests, issues, discussions, years };
}
