/**
 * Helpers for the charts category. Ported byte-for-byte from the prototype, so this keeps its
 * own categorical palette (validated on both page backgrounds) and document wrapper instead of
 * src/kit.
 */

import type { PrPartKey } from "../../kit/outcomes.ts";
import { MONO, PALETTES, SANS, esc } from "../../kit/svg.ts";
import type { EcosystemStats, RepoStats, Stats } from "../../stats/types.ts";
import type { Level, ThemeName } from "../types.ts";

export { esc };

export const W = 840;

export interface Theme {
  name: ThemeName;
  bg: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  grid: string;
  faint: string;
  /** Neutral for everything outside the coloured groups. */
  other: string;
  /** Eight categorical slots, adjacent pairs distinguishable. */
  cat: string[];
  /** Contribution kinds, shared with every category through src/kit/svg.ts PALETTES. */
  merged: string;
  prOther: string;
  open: string;
  issue: string;
  disc: string;
  /** Fill opacity of treemap tiles. */
  tint: number;
  /** Fill opacity of stacked areas. */
  areaTint: number;
}

export const THEMES: Record<ThemeName, Theme> = {
  dark: {
    name: "dark",
    bg: "#0d1117",
    card: "#0d1117",
    text: "#e6edf3",
    muted: "#9198a1",
    border: "#3d444d",
    grid: "#262c36",
    faint: "#1c2128",
    other: "#656c76",
    cat: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
    merged: PALETTES.dark.merged,
    prOther: PALETTES.dark.pr,
    open: PALETTES.dark.open,
    issue: PALETTES.dark.issue,
    disc: PALETTES.dark.discussion,
    tint: 0.34,
    areaTint: 0.9,
  },
  light: {
    name: "light",
    bg: "#ffffff",
    card: "#ffffff",
    text: "#1f2328",
    muted: "#59636e",
    border: "#d1d9e0",
    grid: "#eaeef2",
    faint: "#f6f8fa",
    other: "#afb8c1",
    cat: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"],
    merged: PALETTES.light.merged,
    prOther: PALETTES.light.pr,
    open: PALETTES.light.open,
    issue: PALETTES.light.issue,
    disc: PALETTES.light.discussion,
    tint: 0.22,
    areaTint: 0.9,
  },
};

/** Categorical slot `i`; the palette has eight, so this never comes back undefined. */
export const cat = (t: Theme, i: number): string => t.cat[i % t.cat.length] ?? t.other;

/** Estimated width (code units, as the prototype counted). */
export const tw = (s: string | number, size: number, mono = false): number =>
  String(s).length * size * (mono ? 0.6 : 0.58);

export const trunc = (s0: string | number, size: number, max: number): string => {
  const s = String(s0);
  if (tw(s, size) <= max) return s;
  const n = Math.floor(max / (size * 0.58)) - 1;
  return `${s.slice(0, Math.max(1, n))}…`;
};

export const f1 = (n: number): number => Math.round(n * 10) / 10;
export const fmt = (n: number): string => n.toLocaleString("en-US");
export const fmtK = (n: number): string =>
  n >= 1000 ? `${n >= 10000 ? Math.round(n / 1000) : f1(n / 1000)}k` : String(n);
export const pct = (n: number, d: number): string => `${(d === 0 ? 0 : (100 * n) / d).toFixed(1)}%`;
export const sum = (a: readonly number[]): number => a.reduce((s, x) => s + x, 0);
export const plural = (n: number, one: string, many = `${one}s`): string =>
  `${n} ${n === 1 ? one : many}`;

export function svgDoc(t: Theme, h: number, body: string, extraStyle = ""): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" role="img">
<style>
text{font-family:${SANS};fill:${t.text}}
.m{fill:${t.muted}}
.mono{font-family:${MONO}}
.b{font-weight:600}
${extraStyle}
</style>
<defs><clipPath id="av" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5"/></clipPath></defs>
<rect x="0.5" y="0.5" width="${W - 1}" height="${h - 1}" rx="6" fill="${t.card}" stroke="${t.border}"/>
${body}
</svg>`;
}

export function header(title: string, sub: string): string {
  return `<text x="24" y="36" font-size="16" class="b">${esc(title)}</text>
<text x="24" y="56" font-size="12" class="m">${esc(sub)}</text>`;
}

/** Round avatar from the embedded data URI, or a monogram circle. */
export function avatar(
  t: Theme,
  avatars: Record<string, string>,
  login: string,
  x: number,
  y: number,
  size: number,
): string {
  const src = avatars[login];
  if (src) {
    return (
      `<image x="${x}" y="${y}" width="${size}" height="${size}" href="${src}" clip-path="url(#av)"/>` +
      `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2 - 0.25}" fill="none" stroke="${t.border}" stroke-width="0.5"/>`
    );
  }
  const letter = (login || "?")[0]?.toUpperCase() ?? "?";
  return (
    `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2}" fill="${t.faint}" stroke="${t.border}"/>` +
    `<text x="${x + size / 2}" y="${y + size / 2 + size * 0.18}" font-size="${size * 0.5}" text-anchor="middle" class="m b">${esc(letter)}</text>`
  );
}

/** Bar with a square left end and a rounded right end. */
export function barPath(x: number, y: number, w: number, h: number, r0 = 4): string {
  if (w <= 0) return "";
  const r = Math.min(r0, w, h / 2);
  return `M${x},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h - r}Q${x + w},${y + h} ${x + w - r},${y + h}H${x}Z`;
}

export interface Repo extends RepoStats {
  group: string;
  name: string;
}

export interface Counts {
  total: number;
  prs: number;
  prsMerged: number;
  issues: number;
  discussions: number;
}

export interface Group extends Counts {
  name: string;
  repos: Repo[];
  owners: Set<string>;
  rank: number;
  /** Login whose avatar stands for the group: the group's owner with the most contributions. */
  avatar: string;
  ecosystem: EcosystemStats | undefined;
}

export interface Rest extends Counts {
  name: string;
  owners: number;
  repos: number;
}

/** How many groups get their own colour; the rest are "everyone else" in neutral gray. */
export const NCOL = 7;

const addCounts = (a: Counts, b: Counts): void => {
  a.total += b.total;
  a.prs += b.prs;
  a.prsMerged += b.prsMerged;
  a.issues += b.issues;
  a.discussions += b.discussions;
};

const zero = (): Counts => ({ total: 0, prs: 0, prsMerged: 0, issues: 0, discussions: 0 });

/** Repos tagged with their group (ecosystem when one matches the owner, otherwise the owner), and the groups ranked. */
export function derive(stats: Stats) {
  const famOf = new Map<string, EcosystemStats>();
  for (const f of stats.ecosystems) for (const o of f.owners) famOf.set(o, f);
  const famRe = stats.ecosystems.map((f) => [new RegExp(f.match), f] as const);
  const ecosystemOf = (owner: string): EcosystemStats | undefined =>
    famOf.get(owner) ?? famRe.find(([re]) => re.test(owner))?.[1];
  const repos: Repo[] = stats.repos.map((r) => ({
    ...r,
    group: ecosystemOf(r.owner)?.name ?? r.owner,
    name: r.repo.split("/")[1] ?? r.repo,
  }));
  const total = sum(repos.map((r) => r.total));
  const groupMap = new Map<string, Group>();
  for (const r of repos) {
    let g = groupMap.get(r.group);
    if (!g) {
      g = {
        name: r.group,
        repos: [],
        owners: new Set(),
        rank: 0,
        avatar: r.owner,
        ecosystem: ecosystemOf(r.owner),
        ...zero(),
      };
      groupMap.set(r.group, g);
    }
    g.repos.push(r);
    g.owners.add(r.owner);
    addCounts(g, r);
  }
  const groups = [...groupMap.values()].sort(
    (a, b) => b.total - a.total || a.name.localeCompare(b.name),
  );
  groups.forEach((g, i) => {
    g.rank = i;
    // For an ecosystem, the owner with the most contributions (first seen wins a tie).
    let best = "";
    let bestTotal = -1;
    for (const o of g.owners) {
      const v = sum(g.repos.filter((r) => r.owner === o).map((r) => r.total));
      if (v > bestTotal) {
        best = o;
        bestTotal = v;
      }
    }
    g.avatar = g.ecosystem ? best : g.name;
  });
  const topGroups = groups.slice(0, NCOL);
  const restGroups = groups.slice(NCOL);
  const rest: Rest = {
    name: "Everyone else",
    ...zero(),
    owners: new Set(restGroups.flatMap((g) => [...g.owners])).size,
    repos: sum(restGroups.map((g) => g.repos.length)),
  };
  for (const g of restGroups) addCounts(rest, g);
  const T = stats.totals;
  const SUB = `${fmt(total)} contributions to upstream repos · ${T.externalRepos} repos · ${T.externalOwners} owners · ${T.externalMerged} PRs merged`;
  /** The largest colored ecosystem that spans more than one owner, used to spell out an ecosystem in footnotes. */
  return { T, repos, total, groups, topGroups, restGroups, rest, SUB };
}

export const colorOf = (t: Theme, g: { rank: number }): string =>
  g.rank < NCOL ? cat(t, g.rank) : t.other;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthName(m: string): string {
  const [y, mo] = m.split("-").map(Number);
  return `${MONTHS[(mo ?? 1) - 1]} ${y}`;
}

/**
 * Colour of a PR outcome part at an explicit level: merged purple, open a lighter purple, closed
 * unmerged the neutral grey, and plain PRs purple under "none" or the softer purple rest under "merged".
 */
export const prColor = (t: Theme, key: PrPartKey, outcomes: Level): string =>
  key === "merged"
    ? t.merged
    : key === "open"
      ? t.open
      : key === "closed"
        ? t.other
        : outcomes === "none"
          ? t.merged
          : t.prOther;
