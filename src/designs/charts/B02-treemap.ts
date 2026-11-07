import type { Design } from "../types.ts";
import {
  NCOL,
  type Repo,
  THEMES,
  W,
  colorOf,
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

interface Rect<T> {
  it: T;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Squarified treemap layout of `items` (each with a value `v`) into the rectangle. */
function squarify<T extends { v: number }>(
  items: T[],
  x0: number,
  y0: number,
  w0: number,
  h0: number,
): Rect<T>[] {
  const out: Rect<T>[] = [];
  const total = sum(items.map((it) => it.v));
  let x = x0;
  let y = y0;
  let w = w0;
  let h = h0;
  if (!total || w <= 0 || h <= 0) return out;
  const scale = (w * h) / total;
  let restI = items.filter((it) => it.v > 0).map((it) => ({ it, a: it.v * scale }));
  while (restI.length) {
    const side = Math.min(w, h);
    const worst = (r: { a: number }[]) => {
      const s = sum(r.map((q) => q.a));
      let mx = 0;
      let mn = Number.POSITIVE_INFINITY;
      for (const q of r) {
        mx = Math.max(mx, q.a);
        mn = Math.min(mn, q.a);
      }
      return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
    };
    const row = restI.slice(0, 1);
    let i = 1;
    while (i < restI.length) {
      const next = restI[i];
      if (!next || worst([...row, next]) > worst(row)) break;
      row.push(next);
      i++;
    }
    const s = sum(row.map((q) => q.a));
    if (w >= h) {
      const rw = s / h;
      let yy = y;
      for (const q of row) {
        const qh = q.a / rw;
        out.push({ it: q.it, x, y: yy, w: rw, h: qh });
        yy += qh;
      }
      x += rw;
      w -= rw;
    } else {
      const rh = s / w;
      let xx = x;
      for (const q of row) {
        const qw = q.a / rh;
        out.push({ it: q.it, x: xx, y, w: qw, h: rh });
        xx += qw;
      }
      y += rh;
      h -= rh;
    }
    restI = restI.slice(i);
  }
  return out;
}

const inset = <T>(r: Rect<T>, g: number): Rect<T> => ({
  ...r,
  x: r.x + g / 2,
  y: r.y + g / 2,
  w: Math.max(0, r.w - g),
  h: Math.max(0, r.h - g),
});

const list = (xs: string[]): string =>
  xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

export const design: Design = {
  id: "B02",
  slug: "treemap",
  title: "Treemap",
  idea: "Every external repo as a tile sized by contributions, nested family → owner → repo, so the shape of the whole footprint (a few dominant blocks, a wide family spread, a long tail) is visible at a glance. The seven largest groups get colours.",
  render(stats, theme) {
    const t = THEMES[theme];
    const { T, total: TOTAL, groups, restGroups, rest, bigFamily } = derive(stats);
    const X = 24;
    const Y = 74;
    const WW = W - 48;
    const HH = 400;
    const h = Y + HH + 40;
    let s = header(
      "Contribution map",
      `Area = PRs + issues + discussions · grouped by family → owner → repo · ${fmt(TOTAL)} contributions in ${T.externalRepos} repos`,
    );
    const gRects = squarify(
      groups.map((g) => ({ v: g.total, g })),
      X,
      Y,
      WW,
      HH,
    );
    let labels = "";
    for (const gr0 of gRects) {
      const g = gr0.it.g;
      const gr = inset(gr0, 3);
      const col = colorOf(t, g);
      // owner level
      const owners = [...g.owners]
        .map((o) => {
          const rs = g.repos.filter((r) => r.owner === o).sort((a, b) => b.total - a.total);
          return { v: sum(rs.map((r) => r.total)), o, rs };
        })
        .sort((a, b) => b.v - a.v);
      const oRects =
        owners.length > 1
          ? squarify(owners, gr.x, gr.y, gr.w, gr.h).map((r) => inset(r, 2))
          : owners.map((o) => ({ ...gr, it: o }));
      // group label overlay at the group's top-left
      const halo = `stroke="${t.card}" stroke-width="3" stroke-opacity="0.85" stroke-linejoin="round" paint-order="stroke"`;
      let labelEnd = -1;
      let labelLines = 0;
      const gl = `${g.name} ${g.total}`;
      if (gr.w >= tw(gl, 12) + 14 && gr.h >= 36) {
        labels += `<text x="${f1(gr.x + 6)}" y="${f1(gr.y + 16)}" font-size="12" ${halo}><tspan class="b">${esc(g.name)}</tspan><tspan class="m"> ${g.total}</tspan></text>`;
        labelEnd = gr.x + tw(gl, 12) + 12;
        labelLines = 1;
      } else if (gr.w >= tw(g.name, 10) + 8 && gr.h >= 50) {
        const size = tw(g.name, 12) + 12 <= gr.w ? 12 : tw(g.name, 11) + 10 <= gr.w ? 11 : 10;
        labels += `<text x="${f1(gr.x + 6)}" y="${f1(gr.y + 16)}" font-size="${size}" class="b" ${halo}>${esc(g.name)}</text>`;
        labels += `<text x="${f1(gr.x + 6)}" y="${f1(gr.y + 30)}" font-size="11" class="m" ${halo}>${g.total}</text>`;
        labelEnd = gr.x + Math.min(gr.w, tw(g.name, 12) + 12);
        labelLines = 2;
      }
      const single = g.repos.length === 1;
      for (const orr of oRects) {
        const tiles = squarify(
          orr.it.rs.map((r: Repo) => ({ v: r.total, r })),
          orr.x,
          orr.y,
          orr.w,
          orr.h,
        ).map((r) => inset(r, 1));
        for (const tl of tiles) {
          const r = tl.it.r;
          if (tl.w < 0.5 || tl.h < 0.5) continue;
          s += `<rect x="${f1(tl.x)}" y="${f1(tl.y)}" width="${f1(tl.w)}" height="${f1(tl.h)}" rx="2" fill="${col}" fill-opacity="${t.tint}"/>`;
          const pad = 6;
          const avail = tl.w - pad * 2;
          const under = labelLines > 0 && tl.y < gr.y + 6 && tl.x < labelEnd;
          const off = under ? labelLines * 14 + 4 : 0;
          const hh = tl.h - off;
          if (single) {
            if (under && hh >= 18 && tw(r.name, 11) <= avail)
              labels += `<text x="${f1(tl.x + pad)}" y="${f1(tl.y + off + 13)}" font-size="11" class="m">${esc(r.name)}</text>`;
            continue;
          }
          if (hh >= 32 && avail >= 30) {
            const rl = trunc(r.name, 11, avail);
            if (rl === r.name || rl.length >= 8) {
              labels += `<text x="${f1(tl.x + pad)}" y="${f1(tl.y + off + 15)}" font-size="11">${esc(rl)}</text>`;
              labels += `<text x="${f1(tl.x + pad)}" y="${f1(tl.y + off + 28)}" font-size="11" class="m">${r.total}</text>`;
            }
          } else if (hh >= 18 && tw(`${r.name} ${r.total}`, 10) <= avail) {
            labels += `<text x="${f1(tl.x + pad)}" y="${f1(tl.y + off + hh / 2 + 3.5)}" font-size="10">${esc(r.name)} <tspan class="m">${r.total}</tspan></text>`;
          }
        }
      }
      if (g.rank < NCOL)
        s += `<rect x="${f1(gr.x)}" y="${f1(gr.y)}" width="${f1(gr.w)}" height="${f1(gr.h)}" rx="3" fill="none" stroke="${col}" stroke-width="1.5"/>`;
    }
    s += labels;
    const fy = Y + HH + 22;
    // Spell out the largest multi-owner family among the coloured groups, naming up to three of its owners by contributions.
    let fam = "";
    if (bigFamily?.family) {
      const owners = bigFamily.family.owners;
      const kind = owners.every((o) => stats.owners.find((x) => x.owner === o)?.type !== "User")
        ? "orgs"
        : "owners";
      const ranked = [...bigFamily.owners].sort(
        (a, b) =>
          sum(bigFamily.repos.filter((r) => r.owner === b).map((r) => r.total)) -
          sum(bigFamily.repos.filter((r) => r.owner === a).map((r) => r.total)),
      );
      fam =
        owners.length > 3
          ? ` (${bigFamily.name} spans ${owners.length} ${kind}, e.g. ${ranked.slice(0, 3).join(", ")})`
          : ` (${bigFamily.name} = ${list(owners)})`;
    }
    const foot = restGroups.length
      ? `Coloured: the ${NCOL} largest groups${fam}. Gray: everyone else, ${rest.owners} owners and ${rest.total} contributions.`
      : `One colour per group, ${groups.length} in all${fam}.`;
    s += `<text x="24" y="${fy}" font-size="11" class="m">${esc(foot)}</text>`;
    return svgDoc(t, h, s);
  },
};
