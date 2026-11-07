import type { Stats } from "../../stats/types.ts";
import type { Design, ThemeName } from "../types.ts";
import {
  avatar,
  context,
  esc,
  fmt,
  icon,
  plural,
  r1,
  svg,
  trunc,
  tw,
  upstream,
} from "./_shared.ts";

/** Most recent calendar years shown in the per-year mini chart. */
const YEARS = 4;

function render(stats: Stats, theme: ThemeName): string {
  const c = context(stats, theme);
  const { t } = c;
  const X = upstream(stats);
  const W = 840;
  const H = 118;
  const TW = 198;
  const G = 16;

  // PRs + issues + discussions per year, over the last YEARS years up to the snapshot year.
  const byYear: Record<string, number> = {};
  for (const r of stats.repos)
    for (const [m, n] of Object.entries(r.monthly))
      byYear[m.slice(0, 4)] = (byYear[m.slice(0, 4)] ?? 0) + n;
  const active = Object.keys(byYear).filter((y) => (byYear[y] ?? 0) > 0);
  const last = Number(stats.generatedAt.slice(0, 4));
  const first = Math.max(last - YEARS + 1, Math.min(...active.map(Number)));
  const yrs: string[] = [];
  if (active.length) for (let y = first; y <= last; y++) yrs.push(String(y));

  const langCount: Record<string, { n: number; color: string | null }> = {};
  for (const r of stats.repos)
    if (r.language) {
      const entry = langCount[r.language] ?? { n: 0, color: r.langColor };
      entry.n++;
      langCount[r.language] = entry;
    }
  const topLangs = Object.entries(langCount).sort((a, b) => b[1].n - a[1].n);

  const tiles: string[] = [];
  const tile = (
    i: number,
    label: string,
    ic: (x: number, y: number) => string,
    big: string,
    caption: string,
    extra: (x: number) => string,
  ) => {
    const x = i * (TW + G);
    tiles.push(
      `<g class="tile" style="animation-delay:${i * 90}ms"><rect x="${x + 0.5}" y=".5" width="${TW - 1}" height="${H - 1}" rx="6" fill="${t.card}" stroke="${t.border}"/>${ic(x + 16, 16)}<text x="${x + 38}" y="28" font-size="12" font-weight="600" fill="${t.muted}">${esc(label)}</text><text x="${x + 16}" y="70" font-size="30" font-weight="600" fill="${t.text}">${esc(big)}</text><text x="${x + 16}" y="100" font-size="11.5" fill="${t.muted}">${esc(caption)}</text>${extra(x)}</g>`,
    );
  };

  tile(
    0,
    "Upstream PRs",
    (x, y) => icon("pr", x, y, 14, t.pr),
    fmt(X.prs),
    "opened on others’ repos",
    (x) => {
      if (!yrs.length) return "";
      const max = Math.max(1, ...yrs.map((y) => byYear[y] ?? 0));
      const bw = 13;
      const bg = 5;
      const base = 74;
      // 4px shorter than the prototype so the longer label clears the tile heading.
      const hmax = 28;
      const x0 = x + TW - 16 - (yrs.length * bw + (yrs.length - 1) * bg);
      return `${yrs
        .map((y, i) => {
          const h = Math.max(2, ((byYear[y] ?? 0) / max) * hmax);
          const bx = x0 + i * (bw + bg);
          return `<rect class="col" style="animation-delay:${200 + i * 70}ms" x="${bx}" y="${r1(base - h)}" width="${bw}" height="${r1(h)}" rx="2" fill="${t.pr}"/><text x="${bx + bw / 2}" y="${base + 12}" text-anchor="middle" font-size="9.5" fill="${t.muted}">’${y.slice(2)}</text>`;
        })
        .join(
          "",
        )}<text x="${x + TW - 16}" y="${base - hmax - 6}" text-anchor="end" font-size="9.5" fill="${t.muted}">activity per year</text>`;
    },
  );

  tile(
    1,
    "Merge rate",
    (x, y) => icon("merge", x, y, 14, t.pr),
    `${X.rate}%`,
    `${fmt(X.merged)} of ${fmt(X.prs)} PRs merged`,
    (x) => {
      const cx = x + TW - 16 - 24;
      const cy = 56;
      const r = 20;
      const circ = 2 * Math.PI * r;
      const f = X.prs ? X.merged / X.prs : 0;
      const track = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${t.track}" stroke-width="6"/>`;
      if (!f) return track;
      return `${track}<circle class="ring" cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${t.pr}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${r1(circ * f)} ${r1(circ)}" transform="rotate(-90 ${cx} ${cy})" style="--c:${r1(circ)}"/>`;
    },
  );

  tile(
    2,
    "Repositories",
    (x, y) => icon("repo", x, y, 14, t.muted),
    fmt(X.repos),
    `${X.reposWithMerge} with a merged PR`,
    (x) => {
      const rx = x + TW - 16;
      return topLangs
        .slice(0, 3)
        .map(([name, v], i) => {
          const y = 50 + i * 15;
          const label = trunc(name, 66, 10.5);
          return `<text x="${rx}" y="${y}" text-anchor="end" font-size="10.5" fill="${t.muted}">${esc(label)} <tspan fill="${t.text}" font-weight="600">${v.n}</tspan></text><circle cx="${rx - tw(`${label} ${v.n}`, 10.5) - 7}" cy="${y - 3.5}" r="3.5" fill="${v.color ?? t.muted}"/>`;
        })
        .join("");
    },
  );

  tile(
    3,
    "Owners",
    (x, y) => icon("org", x, y, 14, t.muted),
    fmt(X.owners),
    `${plural(X.orgs, "org")} · ${plural(X.users, "user")}`,
    (x) => {
      const top = stats.owners.slice(0, 4);
      const s = 26;
      const step = 19;
      const x0 = x + TW - 16 - (s + step * (top.length - 1));
      return top
        .map((o, i) => avatar(c, o.owner, x0 + i * step, 44, s, { type: o.type, ring: t.card }))
        .join("");
    },
  );

  const css =
    "@keyframes rise{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@keyframes grow{from{transform:scaleY(0)}to{transform:scaleY(1)}}@keyframes dash{from{stroke-dashoffset:var(--c)}to{stroke-dashoffset:0}}.tile{animation:rise .5s ease-out both}.col{transform-box:fill-box;transform-origin:bottom;animation:grow .6s cubic-bezier(.2,.7,.2,1) both}.ring{animation:dash .9s .25s ease-out both}";
  return svg(
    W,
    H,
    `Upstream PRs ${X.prs}, merge rate ${X.rate}%, ${X.repos} repositories, ${X.owners} owners`,
    tiles.join(""),
    css,
  );
}

export const design: Design = {
  id: "E01",
  slug: "stat-tiles",
  title: "Four stat tiles",
  idea: "Upstream PRs, merge rate, repositories and owners as four equal 198px tiles in one 840px strip, each with a tiny supporting visual (activity per year over the last four years, merge ring, top languages, top-owner avatars). Tiles rise in with a short staggered entrance.",
  render,
};
