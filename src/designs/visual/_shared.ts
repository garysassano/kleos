/**
 * Helpers shared by the visual (D) designs: their own palette, rounding and avatar drawing.
 * Contribution-type colors come from src/kit.
 */

import { MONTHS, fmt, plural, r1 } from "../../kit/format.ts";
import { MONO, PALETTES, SANS, esc } from "../../kit/svg.ts";
import type { Stats } from "../../stats/types.ts";
import type { ThemeName } from "../types.ts";

export { MONTHS, fmt, plural, r1 };

export interface Theme {
  bg: string;
  text: string;
  muted: string;
  border: string;
  faint: string;
  cell: string;
  cell2: string;
  merged: string;
  prOther: string;
  issue: string;
  disc: string;
  avBg: string;
  /** Six-step blue ramp, index 0 = empty. */
  blue: string[];
  /** Five-step green ramp like GitHub's contribution calendar, index 0 = empty. */
  green: string[];
  dot: string;
  active: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  dark: {
    bg: "#0d1117",
    text: "#e6edf3",
    muted: "#9198a1",
    border: "#3d444d",
    faint: "#262c36",
    cell: "#151b23",
    cell2: "#1c2128",
    merged: PALETTES.dark.merged,
    prOther: PALETTES.dark.pr,
    issue: PALETTES.dark.issue,
    disc: PALETTES.dark.discussion,
    avBg: "#ffffff",
    blue: ["#151b23", "#0c2d6b", "#0d419d", "#1f6feb", "#4493f8", "#a5d6ff"],
    green: ["#151b23", "#033a16", "#196c2e", "#2ea043", "#56d364"],
    dot: "#4493f8",
    active: "#3fb950",
  },
  light: {
    bg: "#ffffff",
    text: "#1f2328",
    muted: "#59636e",
    border: "#d1d9e0",
    faint: "#e8ecf0",
    cell: "#f6f8fa",
    cell2: "#eff2f5",
    merged: PALETTES.light.merged,
    prOther: PALETTES.light.pr,
    issue: PALETTES.light.issue,
    disc: PALETTES.light.discussion,
    avBg: "#ffffff",
    blue: ["#eff2f5", "#b6e3ff", "#80ccff", "#218bff", "#0550ae", "#0a3069"],
    green: ["#eff2f5", "#aceebb", "#4ac26b", "#2da44e", "#116329"],
    dot: "#0969da",
    active: "#1a7f37",
  },
};

/** Estimated text width (0.58em sans, 0.6em mono per UTF-16 unit). */
export const tw = (s: string | number, size: number, mono = false): number =>
  String(s).length * size * (mono ? 0.6 : 0.58);
export const trunc = (s: string | number, maxW: number, size: number): string => {
  const str = String(s);
  if (tw(str, size) <= maxW) return str;
  const n = Math.max(1, Math.floor(maxW / (size * 0.58)) - 1);
  return `${str.slice(0, n)}…`;
};

/** "2025-03" → "Mar 2025". */
export const monLabel = (ym: string): string => `${MONTHS[+ym.slice(5, 7) - 1]} ${ym.slice(0, 4)}`;
/** "2025-03-07" → "Mar 7". */
export const dayLabel = (d: string): string => `${MONTHS[+d.slice(5, 7) - 1]} ${+d.slice(8, 10)}`;
/** Every "YYYY-MM" from `a` to `b`, inclusive. */
export function monthRange(a: string, b: string): string[] {
  const out: string[] = [];
  let y = +a.slice(0, 4);
  let m = +a.slice(5, 7);
  const by = +b.slice(0, 4);
  const bm = +b.slice(5, 7);
  while (y < by || (y === by && m <= bm)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    if (++m > 12) {
      m = 1;
      y++;
    }
  }
  return out;
}

/** Darkens (f < 1) or lightens (f > 1) a #rrggbb colour. */
export function shade(hex: string, f: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.round(f < 1 ? v * f : v + (255 - v) * (f - 1)),
  );
  return `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** Per-render drawing context: theme, collected <defs>, unique ids and avatar lookup. */
export interface Ctx {
  T: Theme;
  defs: string[];
  id(prefix?: string): string;
  /** Avatar centred at (cx, cy), or a monogram when the login has no embedded image. */
  avatar(
    login: string,
    cx: number,
    cy: number,
    size: number,
    shape?: "circle" | "square",
    ring?: boolean,
  ): string;
}

export function makeCtx(stats: Stats, theme: ThemeName): Ctx {
  const T = THEMES[theme];
  const defs: string[] = [];
  let n = 0;
  const id = (p = "c") => `${p}${n++}`;
  const avatar: Ctx["avatar"] = (login, cx, cy, size, shape = "circle", ring = true) => {
    const cid = id("av");
    const x = r1(cx - size / 2);
    const y = r1(cy - size / 2);
    const s = r1(size);
    const rx = shape === "circle" ? s / 2 : Math.max(3, r1(size * 0.16));
    defs.push(
      `<clipPath id="${cid}"><rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${rx}"/></clipPath>`,
    );
    const src = stats.avatars[login];
    const edge = ring
      ? `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${rx}" fill="none" stroke="${T.border}" stroke-width="1"/>`
      : "";
    if (src) {
      return `<g clip-path="url(#${cid})"><rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${T.avBg}"/><image href="${src}" x="${x}" y="${y}" width="${s}" height="${s}" preserveAspectRatio="xMidYMid slice"/></g>${edge}`;
    }
    const fs = r1(size * 0.46);
    return `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${rx}" fill="${T.cell2}" stroke="${T.border}"/><text x="${r1(cx)}" y="${r1(cy + fs * 0.36)}" text-anchor="middle" font-size="${fs}" font-weight="600" fill="${T.muted}">${esc((login[0] ?? "?").toUpperCase())}</text>`;
  };
  return { T, defs, id, avatar };
}

/** Root <svg> with shared text styles, collected defs and the bordered card background. */
export function doc(W: number, H: number, ctx: Ctx, body: string, label: string, css = ""): string {
  const T = ctx.T;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
<title>${esc(label)}</title>
<style>
text{font-family:${SANS};fill:${T.text}}
.mono{font-family:${MONO}}
.mu{fill:${T.muted}}
.b{font-weight:600}
${css}
</style>
<defs>${ctx.defs.join("")}</defs>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="6" fill="${T.bg}" stroke="${T.border}"/>
${body}
</svg>
`;
}

export function header(title: string, sub: string, right = ""): string {
  return (
    `<text x="20" y="32" font-size="16" class="b">${esc(title)}</text>` +
    (sub ? `<text x="20" y="51" font-size="12" class="mu">${esc(sub)}</text>` : "") +
    right
  );
}

/** "N PRs, issues and discussions on R repos of O other orgs and people". */
export function extLine(stats: Stats): string {
  const total = stats.repos.reduce((a, r) => a + r.total, 0);
  return `${fmt(total)} PRs, issues and discussions on ${fmt(stats.totals.externalRepos)} repos of ${fmt(stats.totals.externalOwners)} other orgs and people`;
}

/** Splits "owner/name" for a row label; drops the owner when the whole thing would not fit. */
export function repoLabel(repo: string, maxW: number, size: number): string {
  const [own = "", nm = ""] = repo.split("/");
  if (tw(`${own}/${nm}`, size) > maxW) return esc(trunc(nm, maxW, size));
  return `<tspan class="mu">${esc(own)}/</tspan>${esc(nm)}`;
}
