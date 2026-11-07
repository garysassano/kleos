import { mergeRate, prsClosed } from "../../kit/outcomes.ts";
import { esc } from "../../kit/svg.ts";
import type { OwnerStats } from "../../stats/types.ts";
import { DEFAULT_OPTIONS, type Design, type Level } from "../types.ts";
import { doc, extLine, header, makeCtx, plural, r1, trunc, tw } from "./_shared.ts";

const W = 840;
const H = 500;
/** Owners with at least this many contributions get their own tile; the rest share one. */
const MIN_TILE = 6;

interface Cell {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Squarified treemap (Bruls et al.) of `values`, in order, inside the rectangle. */
function squarify(values: number[], x: number, y: number, w: number, h: number): Cell[] {
  const total = values.reduce((a, b) => a + b, 0);
  if (total <= 0) return [];
  const areas = values.map((v) => (v * w * h) / total);
  const out: Cell[] = [];
  let rect = { x, y, w, h };
  let row: number[] = [];
  let i = 0;
  const worst = (r: number[], side: number) => {
    const s = r.reduce((a, b) => a + b, 0);
    const mx = Math.max(...r);
    const mn = Math.min(...r);
    return Math.max((side * side * mx) / (s * s), (s * s) / (side * side * mn));
  };
  const lay = (r: number[]) => {
    const s = r.reduce((a, b) => a + b, 0);
    if (rect.w >= rect.h) {
      const cw = s / rect.h;
      let yy = rect.y;
      for (const a of r) {
        out.push({ x: rect.x, y: yy, w: cw, h: a / cw });
        yy += a / cw;
      }
      rect = { x: rect.x + cw, y: rect.y, w: rect.w - cw, h: rect.h };
    } else {
      const rh = s / rect.w;
      let xx = rect.x;
      for (const a of r) {
        out.push({ x: xx, y: rect.y, w: a / rh, h: rh });
        xx += a / rh;
      }
      rect = { x: rect.x, y: rect.y + rh, w: rect.w, h: rect.h - rh };
    }
  };
  while (i < areas.length) {
    const side = Math.min(rect.w, rect.h);
    const next = areas[i] ?? 0;
    if (!row.length || worst([...row, next], side) <= worst(row, side)) {
      row.push(next);
      i++;
    } else {
      lay(row);
      row = [];
    }
  }
  if (row.length) lay(row);
  return out;
}

/**
 * The PR line on a large tile: at "merged" PRs with the merged count; at "none" just the PRs; at
 * "full" the merge rate.
 */
function prLine(o: OwnerStats, level: Level): string {
  const prs = plural(o.prs, "PR");
  if (level === "none") return prs;
  if (level !== "full") return `${prs} · ${o.prsMerged} merged`;
  return `${prs} · ${mergeRate(o, level)}% merged`;
}

type Item = { o: OwnerStats; v: number } | { rest: true; v: number; n: number };

export const design: Design = {
  id: "D02",
  slug: "mosaic",
  title: "Avatar mosaic",
  idea: "A treemap wall of avatars: each tile’s area is that owner’s share of all upstream contributions, with the count on every tile, a PR/issue breakdown on the big ones, and one tile pooling everyone with 5 or fewer.",
  render(stats, theme, options = DEFAULT_OPTIONS) {
    const level = options.outcomes;
    const ctx = makeCtx(stats, theme);
    const T = ctx.T;
    const line = extLine(stats);
    const top = stats.owners.filter((o) => o.total >= MIN_TILE);
    const N = top.length;
    const rest = stats.owners.filter((o) => o.total < MIN_TILE);
    const restTotal = rest.reduce((a, o) => a + o.total, 0);
    // Owners with zero contributions (commits only) have no area, so the pooled tile appears only when it has some.
    const items: Item[] = [
      ...top.map((o) => ({ o, v: o.total })),
      ...(restTotal > 0 ? [{ rest: true as const, v: restTotal, n: rest.length }] : []),
    ];
    const gx = 16;
    const gy = 66;
    const gw = W - 32;
    const gh = H - gy - 34;
    const cells = squarify(
      items.map((it) => it.v),
      gx,
      gy,
      gw,
      gh,
    );

    let b = header("Upstream mosaic", line);
    const G = 3;
    const badge = (bx: number, by: number, txt: string) => {
      const bw = tw(txt, 10.5, true) + 10;
      const x0 = bx - bw;
      return (
        `<rect x="${r1(x0)}" y="${r1(by)}" width="${r1(bw)}" height="17" rx="8.5" fill="${T.bg}" stroke="${T.border}"/>` +
        `<text x="${r1(x0 + bw / 2)}" y="${r1(by + 12.5)}" text-anchor="middle" font-size="10.5" class="mono b">${txt}</text>`
      );
    };
    items.forEach((it, i) => {
      const c = cells[i];
      if (!c) return;
      const x = c.x + G / 2;
      const y = c.y + G / 2;
      const w = c.w - G;
      const h = c.h - G;
      const delay = (Math.min(i, 20) * 0.03).toFixed(2);
      b += `<g class="fade" style="animation-delay:${delay}s"><rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}" rx="6" fill="${T.cell}" stroke="${T.faint}"/>`;
      if ("rest" in it) {
        // A crowd of small avatars for everyone below the tile threshold.
        b +=
          `<text x="${r1(x + 12)}" y="${r1(y + 22)}" font-size="13" class="b">${it.n} more</text>` +
          `<text x="${r1(x + 12)}" y="${r1(y + 38)}" font-size="11" class="mu">${esc(trunc(`≤ ${MIN_TILE - 1} each · ${it.v} total`, w - 24, 11))}</text>`;
        const a = 18;
        const pitch = 22;
        const cx0 = x + 12;
        const cy0 = y + 52;
        const cols = Math.max(1, Math.floor((w - 24 + (pitch - a)) / pitch));
        const rows = Math.max(0, Math.floor((y + h - 10 - cy0 + (pitch - a)) / pitch));
        const cap = cols * rows;
        const withAv = rest.filter((o) => stats.avatars[o.owner]);
        const list = withAv.slice(
          0,
          Math.max(0, withAv.length < rest.length || withAv.length > cap ? cap - 1 : cap),
        );
        list.forEach((o, k) => {
          const cxk = cx0 + (k % cols) * pitch + a / 2;
          const cyk = cy0 + Math.floor(k / cols) * pitch + a / 2;
          b += ctx.avatar(o.owner, cxk, cyk, a, "circle", false);
        });
        if (list.length < rest.length && cap > 0) {
          const k = list.length;
          const cxk = cx0 + (k % cols) * pitch + a / 2;
          const cyk = cy0 + Math.floor(k / cols) * pitch + a / 2;
          b += `<text x="${r1(cxk)}" y="${r1(cyk + 3.5)}" text-anchor="middle" font-size="9.5" class="mu">+${rest.length - list.length}</text>`;
        }
        b += "</g>";
        return;
      }
      const o = it.o;
      if (w >= 120 && h >= 120) {
        // Large: avatar and name, big number, breakdown lines.
        const a = Math.min(56, h * 0.3, w * 0.3);
        b += ctx.avatar(o.owner, x + 12 + a / 2, y + 12 + a / 2, a, "square");
        const nx = x + 12 + a + 10;
        const meta = `${o.type === "User" ? "Person" : "Org"} · ${plural(o.repos, "repo")}`;
        b +=
          `<text x="${r1(nx)}" y="${r1(y + 12 + a / 2 - 2)}" font-size="13" class="b">${esc(trunc(o.owner, x + w - nx - 8, 13))}</text>` +
          `<text x="${r1(nx)}" y="${r1(y + 12 + a / 2 + 14)}" font-size="11" class="mu">${esc(tw(meta, 11) <= x + w - nx - 8 ? meta : trunc(plural(o.repos, "repo"), x + w - nx - 8, 11))}</text>`;
        const lines: string[] = [];
        if (o.prs) lines.push(prLine(o, level));
        // At "full", PRs still open and closed without merging get a line when the tile has room.
        const later = level === "full" ? [o.prsOpen, prsClosed(o)] : [0, 0];
        if (o.issues) lines.push(plural(o.issues, "issue"));
        if (o.discussions) lines.push(plural(o.discussions, "discussion"));
        const big = Math.round(Math.max(24, Math.min(40, Math.min(w, h) * 0.2)));
        if ((later[0] || later[1]) && h - 12 - lines.length * 15 - 20 - big - (12 + a) >= 6) {
          const say = (closed: string) =>
            [later[0] ? `${later[0]} open` : "", later[1] ? `${later[1]} ${closed}` : ""]
              .filter(Boolean)
              .join(" · ");
          const long = say("closed unmerged");
          lines.splice(1, 0, tw(long, 11) <= w - 24 ? long : say("closed"));
        }
        let yy = y + h - 12 - (lines.length - 1) * 15;
        b += `<text x="${r1(x + 12)}" y="${r1(yy - 20)}" font-size="${big}" class="b">${o.total}</text>`;
        for (const l of lines) {
          b += `<text x="${r1(x + 12)}" y="${r1(yy)}" font-size="11" class="mu">${esc(trunc(l, w - 24, 11))}</text>`;
          yy += 15;
        }
      } else if (w >= 64 && h >= 58) {
        const a = Math.min(28, h * 0.42);
        b += ctx.avatar(o.owner, x + 8 + a / 2, y + 8 + a / 2, a, "square");
        b += badge(x + w - 6, y + 7, String(o.total));
        b += `<text x="${r1(x + 8)}" y="${r1(y + h - 9)}" font-size="11">${esc(trunc(o.owner, w - 16, 11))}</text>`;
      } else {
        const a = Math.max(14, Math.min(40, Math.min(w, h) - 18));
        b += ctx.avatar(o.owner, x + w / 2 - 4, y + h / 2 - 3, a, "square");
        b += badge(x + w - 3, y + h - 20, String(o.total));
      }
      b += "</g>";
    });
    b += `<text x="20" y="${H - 13}" font-size="11" class="mu">Tile area ∝ PRs + issues + discussions per org or person · ${N} with ${MIN_TILE} or more get their own tile</text>`;
    return doc(
      W,
      H,
      ctx,
      b,
      `Upstream mosaic: ${line}`,
      "@keyframes f{from{opacity:0}to{opacity:1}}.fade{animation:f .5s ease-out both}",
    );
  },
};
