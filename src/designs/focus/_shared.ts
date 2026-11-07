/** Helpers shared by the "Focus and stories" designs (H). */
import { type Palette, SANS, esc } from "../../kit/svg.ts";
import type { FamilyStats, RepoStats, Stats } from "../../stats/types.ts";

/** A family or a stand-in for one: a single independent owner treated as its own group. */
export interface Group {
  name: string;
  owners: string[];
  /** Avatar key: the member owner with the most contributions. */
  lead: string;
  leadIsOrg: boolean;
  /** True for a real family from the snapshot, false for a lone owner standing in. */
  family: boolean;
  repos: RepoStats[];
  total: number;
  prs: number;
  prsMerged: number;
  prsOpen: number;
  issues: number;
  discussions: number;
}

export const sum = <T>(xs: readonly T[], f: (x: T) => number): number =>
  xs.reduce((a, x) => a + f(x), 0);

const byTotal = (a: { total: number }, b: { total: number }) => b.total - a.total;

function groupOf(stats: Stats, name: string, owners: string[], family: boolean): Group {
  const set = new Set(owners);
  const repos = stats.repos.filter((r) => set.has(r.owner)).sort(byTotal);
  const members = stats.owners.filter((o) => set.has(o.owner)).sort(byTotal);
  const lead = members[0]?.owner ?? owners[0] ?? name;
  return {
    name,
    owners: members.length ? members.map((o) => o.owner) : owners,
    lead,
    leadIsOrg: (members[0]?.type ?? "Organization") === "Organization",
    family,
    repos,
    total: sum(repos, (r) => r.total),
    prs: sum(repos, (r) => r.prs),
    prsMerged: sum(repos, (r) => r.prsMerged),
    prsOpen: sum(repos, (r) => r.prsOpen),
    issues: sum(repos, (r) => r.issues),
    discussions: sum(repos, (r) => r.discussions),
  };
}

export const familyGroup = (stats: Stats, f: FamilyStats): Group =>
  groupOf(stats, f.name, f.owners, true);

/** Owners that belong to no family. */
export function independentOwners(stats: Stats) {
  const inFamily = new Set(stats.families.flatMap((f) => f.owners));
  return stats.owners.filter((o) => !inFamily.has(o.owner)).sort(byTotal);
}

/**
 * The `n` biggest groups: families by total contributions, then — when there are fewer than `n`
 * families — the biggest independent owners, each standing in as a group of one.
 */
export function topGroups(stats: Stats, n: number): Group[] {
  const groups = stats.families
    .map((f) => familyGroup(stats, f))
    .filter((g) => g.total > 0)
    .sort(byTotal)
    .slice(0, n);
  for (const o of independentOwners(stats)) {
    if (groups.length >= n) break;
    if (o.total > 0) groups.push(groupOf(stats, o.owner, [o.owner], false));
  }
  return groups;
}

/** All families with at least one contribution, biggest first. */
export const allFamilies = (stats: Stats): Group[] =>
  stats.families
    .map((f) => familyGroup(stats, f))
    .filter((g) => g.total > 0)
    .sort(byTotal);

/** A rounded card that fills the whole document. */
export const frame = (w: number, h: number, p: Palette): string =>
  `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="6" fill="${p.bg}" stroke="${p.border}"/>`;

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const LONG_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "2026-03" → "Mar 2026". */
export const monthLabel = (ym: string): string =>
  `${MONTHS[Number(ym.slice(5, 7)) - 1] ?? ""} ${ym.slice(0, 4)}`;

/** "2026-03" → "March". */
export const longMonth = (ym: string): string => LONG_MONTHS[Number(ym.slice(5, 7)) - 1] ?? "";

/** ISO timestamp → "7 November 2026". */
export const dayLabel = (iso: string): string =>
  `${Number(iso.slice(8, 10))} ${longMonth(iso.slice(0, 7))} ${iso.slice(0, 4)}`;

/** Count with a singular or plural noun: plural(1, "repo") → "1 repo". */
export const plural = (n: number, one: string, many = `${one}s`): string =>
  `${n.toLocaleString("en-US")} ${n === 1 ? one : many}`;

export const num = (n: number): string => n.toLocaleString("en-US");

/** Contribution kinds in the fixed palette order. */
export const kinds = (
  x: { prs: number; prsMerged: number; issues: number; discussions: number },
  p: Palette,
) => [
  { key: "merged", label: "PRs merged", value: x.prsMerged, color: p.merged },
  { key: "pr", label: "PRs not merged", value: x.prs - x.prsMerged, color: p.pr },
  { key: "issue", label: "Issues", value: x.issues, color: p.issue },
  { key: "discussion", label: "Discussions", value: x.discussions, color: p.discussion },
];

/**
 * A horizontal bar of the four contribution kinds, `scale` pixels per contribution. Segments
 * are separated by a 1 px gap; tiny non-zero segments stay at least 2 px wide.
 */
export function mixBar(opts: {
  x: number;
  y: number;
  h: number;
  scale: number;
  counts: { prs: number; prsMerged: number; issues: number; discussions: number };
  p: Palette;
}): string {
  const { x, y, h, scale, counts, p } = opts;
  let cx = x;
  let out = "";
  for (const k of kinds(counts, p)) {
    if (k.value <= 0) continue;
    const w = Math.max(2, k.value * scale);
    out += `<rect x="${cx.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="${Math.min(2, h / 2)}" fill="${k.color}"/>`;
    cx += w + 1;
  }
  return out;
}

/** A legend of coloured squares, laid out left to right from (x, y = text baseline). */
export function legend(opts: {
  x: number;
  y: number;
  p: Palette;
  items: { label: string; color: string }[];
  size?: number;
}): string {
  const { x, y, p, items, size = 12 } = opts;
  let cx = x;
  let out = "";
  for (const it of items) {
    out += `<rect x="${cx}" y="${y - size * 0.75}" width="${size * 0.8}" height="${size * 0.8}" rx="2" fill="${it.color}"/>`;
    out += `<text x="${cx + size * 0.8 + 6}" y="${y}" font-family="${SANS}" font-size="${size}" fill="${p.muted}">${esc(it.label)}</text>`;
    cx += size * 0.8 + 6 + it.label.length * size * 0.58 + 18;
  }
  return out;
}

/** Shorthand for a <text> element in the sans font. `attrs` is appended verbatim. */
export const t = (
  x: number,
  y: number,
  s: string | number,
  size: number,
  fill: string,
  attrs = "",
): string =>
  `<text x="${x}" y="${y}" font-family="${SANS}" font-size="${size}" fill="${fill}"${attrs ? ` ${attrs}` : ""}>${esc(s)}</text>`;

/** Earliest "YYYY-MM" key of a repo's monthly counts, falling back to its first date. */
export function firstMonth(r: RepoStats): string | null {
  const keys = Object.keys(r.monthly)
    .filter((k) => (r.monthly[k] ?? 0) > 0)
    .sort();
  return keys[0] ?? r.first?.slice(0, 7) ?? null;
}

/** Contributions per "YYYY-MM" across every external repo. */
export function monthlyTotals(stats: Stats): Map<string, number> {
  const m = new Map<string, number>();
  for (const r of stats.repos)
    for (const [k, v] of Object.entries(r.monthly)) m.set(k, (m.get(k) ?? 0) + v);
  return m;
}

/** "2026-03" + n months. */
export function addMonths(ym: string, n: number): string {
  const i = Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1 + n;
  return `${Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`;
}

export const monthIndex = (ym: string): number =>
  Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1;
