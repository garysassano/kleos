/**
 * The aggregated contribution data every design renders from.
 *
 * "External" means a repository the user does not own. Counts of PRs, issues and discussions are
 * the items the user opened; `total` is their sum. Commits and reviews come from GitHub's yearly
 * contribution collections and are informational only.
 */
export interface Stats {
  user: string;
  /** ISO timestamp of the fetch. Designs that print an "as of" date use this, never the clock. */
  generatedAt: string;
  totals: Totals;
  /** PRs + issues + discussions in the user's own repositories. */
  ownRepoActivity: number;
  /** External repositories, sorted by `total` descending. */
  repos: RepoStats[];
  /** External owners (organizations and users), sorted by `total` descending. */
  owners: OwnerStats[];
  /** Owners grouped under one brand, such as AWS = aws + aws-samples + aws-cloudformation + …. */
  ecosystems: EcosystemStats[];
  /** Daily contribution counts for the last 371 days up to `generatedAt`, oldest first. Includes private contributions. */
  calendar: [date: string, count: number][];
  /** The user's most recent PRs in external public repositories, newest first (at most 30). */
  recentPRs: RecentPR[];
  /** Owner login → avatar as a `data:` URI. Owners outside the top ~60 are missing: draw a monogram. */
  avatars: Record<string, string>;
}

export interface Totals {
  /** All PRs the user opened, including in their own repositories. */
  prs: number;
  prsMerged: number;
  issues: number;
  discussions: number;
  externalRepos: number;
  externalOwners: number;
  externalPRs: number;
  externalMerged: number;
  /** PRs in external public repositories that are still open. */
  externalOpen: number;
  /** ISO timestamp of the user's first PR in an external public repository, or null. */
  firstExternalPR: string | null;
}

export interface RecentPR {
  /** "owner/name" */
  repo: string;
  number: number;
  title: string;
  createdAt: string;
  state: "OPEN" | "MERGED" | "CLOSED";
  additions: number;
  deletions: number;
}

export interface RepoStats {
  /** "owner/name" */
  repo: string;
  owner: string;
  ownerType: "Organization" | "User";
  /** Remote avatar URL. Never put this in an SVG; use `Stats.avatars`. */
  avatar: string;
  stars: number;
  private: boolean;
  language: string | null;
  langColor: string | null;
  prs: number;
  prsMerged: number;
  prsOpen: number;
  issues: number;
  discussions: number;
  commits: number;
  reviews: number;
  /** ISO timestamps of the first and last PR, issue or discussion; null when the repo only has commits. */
  first: string | null;
  last: string | null;
  /** "YYYY-MM" → PRs + issues + discussions opened that month. */
  monthly: Record<string, number>;
  total: number;
}

export interface OwnerStats {
  owner: string;
  type: "Organization" | "User";
  avatar: string;
  prs: number;
  prsMerged: number;
  prsOpen: number;
  issues: number;
  discussions: number;
  commits: number;
  total: number;
  /** Number of the owner's repositories the user contributed to. */
  repos: number;
  /** Sum of stars across those repositories. */
  stars: number;
  topRepos: string[];
}

export interface EcosystemStats {
  name: string;
  /** Regular expression matched against owner logins. */
  match: string;
  owners: string[];
  total: number;
  prs: number;
  prsMerged: number;
  prsOpen: number;
  issues: number;
  discussions: number;
  repos: number;
}
