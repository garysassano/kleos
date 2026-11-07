/**
 * Shared helpers for building GitHub-safe SVG cards. New designs should use these; the first
 * 30 designs were ported byte-for-byte from prototypes and keep some local helpers of their own.
 *
 * Rules every card follows (see docs/decisions/0005-svg-rules-for-github-readmes.md):
 * no scripts, no foreignObject, no external URLs, images only as data: URIs, system fonts only.
 */
import type { ThemeName } from "../designs/types.ts";

export const SANS =
  "-apple-system,BlinkMacSystemFont,'Segoe UI','Noto Sans',Helvetica,Arial,sans-serif";
export const MONO =
  "ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,'Liberation Mono',monospace";

/** Widest a card may be: GitHub's profile README column. */
export const MAX_WIDTH = 840;

/** GitHub Primer colours for each theme, so cards look native on the profile page. */
export interface Palette {
  /** Card background. Matches GitHub's page background. */
  bg: string;
  /** Raised surface inside a card (tiles, rows). */
  surface: string;
  border: string;
  /** Hairline divider, lighter than `border`. */
  hair: string;
  text: string;
  muted: string;
  faint: string;
  accent: string;
  /** Merged PRs, other PRs, issues, discussions: the four contribution kinds, validated for both themes. */
  merged: string;
  pr: string;
  /** PRs still open, and PRs closed without merging (outcomes "full"). Closed is neutral grey on purpose. */
  open: string;
  closed: string;
  issue: string;
  discussion: string;
}

export const PALETTES: Record<ThemeName, Palette> = {
  dark: {
    bg: "#0d1117",
    surface: "#151b23",
    border: "#3d444d",
    hair: "#262c36",
    text: "#e6edf3",
    muted: "#9198a1",
    faint: "#656c76",
    accent: "#4493f8",
    merged: "#9085e9",
    pr: "#5b5592",
    open: "#b7aef5",
    closed: "#656c76",
    issue: "#199e70",
    discussion: "#d95926",
  },
  light: {
    bg: "#ffffff",
    surface: "#f6f8fa",
    border: "#d1d9e0",
    hair: "#e6eaef",
    text: "#1f2328",
    muted: "#59636e",
    faint: "#818b98",
    accent: "#0969da",
    merged: "#6250d6",
    pr: "#b1a8ef",
    open: "#8f82e3",
    closed: "#aeb7c1",
    issue: "#1baf7a",
    discussion: "#eb6834",
  },
};

export const esc = (s: string | number): string =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Estimated rendered width. SVG in <img> cannot measure text, so leave slack. */
export const textWidth = (s: string, size: number, mono = false): number =>
  [...s].length * size * (mono ? 0.6 : 0.58);

/** Truncates with an ellipsis so the estimated width fits `maxPx`. */
export function truncate(s: string, maxPx: number, size: number, mono = false): string {
  if (textWidth(s, size, mono) <= maxPx) return s;
  const chars = [...s];
  while (chars.length > 1 && textWidth(`${chars.join("")}…`, size, mono) > maxPx) chars.pop();
  return `${chars.join("")}…`;
}

/** 1234 → "1.2k", 12345 → "12k". */
export const compact = (n: number): string =>
  n < 1000
    ? String(n)
    : n < 10000
      ? `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`
      : `${Math.round(n / 1000)}k`;

export const percent = (part: number, whole: number): number =>
  whole === 0 ? 0 : Math.round((100 * part) / whole);

/**
 * A round (users) or rounded-square (organizations) avatar from the embedded data URI,
 * or a monogram when the owner has none. `id` must be unique within the document.
 */
export function avatar(opts: {
  id: string;
  login: string;
  uri: string | undefined;
  x: number;
  y: number;
  size: number;
  org: boolean;
  palette: Palette;
}): string {
  const { id, login, uri, x, y, size, org, palette } = opts;
  const r = org ? Math.round(size * 0.2) : size / 2;
  const clip = `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}"/></clipPath>`;
  const ring = `<rect x="${x + 0.5}" y="${y + 0.5}" width="${size - 1}" height="${size - 1}" rx="${r}" fill="none" stroke="${palette.border}"/>`;
  if (uri) {
    return `${clip}<image href="${uri}" x="${x}" y="${y}" width="${size}" height="${size}" clip-path="url(#${id})" preserveAspectRatio="xMidYMid slice"/>${ring}`;
  }
  const letter = esc((login[0] ?? "?").toUpperCase());
  return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}" fill="${palette.surface}"/>${ring}<text x="${x + size / 2}" y="${y + size / 2}" dy="0.35em" text-anchor="middle" font-family="${SANS}" font-size="${Math.round(size * 0.48)}" font-weight="600" fill="${palette.muted}">${letter}</text>`;
}

/** Wraps a body in a root <svg> with title, size and viewBox. */
export function document(opts: {
  width: number;
  height: number;
  title: string;
  body: string;
  style?: string;
}): string {
  const { width, height, title, body, style } = opts;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${style ? `<style>${style}</style>` : ""}${body}</svg>`;
}
