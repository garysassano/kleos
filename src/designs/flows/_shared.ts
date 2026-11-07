/**
 * Helpers shared by the flow and network cards (category F): the card frame, contribution groups
 * (an ecosystem counts as one group, every other owner is its own), a fixed categorical palette, and
 * small layout utilities.
 */

import {
  PALETTES,
  type Palette,
  SANS,
  avatar,
  document,
  esc,
  truncate as fitText,
  textWidth,
} from "../../kit/svg.ts";
import type { RepoStats, Stats } from "../../stats/types.ts";
import type { ThemeName } from "../types.ts";

/** Eight categorical hues in fixed order, stepped per theme (validated for adjacent-pair CVD separation). */
export const SERIES: Record<ThemeName, readonly string[]> = {
  light: ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#6250d6", "#e34948"],
  dark: ["#3987e5", "#d95926", "#199e70", "#c98500", "#d55181", "#008300", "#9085e9", "#e66767"],
};

/** An ecosystem (several related owners) or a single owner outside any ecosystem. */
export interface Group {
  key: string;
  name: string;
  ecosystem: boolean;
  owners: string[];
  /** Owner whose avatar stands for the group: the one with the most contributions. */
  lead: string;
  org: boolean;
  /** The group's repositories with at least one contribution, by total descending. */
  repos: RepoStats[];
  total: number;
  prs: number;
  merged: number;
  open: number;
  issues: number;
  discussions: number;
}

/** Upstream repos with at least one PR, issue or discussion, by total descending. */
export const activeRepos = (stats: Stats): RepoStats[] =>
  stats.repos
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total || a.repo.localeCompare(b.repo));

/** Groups summed from the repositories, so every flow adds up exactly. Sorted by total, then name. */
export function groups(stats: Stats): Group[] {
  const ecosystemOf = new Map<string, string>();
  for (const f of stats.ecosystems) for (const o of f.owners) ecosystemOf.set(o, f.name);
  const byKey = new Map<string, Group>();
  const ownerTotals = new Map<string, number>();
  for (const r of activeRepos(stats)) {
    const fam = ecosystemOf.get(r.owner);
    const key = fam ? `ecosystem:${fam}` : `owner:${r.owner}`;
    let g = byKey.get(key);
    if (!g) {
      g = {
        key,
        name: fam ?? r.owner,
        ecosystem: fam !== undefined,
        owners: [],
        lead: r.owner,
        org: fam !== undefined || r.ownerType === "Organization",
        repos: [],
        total: 0,
        prs: 0,
        merged: 0,
        open: 0,
        issues: 0,
        discussions: 0,
      };
      byKey.set(key, g);
    }
    if (!g.owners.includes(r.owner)) g.owners.push(r.owner);
    ownerTotals.set(r.owner, (ownerTotals.get(r.owner) ?? 0) + r.total);
    g.repos.push(r);
    g.total += r.total;
    g.prs += r.prs;
    g.merged += r.prsMerged;
    g.open += r.prsOpen;
    g.issues += r.issues;
    g.discussions += r.discussions;
  }
  for (const g of byKey.values()) {
    g.lead = [...g.owners].sort(
      (a, b) => (ownerTotals.get(b) ?? 0) - (ownerTotals.get(a) ?? 0) || a.localeCompare(b),
    )[0] as string;
  }
  return [...byKey.values()].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

/** 12345 → "12,345". */
export const fmt = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const plural = (n: number, one: string, many = `${one}s`): string =>
  `${fmt(n)} ${n === 1 ? one : many}`;

export const r1 = (n: number): number => Math.round(n * 10) / 10;

/** Short repository name without the owner. */
export const repoName = (repo: string): string => repo.slice(repo.indexOf("/") + 1);

/** Avatar on a white backing so transparent logos stay visible in dark mode. */
export function av(opts: {
  id: string;
  login: string;
  stats: Stats;
  cx: number;
  cy: number;
  size: number;
  org: boolean;
  p: Palette;
}): string {
  const { id, login, stats, cx, cy, size, org, p } = opts;
  const x = r1(cx - size / 2);
  const y = r1(cy - size / 2);
  const uri = stats.avatars[login];
  const r = org ? Math.round(size * 0.2) : size / 2;
  const back = uri
    ? `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}" fill="#ffffff"/>`
    : "";
  return back + avatar({ id, login, uri, x, y, size, org, palette: p });
}

/** Text with a background-coloured halo, for labels that sit on top of links. */
export const halo = (p: Palette): string =>
  `paint-order="stroke" stroke="${p.bg}" stroke-width="3" stroke-linejoin="round"`;

/**
 * Pushes label centres apart so neighbours are at least `gap` apart, staying inside [lo, hi]
 * where possible. Input order is preserved; positions are assumed sorted ascending.
 */
export function spread(wanted: number[], gap: number, lo: number, hi: number): number[] {
  const out = wanted.map((v) => Math.max(lo, v));
  for (let i = 1; i < out.length; i++) {
    out[i] = Math.max(out[i] as number, (out[i - 1] as number) + gap);
  }
  const last = out.length - 1;
  if (last >= 0 && (out[last] as number) > hi) {
    out[last] = hi;
    for (let i = last - 1; i >= 0; i--) {
      out[i] = Math.min(out[i] as number, (out[i + 1] as number) - gap);
    }
  }
  return out;
}

/** The bordered card with a title and a subtitle; `body` is drawn below y = 64. */
export function card(opts: {
  theme: ThemeName;
  width: number;
  height: number;
  title: string;
  subtitle: string;
  body: string;
  style?: string;
}): string {
  const { theme, width, height, title, subtitle, body, style } = opts;
  const p = PAL(theme);
  const base = `text{font-family:${SANS};fill:${p.text}}.mu{fill:${p.muted}}.fa{fill:${p.faint}}.b{font-weight:600}`;
  return document({
    width,
    height,
    title,
    style: base + (style ?? ""),
    body:
      `<rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="6" fill="${p.bg}" stroke="${p.border}"/>` +
      `<text x="20" y="32" font-size="16" class="b">${esc(title)}</text>` +
      `<text x="20" y="51" font-size="12" class="mu">${esc(subtitle)}</text>` +
      body,
  });
}

export const PAL = (theme: ThemeName): Palette => PALETTES[theme];

/** Legend swatch + label; returns the markup and the x after it. */
export function legendItem(
  x: number,
  y: number,
  color: string,
  label: string,
  shape: "square" | "line" | "dot" = "square",
): { svg: string; next: number } {
  const mark =
    shape === "line"
      ? `<rect x="${x}" y="${y - 5}" width="14" height="4" rx="2" fill="${color}"/>`
      : shape === "dot"
        ? `<circle cx="${x + 5}" cy="${y - 3}" r="4.5" fill="${color}"/>`
        : `<rect x="${x}" y="${y - 8}" width="10" height="10" rx="2" fill="${color}"/>`;
  const tx = x + (shape === "line" ? 20 : 15);
  return {
    svg: `${mark}<text x="${tx}" y="${y}" font-size="11" class="mu">${esc(label)}</text>`,
    next: tx + label.length * 11 * 0.58 + 16,
  };
}

/** Dark or white text, whichever reads better on a hue. */
export function ink(hex: string): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const l = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return l > 0.3 ? "#1f2328" : "#ffffff";
}

/**
 * The dash-ended prefix (6+ characters, shared by 2+ names) that saves the most characters, such as
 * "opentelemetry-"; stations show "…" in its place so the distinctive part stays readable.
 */
export function sharedPrefix(names: string[]): string {
  let best = "";
  let saved = 0;
  for (const a of names) {
    for (let i = a.indexOf("-"); i >= 0; i = a.indexOf("-", i + 1)) {
      const pre = a.slice(0, i + 1);
      const count = names.filter((b) => b.startsWith(pre) && b.length > pre.length).length;
      if (pre.length < 6 || count < 2) continue;
      if (count * pre.length > saved || (count * pre.length === saved && pre < best)) {
        best = pre;
        saved = count * pre.length;
      }
    }
  }
  return best;
}

/**
 * Fits each name into its budget. A name that would be cut short loses the dash-ended prefix it
 * shares with its siblings ("opentelemetry-lambda" → "…lambda") before it is truncated; `prefix`
 * is set only when that happened, so the card can say what "…" stands for.
 */
export function abbreviate(
  names: string[],
  budget: (i: number) => number,
  size: number,
): { labels: string[]; prefix: string } {
  const pre = sharedPrefix(names);
  let used = false;
  const labels = names.map((name, i) => {
    const max = budget(i);
    if (textWidth(name, size) <= max) return name;
    if (pre && name.startsWith(pre) && name.length > pre.length) {
      used = true;
      return fitText(`…${name.slice(pre.length)}`, max, size);
    }
    return fitText(name, max, size);
  });
  return { labels, prefix: used ? pre : "" };
}
