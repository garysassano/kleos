import { mergeRate, prParts, totalsCounts } from "../../kit/outcomes.ts";
import { DEFAULT_OPTIONS, type Design, type Level, type RenderOptions } from "../types.ts";
import type { Repo, Theme } from "./_shared.ts";
import {
  THEMES,
  W,
  avatar,
  barPath,
  derive,
  esc,
  f1,
  fmt,
  header,
  prColor,
  sum,
  svgDoc,
  trunc,
  tw,
} from "./_shared.ts";

/** Most repos shown. */
const N = 12;

interface Col {
  label: string;
  /** Swatch under the header; two colours draw a split swatch (the whole PR span). */
  c: string | undefined;
  c2?: string;
  v: (r: Repo) => number;
}

/** Bar segments and table columns at an explicit outcomes level. */
function levelCols(t: Theme, lvl: Level) {
  const rest: Col[] = [
    { label: "Issues", c: cat0(t, 1), v: (r) => r.issues },
    { label: "Discuss.", c: cat0(t, 2), v: (r) => r.discussions },
  ];
  const segs = (r: Repo) => [
    ...prParts(r, lvl).map((p) => ({ v: p.count, c: prColor(t, p.key, lvl) })),
    { v: r.issues, c: cat0(t, 1) },
    { v: r.discussions, c: cat0(t, 2) },
  ];
  const pr: Col[] =
    lvl === "none"
      ? [{ label: "PRs", c: prColor(t, "pr", lvl), v: (r) => r.prs }]
      : lvl === "merged"
        ? [
            {
              label: "PRs",
              c: prColor(t, "merged", lvl),
              c2: prColor(t, "pr", lvl),
              v: (r) => r.prs,
            },
            { label: "of which merged", c: prColor(t, "merged", lvl), v: (r) => r.prsMerged },
          ]
        : [
            { label: "Merged", c: prColor(t, "merged", lvl), v: (r) => r.prsMerged },
            { label: "Open", c: prColor(t, "open", lvl), v: (r) => r.prsOpen },
            {
              label: "Closed",
              c: prColor(t, "closed", lvl),
              v: (r) => prParts(r, lvl)[2]?.count ?? 0,
            },
          ];
  const cols = [...pr, ...rest];
  // Right-aligned numeric columns, packed from the right edge by header width.
  const colX: number[] = [];
  let x = 816;
  for (let i = cols.length - 1; i >= 0; i--) {
    colX[i] = x;
    x -= Math.max(tw(cols[i]?.label ?? "", 11), 28) + 20;
  }
  return { cols, colX, segs };
}

const cat0 = (t: Theme, i: number): string => t.cat[i] ?? t.other;

export const design: Design = {
  id: "B01",
  slug: "stacked-bars",
  title: "Stacked bars + table",
  idea: 'The top 12 external repos as horizontal stacked bars (merged PRs, other PRs, issues, discussions) with the exact counts in aligned columns that double as the legend. With outcomes "none" PRs are one segment and column, "merged" shows PRs with the merged ones as a subset, and "full" splits merged, open and closed-unmerged PRs.',
  render(stats, theme, options: RenderOptions = DEFAULT_OPTIONS) {
    const lvl = options.outcomes;
    const t = THEMES[theme];
    const { T, repos, total: TOTAL, SUB } = derive(stats);
    const rows = repos.slice(0, N);
    const n = rows.length;
    const top = 92;
    const pitch = 27;
    const bh = 16;
    const lx = 24;
    const labelX = 48;
    const bx = 262;
    const cols = [
      { k: "prsMerged", label: "Merged", c: t.cat[0] },
      { k: "prsOther", label: "Other PRs", c: t.blueLight },
      { k: "issues", label: "Issues", c: t.cat[1] },
      { k: "discussions", label: "Discuss.", c: t.cat[2] },
    ] as const;
    const colX0 = [603, 685, 745, 816]; // right-aligned numeric columns
    const L = lvl ? levelCols(t, lvl) : undefined;
    const colX = L?.colX ?? colX0;
    const heads: Col[] = L?.cols ?? cols.map((c) => ({ ...c, v: () => 0 }));
    const bw = L ? (colX[0] ?? 0) - Math.max(tw(heads[0]?.label ?? "", 11), 28) - 44 - bx : 248;
    const max = Math.max(1, rows[0]?.total ?? 0);
    const h = top + n * pitch + 46;
    const P = totalsCounts(T);
    const prNote =
      lvl === "none"
        ? `${P.prs} PRs`
        : lvl === "full"
          ? `${P.prsMerged} of ${P.prs} PRs merged (${mergeRate(P, "full") ?? 0}%)`
          : `${T.externalMerged} PRs merged`;
    const sub = lvl
      ? `${fmt(TOTAL)} contributions to other people's projects · ${T.externalRepos} repos · ${T.externalOwners} owners · ${prNote}`
      : SUB;
    let s = header("Where my contributions went", sub);
    // column headers (= legend)
    const hy = 82;
    s += `<text x="${labelX}" y="${hy}" font-size="11" class="m">Repository</text>`;
    s += `<text x="${bx}" y="${hy}" font-size="11" class="m">PRs, issues and discussions (opened)</text>`;
    heads.forEach((c, i) => {
      const w = tw(c.label, 11);
      s += `<rect x="${f1((colX[i] ?? 0) - w)}" y="${hy + 4}" width="${f1(w)}" height="3" rx="1.5" fill="${c.c}"/>`;
      if (c.c2)
        s += `<rect x="${f1((colX[i] ?? 0) - w / 2)}" y="${hy + 4}" width="${f1(w / 2)}" height="3" rx="1.5" fill="${c.c2}"/>`;
      s += `<text x="${colX[i]}" y="${hy}" font-size="11" text-anchor="end" class="m">${c.label}</text>`;
    });
    s += `<line x1="${lx}" y1="${hy + 10}" x2="${W - 24}" y2="${hy + 10}" stroke="${t.border}"/>`;
    rows.forEach((r, i) => {
      const y = top + i * pitch + 6;
      const cy = y + bh / 2;
      const vals = {
        prsMerged: r.prsMerged,
        prsOther: r.prs - r.prsMerged,
        issues: r.issues,
        discussions: r.discussions,
      };
      s += avatar(t, stats.avatars, r.owner, lx, cy - 8, 16);
      const label = trunc(r.repo, 12, bx - labelX - 14);
      const [o, ...nm] = label.split("/");
      s += `<text x="${labelX}" y="${cy + 4}" font-size="12"><tspan class="m">${esc(o ?? "")}/</tspan>${esc(nm.join("/"))}</text>`;
      let x = bx;
      const segs = (
        L
          ? L.segs(r).map((q) => ({ c: { c: q.c }, v: q.v }))
          : cols.map((c) => ({ c, v: vals[c.k] }))
      ).filter((q) => q.v > 0);
      const totalW = (r.total / max) * bw;
      s += `<g>`;
      segs.forEach((q, j) => {
        const w = (q.v / r.total) * totalW;
        const last = j === segs.length - 1;
        const gw = last ? w : Math.max(w - 2, 0.8); // 2px surface gap
        s += last
          ? `<path d="${barPath(x, y, gw, bh)}" fill="${q.c.c}"/>`
          : `<rect x="${f1(x)}" y="${y}" width="${f1(gw)}" height="${bh}" fill="${q.c.c}"/>`;
        x += w;
      });
      s += `</g>`;
      s += `<text x="${f1(bx + totalW + 6)}" y="${cy + 4}" font-size="12" class="b">${r.total}</text>`;
      heads.forEach((c, k) => {
        const v = L ? c.v(r) : (vals[cols[k]?.k ?? "issues"] ?? 0);
        s += `<text x="${colX[k]}" y="${cy + 4}" font-size="12" text-anchor="end" class="mono${v ? "" : " m"}">${v ? v : "–"}</text>`;
      });
    });
    const fy = top + n * pitch + 22;
    s += `<line x1="${lx}" y1="${fy - 14}" x2="${W - 24}" y2="${fy - 14}" stroke="${t.border}"/>`;
    const shown = sum(rows.map((r) => r.total));
    const scope =
      n < repos.length
        ? `Top ${n} of ${T.externalRepos} repos, ranked by total (bold) · these ${n} hold ${shown} of ${fmt(TOTAL)} contributions`
        : `All ${n} repos, ranked by total (bold)`;
    const note =
      lvl === undefined
        ? ' · "Other PRs" = open or closed without merge'
        : lvl === "full"
          ? ' · "Closed" = closed without merging'
          : "";
    s += `<text x="${lx}" y="${fy + 6}" font-size="11" class="m">${scope}${note}</text>`;
    return svgDoc(t, h, s);
  },
};
