import { esc } from "../../kit/svg.ts";
import type { OwnerStats } from "../../stats/types.ts";
import type { Design } from "../types.ts";
import { doc, extLine, header, makeCtx, r1, trunc, tw } from "./_shared.ts";

const W = 840;
const H = 676;
const cx = 420;
const cy = 358;
/** Rings from the centre out. Owners below the outer ring's minimum are counted in the footer. */
const TIERS = [
  { min: 40, max: Number.POSITIVE_INFINITY, rx: 120, ry: 76, label: "40+" },
  { min: 16, max: 39, rx: 208, ry: 132, label: "16–39" },
  { min: 9, max: 15, rx: 294, ry: 188, label: "9–15" },
  { min: 6, max: 8, rx: 372, ry: 244, label: "6–8" },
];
const MIN_SHOWN = 6;

interface Node {
  o: OwnerStats;
  a: number;
  t: number;
  head?: string;
  x: number;
  y: number;
  r: number;
}

const angDist = (a: number, b: number) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));

export const design: Design = {
  id: "D01",
  slug: "orbit",
  title: "Orbit",
  idea: "You at the center, every owner (org or person) you contributed to on a ring by how much (40+, 16–39, 9–15, 6–8), avatar size by total; dotted lines join owners of one ecosystem from the ecosystem list.",
  render(stats, theme) {
    const ctx = makeCtx(stats, theme);
    const T = ctx.T;
    const line = extLine(stats);
    const ecosystemOf = new Map<string, string>();
    for (const f of stats.ecosystems) for (const o of f.owners) ecosystemOf.set(o, f.name);

    const shown = stats.owners.filter((o) => o.total >= MIN_SHOWN);
    const hidden = stats.owners.filter((o) => o.total < MIN_SHOWN);
    const pos = new Map<string, Node>();
    const rad = (t: number) => Math.max(10, 1.8 * Math.sqrt(t));
    TIERS.forEach((t, ti) => {
      const list = shown.filter((o) => o.total >= t.min && o.total <= t.max);
      const n = list.length + 1; // slot 0 (top) is reserved for the ring label
      const free: { a: number; used: boolean }[] = [];
      for (let i = 1; i < n; i++)
        free.push({ a: -Math.PI / 2 + (i * 2 * Math.PI) / n, used: false });
      // Owners whose ecosystem head (the ecosystem's biggest shown owner) sits on an inner ring take the free slot nearest to it.
      const pref: { o: OwnerStats; a: number; head: string }[] = [];
      const rest: OwnerStats[] = [];
      for (const o of list) {
        const fam = ecosystemOf.get(o.owner);
        const head = fam
          ? shown
              .filter((x) => ecosystemOf.get(x.owner) === fam)
              .sort((a, b) => b.total - a.total)[0]
          : undefined;
        const hp = head ? pos.get(head.owner) : undefined;
        if (head && hp && head.owner !== o.owner) pref.push({ o, a: hp.a, head: head.owner });
        else rest.push(o);
      }
      const place = (o: OwnerStats, a: number, head?: string) => {
        const x = cx + t.rx * Math.cos(a);
        const y = cy + t.ry * Math.sin(a);
        pos.set(o.owner, { o, a, t: ti, head, x, y, r: rad(o.total) });
      };
      for (const p of pref) {
        const s = free
          .filter((f) => !f.used)
          .sort((x, y) => angDist(x.a, p.a) - angDist(y.a, p.a))[0];
        if (!s) continue;
        s.used = true;
        place(p.o, s.a, p.head);
      }
      for (const o of rest) {
        const s = free.find((f) => !f.used);
        if (!s) continue;
        s.used = true;
        place(o, s.a);
      }
    });

    let b = header("Upstream orbit", line);
    for (const t of TIERS) {
      b += `<ellipse cx="${cx}" cy="${cy}" rx="${t.rx}" ry="${t.ry}" fill="none" stroke="${T.faint}" stroke-width="1"/>`;
    }
    for (const t of TIERS) {
      const w = tw(t.label, 10) + 10;
      b +=
        `<rect x="${r1(cx - w / 2)}" y="${cy - t.ry - 8}" width="${r1(w)}" height="16" rx="8" fill="${T.bg}" stroke="${T.faint}"/>` +
        `<text x="${cx}" y="${cy - t.ry + 3.5}" text-anchor="middle" font-size="10" class="mu">${t.label}</text>`;
    }
    const linked = new Set<string>();
    for (const p of pos.values()) {
      const h = p.head ? pos.get(p.head) : undefined;
      if (!h) continue;
      linked.add(ecosystemOf.get(p.o.owner) ?? "");
      b += `<line x1="${r1(h.x)}" y1="${r1(h.y)}" x2="${r1(p.x)}" y2="${r1(p.y)}" stroke="${T.muted}" stroke-opacity="0.55" stroke-width="1" stroke-dasharray="1.5 3"/>`;
    }
    b += `<g class="fade" style="animation-delay:0s">${ctx.avatar(stats.user, cx, cy, 64)}</g>`;
    for (const p of pos.values()) {
      const name = trunc(p.o.owner, 112, 11);
      const cnt = String(p.o.total);
      const wName = tw(name, 11);
      const wCnt = tw(cnt, 11, true);
      const tx = p.x - (wName + 5 + wCnt) / 2;
      const ty = p.y + p.r + 13;
      b +=
        `<g class="fade" style="animation-delay:${(0.12 + p.t * 0.12).toFixed(2)}s">` +
        ctx.avatar(p.o.owner, p.x, p.y, p.r * 2) +
        `<text x="${r1(tx)}" y="${r1(ty)}" font-size="11">${esc(name)}<tspan dx="5" class="mono mu" font-size="11">${cnt}</tspan></text></g>`;
    }

    if (linked.size)
      b += `<text x="20" y="${H - 16}" font-size="11" class="mu">Dotted lines join an ecosystem's orgs</text>`;
    if (hidden.length)
      b += `<text x="${W - 20}" y="${H - 16}" text-anchor="end" font-size="11" class="mu">+${hidden.length} owners with ≤ ${MIN_SHOWN - 1} each</text>`;
    return doc(
      W,
      H,
      ctx,
      b,
      `Upstream orbit: ${line}`,
      "@keyframes f{from{opacity:0}to{opacity:1}}.fade{animation:f .6s ease-out both}",
    );
  },
};
