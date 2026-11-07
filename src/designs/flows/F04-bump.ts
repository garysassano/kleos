import { esc, truncate as fitText } from "../../kit/svg.ts";
import type { Stats } from "../../stats/types.ts";
import type { Design, ThemeName } from "../types.ts";
import { PAL, SERIES, card, fmt, groups, halo, ink, plural, r1 } from "./_shared.ts";

const W = 840;
const RANKS = 8;
const MAX_YEARS = 6;
const MIN_YEAR_TOTAL = 10;
const COLORED = 7;
const TOP = 112;
const ROW = 40;
const X0 = 210;
const X1 = 630;
const R = 11;

interface Entity {
  name: string;
  /** year → contributions that year */
  byYear: Map<string, number>;
  total: number;
  /** year → rank (0-based), only where it made the top RANKS */
  rank: Map<string, number>;
  color: string | null;
}

function render(stats: Stats, theme: ThemeName): string {
  const p = PAL(theme);
  const series = SERIES[theme];
  const ents: Entity[] = groups(stats).map((g) => {
    const byYear = new Map<string, number>();
    for (const r of g.repos) {
      for (const [m, c] of Object.entries(r.monthly)) {
        const y = m.slice(0, 4);
        byYear.set(y, (byYear.get(y) ?? 0) + c);
      }
    }
    return { name: g.name, byYear, total: g.total, rank: new Map(), color: null };
  });

  // Years: those with at least MIN_YEAR_TOTAL contributions (or any, if fewer than two qualify), latest MAX_YEARS.
  const yearTotals = new Map<string, number>();
  for (const e of ents)
    for (const [y, c] of e.byYear) yearTotals.set(y, (yearTotals.get(y) ?? 0) + c);
  const sortedYears = [...yearTotals.keys()].sort();
  let years = sortedYears.filter((y) => (yearTotals.get(y) ?? 0) >= MIN_YEAR_TOTAL);
  if (years.length < 2) years = sortedYears;
  years = years.slice(-MAX_YEARS);

  for (const y of years) {
    ents
      .filter((e) => (e.byYear.get(y) ?? 0) > 0)
      .sort(
        (a, b) =>
          (b.byYear.get(y) ?? 0) - (a.byYear.get(y) ?? 0) ||
          b.total - a.total ||
          a.name.localeCompare(b.name),
      )
      .slice(0, RANKS)
      .forEach((e, i) => {
        e.rank.set(y, i);
      });
  }
  const ranked = ents.filter((e) => e.rank.size > 0);
  // Color the biggest entities over the shown years; the rest stay gray for context.
  const inShown = (e: Entity) => years.reduce((s, y) => s + (e.byYear.get(y) ?? 0), 0);
  [...ranked]
    .sort((a, b) => inShown(b) - inShown(a) || a.name.localeCompare(b.name))
    .slice(0, COLORED)
    .forEach((e, i) => {
      e.color = series[i] ?? null;
    });

  const rows = Math.max(1, ...ranked.map((e) => Math.max(...e.rank.values()) + 1));
  const xOf = (i: number) =>
    years.length === 1 ? (X0 + X1) / 2 : X0 + ((X1 - X0) * i) / (years.length - 1);
  const yOf = (rank: number) => TOP + rank * ROW;

  let grid = "";
  years.forEach((y, i) => {
    const x = r1(xOf(i));
    grid += `<line x1="${x}" y1="${TOP - R - 6}" x2="${x}" y2="${yOf(rows - 1) + R + 6}" stroke="${p.hair}"/>`;
    grid += `<text x="${x}" y="${TOP - 38}" text-anchor="middle" font-size="13" class="b">${esc(y)}</text>`;
    grid += `<text x="${x}" y="${TOP - 22}" text-anchor="middle" font-size="10.5" class="mu">${esc(`${fmt(yearTotals.get(y) ?? 0)} total`)}</text>`;
  });
  for (let r = 0; r < rows; r++) {
    grid += `<text x="20" y="${yOf(r)}" dy="0.35em" font-size="11" class="fa">#${r + 1}</text>`;
  }

  // Gray entities first so colored lines sit on top.
  const order = [...ranked].sort((a, b) => (a.color ? 1 : 0) - (b.color ? 1 : 0));
  let lines = "";
  let dots = "";
  let labels = "";
  const first = years[0] as string;
  const last = years[years.length - 1] as string;
  for (const e of order) {
    const stroke = e.color ?? p.border;
    years.forEach((y, i) => {
      const next = years[i + 1];
      const a = e.rank.get(y);
      const b = next ? e.rank.get(next) : undefined;
      if (a === undefined || b === undefined) return;
      const x0 = xOf(i);
      const x1 = xOf(i + 1);
      const m = (x0 + x1) / 2;
      lines += `<path d="M${r1(x0)},${yOf(a)}C${r1(m)},${yOf(a)} ${r1(m)},${yOf(b)} ${r1(x1)},${yOf(b)}" fill="none" stroke="${stroke}" stroke-width="${e.color ? 3 : 2}"/>`;
    });
    years.forEach((y, i) => {
      const rk = e.rank.get(y);
      if (rk === undefined) return;
      const x = r1(xOf(i));
      const v = e.byYear.get(y) ?? 0;
      dots += e.color
        ? `<circle cx="${x}" cy="${yOf(rk)}" r="${R}" fill="${e.color}" stroke="${p.bg}" stroke-width="2"/><text x="${x}" y="${yOf(rk)}" dy="0.35em" text-anchor="middle" font-size="10" font-weight="600" style="fill:${ink(e.color)}">${fmt(v)}</text>`
        : `<circle cx="${x}" cy="${yOf(rk)}" r="${R}" fill="${p.surface}" stroke="${p.border}"/><text x="${x}" y="${yOf(rk)}" dy="0.35em" text-anchor="middle" font-size="10" class="mu">${fmt(v)}</text>`;
    });
    const cls = e.color ? "b" : "mu";
    const lr = e.rank.get(first);
    const rr = e.rank.get(last);
    if (lr !== undefined && years.length > 1) {
      labels += `<text x="${X0 - R - 8}" y="${yOf(lr)}" dy="0.35em" text-anchor="end" font-size="12" class="${cls}">${esc(fitText(e.name, X0 - R - 8 - 48, 12))}</text>`;
    }
    if (rr !== undefined) {
      labels += `<text x="${X1 + R + 8}" y="${yOf(rr)}" dy="0.35em" font-size="12" class="${cls}">${esc(fitText(e.name, W - 20 - X1 - R - 8, 12))}</text>`;
    }
    // Every run that starts after the first year is named beside its first dot.
    years.forEach((y, i) => {
      if (i === 0 || i === years.length - 1) return;
      const rk = e.rank.get(y);
      if (rk === undefined || e.rank.has(years[i - 1] as string)) return;
      labels += `<text x="${r1(xOf(i) + R + 5)}" y="${yOf(rk)}" dy="0.35em" font-size="10.5" class="${cls}" ${halo(p)}>${esc(fitText(e.name, (X1 - X0) / Math.max(1, years.length - 1) - 2 * R - 14, 10.5))}</text>`;
    });
  }

  const footY = yOf(rows - 1) + R + 34;
  const foot = `<text x="20" y="${footY}" font-size="11" class="mu">${esc(
    `Top ${RANKS} per year by PRs + issues + discussions opened that year (the number in each dot). Lines break outside the top ${RANKS}.`,
  )}</text>`;

  return card({
    theme,
    width: W,
    height: footY + 20,
    title: "Who I worked with, year by year",
    subtitle: `Rank of each ecosystem or owner per calendar year · ${years.length === 1 ? first : `${first}–${last}`} · ${plural(ranked.length, "ecosystem or owner", "ecosystems and owners")} reached the top ${RANKS}`,
    body: grid + lines + dots + labels + foot,
  });
}

export const design: Design = {
  id: "F04",
  slug: "bump",
  title: "Rank by year",
  idea: "A bump chart of the top 8 ecosystems and owners in each calendar year (from repos' monthly counts), so you can see who rose, who faded and who stayed. Years with fewer than 10 contributions are left out (the latest 6 are shown); the 7 biggest over those years get color, the rest stay gray.",
  render,
};
