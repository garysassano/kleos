import type { Design } from "../types.ts";
import { type Repo, THEMES, W, derive, esc, f1, fmtK, header, svgDoc, tw } from "./_shared.ts";

/** FNV-1a of the repo name in [0, 1]: a stable jitter, not randomness. */
function hash(str: string): number {
  let h = 2166136261;
  for (const ch of str) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/** Smallest value of the 1, 3, 10, 30, … sequence that is at least `v`. */
function niceCeil(v: number): number {
  let n = 1;
  for (let k = 0; n < v; k++) n = k % 2 === 0 ? n * 3 : (n / 3) * 10;
  return n;
}

/** Repos labelled first: the most contributions. */
const TOP_BY_TOTAL = 7;
/** Then the repos with the highest stars × contributions, among those with at least this many contributions. */
const MIN_FOR_STAR_LABEL = 3;
const MAX_LABELS = 11;

interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}
const hit = (a: Box, b: Box) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;

export const design: Design = {
  id: "B04",
  slug: "stars-scatter",
  title: "Stars vs involvement",
  idea: "Each repo plotted by stars (log) against my contributions (log), coloured by whether code landed; shows depth in mid-size projects versus drive-by issues on giant ones. Labels go to the 7 repos with most contributions, then the highest stars × contributions among repos with at least 3, up to 11 in all, each placed where it overlaps no other label and no other labelled repo's dot.",
  render(stats, theme) {
    const t = THEMES[theme];
    const { repos } = derive(stats);
    const PX0 = 72;
    const PX1 = W - 32;
    const PY0 = 96;
    const PY1 = 400;
    const h = PY1 + 62;
    const plotted = repos.filter((r) => r.total > 0);
    const xTop = niceCeil(Math.max(10, ...plotted.map((r) => r.stars)));
    const yTop = niceCeil(Math.max(3, ...plotted.map((r) => r.total)));
    const xmax = Math.log10(xTop);
    const ymax = Math.log10(yTop);
    const sx = (v: number) => PX0 + (Math.log10(Math.max(1, v)) / xmax) * (PX1 - PX0);
    const sy = (v: number, j = 0) => PY1 - ((Math.log10(v) + j) / ymax) * (PY1 - PY0);
    const cats = [
      { label: "Has a merged PR", c: t.cat[0], test: (r: Repo) => r.prsMerged > 0 },
      {
        label: "PRs, none merged yet",
        c: t.cat[1],
        test: (r: Repo) => r.prs > 0 && r.prsMerged === 0,
      },
      { label: "Issues / discussions only", c: t.cat[2], test: (r: Repo) => r.prs === 0 },
    ];
    const counts = cats.map((c) => plotted.filter(c.test).length);
    let s = header(
      "Popular projects vs. how involved I got",
      `Each dot is one of ${plotted.length} repos · x = stars (log) · y = my PRs + issues + discussions (log)`,
    );
    // legend
    let lx = 24;
    cats.forEach((c, i) => {
      s += `<circle cx="${lx + 5}" cy="76" r="5" fill="${c.c}"/>`;
      const lbl = `${c.label} (${counts[i]})`;
      s += `<text x="${lx + 15}" y="80" font-size="12" class="m">${esc(lbl)}</text>`;
      lx += 15 + tw(lbl, 12) + 22;
    });
    // grid
    for (let v = 1; v <= xTop; v *= 10) {
      const x = sx(v);
      s += `<line x1="${f1(x)}" y1="${PY0}" x2="${f1(x)}" y2="${PY1}" stroke="${t.grid}"/>`;
      s += `<text x="${f1(x)}" y="${PY1 + 16}" font-size="11" text-anchor="middle" class="m">${v === 1 ? "≤1" : fmtK(v)}</text>`;
    }
    for (let v = 1; v <= yTop; v = niceCeil(v + 1)) {
      const y = sy(v);
      s += `<line x1="${PX0}" y1="${f1(y)}" x2="${PX1}" y2="${f1(y)}" stroke="${t.grid}"/>`;
      s += `<text x="${PX0 - 8}" y="${f1(y + 4)}" font-size="11" text-anchor="end" class="m">${v}</text>`;
    }
    s += `<text x="${PX1}" y="${PY1 + 34}" font-size="11" text-anchor="end" class="m">GitHub stars →</text>`;
    s += `<text transform="translate(22 ${(PY0 + PY1) / 2}) rotate(-90)" font-size="11" text-anchor="middle" class="m">my contributions →</text>`;
    // dots (draw rarest last so colour minorities stay on top)
    const pts = plotted.map((r) => {
      const ci = cats.findIndex((c) => c.test(r));
      const j = (hash(r.repo) - 0.5) * 0.09; // tiny vertical jitter to separate ties
      return { r, ci, x: sx(r.stars), y: sy(r.total, r.total <= 3 ? j : 0) };
    });
    for (const ci of [2, 1, 0])
      for (const p of pts.filter((q) => q.ci === ci)) {
        s += `<circle cx="${f1(p.x)}" cy="${f1(p.y)}" r="4.5" fill="${cats[ci]?.c}" fill-opacity="0.9" stroke="${t.card}" stroke-width="1.5"/>`;
      }
    // Labels: candidates in priority order, each at the first offset that stays inside the plot and
    // clear of other labels and of every candidate's dot. Other dots may sit under a label's halo.
    const byStars = pts
      .slice(TOP_BY_TOTAL)
      .filter((p) => p.r.total >= MIN_FOR_STAR_LABEL)
      .sort((a, b) => b.r.stars * b.r.total - a.r.stars * a.r.total);
    const wanted = [...pts.slice(0, TOP_BY_TOTAL), ...byStars].slice(0, MAX_LABELS);
    const dotOf = (p: { x: number; y: number }): Box => ({
      x0: p.x - 4.5,
      x1: p.x + 4.5,
      y0: p.y - 4.5,
      y1: p.y + 4.5,
    });
    const placed: Box[] = [];
    const offsets = [
      [10, 4, "start"],
      [-10, 4, "end"],
      [0, -10, "middle"],
      [0, -10, "end"],
      [0, -10, "start"],
      [0, 17, "middle"],
      [0, 17, "end"],
      [0, 17, "start"],
    ] as const;
    for (const p of wanted) {
      const label = p.r.name;
      const w = tw(`${label} ${p.r.total}`, 11);
      for (const [dx, dy, anchor] of offsets) {
        const ax = p.x + dx;
        const x0 = anchor === "start" ? ax : anchor === "end" ? ax - w : ax - w / 2;
        const box = { x0: x0 - 2, x1: x0 + w + 2, y0: p.y + dy - 10, y1: p.y + dy + 3 };
        if (box.x0 < PX0 || box.x1 > W - 24 || box.y0 < PY0 - 6 || box.y1 > PY1 - 2) continue;
        if (placed.some((b) => hit(b, box))) continue;
        if (wanted.some((q) => q !== p && hit(dotOf(q), box))) continue;
        placed.push(box);
        s += `<text x="${f1(ax)}" y="${f1(p.y + dy)}" font-size="11" text-anchor="${anchor}" stroke="${t.card}" stroke-width="3" stroke-linejoin="round" paint-order="stroke">${esc(label)} <tspan class="m">${p.r.total}</tspan></text>`;
        break;
      }
    }
    const zero = plotted.filter((r) => r.stars < 1).length;
    const zeroNote = zero
      ? ` ${zero} repo${zero === 1 ? "" : "s"} with 0 stars ${zero === 1 ? "is" : "are"} plotted at ≤1.`
      : "";
    s += `<text x="24" y="${PY1 + 34}" font-size="11" class="m">Labels show repo name and my total there.${zeroNote}</text>`;
    return svgDoc(t, h, s);
  },
};
