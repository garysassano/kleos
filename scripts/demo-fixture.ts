/**
 * Builds fixtures/demo.json: a fictional account used for the README and the public catalog.
 * Every user, organization, repository and avatar here is made up. The raw items go through the
 * real aggregation, so totals, owners and ecosystems are consistent with each other.
 *
 * Usage: node scripts/demo-fixture.ts
 */
import { writeFileSync } from "node:fs";
import type {
  RawData,
  RawDiscussion,
  RawIssue,
  RawPullRequest,
  RawRepo,
  RawYear,
} from "../src/github/fetch.ts";
import { type EcosystemRule, aggregate } from "../src/stats/aggregate.ts";

const LOGIN = "kleos-demo";
const FETCHED_AT = "2026-11-01T09:00:00Z";

/** Small deterministic PRNG (mulberry32) so the fixture is reproducible. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = prng(20261101);
const pick = <T>(xs: readonly T[]): T => xs[Math.floor(rand() * xs.length)] as T;

const LANGS = {
  TypeScript: "#3178c6",
  Rust: "#dea584",
  Go: "#00ADD8",
  Python: "#3572A5",
  MDX: "#fcb32c",
} as const;
type Lang = keyof typeof LANGS;

const PALETTE = [
  "#6e56cf",
  "#0e7c86",
  "#c2410c",
  "#2563eb",
  "#15803d",
  "#b45309",
  "#be185d",
  "#475569",
  "#0891b2",
  "#7c3aed",
];

/** A simple geometric avatar as an SVG data URI: coloured tile, two shapes, no text. */
function avatarFor(login: string): string {
  let h = 0;
  for (const c of login) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0;
  const bg = PALETTE[h % PALETTE.length];
  const fg = "#ffffff";
  const shape = h % 4;
  const shapes = [
    `<circle cx="32" cy="32" r="16" fill="${fg}" opacity=".9"/><circle cx="32" cy="32" r="7" fill="${bg}"/>`,
    `<rect x="17" y="17" width="30" height="30" rx="6" fill="${fg}" opacity=".9" transform="rotate(45 32 32)"/>`,
    `<path d="M14 44 L32 16 L50 44 Z" fill="${fg}" opacity=".9"/><circle cx="32" cy="36" r="5" fill="${bg}"/>`,
    `<rect x="14" y="14" width="16" height="16" rx="3" fill="${fg}"/><rect x="34" y="34" width="16" height="16" rx="3" fill="${fg}" opacity=".7"/><rect x="34" y="14" width="16" height="16" rx="8" fill="${fg}" opacity=".45"/>`,
  ];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="${bg}"/>${shapes[shape]}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

interface RepoSpec {
  repo: string;
  stars: number;
  lang: Lang;
  /** Contributions to generate: PRs, issues, discussions. */
  prs: number;
  issues: number;
  discussions: number;
  /** Share of PRs merged, 0..1. */
  mergeRate: number;
  /** Active window, "YYYY-MM". */
  from: string;
  to: string;
}

const user = (login: string) => login;
const SPECS: RepoSpec[] = [
  {
    repo: "nimbus/nimbus-sdk",
    stars: 18400,
    lang: "TypeScript",
    prs: 64,
    issues: 41,
    discussions: 6,
    mergeRate: 0.86,
    from: "2023-03",
    to: "2026-10",
  },
  {
    repo: "nimbus/nimbus-cli",
    stars: 2900,
    lang: "Go",
    prs: 22,
    issues: 17,
    discussions: 2,
    mergeRate: 0.8,
    from: "2023-09",
    to: "2026-09",
  },
  {
    repo: "nimbus-labs/edge-router",
    stars: 1300,
    lang: "Rust",
    prs: 14,
    issues: 6,
    discussions: 0,
    mergeRate: 0.7,
    from: "2024-05",
    to: "2026-08",
  },
  {
    repo: "nimbus-samples/serverless-patterns",
    stars: 640,
    lang: "TypeScript",
    prs: 9,
    issues: 3,
    discussions: 0,
    mergeRate: 0.9,
    from: "2024-01",
    to: "2025-11",
  },
  {
    repo: "nimbus-community/awesome-nimbus",
    stars: 410,
    lang: "MDX",
    prs: 6,
    issues: 1,
    discussions: 0,
    mergeRate: 1,
    from: "2023-06",
    to: "2025-04",
  },
  {
    repo: "tidepool/tidepool",
    stars: 7200,
    lang: "Rust",
    prs: 38,
    issues: 22,
    discussions: 9,
    mergeRate: 0.84,
    from: "2022-11",
    to: "2026-10",
  },
  {
    repo: "tidepool/tidepool-docs",
    stars: 380,
    lang: "MDX",
    prs: 15,
    issues: 2,
    discussions: 0,
    mergeRate: 0.93,
    from: "2023-01",
    to: "2026-06",
  },
  {
    repo: "tidepool-dev/collector",
    stars: 960,
    lang: "Go",
    prs: 8,
    issues: 7,
    discussions: 1,
    mergeRate: 0.62,
    from: "2024-08",
    to: "2026-07",
  },
  {
    repo: "kestrel-rs/kestrel",
    stars: 12100,
    lang: "Rust",
    prs: 19,
    issues: 25,
    discussions: 4,
    mergeRate: 0.68,
    from: "2024-02",
    to: "2026-10",
  },
  {
    repo: "orchard-js/orchard",
    stars: 5300,
    lang: "TypeScript",
    prs: 26,
    issues: 12,
    discussions: 3,
    mergeRate: 0.88,
    from: "2022-04",
    to: "2024-12",
  },
  {
    repo: "lattice-db/lattice",
    stars: 23800,
    lang: "Go",
    prs: 4,
    issues: 19,
    discussions: 2,
    mergeRate: 0.5,
    from: "2023-05",
    to: "2026-05",
  },
  {
    repo: "quill-docs/quill",
    stars: 3100,
    lang: "TypeScript",
    prs: 11,
    issues: 5,
    discussions: 7,
    mergeRate: 0.82,
    from: "2025-01",
    to: "2026-10",
  },
  {
    repo: "ember-ui/ember-ui",
    stars: 8700,
    lang: "TypeScript",
    prs: 7,
    issues: 9,
    discussions: 1,
    mergeRate: 0.71,
    from: "2023-08",
    to: "2025-09",
  },
  {
    repo: "ferrous-tools/ferrous-fmt",
    stars: 1500,
    lang: "Rust",
    prs: 10,
    issues: 3,
    discussions: 0,
    mergeRate: 0.9,
    from: "2025-03",
    to: "2026-09",
  },
  {
    repo: "cobalt-cli/cobalt",
    stars: 4400,
    lang: "Go",
    prs: 3,
    issues: 8,
    discussions: 0,
    mergeRate: 0.67,
    from: "2024-10",
    to: "2026-04",
  },
  {
    repo: `${user("mira-kowal")}/sparkline-kit`,
    stars: 820,
    lang: "TypeScript",
    prs: 9,
    issues: 2,
    discussions: 0,
    mergeRate: 0.89,
    from: "2024-03",
    to: "2025-06",
  },
  {
    repo: `${user("jonas-heller")}/dotenv-schema`,
    stars: 290,
    lang: "TypeScript",
    prs: 5,
    issues: 3,
    discussions: 0,
    mergeRate: 0.8,
    from: "2025-02",
    to: "2026-01",
  },
  {
    repo: "driftwood-io/drift",
    stars: 650,
    lang: "Python",
    prs: 2,
    issues: 6,
    discussions: 3,
    mergeRate: 0.5,
    from: "2025-06",
    to: "2026-10",
  },
  {
    repo: "beacon-hq/beacon",
    stars: 14600,
    lang: "Go",
    prs: 1,
    issues: 7,
    discussions: 0,
    mergeRate: 1,
    from: "2024-04",
    to: "2026-02",
  },
  {
    repo: `${user("tess-ober")}/rusty-cache`,
    stars: 1200,
    lang: "Rust",
    prs: 4,
    issues: 1,
    discussions: 0,
    mergeRate: 0.75,
    from: "2025-09",
    to: "2026-08",
  },
];

// A long tail of small, one-off contributions to many other projects.
const TAIL_OWNERS = [
  "harbor-ops",
  "pixelforge",
  "sable-sh",
  "gridline",
  "meadow-labs",
  "oakhaven",
  "polaris-dev",
  "rivet-rs",
  "sundial-js",
  "vesper-io",
  "wren-tools",
  "zephyr-ci",
  "atlas-maps-oss",
  "brightside",
  "copperleaf",
  "duskmoon",
  "elm-street-dev",
  "fjord-data",
  "glasshouse",
  "hollow-pine",
];
const TAIL_NAMES = [
  "cli",
  "core",
  "docs",
  "action",
  "plugin",
  "sdk",
  "server",
  "ui",
  "lint",
  "config",
];
for (const [i, owner] of TAIL_OWNERS.entries()) {
  const n = 1 + (i % 3 === 0 ? 1 : 0);
  for (let k = 0; k < n; k++) {
    const total = 1 + Math.floor(rand() * 4);
    const prs = Math.floor(rand() * (total + 1));
    const issues = total - prs;
    const year = 2022 + Math.floor(rand() * 5);
    const month = String(1 + Math.floor(rand() * 10)).padStart(2, "0");
    SPECS.push({
      repo: `${owner}/${pick(TAIL_NAMES)}${k ? "-2" : ""}`,
      stars: Math.round(20 + rand() * rand() * 3000),
      lang: pick(Object.keys(LANGS) as Lang[]),
      prs,
      issues,
      discussions: 0,
      mergeRate: 0.7,
      from: `${year}-${month}`,
      to: `${year}-${month}`,
    });
  }
}

const OWN: RepoSpec[] = [
  {
    repo: `${LOGIN}/dotfiles`,
    stars: 12,
    lang: "TypeScript",
    prs: 14,
    issues: 3,
    discussions: 0,
    mergeRate: 1,
    from: "2022-01",
    to: "2026-10",
  },
  {
    repo: `${LOGIN}/notes`,
    stars: 3,
    lang: "MDX",
    prs: 6,
    issues: 2,
    discussions: 0,
    mergeRate: 1,
    from: "2023-01",
    to: "2026-09",
  },
];

const ECOSYSTEMS: EcosystemRule[] = [
  { name: "Nimbus", match: "^nimbus(-.*)?$" },
  { name: "Tidepool", match: "^tidepool(-.*)?$" },
];

const TITLES = {
  pr: [
    "fix: handle empty config in {m}",
    "feat: add retry option to {m}",
    "docs: clarify {m} setup",
    "fix: correct timeout handling in {m}",
    "feat: support custom endpoints in {m}",
    "chore: bump minimum Node version",
    "refactor: simplify {m} error paths",
    "test: cover {m} edge cases",
  ],
  issue: [
    "{m} fails when the path contains spaces",
    "Support for {m} in monorepos",
    "Docs: {m} example is outdated",
    "Unexpected error from {m} on Windows",
  ],
  discussion: ["How do you structure {m} in larger projects?", "RFC: rethinking {m}"],
};
const MODULES = ["client", "config", "parser", "router", "cache", "auth", "loader", "exporter"];
const title = (kind: keyof typeof TITLES) => pick(TITLES[kind]).replace("{m}", pick(MODULES));

const monthsBetween = (from: string, to: string) => {
  const out: string[] = [];
  let [y, m] = from.split("-").map(Number) as [number, number];
  const [ty, tm] = to.split("-").map(Number) as [number, number];
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
};
const dateIn = (months: string[]) => {
  const month = pick(months);
  const day = String(1 + Math.floor(rand() * 27)).padStart(2, "0");
  const hour = String(8 + Math.floor(rand() * 12)).padStart(2, "0");
  return `${month}-${day}T${hour}:${String(Math.floor(rand() * 60)).padStart(2, "0")}:00Z`;
};

const rawRepo = (spec: RepoSpec): RawRepo => {
  const [owner, name] = spec.repo.split("/") as [string, string];
  const isUser = ["mira-kowal", "jonas-heller", "tess-ober", LOGIN].includes(owner);
  return {
    nameWithOwner: spec.repo,
    name,
    isPrivate: false,
    stargazerCount: spec.stars,
    owner: { login: owner, __typename: isUser ? "User" : "Organization", avatarUrl: "" },
    primaryLanguage: { name: spec.lang, color: LANGS[spec.lang] },
  };
};

const pullRequests: RawPullRequest[] = [];
const issues: RawIssue[] = [];
const discussions: RawDiscussion[] = [];
let number = 100;
for (const spec of [...SPECS, ...OWN]) {
  const repository = rawRepo(spec);
  const months = monthsBetween(spec.from, spec.to);
  const merged = Math.round(spec.prs * spec.mergeRate);
  for (let i = 0; i < spec.prs; i++) {
    const createdAt = dateIn(months);
    const isMerged = i < merged;
    const open = !isMerged && createdAt > "2026-08";
    pullRequests.push({
      id: `PR_demo_${number}`,
      number: number++,
      title: title("pr"),
      state: isMerged ? "MERGED" : open ? "OPEN" : "CLOSED",
      merged: isMerged,
      createdAt,
      additions: 5 + Math.floor(rand() * rand() * 400),
      deletions: Math.floor(rand() * rand() * 120),
      repository,
    });
  }
  for (let i = 0; i < spec.issues; i++) {
    issues.push({
      id: `I_demo_${number}`,
      number: number++,
      title: title("issue"),
      state: rand() < 0.7 ? "CLOSED" : "OPEN",
      createdAt: dateIn(months),
      repository,
    });
  }
  for (let i = 0; i < spec.discussions; i++) {
    discussions.push({
      id: `D_demo_${number}`,
      number: number++,
      title: title("discussion"),
      createdAt: dateIn(months),
      repository,
    });
  }
}

// Daily calendar: weekday-heavy activity that follows the generated items, plus quieter background.
const perDay = new Map<string, number>();
for (const item of [...pullRequests, ...issues, ...discussions]) {
  const d = item.createdAt.slice(0, 10);
  perDay.set(d, (perDay.get(d) ?? 0) + 1);
}
const years: RawYear[] = [];
for (let y = 2022; y <= 2026; y++) {
  const weeks: RawYear["contributionCalendar"]["weeks"] = [];
  let week: { date: string; contributionCount: number }[] = [];
  let total = 0;
  for (let t = Date.UTC(y, 0, 1); t <= Date.UTC(y, 11, 31); t += 86_400_000) {
    const date = new Date(t).toISOString().slice(0, 10);
    const weekday = new Date(t).getUTCDay();
    const busy = weekday > 0 && weekday < 6 ? 0.62 : 0.2;
    const count =
      (perDay.get(date) ?? 0) + (rand() < busy ? Math.floor(rand() * rand() * 9) + 1 : 0);
    total += count;
    week.push({ date, contributionCount: count });
    if (weekday === 6) {
      weeks.push({ contributionDays: week });
      week = [];
    }
  }
  if (week.length) weeks.push({ contributionDays: week });
  const commitsByRepo = new Map<string, { repo: RawRepo; n: number }>();
  for (const p of pullRequests) {
    if (!p.merged || !p.createdAt.startsWith(String(y))) continue;
    const e = commitsByRepo.get(p.repository.nameWithOwner) ?? { repo: p.repository, n: 0 };
    e.n += 1 + Math.floor(rand() * 3);
    commitsByRepo.set(p.repository.nameWithOwner, e);
  }
  years.push({
    year: y,
    totalCommitContributions: [...commitsByRepo.values()].reduce((a, e) => a + e.n, 0),
    restrictedContributionsCount: 0,
    commitContributionsByRepository: [...commitsByRepo.values()].map((e) => ({
      contributions: { totalCount: e.n },
      repository: e.repo,
    })),
    pullRequestReviewContributionsByRepository: [],
    contributionCalendar: { totalContributions: total, weeks },
  });
}

const raw: RawData = {
  login: LOGIN,
  fetchedAt: FETCHED_AT,
  pullRequests,
  issues,
  discussions,
  years,
};
const draft = aggregate(raw, { ecosystems: ECOSYSTEMS });
const avatars = Object.fromEntries(
  [LOGIN, ...draft.owners.map((o) => o.owner)].sort().map((login) => [login, avatarFor(login)]),
);
const stats = aggregate(raw, { ecosystems: ECOSYSTEMS, avatars });

const out = new URL("../fixtures/demo.json", import.meta.url);
writeFileSync(out, `${JSON.stringify(stats, null, 1)}\n`);
const t = stats.totals;
console.log(
  `demo: ${t.externalPRs} PRs (${t.externalMerged} merged), ${stats.repos.reduce((a, r) => a + r.issues, 0)} issues, ${stats.repos.reduce((a, r) => a + r.discussions, 0)} discussions across ${t.externalRepos} repos and ${t.externalOwners} owners`,
);
