import type { Design } from "../types.ts";
import {
  type Repo,
  THEMES,
  W,
  colorOf,
  derive,
  esc,
  f1,
  header,
  monthName,
  sum,
  svgDoc,
  tw,
} from "./_shared.ts";

/** The chart starts in the first year that holds at least this share of all monthly activity. */
const START_SHARE = 0.05;
/** Nice y-axis steps; the smallest that needs at most MAX_TICKS intervals wins. */
const STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
const MAX_TICKS = 4;

const nextMonth = (m: string): string => {
  const [y = 0, mo = 1] = m.split("-").map(Number);
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, "0")}`;
};

export const design: Design = {
  id: "B06",
  slug: "stacked-area",
  title: "Activity over time",
  idea: "Monthly contributions as a stacked area by family or owner, showing peaks and how the mix shifts between groups. It starts in the first year holding at least 5% of all activity; anything earlier is counted in the footnote.",
  render(stats, theme) {
    const t = THEMES[theme];
    const { repos, topGroups, restGroups, rest } = derive(stats);
    const perMonth = new Map<string, number>();
    for (const r of repos)
      for (const [k, v] of Object.entries(r.monthly)) perMonth.set(k, (perMonth.get(k) ?? 0) + v);
    const allMonths = [...perMonth.keys()].filter((k) => (perMonth.get(k) ?? 0) > 0).sort();
    const grand = sum([...perMonth.values()]);
    const perYear = new Map<string, number>();
    for (const [k, v] of perMonth)
      perYear.set(k.slice(0, 4), (perYear.get(k.slice(0, 4)) ?? 0) + v);
    const firstYear =
      [...perYear.keys()].sort().find((y) => (perYear.get(y) ?? 0) >= START_SHARE * grand) ?? "";
    const fallback = stats.generatedAt.slice(0, 7);
    const START = allMonths.find((m) => m >= firstYear) ?? fallback;
    const last = allMonths[allMonths.length - 1] ?? fallback;
    const months: string[] = [];
    for (let m = START; m <= last; m = nextMonth(m)) months.push(m);
    const earlier = allMonths.filter((m) => m < START);
    const before = sum(earlier.map((m) => perMonth.get(m) ?? 0));
    const y0 = earlier[0]?.slice(0, 4) ?? "";
    const y1 = earlier[earlier.length - 1]?.slice(0, 4) ?? "";
    const earlierYears = y0 === y1 ? y0 : `${y0}–${y1}`;
    const series = [
      ...topGroups.map((g) => ({
        name: g.name,
        c: colorOf(t, g),
        reposList: g.repos,
        total: g.total,
        isRest: false,
      })),
    ];
    if (restGroups.length)
      series.push({
        name: `${rest.owners} other owners`,
        c: t.other,
        reposList: restGroups.flatMap((g) => g.repos) as Repo[],
        total: rest.total,
        isRest: true,
      });
    const vals = series.map((se) =>
      months.map((m) => sum(se.reposList.map((r) => r.monthly[m] || 0))),
    );
    const stackTot = months.map((_, i) => sum(vals.map((v) => v[i] ?? 0)));
    const ymaxRaw = Math.max(0, ...stackTot);
    const step = STEPS.find((st) => Math.ceil(ymaxRaw / st) <= MAX_TICKS) ?? 10000;
    const ymax = Math.max(step, Math.ceil(ymaxRaw / step) * step);
    const PX0 = 56;
    const PX1 = W - 24;
    const PY0 = 120;
    const PY1 = 380;
    const h = PY1 + 56;
    const span = Math.max(1, months.length - 1);
    // A single month is drawn as a flat band across the plot instead of a zero-width spike.
    const xs =
      months.length === 1 ? [PX0, PX1] : months.map((_, i) => PX0 + (i / span) * (PX1 - PX0));
    const sx = (i: number) => PX0 + (i / span) * (PX1 - PX0);
    const sy = (v: number) => PY1 - (v / ymax) * (PY1 - PY0);
    const peakAt = months[stackTot.indexOf(ymaxRaw)] ?? START;
    let s = header(
      "Upstream activity over time",
      `Monthly PRs + issues + discussions on other people's repos, stacked by family or owner · peak ${ymaxRaw} in ${monthName(peakAt)}`,
    );
    // legend (wraps to more rows as needed)
    let lx = 24;
    let ly = 80;
    for (const se of series) {
      const lbl = `${se.name} ${se.total}`;
      const w = 14 + tw(lbl, 12) + 18;
      if (lx + w > W - 24) {
        lx = 24;
        ly += 20;
      }
      s += `<rect x="${lx}" y="${ly - 9}" width="10" height="10" rx="2" fill="${se.c}"/>`;
      s += `<text x="${lx + 14}" y="${ly}" font-size="12">${esc(se.name)} <tspan class="m">${se.total}</tspan></text>`;
      lx += w;
    }
    // grid
    for (let v = 0; v <= ymax; v += step) {
      s += `<line x1="${PX0}" y1="${f1(sy(v))}" x2="${PX1}" y2="${f1(sy(v))}" stroke="${v === 0 ? t.border : t.grid}"/>`;
      s += `<text x="${PX0 - 8}" y="${f1(sy(v) + 4)}" font-size="11" text-anchor="end" class="m">${v}</text>`;
    }
    // Year ticks at each January; a start mid-year gets its own month label when it fits before the next one.
    const firstJan = months.findIndex((m) => m.endsWith("-01"));
    const startLabel = monthName(START);
    const startFits =
      !START.endsWith("-01") && (firstJan < 0 || sx(firstJan) - sx(0) >= tw(startLabel, 11) + 8);
    months.forEach((m, i) => {
      if (m.endsWith("-01") || (i === 0 && startFits)) {
        s += `<line x1="${f1(sx(i))}" y1="${PY0}" x2="${f1(sx(i))}" y2="${PY1}" stroke="${t.grid}"/>`;
        s += `<text x="${f1(sx(i) + 4)}" y="${PY1 + 16}" font-size="11" class="m">${m.endsWith("-01") ? m.slice(0, 4) : startLabel}</text>`;
      }
    });
    // stacked boundaries; smooth with horizontal-tangent cubic (order-preserving, no overshoot)
    const curve = (ys: number[], rev = false) => {
      const ys2 = months.length === 1 ? [ys[0] ?? 0, ys[0] ?? 0] : ys;
      const pts = ys2.map((v, i) => [xs[i] ?? PX0, sy(v)] as const);
      if (rev) pts.reverse();
      let d = "";
      pts.forEach(([x, y], i) => {
        if (i === 0) {
          d += `${f1(x)},${f1(y)}`;
          return;
        }
        const [px, py] = pts[i - 1] ?? [x, y];
        const mx = (px + x) / 2;
        d += ` C${f1(mx)},${f1(py)} ${f1(mx)},${f1(y)} ${f1(x)},${f1(y)}`;
      });
      return d;
    };
    let areas = "";
    let lines = "";
    let labels = "";
    let base = months.map(() => 0);
    series.forEach((se, k) => {
      const v = vals[k] ?? [];
      const lo = base;
      const hi = base.map((b, i) => b + (v[i] ?? 0));
      base = hi;
      areas += `<path d="M${curve(hi)} L${curve(lo, true)} Z" fill="${se.c}" fill-opacity="${t.areaTint}"/>`;
      lines += `<path d="M${curve(hi)}" fill="none" stroke="${t.card}" stroke-width="1.25" stroke-linejoin="round"/>`;
      // direct label at the thickest point if it fits
      let bi = 0;
      v.forEach((x, i) => {
        if (x > (v[bi] ?? 0)) bi = i;
      });
      const thick = sy(lo[bi] ?? 0) - sy(hi[bi] ?? 0);
      const lbl = se.isRest ? "others" : se.name;
      if (thick >= 16) {
        const w = tw(lbl, 11);
        const x = Math.min(
          Math.max(
            xs.length === 2 && months.length === 1 ? (PX0 + PX1) / 2 : sx(bi),
            PX0 + w / 2 + 4,
          ),
          PX1 - w / 2 - 4,
        );
        labels += `<text x="${f1(x)}" y="${f1((sy(lo[bi] ?? 0) + sy(hi[bi] ?? 0)) / 2 + 4)}" font-size="11" text-anchor="middle" class="b" stroke="${t.card}" stroke-width="3" stroke-opacity="0.7" stroke-linejoin="round" paint-order="stroke">${esc(lbl)}</text>`;
      }
    });
    s += `<g>${areas}${lines}</g>${labels}`;
    const partial =
      last === stats.generatedAt.slice(0, 7) ? ` · ${monthName(last)} is partial` : "";
    const range = START === last ? monthName(START) : `${monthName(START)} – ${monthName(last)}`;
    s += `<text x="24" y="${h - 16}" font-size="11" class="m">${range}${before ? ` · ${before} earlier contributions (${earlierYears}) not shown` : ""}${partial}</text>`;
    return svgDoc(t, h, s);
  },
};
