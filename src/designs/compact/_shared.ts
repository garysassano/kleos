/**
 * Helpers shared by the compact designs (E01–E06). They keep their own text metrics and
 * GitHub-style chrome instead of src/kit, so changes here don't shift other categories.
 */

import { MONTHS as MON, fmt, plural, r1 } from "../../kit/format.ts";
import { type PrCounts, prLegend, prParts } from "../../kit/outcomes.ts";
import { MONO, PALETTES, SANS, esc } from "../../kit/svg.ts";
import type { OwnerStats, RepoStats, Stats } from "../../stats/types.ts";
import type { Level, ThemeName } from "../types.ts";

export { MON, esc, fmt, plural, r1 };

export interface Theme {
  name: ThemeName;
  page: string;
  card: string;
  inset: string;
  border: string;
  borderMuted: string;
  text: string;
  muted: string;
  accent: string;
  track: string;
  mono: string;
  pr: string;
  prOther: string;
  issue: string;
  disc: string;
  /** PRs still open and PRs closed without merging, for outcomes "full": a lighter tone of `pr`, and neutral grey. */
  open: string;
  closed: string;
  neutralBar: string;
  badgeL: string;
  badgeR: string;
  onBadge: string;
  star: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  dark: {
    name: "dark",
    page: "#0d1117",
    card: "#151b23",
    inset: "#0d1117",
    border: "#3d444d",
    borderMuted: "#2a313c",
    text: "#e6edf3",
    muted: "#9198a1",
    accent: "#4493f8",
    track: "#262c36",
    mono: "#3d444d",
    pr: PALETTES.dark.merged,
    prOther: PALETTES.dark.pr,
    issue: PALETTES.dark.issue,
    disc: PALETTES.dark.discussion,
    open: PALETTES.dark.open,
    closed: PALETTES.dark.closed,
    neutralBar: "#7d8590",
    badgeL: "#3d444d",
    badgeR: "#1f6feb",
    onBadge: "#ffffff",
    star: "#9198a1",
  },
  light: {
    name: "light",
    page: "#ffffff",
    card: "#f6f8fa",
    inset: "#ffffff",
    border: "#d1d9e0",
    borderMuted: "#e6eaef",
    text: "#1f2328",
    muted: "#59636e",
    accent: "#0969da",
    track: "#e6eaef",
    mono: "#d1d9e0",
    pr: PALETTES.light.merged,
    prOther: PALETTES.light.pr,
    issue: PALETTES.light.issue,
    disc: PALETTES.light.discussion,
    open: PALETTES.light.open,
    closed: PALETTES.light.closed,
    neutralBar: "#8c959f",
    badgeL: "#555555",
    badgeR: "#0969da",
    onBadge: "#ffffff",
    star: "#59636e",
  },
};

export const kfmt = (n: number): string =>
  n >= 1e6
    ? `${(Math.floor(n / 1e5) / 10).toFixed(1).replace(/\.0$/, "")}M`
    : n >= 1000
      ? `${(Math.floor(n / 100) / 10).toFixed(1).replace(/\.0$/, "")}k`
      : String(n);

export interface TextOpts {
  mono?: boolean;
  bold?: boolean;
}
/** Estimated text width: 0.6em per char for mono, 0.61em for bold sans, 0.58em for sans. */
export const tw = (
  s: string | number,
  size: number,
  { mono = false, bold = false }: TextOpts = {},
) => String(s).length * size * (mono ? 0.6 : bold ? 0.61 : 0.58);
export function trunc(str: string, maxPx: number, size: number, opts?: TextOpts): string {
  let s = String(str);
  if (tw(s, size, opts) <= maxPx) return s;
  while (s.length > 1 && tw(`${s}…`, size, opts) > maxPx) s = s.slice(0, -1);
  return `${s}…`;
}
export const monthLabel = (iso: string): string =>
  `${MON[+iso.slice(5, 7) - 1]} ${iso.slice(0, 4)}`;
export const dayLabel = (iso: string): string =>
  `${MON[+iso.slice(5, 7) - 1]} ${+iso.slice(8, 10)}, ${iso.slice(0, 4)}`;

/** Per-render state: theme, avatars and a counter for unique clip-path ids. */
export interface Ctx {
  t: Theme;
  stats: Stats;
  id(prefix: string): string;
}
export function context(stats: Stats, theme: ThemeName): Ctx {
  let uid = 0;
  return { t: THEMES[theme], stats, id: (p) => `${p}${++uid}` };
}

/** Organization = rounded square, user = circle; monogram when the owner has no embedded avatar. */
export function avatar(
  c: Ctx,
  login: string,
  x: number,
  y: number,
  size: number,
  { type = "Organization", ring = null }: { type?: string; ring?: string | null } = {},
): string {
  const { t } = c;
  const id = c.id("av");
  const rx = type === "User" ? size / 2 : Math.max(3, size * 0.2);
  const ringEl = ring
    ? `<rect x="${x - 1.5}" y="${y - 1.5}" width="${size + 3}" height="${size + 3}" rx="${rx + 1.5}" fill="${ring}"/>`
    : "";
  const uri = c.stats.avatars[login];
  if (!uri) {
    return `${ringEl}<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${rx}" fill="${t.mono}"/><text x="${x + size / 2}" y="${y + size / 2}" dy=".35em" text-anchor="middle" font-size="${r1(size * 0.5)}" font-weight="600" fill="${t.text}">${esc((login[0] ?? "?").toUpperCase())}</text>`;
  }
  return `${ringEl}<clipPath id="${id}"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${rx}"/></clipPath><image href="${uri}" x="${x}" y="${y}" width="${size}" height="${size}" clip-path="url(#${id})" preserveAspectRatio="xMidYMid slice"/><rect x="${x + 0.5}" y="${y + 0.5}" width="${size - 1}" height="${size - 1}" rx="${rx}" fill="none" stroke="${t.border}" stroke-opacity=".6"/>`;
}

/** Octicons on a 16px grid. */
const OCT = {
  pr: "M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z",
  merge:
    "M5.45 5.154A4.25 4.25 0 0 0 9.25 7.5h1.378a2.251 2.251 0 1 1 0 1.5H9.25A5.734 5.734 0 0 1 5 7.123v3.505a2.25 2.25 0 1 1-1.5 0V5.372a2.25 2.25 0 1 1 1.95-.218ZM4.25 13.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm8.5-4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z",
  issue:
    "M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z",
  disc: "M1.75 1h8.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 10.25 10H7.061l-2.574 2.573A1.458 1.458 0 0 1 2 11.543V10h-.25A1.75 1.75 0 0 1 0 8.25v-5.5C0 1.784.784 1 1.75 1ZM1.5 2.75v5.5c0 .138.112.25.25.25h1a.75.75 0 0 1 .75.75v2.19l2.72-2.72a.749.749 0 0 1 .53-.22h3.5a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25Zm13 2a.25.25 0 0 0-.25-.25h-.5a.75.75 0 0 1 0-1.5h.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 14.25 12H14v1.543a1.458 1.458 0 0 1-2.487 1.03L9.22 12.28a.749.749 0 0 1 1.06-1.06l2.22 2.22v-2.19a.75.75 0 0 1 .75-.75h1a.25.25 0 0 0 .25-.25Z",
  star: "M8 .25a.75.75 0 0 1 .673.418l1.882 3.815 4.21.612a.75.75 0 0 1 .416 1.279l-3.046 2.97.719 4.192a.751.751 0 0 1-1.088.791L8 12.347l-3.766 1.98a.75.75 0 0 1-1.088-.79l.72-4.194L.818 6.374a.75.75 0 0 1 .416-1.28l4.21-.611L7.327.668A.75.75 0 0 1 8 .25Zm0 2.445L6.615 5.5a.75.75 0 0 1-.564.41l-3.097.45 2.24 2.184a.75.75 0 0 1 .216.664l-.528 3.084 2.769-1.456a.75.75 0 0 1 .698 0l2.77 1.456-.53-3.084a.75.75 0 0 1 .216-.664l2.24-2.183-3.096-.45a.75.75 0 0 1-.564-.41L8 2.694Z",
  repo: "M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75h-2.5a.75.75 0 0 1 0-1.5h1.75v-2h-8a1 1 0 0 0-.714 1.7.75.75 0 1 1-1.072 1.05A2.495 2.495 0 0 1 2 11.5Zm10.5-1h-8a1 1 0 0 0-1 1v6.708A2.486 2.486 0 0 1 4.5 9h8ZM5 12.25a.25.25 0 0 1 .25-.25h3.5a.25.25 0 0 1 .25.25v3.25a.25.25 0 0 1-.4.2l-1.45-1.087a.249.249 0 0 0-.3 0L5.4 15.7a.25.25 0 0 1-.4-.2Z",
  org: "M1.75 16A1.75 1.75 0 0 1 0 14.25V1.75C0 .784.784 0 1.75 0h8.5C11.216 0 12 .784 12 1.75v12.5c0 .085-.006.168-.018.25h2.268a.25.25 0 0 0 .25-.25V8.285a.25.25 0 0 0-.111-.208l-1.055-.703a.749.749 0 1 1 .832-1.248l1.055.703c.487.325.779.871.779 1.456v5.965A1.75 1.75 0 0 1 14.25 16h-3.5a.766.766 0 0 1-.197-.026c-.099.017-.2.026-.303.026h-3a.75.75 0 0 1-.75-.75V14h-1v1.25a.75.75 0 0 1-.75.75Zm-.25-1.75c0 .138.112.25.25.25H4v-1.25a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 .75.75v1.25h2.25a.25.25 0 0 0 .25-.25V1.75a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25ZM3.75 6h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 3.75A.75.75 0 0 1 3.75 3h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 3.75Zm4 3A.75.75 0 0 1 7.75 6h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 7 6.75ZM7.75 3h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5ZM3 9.75A.75.75 0 0 1 3.75 9h.5a.75.75 0 0 1 0 1.5h-.5A.75.75 0 0 1 3 9.75ZM7.75 9h.5a.75.75 0 0 1 0 1.5h-.5a.75.75 0 0 1 0-1.5Z",
  calendar:
    "M4.75 0a.75.75 0 0 1 .75.75V2h5V.75a.75.75 0 0 1 1.5 0V2h1.25c.966 0 1.75.784 1.75 1.75v10.5A1.75 1.75 0 0 1 13.25 16H2.75A1.75 1.75 0 0 1 1 14.25V3.75C1 2.784 1.784 2 2.75 2H4V.75A.75.75 0 0 1 4.75 0ZM2.5 7.5v6.75c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25V7.5Zm10.75-4H2.75a.25.25 0 0 0-.25.25V6h11V3.75a.25.25 0 0 0-.25-.25Z",
};
export type IconName = keyof typeof OCT | "percent";

export function icon(name: IconName, x: number, y: number, size: number, fill: string): string {
  const s = size / 16;
  if (name === "percent")
    return `<g transform="translate(${x} ${y}) scale(${s})" fill="none" stroke="${fill}" stroke-width="1.5" stroke-linecap="round"><path d="M3.5 12.5 12.5 3.5"/><circle cx="4.5" cy="4.5" r="1.75"/><circle cx="11.5" cy="11.5" r="1.75"/></g>`;
  return `<path transform="translate(${x} ${y}) scale(${s})" fill="${fill}" d="${OCT[name]}"/>`;
}

export interface Seg {
  k?: string;
  v: number;
  c: string;
}

/**
 * Segmented horizontal bar with 2px gaps and rounded outer ends. `fullWidth` shortens the
 * filled part (for bars scaled against a maximum) while the track keeps width `w`.
 */
export function segBar(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  segs: Seg[],
  {
    track = true,
    gap = 2,
    cls = "",
    style = "",
    fullWidth,
  }: { track?: boolean; gap?: number; cls?: string; style?: string; fullWidth?: number } = {},
): string {
  const live = segs.filter((s) => s.v > 0);
  const tot = live.reduce((a, s) => a + s.v, 0);
  const id = c.id("sb");
  let out = "";
  if (track)
    out += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${c.t.track}"/>`;
  if (!tot) return out;
  const full = fullWidth ?? w;
  const usable = full - gap * (live.length - 1);
  let cx = x;
  let parts = "";
  for (const s of live) {
    const sw = Math.max(1, (s.v / tot) * usable);
    parts += `<rect x="${r1(cx)}" y="${y}" width="${r1(sw)}" height="${h}" fill="${s.c}"/>`;
    cx += sw + gap;
  }
  out += `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${r1(full)}" height="${h}" rx="${h / 2}"/></clipPath><g clip-path="url(#${id})"${cls ? ` class="${cls}"` : ""}${style ? ` style="${style}"` : ""}>${parts}</g>`;
  return out;
}

export interface Counts {
  prs: number;
  prsMerged: number;
  issues: number;
  discussions: number;
}
export const kinds = (t: Theme, o: Counts): (Seg & { k: string })[] => [
  { k: "PRs merged", v: o.prsMerged, c: t.pr },
  { k: "other PRs", v: o.prs - o.prsMerged, c: t.prOther },
  { k: "issues", v: o.issues, c: t.issue },
  { k: "discussions", v: o.discussions, c: t.disc },
];
/** Colour of a PR outcome part at an explicit level: under "none" all PRs take the PR colour. */
const prColor = (t: Theme, key: string, outcomes: Level): string =>
  key === "merged"
    ? t.pr
    : key === "open"
      ? t.open
      : key === "closed"
        ? t.closed
        : outcomes === "none"
          ? t.pr
          : t.prOther;

/** Like `kinds`, with the PR segments decided by an explicit outcomes level (src/kit/outcomes.ts). */
export const kindsAt = (
  t: Theme,
  o: PrCounts & { issues: number; discussions: number },
  outcomes: Level,
): (Seg & { k: string })[] => [
  ...prParts(o, outcomes).map((p) => ({ k: p.label, v: p.count, c: prColor(t, p.key, outcomes) })),
  { k: "issues", v: o.issues, c: t.issue },
  { k: "discussions", v: o.discussions, c: t.disc },
];

/** Legend entries matching `kindsAt`: PR entries from `prLegend`, then issues and discussions. */
export const legendAt = (t: Theme, outcomes: Level): { k: string; c: string }[] => [
  ...prLegend(outcomes).map(({ key, label }) => ({ k: label, c: prColor(t, key, outcomes) })),
  { k: "issues", c: t.issue },
  { k: "discussions", c: t.disc },
];
export const ONE_OF_EACH: Counts = { prs: 1, prsMerged: 1, issues: 1, discussions: 1 };

export function legend(
  x: number,
  y: number,
  t: Theme,
  items: { k: string; c: string }[],
  {
    size = 11,
    gap = 14,
    anchor = "start",
    swatchRx = 2,
  }: { size?: number; gap?: number; anchor?: "start" | "end"; swatchRx?: number } = {},
): string {
  const widths = items.map((it) => 10 + 5 + tw(it.k, size));
  const total = widths.reduce((a, b) => a + b, 0) + gap * (items.length - 1);
  let cx = anchor === "end" ? x - total : x;
  let out = "";
  items.forEach((it, i) => {
    out += `<rect x="${r1(cx)}" y="${y - 8}" width="9" height="9" rx="${swatchRx}" fill="${it.c}"/><text x="${r1(cx + 14)}" y="${y}" font-size="${size}" fill="${t.muted}">${esc(it.k)}</text>`;
    cx += (widths[i] ?? 0) + gap;
  });
  return out;
}

export function svg(w: number, h: number, title: string, body: string, css = ""): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><style>text{font-family:${SANS}}.mono{font-family:${MONO}}${css}</style>${body}</svg>\n`;
}
export const card = (w: number, h: number, t: Theme, fill = t.card): string =>
  `<rect x=".5" y=".5" width="${w - 1}" height="${h - 1}" rx="6" fill="${fill}" stroke="${t.border}"/>`;

/** Upstream totals derived from the snapshot (external repositories only). */
export function upstream(stats: Stats) {
  const T = stats.totals;
  const repos: RepoStats[] = stats.repos;
  const owners: OwnerStats[] = stats.owners;
  const sum = (k: "prsOpen" | "issues" | "discussions") => repos.reduce((s, r) => s + r[k], 0);
  const prs = T.externalPRs;
  const merged = T.externalMerged;
  const issues = sum("issues");
  const discussions = sum("discussions");
  return {
    prs,
    merged,
    open: sum("prsOpen"),
    issues,
    discussions,
    repos: T.externalRepos,
    owners: T.externalOwners,
    orgs: owners.filter((o) => o.type === "Organization").length,
    users: owners.filter((o) => o.type === "User").length,
    reposWithMerge: repos.filter((r) => r.prsMerged > 0).length,
    total: prs + issues + discussions,
    rate: prs ? Math.round((merged / prs) * 100) : 0,
  };
}
