import { esc } from "../../kit/svg.ts";
import type { Design } from "../types.ts";
import { doc, extLine, header, makeCtx, r1, shade, trunc, tw } from "./_shared.ts";

const BUILDINGS = 15;

/** Smallest 1/2/2.5/5 × 10ⁿ step that puts at most five scale lines under `max`. */
function scaleStep(max: number): number {
  for (let p = 1; ; p *= 10) {
    for (const m of [1, 2, 2.5, 5]) {
      const step = m * p;
      if (Number.isInteger(step) && Math.floor(max / step) <= 5) return step;
    }
  }
}

export const design: Design = {
  id: "D05",
  slug: "skyline",
  title: "Skyline",
  idea: "Each building is one of the top 15 orgs or users, its height is the number of contributions and its floors split them into merged PRs, other PRs, issues and discussions, on a real scale with round-number gridlines.",
  render(stats, theme) {
    const ctx = makeCtx(stats, theme);
    const T = ctx.T;
    const sel = stats.owners.slice(0, BUILDINGS);
    const W = 840;
    const H = 520;
    const ground = 392;
    const maxH = 260;
    const bx0 = 104;
    const pitch = 48;
    const bw = 30;
    const dx = 10;
    const dy = 6;
    const maxT = Math.max(1, ...sel.map((o) => o.total));
    const k = maxH / maxT;
    const kinds = [
      ["prsMerged", "merged PRs", T.merged],
      ["prOther", "other PRs", T.prOther],
      ["issues", "issues", T.issue],
      ["discussions", "discussions", T.disc],
    ] as const;

    let b = header(
      "Upstream skyline",
      `Top ${sel.length} of ${stats.totals.externalOwners} orgs and users · building height = PRs + issues + discussions`,
    );
    let lx = W - 20;
    const leg: string[] = [];
    for (const [, name, col] of [...kinds].reverse()) {
      const w = tw(name, 11) + 18;
      lx -= w;
      leg.push(
        `<rect x="${r1(lx)}" y="${42}" width="10" height="10" rx="2" fill="${col}"/><text x="${r1(lx + 14)}" y="${51}" font-size="11" class="mu">${name}</text>`,
      );
      lx -= 6;
    }
    b += leg.join("");
    const step = scaleStep(maxT);
    for (let v = step; v <= maxT; v += step) {
      const y = r1(ground - v * k);
      b +=
        `<line x1="${bx0 - 8}" y1="${y}" x2="${W - 20}" y2="${y}" stroke="${T.faint}" stroke-dasharray="2 4"/>` +
        `<text x="${bx0 - 14}" y="${y + 4}" text-anchor="end" font-size="10.5" class="mu mono">${v}</text>`;
    }
    b += `<line x1="${bx0 - 8}" y1="${ground + 0.5}" x2="${W - 20}" y2="${ground + 0.5}" stroke="${T.border}"/>`;
    // Fewer buildings than slots: centre the row over the ground line.
    const x0 = bx0 + ((BUILDINGS - sel.length) * pitch) / 2;
    sel.forEach((o, i) => {
      const x = x0 + i * pitch;
      const vals = {
        prsMerged: o.prsMerged,
        prOther: o.prs - o.prsMerged,
        issues: o.issues,
        discussions: o.discussions,
      };
      let y = ground;
      let g = "";
      let topCol = T.faint;
      for (const [key, , col] of kinds) {
        const v = vals[key];
        if (!v) continue;
        const h = v * k;
        y -= h;
        g += `<rect x="${x}" y="${r1(y)}" width="${bw}" height="${r1(h)}" fill="${col}"/>`;
        g += `<path d="M${x + bw} ${r1(y)}l${dx} ${-dy}v${r1(h)}l${-dx} ${dy}z" fill="${shade(col, 0.62)}"/>`;
        topCol = col;
      }
      const yTop = y;
      g += `<path d="M${x} ${r1(yTop)}l${dx} ${-dy}h${bw}l${-dx} ${dy}z" fill="${shade(topCol, 1.35)}"/>`;
      b += `<g class="grow" style="animation-delay:${(i * 0.04).toFixed(2)}s">${g}</g>`;
      b += `<text class="fade mono b" style="animation-delay:${(0.3 + i * 0.04).toFixed(2)}s" x="${x + bw / 2 + dx / 2}" y="${r1(yTop - dy - 6)}" text-anchor="middle" font-size="12">${o.total}</text>`;
      const ax = x + bw / 2;
      b += ctx.avatar(o.owner, ax, ground + 17, 20);
      const name = trunc(o.owner, 112, 11);
      b += `<text transform="translate(${ax + 5} ${ground + 38}) rotate(-35)" text-anchor="end" font-size="11">${esc(name)}</text>`;
    });
    b += `<text x="${W - 20}" y="${H - 14}" text-anchor="end" font-size="11" class="mu">${extLine(stats)}</text>`;
    return doc(
      W,
      H,
      ctx,
      b,
      `Upstream skyline: top ${sel.length} orgs and users by contributions`,
      `@keyframes g{from{transform:scaleY(0)}to{transform:scaleY(1)}}@keyframes f{from{opacity:0}to{opacity:1}}
.grow{transform-box:fill-box;transform-origin:50% 100%;animation:g .7s cubic-bezier(.2,.7,.2,1) both}.fade{animation:f .4s ease-out both}`,
    );
  },
};
