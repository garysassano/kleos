/**
 * Helpers for the typographic category. Ported byte-for-byte from the prototype, so this keeps
 * its own palette (GitHub's merged/open/diff colours) and document wrapper instead of src/kit.
 */
import { MONO, SANS, esc } from "../../kit/svg.ts";
import type { Stats } from "../../stats/types.ts";
import type { ThemeName } from "../types.ts";

export { esc };

export interface Theme {
  bg: string;
  card: string;
  text: string;
  muted: string;
  faint: string;
  border: string;
  hair: string;
  merged: string;
  open: string;
  add: string;
  del: string;
  accent: string;
  /** Still-open PRs where a card shows outcomes: a lighter tone of `merged`. */
  prOpen: string;
  /** PRs closed without merging: neutral grey, never red. */
  closed: string;
}

export const THEMES: Record<ThemeName, Theme> = {
  dark: {
    bg: "#0d1117",
    card: "#151b23",
    text: "#e6edf3",
    muted: "#9198a1",
    faint: "#6e7681",
    border: "#3d444d",
    hair: "#262c36",
    merged: "#ab7df8",
    open: "#3fb950",
    add: "#3fb950",
    del: "#f85149",
    accent: "#4493f8",
    prOpen: "#d0b8fb",
    closed: "#7d8590",
  },
  light: {
    bg: "#ffffff",
    card: "#f6f8fa",
    text: "#1f2328",
    muted: "#59636e",
    faint: "#818b98",
    border: "#d1d9e0",
    hair: "#e6eaef",
    merged: "#8250df",
    open: "#1a7f37",
    add: "#1a7f37",
    del: "#d1242f",
    accent: "#0969da",
    prOpen: "#a58aea",
    closed: "#818b98",
  },
};

const baseCss = (t: Theme): string => `
.s{font-family:${SANS}}.m{font-family:${MONO}}
.t{fill:${t.text}}.mu{fill:${t.muted}}.f{fill:${t.faint}}.pu{fill:${t.merged}}.gr{fill:${t.open}}.ad{fill:${t.add}}.de{fill:${t.del}}.ac{fill:${t.accent}}
.b{font-weight:600}.n{font-variant-numeric:tabular-nums}.cap{letter-spacing:.08em}
.e{text-anchor:end}.c{text-anchor:middle}`;

/** Root <svg> with title and the category's utility classes (.s/.m fonts, .t/.mu/.f fills, .b, .e, …). */
export const svg = (
  w: number,
  h: number,
  t: Theme,
  css: string,
  body: string,
  title: string,
): string => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>${baseCss(t)}${css}</style>
${body}
</svg>
`;

export const text = (x: number, y: number, s: string, cls: string, extra = ""): string =>
  `<text x="${x}" y="${y}" class="${cls}"${extra ? ` ${extra}` : ""}>${esc(s)}</text>`;

export const trunc = (s: string, n: number): string => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
export const fmt = (n: number): string => n.toLocaleString("en-US");
/** 1234 → "1.2k", 123456 → "123k". */
export const kfmt = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, "")}k` : String(n);
export const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

export const MONTHS = [
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
const month = (d: string): string => MONTHS[Number(d.slice(5, 7)) - 1] ?? "";
export const monthYear = (d: string): string => `${month(d)} ${d.slice(0, 4)}`;
export const longDate = (d: string): string =>
  `${Number(d.slice(8, 10))} ${month(d)} ${d.slice(0, 4)}`;
/** "Oct 03" */
export const shortDate = (d: string): string => `${month(d).slice(0, 3)} ${d.slice(8, 10)}`;
/** shortDate within `year`, otherwise "Oct '24", so rows from different years never look adjacent. */
export const shortDateIn = (d: string, year: string): string =>
  d.startsWith(year) ? shortDate(d) : `${month(d).slice(0, 3)} '${d.slice(2, 4)}`;
const NUMW = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];
export const words = (n: number): string => NUMW[n] ?? String(n);

/** Figures several cards share, all derived from the upstream repos. */
export function derive(stats: Stats) {
  const { repos } = stats;
  const T = stats.totals;
  const asOf = stats.generatedAt.slice(0, 10);
  const sum = (f: (r: (typeof repos)[number]) => number) => repos.reduce((s, r) => s + f(r), 0);
  const firsts = (rs: typeof repos) =>
    rs
      .map((r) => r.first)
      .filter((d): d is string => d !== null)
      .sort();
  return {
    T,
    asOf,
    extIssues: sum((r) => r.issues),
    extDisc: sum((r) => r.discussions),
    extTotal: sum((r) => r.total),
    prsOpen: sum((r) => r.prsOpen),
    /** Date of the first upstream PR, issue or discussion. */
    firstAny: (firsts(repos)[0] ?? stats.generatedAt).slice(0, 10),
    /** Date of the first upstream PR, or of the first upstream activity when there is none. */
    firstPR: (T.firstExternalPR ?? firsts(repos)[0] ?? stats.generatedAt).slice(0, 10),
    mergeRate: T.externalPRs ? T.externalMerged / T.externalPRs : 0,
  };
}

/** "3 PRs · 1 issue · 2 disc." with zero kinds left out. */
export function kinds(prs: number, issues: number, discussions: number, prsSuffix = ""): string {
  const bits: string[] = [];
  if (prs) bits.push(`${prs} PR${prs > 1 ? "s" : ""}${prsSuffix}`);
  if (issues) bits.push(`${issues} issue${issues > 1 ? "s" : ""}`);
  if (discussions) bits.push(`${discussions} disc.`);
  return bits.join(" · ");
}
