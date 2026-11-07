/**
 * Turns raw GitHub data into the Stats every design renders from. Pure: no I/O.
 * See docs/decisions/0006-what-counts.md for what is counted and why.
 */
import type { RawData, RawRepo } from "../github/fetch.ts";
import type { FamilyStats, OwnerStats, RecentPR, RepoStats, Stats } from "./types.ts";

export interface FamilyRule {
  name: string;
  /** Regular expression matched against the whole owner login. */
  match: string;
}

/** Vendors that spread their open source over several GitHub organizations. */
export const DEFAULT_FAMILIES: FamilyRule[] = [
  { name: "AWS", match: "^(aws|awslabs|aws-.*|amazon-.*)$" },
  { name: "HashiCorp", match: "^hashicorp$" },
  { name: "OpenTelemetry", match: "^open-telemetry$" },
  { name: "Microsoft", match: "^(microsoft|Azure)$" },
  { name: "Cloudflare", match: "^cloudflare$" },
  { name: "GitHub", match: "^(github|actions|integrations)$" },
];

const CALENDAR_DAYS = 371;
/** How many recent PRs Stats keeps; the fetcher gets line counts for exactly these. */
export const RECENT_PRS = 30;

export function aggregate(
  raw: RawData,
  opts: { families?: FamilyRule[]; avatars?: Record<string, string> } = {},
): Stats {
  const families = opts.families ?? DEFAULT_FAMILIES;
  const repos = new Map<string, RepoStats>();

  const get = (r: RawRepo): RepoStats => {
    let x = repos.get(r.nameWithOwner);
    if (!x) {
      x = {
        repo: r.nameWithOwner,
        owner: r.owner.login,
        ownerType: r.owner.__typename,
        avatar: r.owner.avatarUrl,
        stars: r.stargazerCount,
        private: r.isPrivate,
        language: r.primaryLanguage?.name ?? null,
        langColor: r.primaryLanguage?.color ?? null,
        prs: 0,
        prsMerged: 0,
        prsOpen: 0,
        issues: 0,
        discussions: 0,
        commits: 0,
        reviews: 0,
        first: null,
        last: null,
        monthly: {},
        total: 0,
      };
      repos.set(r.nameWithOwner, x);
    }
    if (r.primaryLanguage && !x.language) {
      x.language = r.primaryLanguage.name;
      x.langColor = r.primaryLanguage.color;
    }
    return x;
  };
  const touch = (x: RepoStats, at: string) => {
    if (!x.first || at < x.first) x.first = at;
    if (!x.last || at > x.last) x.last = at;
    const month = at.slice(0, 7);
    x.monthly[month] = (x.monthly[month] ?? 0) + 1;
  };

  for (const p of raw.pullRequests) {
    const x = get(p.repository);
    x.prs++;
    if (p.merged) x.prsMerged++;
    if (p.state === "OPEN") x.prsOpen++;
    touch(x, p.createdAt);
  }
  for (const i of raw.issues) {
    const x = get(i.repository);
    x.issues++;
    touch(x, i.createdAt);
  }
  for (const d of raw.discussions) {
    const x = get(d.repository);
    x.discussions++;
    touch(x, d.createdAt);
  }

  const today = raw.fetchedAt.slice(0, 10);
  const calendar: [string, number][] = [];
  for (const y of raw.years) {
    for (const c of y.commitContributionsByRepository)
      get(c.repository).commits += c.contributions.totalCount;
    for (const c of y.pullRequestReviewContributionsByRepository) {
      get(c.repository).reviews += c.contributions.totalCount;
    }
    for (const w of y.contributionCalendar.weeks) {
      for (const d of w.contributionDays)
        if (d.date <= today) calendar.push([d.date, d.contributionCount]);
    }
  }
  calendar.sort((a, b) => a[0].localeCompare(b[0]));

  const all = [...repos.values()].map((x) => ({ ...x, total: x.prs + x.issues + x.discussions }));
  const external = all
    // A repository counts once the user opened something there; commit-only repos are left out.
    .filter((x) => x.owner !== raw.login && !x.private && x.total > 0)
    .sort((a, b) => b.total - a.total);

  const owners = new Map<string, OwnerStats>();
  for (const x of external) {
    let o = owners.get(x.owner);
    if (!o) {
      o = {
        owner: x.owner,
        type: x.ownerType,
        avatar: x.avatar,
        prs: 0,
        prsMerged: 0,
        prsOpen: 0,
        issues: 0,
        discussions: 0,
        commits: 0,
        total: 0,
        repos: 0,
        stars: 0,
        topRepos: [],
      };
      owners.set(x.owner, o);
    }
    o.prs += x.prs;
    o.prsMerged += x.prsMerged;
    o.prsOpen += x.prsOpen;
    o.issues += x.issues;
    o.discussions += x.discussions;
    o.commits += x.commits;
    o.total += x.total;
    o.repos++;
    o.stars += x.stars;
    o.topRepos.push(x.repo);
  }
  const ownerList = [...owners.values()].sort((a, b) => b.total - a.total);

  const familyStats: FamilyStats[] = families.map((f) => {
    const re = new RegExp(f.match);
    const members = ownerList.filter((o) => re.test(o.owner));
    const sum = (
      k: "total" | "prs" | "prsMerged" | "prsOpen" | "issues" | "discussions" | "repos",
    ) => members.reduce((a, o) => a + o[k], 0);
    return {
      ...f,
      owners: members.map((o) => o.owner),
      total: sum("total"),
      prs: sum("prs"),
      prsMerged: sum("prsMerged"),
      prsOpen: sum("prsOpen"),
      issues: sum("issues"),
      discussions: sum("discussions"),
      repos: sum("repos"),
    };
  });

  const externalPRs = raw.pullRequests
    .filter((p) => p.repository.owner.login !== raw.login && !p.repository.isPrivate)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const recentPRs: RecentPR[] = externalPRs.slice(0, RECENT_PRS).map((p) => ({
    repo: p.repository.nameWithOwner,
    number: p.number,
    title: p.title,
    createdAt: p.createdAt,
    state: p.merged ? "MERGED" : p.state === "OPEN" ? "OPEN" : "CLOSED",
    additions: p.additions ?? 0,
    deletions: p.deletions ?? 0,
  }));

  const sumAll = (k: "prs" | "prsMerged" | "issues" | "discussions") =>
    all.reduce((a, x) => a + x[k], 0);
  return {
    user: raw.login,
    generatedAt: raw.fetchedAt,
    totals: {
      prs: sumAll("prs"),
      prsMerged: sumAll("prsMerged"),
      issues: sumAll("issues"),
      discussions: sumAll("discussions"),
      externalRepos: external.length,
      externalOwners: ownerList.length,
      externalPRs: external.reduce((a, x) => a + x.prs, 0),
      externalMerged: external.reduce((a, x) => a + x.prsMerged, 0),
      externalOpen: external.reduce((a, x) => a + x.prsOpen, 0),
      firstExternalPR: externalPRs.at(-1)?.createdAt ?? null,
    },
    ownRepoActivity: all.filter((x) => x.owner === raw.login).reduce((a, x) => a + x.total, 0),
    repos: external,
    owners: ownerList,
    families: familyStats,
    calendar: calendar.slice(-CALENDAR_DAYS),
    recentPRs,
    avatars: opts.avatars ?? {},
  };
}

/** Owners whose avatar a card is likely to draw: the top owners plus the user. */
export function avatarOwners(stats: Stats, limit = 60): Map<string, string> {
  const out = new Map<string, string>();
  for (const o of stats.owners.slice(0, limit)) out.set(o.owner, o.avatar);
  for (const r of stats.repos.slice(0, limit)) out.set(r.owner, r.avatar);
  out.set(stats.user, `https://avatars.githubusercontent.com/${stats.user}?size=64`);
  return out;
}
