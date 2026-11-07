import { mergeRate, prParts, totalsCounts } from "../../kit/outcomes.ts";
import { DEFAULT_OPTIONS, type Design, type RenderOptions } from "../types.ts";
import {
  THEMES,
  W,
  avatar,
  colorOf,
  derive,
  esc,
  f1,
  fmt,
  header,
  pct,
  sum,
  svgDoc,
  trunc,
  tw,
} from "./_shared.ts";

function arcPath(cx: number, cy: number, R: number, r: number, a0: number, a1: number): string {
  const p = (a: number, rad: number) => [cx + rad * Math.sin(a), cy - rad * Math.cos(a)] as const;
  // A full ring has coincident end points, which SVG arcs cannot draw: split it into two halves.
  if (a1 - a0 >= Math.PI * 2 - 1e-9) {
    const [tx, ty] = p(0, R);
    const [bx, by] = p(Math.PI, R);
    const [ix, iy] = p(0, r);
    const [jx, jy] = p(Math.PI, r);
    return `M${f1(tx)},${f1(ty)}A${R},${R} 0 1 1 ${f1(bx)},${f1(by)}A${R},${R} 0 1 1 ${f1(tx)},${f1(ty)}ZM${f1(ix)},${f1(iy)}A${r},${r} 0 1 0 ${f1(jx)},${f1(jy)}A${r},${r} 0 1 0 ${f1(ix)},${f1(iy)}Z`;
  }
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = p(a0, R);
  const [x1, y1] = p(a1, R);
  const [x2, y2] = p(a1, r);
  const [x3, y3] = p(a0, r);
  return `M${f1(x0)},${f1(y0)}A${R},${R} 0 ${large} 1 ${f1(x1)},${f1(y1)}L${f1(x2)},${f1(y2)}A${r},${r} 0 ${large} 0 ${f1(x3)},${f1(y3)}Z`;
}

interface Item {
  name: string;
  total: number;
  prs: number;
  prsMerged: number;
  prsOpen: number;
  issues: number;
  discussions: number;
  c: string;
  rank: number;
  owners: number;
  reposN: number;
  avatar: string;
  isRest: boolean;
}

/** Row slots reserved even when there are fewer groups, so the ring always fits. */
const MIN_ROWS = 8;

export const design: Design = {
  id: "B03",
  slug: "donut-ranked",
  title: "Donut + ranked legend",
  idea: "Share of all upstream work by family or owner as a donut (seven largest groups plus everyone else), next to a ranked table with avatars, share and a PR/issue breakdown per group. The PR part of that breakdown follows the outcomes level: PRs only, PRs with merged ones, or merged, open and closed-unmerged.",
  render(stats, theme, options: RenderOptions = DEFAULT_OPTIONS) {
    const lvl = options.outcomes;
    const t = THEMES[theme];
    const { T, total: TOTAL, topGroups, restGroups, rest, bigFamily } = derive(stats);
    const items: Item[] = topGroups.map((g) => ({
      ...g,
      c: colorOf(t, g),
      prsOpen: sum(g.repos.map((r) => r.prsOpen)),
      owners: g.owners.size,
      reposN: g.repos.length,
      isRest: false,
    }));
    if (restGroups.length)
      items.push({
        ...rest,
        prsOpen: sum(restGroups.flatMap((g) => g.repos.map((r) => r.prsOpen))),
        c: t.other,
        rank: 99,
        reposN: rest.repos,
        avatar: "",
        isRest: true,
      });
    const rowH = 38;
    const area = Math.max(items.length, MIN_ROWS) * rowH;
    const top = 84 + Math.round((area - items.length * rowH) / 2);
    const h = 84 + area + 30;
    const cx = 168;
    const cy = 84 + area / 2 + 2;
    const R = 128;
    const r = 84;
    let s = header(
      "Share of my upstream work",
      `By organisation family or owner · ${fmt(TOTAL)} contributions across ${T.externalOwners} owners`,
    );
    // ring
    let a = 0;
    const gap = items.length > 1 ? 0.012 : 0;
    for (const it of items) {
      if (!TOTAL || !it.total) continue;
      const da = (it.total / TOTAL) * Math.PI * 2;
      s += `<path d="${arcPath(cx, cy, R, r, a + gap / 2, a + da - gap / 2)}" fill="${it.c}"/>`;
      // percent label just outside the ring for big slices
      const share = it.total / TOTAL;
      if (share >= 0.03) {
        const mid = a + da / 2;
        const lr = R + 14;
        const lx = cx + lr * Math.sin(mid);
        const ly = cy - lr * Math.cos(mid);
        const anchor = Math.sin(mid) > 0.25 ? "start" : Math.sin(mid) < -0.25 ? "end" : "middle";
        s += `<text x="${f1(lx)}" y="${f1(ly + 4)}" font-size="11" text-anchor="${anchor}" class="m">${Math.round(share * 100)}%</text>`;
      }
      a += da;
    }
    s += `<text x="${cx}" y="${cy - 4}" font-size="30" text-anchor="middle" class="b">${fmt(TOTAL)}</text>`;
    s += `<text x="${cx}" y="${cy + 16}" font-size="12" text-anchor="middle" class="m">contributions</text>`;
    const P = totalsCounts(T);
    const prLine =
      lvl === "none"
        ? `${P.prs} PRs`
        : lvl === "full"
          ? `${P.prsMerged} PRs merged (${mergeRate(P, lvl) ?? 0}%)`
          : `${T.externalMerged} PRs merged`;
    s += `<text x="${cx}" y="${cy + 32}" font-size="12" text-anchor="middle" class="m">${prLine}</text>`;
    // legend table
    const LX = 352;
    const RX = W - 24;
    const pctX = RX - 62;
    s += `<text x="${LX}" y="${top - 8}" font-size="11" class="m">Rank · owner</text>`;
    s += `<text x="${pctX}" y="${top - 8}" font-size="11" text-anchor="end" class="m">Share</text>`;
    s += `<text x="${RX}" y="${top - 8}" font-size="11" text-anchor="end" class="m">Total</text>`;
    items.forEach((it, i) => {
      const y = top + i * rowH;
      s += `<line x1="${LX}" y1="${y}" x2="${RX}" y2="${y}" stroke="${t.grid}"/>`;
      const my = y + rowH / 2;
      s += `<rect x="${LX}" y="${my - 12}" width="4" height="24" rx="2" fill="${it.c}"/>`;
      if (it.isRest) {
        s += `<circle cx="${LX + 23}" cy="${my}" r="10" fill="${t.faint}" stroke="${t.border}"/><text x="${LX + 23}" y="${my + 4}" font-size="11" text-anchor="middle" class="m b">+</text>`;
      } else s += avatar(t, stats.avatars, it.avatar, LX + 13, my - 10, 20);
      const nm = it.isRest ? `${it.owners} other owners` : it.name;
      s += `<text x="${LX + 42}" y="${my - 2}" font-size="13"><tspan class="m">${it.isRest ? "" : `${it.rank + 1}  `}</tspan><tspan class="b">${esc(trunc(nm, 13, 200))}</tspan></text>`;
      const parts: string[] = [];
      if (lvl === undefined) {
        if (it.prsMerged) parts.push(`${it.prsMerged} merged`);
        if (it.prs - it.prsMerged) parts.push(`${it.prs - it.prsMerged} other PRs`);
      } else if (lvl === "full") {
        // Merged, open and closed unmerged, each when non-zero.
        for (const p of prParts(it, lvl)) if (p.count) parts.push(`${p.count} ${p.label}`);
      } else if (it.prs)
        parts.push(
          `${it.prs} PR${it.prs === 1 ? "" : "s"}${lvl === "merged" && it.prsMerged ? ` (${it.prsMerged} merged)` : ""}`,
        );
      if (it.issues) parts.push(`${it.issues} issues`);
      if (it.discussions) parts.push(`${it.discussions} disc.`);
      parts.push(`${it.reposN} repo${it.reposN === 1 ? "" : "s"}`);
      const availB = pctX - 50 - (LX + 42);
      while (parts.length > 2 && tw(parts.join(" · "), 11) > availB) parts.pop();
      s += `<text x="${LX + 42}" y="${my + 13}" font-size="11" class="m">${esc(trunc(parts.join(" · "), 11, availB))}</text>`;
      s += `<text x="${pctX}" y="${my + 5}" font-size="12" text-anchor="end" class="m mono">${pct(it.total, TOTAL)}</text>`;
      s += `<text x="${RX}" y="${my + 5}" font-size="13" text-anchor="end" class="b mono">${it.total}</text>`;
    });
    s += `<line x1="${LX}" y1="${top + items.length * rowH}" x2="${RX}" y2="${top + items.length * rowH}" stroke="${t.grid}"/>`;
    // Spell out the largest multi-owner family among the ranked groups.
    if (bigFamily?.family)
      s += `<text x="24" y="${h - 14}" font-size="11" class="m">${esc(`${bigFamily.name} family = ${bigFamily.family.owners.join(", ")}`)}</text>`;
    return svgDoc(t, h, s);
  },
};
