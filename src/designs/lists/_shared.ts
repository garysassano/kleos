/**
 * Helpers shared by the ranked-list designs (A01–A06). Ported byte-for-byte from the prototype,
 * so the text-width estimate, `truncate` and the avatar markup differ slightly from `src/kit/svg.ts`.
 */
import { MONO, PALETTES, SANS, compact, esc, percent } from "../../kit/svg.ts";
import type { OwnerStats, RepoStats, Stats } from "../../stats/types.ts";
import type { ThemeName } from "../types.ts";

export { compact, esc, percent };

export interface Theme {
  card: string;
  border: string;
  hair: string;
  zebra: string;
  track: string;
  text: string;
  muted: string;
  faint: string;
  /** Merged PRs; other PRs use the same colour at `PR_OTHER_OPACITY`. */
  pr: string;
  iss: string;
  disc: string;
  /** Neutral bar (repo stars in A06). */
  bar: string;
}

const EXTRA: Record<ThemeName, { track: string; bar: string }> = {
  dark: { track: "#212830", bar: "#656c76" },
  light: { track: "#eaeef2", bar: "#9ba5b0" },
};

export function themeOf(theme: ThemeName): Theme {
  const p = PALETTES[theme];
  return {
    card: p.bg,
    border: p.border,
    hair: p.hair,
    zebra: p.surface,
    track: EXTRA[theme].track,
    text: p.text,
    muted: p.muted,
    faint: p.faint,
    pr: p.merged,
    iss: p.issue,
    disc: p.discussion,
    bar: EXTRA[theme].bar,
  };
}

export const PR_OTHER_OPACITY = 0.42;

export interface Counts {
  prs: number;
  prsMerged: number;
  issues: number;
  discussions: number;
}

/** Everything the designs derive from the snapshot. */
export interface ListData {
  repos: RepoStats[];
  owners: OwnerStats[];
  ownerBy: Map<string, OwnerStats>;
  avatars: Record<string, string>;
  /** Sums over all external repositories. */
  ext: { prs: number; merged: number; open: number; issues: number; disc: number; total: number };
  nRepos: number;
  nOwners: number;
}

export function dataOf(stats: Stats): ListData {
  const ext = stats.repos.reduce(
    (a, r) => ({
      prs: a.prs + r.prs,
      merged: a.merged + r.prsMerged,
      open: a.open + r.prsOpen,
      issues: a.issues + r.issues,
      disc: a.disc + r.discussions,
      total: a.total + r.total,
    }),
    { prs: 0, merged: 0, open: 0, issues: 0, disc: 0, total: 0 },
  );
  return {
    repos: stats.repos,
    owners: stats.owners,
    ownerBy: new Map(stats.owners.map((o) => [o.owner, o])),
    avatars: stats.avatars ?? {},
    ext,
    nRepos: stats.totals.externalRepos,
    nOwners: stats.totals.externalOwners,
  };
}

const W_SANS = 0.55;
const W_MONO = 0.6;
export const textW = (s: string, size: number, mono = false): number =>
  s.length * size * (mono ? W_MONO : W_SANS);

export function truncate(s: string, maxPx: number, size: number, mono = false): string {
  if (textW(s, size, mono) <= maxPx) return s;
  const n = Math.max(1, Math.floor(maxPx / (size * (mono ? W_MONO : W_SANS))) - 1);
  return `${s.slice(0, n)}…`;
}

export const plural = (n: number, one: string, many = `${one}s`): string =>
  `${n} ${n === 1 ? one : many}`;

const yr = (iso: string): string => iso.slice(0, 4);
/** Active years of a repo, such as "2023–25"; an en dash when it has no dated activity. */
export function span(r: RepoStats): string {
  if (!r.first || !r.last) return "–";
  return yr(r.first) === yr(r.last) ? yr(r.first) : `${yr(r.first)}–${yr(r.last).slice(2)}`;
}

export interface TextOpts {
  size?: number;
  /** A `Theme` key or a literal colour. */
  fill?: string;
  anchor?: "start" | "middle" | "end";
  weight?: number;
  mono?: boolean;
  extra?: string;
}

/** `s` is inserted as markup: escape user text before passing it. */
export function t(T: Theme, x: number, y: number, s: string, o: TextOpts = {}): string {
  const { size = 13, fill = "text", anchor = "start", weight = 400, mono = false, extra = "" } = o;
  const f = (T as unknown as Record<string, string | undefined>)[fill] ?? fill;
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${f}"${anchor !== "start" ? ` text-anchor="${anchor}"` : ""}${weight !== 400 ? ` font-weight="${weight}"` : ""}${mono ? ' class="m"' : ""}${extra}>${s}</text>`;
}

/** Right-aligned number cell; zero shows as a faint en dash. */
export const num = (T: Theme, x: number, y: number, n: number, o: TextOpts = {}): string =>
  n === 0
    ? t(T, x, y, "–", { ...o, fill: "faint", anchor: "end", mono: true })
    : t(T, x, y, String(n), { fill: "text", anchor: "end", mono: true, ...o });

/** Avatar from the embedded data URI (uses the `cc`/`cr` clip paths from `frame`), or a monogram. */
export function avatar(
  T: Theme,
  avatars: Record<string, string>,
  login: string,
  type: "Organization" | "User",
  x: number,
  y: number,
  s: number,
): string {
  const user = type === "User";
  const rx = user ? s / 2 : Math.round(s * 0.22);
  const ring = `<rect x="${x + 0.5}" y="${y + 0.5}" width="${s - 1}" height="${s - 1}" rx="${rx}" fill="none" stroke="${T.border}" stroke-opacity=".9"/>`;
  const uri = avatars[login];
  if (uri) {
    return `<image href="${uri}" x="${x}" y="${y}" width="${s}" height="${s}" clip-path="url(#${user ? "cc" : "cr"})" preserveAspectRatio="xMidYMid slice"/>${ring}`;
  }
  return (
    `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${rx}" fill="${T.track}"/>${ring}` +
    t(T, x + s / 2, y + s / 2 + s * 0.18, esc((login[0] ?? "?").toUpperCase()), {
      size: Math.round(s * 0.5),
      fill: "muted",
      anchor: "middle",
      weight: 600,
    })
  );
}

export interface Segment {
  v: number;
  c: string;
  op?: number;
}

export const segsOf = (T: Theme, o: Counts): Segment[] => [
  { v: o.prsMerged, c: T.pr },
  { v: o.prs - o.prsMerged, c: T.pr, op: PR_OTHER_OPACITY },
  { v: o.issues, c: T.iss },
  { v: o.discussions, c: T.disc },
];

/** Horizontal stacked bar. Totals above `scaleMax` are drawn to `maxW` with an axis-break mark. */
export function stack(
  T: Theme,
  x: number,
  y: number,
  h: number,
  segs: Segment[],
  scaleMax: number,
  maxW: number,
  { dir = 1, gap = 2 }: { dir?: number; gap?: number } = {},
): string {
  const total = segs.reduce((s, g) => s + g.v, 0);
  if (!total || !(scaleMax > 0)) return "";
  const broken = total > scaleMax;
  const len = broken ? maxW : Math.max(3, (total / scaleMax) * maxW);
  const k = len / total;
  const live = segs.filter((g) => g.v > 0);
  let cx = 0;
  let out = "";
  live.forEach((g, i) => {
    let w = g.v * k - (i < live.length - 1 ? gap : 0);
    w = Math.max(1.5, w);
    const sx = dir > 0 ? x + cx : x - cx - w;
    out += `<rect x="${sx.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${h}" rx="${Math.min(2, h / 2)}" fill="${g.c}"${g.op ? ` fill-opacity="${g.op}"` : ""}/>`;
    cx += g.v * k;
  });
  if (broken) {
    const bx = dir > 0 ? x + maxW * 0.78 : x - maxW * 0.78;
    out += `<path d="M${bx - 2} ${y + h + 2}L${bx + 2} ${y - 2}M${bx + 3} ${y + h + 2}L${bx + 7} ${y - 2}" stroke="${T.card}" stroke-width="2.4"/>`;
  }
  return out;
}

export interface LegendItem {
  c?: string;
  op?: number;
  label: string;
}

export function legend(
  T: Theme,
  x: number,
  y: number,
  items: LegendItem[],
  { size = 11.5, gapX = 18 }: { size?: number; gapX?: number } = {},
): string {
  let cx = x;
  let out = "";
  for (const it of items) {
    if (it.c) {
      out += `<rect x="${cx}" y="${y - 8.5}" width="9" height="9" rx="2" fill="${it.c}"${it.op ? ` fill-opacity="${it.op}"` : ""}/>`;
      cx += 14;
    }
    out += t(T, cx, y, esc(it.label), { size, fill: "muted" });
    cx += it.label.length * size * 0.53 + gapX;
  }
  return out;
}

export const STD_LEGEND = (T: Theme): LegendItem[] => [
  { c: T.pr, label: "PRs merged" },
  { c: T.pr, op: PR_OTHER_OPACITY, label: "PRs open or closed" },
  { c: T.iss, label: "Issues" },
  { c: T.disc, label: "Discussions" },
];

/** "owner/name" with the owner muted, truncated to `maxPx`. */
export function repoLabel(
  T: Theme,
  x: number,
  y: number,
  full: string,
  maxPx: number,
  size = 13,
): string {
  const s = truncate(full, maxPx, size);
  const i = s.indexOf("/");
  if (i < 0) return t(T, x, y, esc(s), { size });
  return `<text x="${x}" y="${y}" font-size="${size}"><tspan fill="${T.muted}">${esc(s.slice(0, i + 1))}</tspan><tspan fill="${T.text}">${esc(s.slice(i + 1))}</tspan></text>`;
}

/** Root <svg> with the shared styles, clip paths and card outline. */
export function frame(T: Theme, W: number, H: number, body: string, title: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>
text{font-family:${SANS};font-variant-numeric:tabular-nums}
.m{font-family:${MONO}}
.row{animation:fade .5s ease-out both}
.grow{transform-box:fill-box;transform-origin:left center;animation:grow .7s cubic-bezier(.2,.7,.2,1) both}
.growl{transform-box:fill-box;transform-origin:right center;animation:grow .7s cubic-bezier(.2,.7,.2,1) both}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
@media (prefers-reduced-motion:reduce){.row,.grow,.growl{animation:none}}
</style>
<defs><clipPath id="cc" clipPathUnits="objectBoundingBox"><circle cx=".5" cy=".5" r=".5"/></clipPath><clipPath id="cr" clipPathUnits="objectBoundingBox"><rect width="1" height="1" rx=".22"/></clipPath></defs>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="6" fill="${T.card}" stroke="${T.border}"/>
${body}
</svg>
`;
}

/** Staggered entrance per row. */
export const delay = (i: number): string => ` style="animation-delay:${(0.04 * i).toFixed(2)}s"`;

export const header = (T: Theme, title: string, sub: string, x = 24): string =>
  t(T, x, 36, esc(title), { size: 16, weight: 600 }) +
  t(T, x, 57, esc(sub), { size: 12, fill: "muted" });

/** The table rule under a header row or above a footer. */
export const rule = (
  T: Theme,
  W: number,
  y: number,
  stroke: "border" | "hair" = "border",
): string => `<line x1="24" x2="${W - 24}" y1="${y + 0.5}" y2="${y + 0.5}" stroke="${T[stroke]}"/>`;

/** The top bar is shortened when its total is more than this many times the runner-up's. */
export const BREAK_RATIO = 2;

/**
 * Bar scale for a ranked list. When the leader is more than `BREAK_RATIO` × the runner-up, the
 * scale ends just past the runner-up and the leader's bar is drawn shortened (see `stack`), so
 * the other bars keep their length; otherwise the leader sets the scale.
 */
export function barScale(totals: number[]): { scaleMax: number; broken: boolean } {
  const [first = 0, second = 0] = totals;
  if (second > 0 && first > BREAK_RATIO * second) {
    return { scaleMax: Math.ceil(second * 1.12), broken: true };
  }
  return { scaleMax: Math.max(1, first), broken: false };
}

const CUE = "not to scale";
const CUE_SIZE = 11;
const CUE_GAP = 6;

/** Estimated width of `breakCue`, so the shortened bar can leave room for it. */
export const breakCueW = (total: number, size: number): number =>
  textW(String(total), size, true) + CUE_GAP + textW(CUE, CUE_SIZE);

/**
 * The true total and a "not to scale" note, placed right after a shortened bar so the row
 * explains itself. `x` is where the label starts, `y` its baseline.
 */
export const breakCue = (T: Theme, x: number, y: number, total: number, size: number): string =>
  t(T, x, y, String(total), { size, weight: 700, mono: true }) +
  t(T, x + textW(String(total), size, true) + CUE_GAP, y, CUE, { size: CUE_SIZE, fill: "muted" });

/** "top 12 of 241", or "all 6" when the list shows every item. */
export const topOf = (shown: number, total: number): string =>
  shown >= total ? `all ${total}` : `top ${shown} of ${total}`;

export const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
