import type { Design } from "../types.ts";
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
  sum,
  svgDoc,
  trunc,
  tw,
} from "./_shared.ts";

/** Most repos shown. */
const N = 12;

export const design: Design = {
  id: "B01",
  slug: "stacked-bars",
  title: "Stacked bars + table",
  idea: "The top 12 external repos as horizontal stacked bars (merged PRs, other PRs, issues, discussions) with the exact counts in aligned columns that double as the legend.",
  render(stats, theme) {
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
    const bw = 248;
    const cols = [
      { k: "prsMerged", label: "Merged", c: t.cat[0] },
      { k: "prsOther", label: "Other PRs", c: t.blueLight },
      { k: "issues", label: "Issues", c: t.cat[1] },
      { k: "discussions", label: "Discuss.", c: t.cat[2] },
    ] as const;
    const colX = [603, 685, 745, 816]; // right-aligned numeric columns
    const max = Math.max(1, rows[0]?.total ?? 0);
    const h = top + n * pitch + 46;
    let s = header("Where my contributions went", SUB);
    // column headers (= legend)
    const hy = 82;
    s += `<text x="${labelX}" y="${hy}" font-size="11" class="m">Repository</text>`;
    s += `<text x="${bx}" y="${hy}" font-size="11" class="m">PRs, issues and discussions (opened)</text>`;
    cols.forEach((c, i) => {
      const w = tw(c.label, 11);
      s += `<rect x="${f1((colX[i] ?? 0) - w)}" y="${hy + 4}" width="${f1(w)}" height="3" rx="1.5" fill="${c.c}"/>`;
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
      const segs = cols.map((c) => ({ c, v: vals[c.k] })).filter((q) => q.v > 0);
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
      cols.forEach((c, k) => {
        const v = vals[c.k];
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
    s += `<text x="${lx}" y="${fy + 6}" font-size="11" class="m">${scope} · "Other PRs" = open or closed without merge</text>`;
    return svgDoc(t, h, s);
  },
};
