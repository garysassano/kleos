import type { OwnerStats, Stats } from "../../stats/types.ts";
import type { Design, ThemeName } from "../types.ts";
import { avatar, context, esc, r1, svg, upstream } from "./_shared.ts";

/** Most badges shown. */
const MAX = 24;

function render(stats: Stats, theme: ThemeName): string {
  const c = context(stats, theme);
  const { t } = c;
  const X = upstream(stats);
  const W = 840;
  const H0 = 30;
  const BH = 22;
  const GAP = 6;
  const ROWG = 8;
  const items = stats.owners.slice(0, MAX);
  const N = items.length;
  const FS = 11;
  const cw = (s: string) => s.length * FS * 0.58;

  type Badge = { o: OwnerStats; lw: number; mw: number; w: number; x: number };
  const rows: Badge[][] = [[]];
  let x = 0;
  for (const o of items) {
    const lw = 4 + 16 + 5 + cw(o.owner) + 7;
    const mw = 7 + cw(String(o.total)) + 7;
    const w = lw + mw;
    if (x + w > W && x > 0) {
      rows.push([]);
      x = 0;
    }
    rows[rows.length - 1]?.push({ o, lw, mw, w, x });
    x += w + GAP;
  }

  let out = "";
  rows.forEach((row, ri) => {
    const by = H0 + ri * (BH + ROWG);
    for (const b of row) {
      const id = c.id("bd");
      const bx = b.x;
      out += `<g><clipPath id="${id}"><rect x="${bx}" y="${by}" width="${r1(b.w)}" height="${BH}" rx="4"/></clipPath><g clip-path="url(#${id})"><rect x="${bx}" y="${by}" width="${r1(b.lw)}" height="${BH}" fill="${t.badgeL}"/><rect x="${r1(bx + b.lw)}" y="${by}" width="${r1(b.mw)}" height="${BH}" fill="${t.badgeR}"/></g>`;
      out += avatar(c, b.o.owner, bx + 4, by + 3, 16, { type: b.o.type });
      out += `<text x="${r1(bx + 25)}" y="${by + 15}" font-size="${FS}" fill="${t.onBadge}" textLength="${r1(cw(b.o.owner))}" lengthAdjust="spacingAndGlyphs">${esc(b.o.owner)}</text>`;
      out += `<text x="${r1(bx + b.lw + 7)}" y="${by + 15}" font-size="${FS}" font-weight="600" fill="${t.onBadge}" textLength="${r1(cw(String(b.o.total)))}" lengthAdjust="spacingAndGlyphs">${b.o.total}</text></g>`;
    }
  });
  const H = H0 + rows.length * (BH + ROWG) - ROWG + 2;
  const heading =
    N < X.owners
      ? `Top ${N} of ${X.owners} owners I contribute to`
      : `All ${N} ${N === 1 ? "owner" : "owners"} I contribute to`;
  const head = `<text x="0" y="14" font-size="12.5" font-weight="600" fill="${t.text}">${heading}</text><text x="${W}" y="14" text-anchor="end" font-size="11.5" fill="${t.muted}">count = PRs + issues + discussions</text>`;
  return svg(W, H, `Top ${N} owners by upstream contributions`, head + out);
}

export const design: Design = {
  id: "E02",
  slug: "owner-badges",
  title: "Owner badges",
  idea: 'Shields.io-style pills, one per top owner (up to 24) with its avatar and a contribution count. Reads as a compact "who I contribute to" line and wraps to the README width.',
  render,
};
