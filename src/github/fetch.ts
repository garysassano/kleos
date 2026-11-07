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
import { RECENT_PRS } from "../stats/aggregate.ts";
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
  id: string;
  number: number;
  title: string;
  state: "OPEN" | "CLOSED" | "MERGED";
  merged: boolean;
  createdAt: string;
  /** Lines changed. Fetched only for the PRs that end up in `Stats.recentPRs`: they are expensive to compute. */
  additions?: number;
  deletions?: number;
  repository: RawRepo;
}

export interface RawIssue {
  id: string;
  number: number;
  title: string;
  state: "OPEN" | "CLOSED";
  createdAt: string;
  repository: RawRepo;
}

export interface RawDiscussion {
  id: string;
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
  pullRequests: `id number title state merged createdAt ${REPO}`,
  issues: `id number title state createdAt ${REPO}`,
  repositoryDiscussions: `id number title createdAt ${REPO}`,
} as const;

interface Page<T> {
  user: {
    conn: {
      totalCount: number;
      pageInfo: {
        hasNextPage: boolean;
        endCursor: string | null;
        hasPreviousPage: boolean;
        startCursor: string | null;
      };
      nodes: T[];
    };
  } | null;
}

/**
 * Reads a whole connection, walking from both ends at once (first/after and last/before) until
 * the two walks have covered it. Pages within one walk must wait for the previous cursor, so this
 * halves the requests made one after another; at most one page overlaps and is deduplicated.
 */
async function paginate<T extends { id: string }>(
  gql: GraphQL,
  login: string,
  field: keyof typeof CONNECTIONS,
): Promise<T[]> {
  const query = (dir: "forward" | "backward") => `query($login: String!, $cursor: String) {
    user(login: $login) {
      conn: ${field}(${dir === "forward" ? "first: 100, after: $cursor" : "last: 100, before: $cursor"}) {
        totalCount
        pageInfo { hasNextPage endCursor hasPreviousPage startCursor }
        nodes { ${CONNECTIONS[field]} }
      }
    }
  }`;
  const seen = new Map<string, T>();
  let total = Number.POSITIVE_INFINITY;
  const walk = async (dir: "forward" | "backward") => {
    let cursor: string | null = null;
    while (seen.size < total) {
      const page: Page<T> = await gql<Page<T>>(query(dir), { login, cursor });
      if (!page.user) throw new Error(`GitHub user "${login}" not found`);
      const { conn } = page.user;
      total = conn.totalCount;
      for (const n of conn.nodes) seen.set(n.id, n);
      const more = dir === "forward" ? conn.pageInfo.hasNextPage : conn.pageInfo.hasPreviousPage;
      if (!more) return;
      cursor = dir === "forward" ? conn.pageInfo.endCursor : conn.pageInfo.startCursor;
    }
  };
  await Promise.all([walk("forward"), walk("backward")]);
  return [...seen.values()];
}

/** Lines changed for a few PRs, in one request. */
async function fetchLineCounts(gql: GraphQL, ids: string[]) {
  if (!ids.length) return new Map<string, { additions: number; deletions: number }>();
  const data = await gql<{
    nodes: ({ id: string; additions: number; deletions: number } | null)[];
  }>(`query($ids: [ID!]!) { nodes(ids: $ids) { ... on PullRequest { id additions deletions } } }`, {
    ids,
  });
  return new Map(data.nodes.filter((n) => n !== null).map((n) => [n.id, n]));
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
  // Line counts only for the PRs that Stats.recentPRs keeps (see aggregate.ts).
  const recent = pullRequests
    .filter((p) => p.repository.owner.login !== login && !p.repository.isPrivate)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, RECENT_PRS);
  const lines = await fetchLineCounts(
    gql,
    recent.map((p) => p.id),
  );
  for (const p of pullRequests) Object.assign(p, lines.get(p.id) ?? {});
  return { login, fetchedAt, pullRequests, issues, discussions, years };
}
