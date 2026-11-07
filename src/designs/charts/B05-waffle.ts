import type { Design } from "../types.ts";
import {
  THEMES,
  W,
  colorOf,
  derive,
  esc,
  fmt,
  header,
  plural,
  svgDoc,
  trunc,
  tw,
} from "./_shared.ts";

const MAX_ROWS = 20;
const MIN_ROWS = 5;
/** Columns the rows are sized for, so small totals make a wide strip instead of a tall sliver. */
const TARGET_COLS = 40;

interface Item {
  name: string;
  total: number;
  prsMerged: number;
  owners: number;
  c: string;
  isRest: boolean;
}

export const design: Design = {
  id: "B05",
  slug: "waffle",
  title: "Waffle",
  idea: "One square per contribution, grouped by family or owner, with merged PRs solid and everything else faded, so volume and code-vs-reports read together. Very large totals switch to one square per few contributions so the grid always fits.",
  render(stats, theme) {
    const t = THEMES[theme];
    const { total: TOTAL, topGroups, restGroups, rest } = derive(stats);
    const cell = 12;
    const gap = 3;
    const pitch = cell + gap;
    const maxCols = Math.floor((W - 48 + gap) / pitch);
    const unit = Math.max(1, Math.ceil(TOTAL / (MAX_ROWS * maxCols)));
    const items: Item[] = topGroups.map((g) => ({
      name: g.name,
      total: g.total,
      prsMerged: g.prsMerged,
      owners: g.owners.size,
      c: colorOf(t, g),
      isRest: false,
    }));
    if (restGroups.length) items.push({ ...rest, c: t.other, isRest: true });
    const squares = items.map((it) => ({
      n: Math.round(it.total / unit),
      solid: Math.round(it.prsMerged / unit),
    }));
    const cellsN = squares.reduce((a, q) => a + q.n, 0);
    const ROWS = Math.min(MAX_ROWS, Math.max(MIN_ROWS, Math.ceil(cellsN / TARGET_COLS)));
    const COLS = Math.max(1, Math.ceil(cellsN / ROWS));
    const gridW = COLS * pitch - gap;
    const X0 = Math.round((W - gridW) / 2);
    const Y0 = 112;
    const what =
      unit === 1
        ? `${fmt(TOTAL)} squares =`
        : `${fmt(cellsN)} squares, each ≈ ${unit} of ${fmt(TOTAL)}`;
    let s = header(
      "Every contribution, one square",
      `${what} PRs, issues and discussions on other people's repos · solid = merged PR`,
    );
    let idx = 0;
    const bands: { it: Item; start: number; end: number }[] = [];
    let cells = "";
    items.forEach((it, i) => {
      const start = idx;
      const q = squares[i] ?? { n: 0, solid: 0 };
      for (let k = 0; k < q.n; k++) {
        const solid = k < q.solid;
        const col = Math.floor(idx / ROWS);
        const row = idx % ROWS;
        const x = X0 + col * pitch;
        const y = Y0 + row * pitch;
        cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" rx="2" fill="${it.c}"${solid ? "" : ` fill-opacity="${t.name === "dark" ? 0.4 : 0.38}"`}/>`;
        idx++;
      }
      bands.push({ it, start, end: idx });
    });
    s += `<g class="w">${cells}</g>`;
    // empty remainder cells as faint outlines so the grid reads as complete
    for (let k = idx; k < COLS * ROWS; k++) {
      const col = Math.floor(k / ROWS);
      const row = k % ROWS;
      s += `<rect x="${X0 + col * pitch + 0.5}" y="${Y0 + row * pitch + 0.5}" width="${cell - 1}" height="${cell - 1}" rx="2" fill="none" stroke="${t.grid}"/>`;
    }
    // direct labels above bands wide enough
    for (const b of bands) {
      if (b.end === b.start) continue;
      const c0 = Math.floor(b.start / ROWS);
      const c1 = Math.ceil(b.end / ROWS);
      const wpx = (c1 - c0) * pitch;
      const label = b.it.isRest ? `${b.it.owners} other owners` : b.it.name;
      const lab2 = `${b.it.total}`;
      if (wpx < tw(`${label} ${lab2}`, 12) + 6) continue;
      const x = X0 + c0 * pitch;
      s += `<line x1="${x}" y1="${Y0 - 20}" x2="${x}" y2="${Y0 - 5}" stroke="${b.it.c}" stroke-width="2"/>`;
      s += `<text x="${x + 6}" y="${Y0 - 9}" font-size="12"><tspan class="b">${esc(label)}</tspan> <tspan class="m">${lab2}</tspan></text>`;
    }
    // legend grid below
    const LY = Y0 + ROWS * pitch + 22;
    const colW = (W - 48) / 4;
    items.forEach((it, i) => {
      const x = 24 + (i % 4) * colW;
      const y = LY + Math.floor(i / 4) * 22;
      s += `<rect x="${x}" y="${y - 9}" width="10" height="10" rx="2" fill="${it.c}"/>`;
      const label = it.isRest ? `${it.owners} other owners` : it.name;
      s += `<text x="${x + 16}" y="${y}" font-size="12">${esc(trunc(label, 12, colW - 80))} <tspan class="m">${it.total} · ${it.prsMerged} merged</tspan></text>`;
    });
    const h = LY + Math.ceil(items.length / 4) * 22 + 14;
    s += `<text x="24" y="${h - 14}" font-size="11" class="m">Columns fill top to bottom, ${plural(ROWS, "square")} each. Faded = issue, discussion or unmerged PR.</text>`;
    return svgDoc(t, h, s);
  },
};
