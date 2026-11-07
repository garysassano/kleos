import type { RepoStats } from "../../stats/types.ts";
import type { Design } from "../types.ts";
import { doc, header, makeCtx, monthRange, r1, repoLabel } from "./_shared.ts";

const LANES = 14;
/** A repo counts as active when its last contribution is this recent. */
const ACTIVE_DAYS = 45;

type Dated = RepoStats & { first: string; last: string };

export const design: Design = {
  id: "D04",
  slug: "swimlanes",
  title: "Swimlanes",
  idea: "One lane per top upstream repo in the order I started on it: a line from first to last contribution and a dot per month sized by that month’s count, so the hand-offs between repos read like a timeline.",
  render(stats, theme) {
    const ctx = makeCtx(stats, theme);
    const T = ctx.T;
    const today = stats.generatedAt.slice(0, 10);
    const sel = stats.repos
      .filter((r): r is Dated => r.total > 0 && r.first !== null && r.last !== null)
      .slice(0, LANES)
      .sort((a, b) => a.first.localeCompare(b.first));
    const endY = +today.slice(0, 4);
    const startY = sel[0] ? +sel[0].first.slice(0, 4) : endY;
    const t0 = Date.UTC(startY, 0, 1);
    const t1 = Date.UTC(endY + 1, 0, 1);
    const W = 840;
    const ax0 = 236;
    const ax1 = 704;
    const laneTop = 86;
    const laneP = 26;
    const H = laneTop + sel.length * laneP + 62;
    const X = (ms: number) => ax0 + ((ms - t0) / (t1 - t0)) * (ax1 - ax0);
    const Xd = (iso: string) => X(Date.parse(iso));
    const Xm = (ym: string) => X(Date.UTC(+ym.slice(0, 4), +ym.slice(5, 7) - 1, 15));
    const maxC = Math.max(1, ...sel.flatMap((r) => Object.values(r.monthly)));
    const rr = (c: number) => 1.6 + 5.4 * Math.sqrt(c / maxC);
    const todayMs = Date.parse(stats.generatedAt);
    const spanMo = (r: Dated) => monthRange(r.first.slice(0, 7), r.last.slice(0, 7)).length;

    let b = header(
      "When I worked where",
      `Top ${sel.length} upstream repos by total, ordered by first contribution · dot area ∝ PRs + issues + discussions that month`,
    );
    for (let y = startY; y <= endY + 1; y++) {
      const x = r1(X(Date.UTC(y, 0, 1)));
      b += `<line x1="${x}" y1="${laneTop - 10}" x2="${x}" y2="${laneTop + sel.length * laneP}" stroke="${T.faint}"/>`;
      if (y <= endY)
        b += `<text x="${r1(X(Date.UTC(y, 6, 1)))}" y="${laneTop + sel.length * laneP + 18}" text-anchor="middle" font-size="11" class="mu">${y}</text>`;
    }
    const xt = r1(X(todayMs));
    b +=
      `<line x1="${xt}" y1="${laneTop - 10}" x2="${xt}" y2="${laneTop + sel.length * laneP}" stroke="${T.active}" stroke-dasharray="3 3"/>` +
      `<text x="${xt}" y="${laneTop - 16}" text-anchor="middle" font-size="10" class="mu">today</text>`;
    b +=
      `<text x="${762}" y="${laneTop - 16}" text-anchor="end" font-size="10.5" class="mu">total</text>` +
      `<text x="${W - 16}" y="${laneTop - 16}" text-anchor="end" font-size="10.5" class="mu">span</text>`;
    sel.forEach((r, i) => {
      const y = laneTop + i * laneP + laneP / 2;
      if (i % 2 === 0)
        b += `<rect x="12" y="${y - laneP / 2}" width="${W - 24}" height="${laneP}" rx="4" fill="${T.cell}"/>`;
      const size = 11.5;
      const maxW = ax0 - 44 - 12;
      b += ctx.avatar(r.owner, 28, y, 16, "circle", false);
      b += `<text x="42" y="${y + 4}" font-size="${size}">${repoLabel(r.repo, maxW, size)}</text>`;
      const xa = Xd(r.first);
      const xz = Xd(r.last);
      b += `<line x1="${r1(xa)}" y1="${y}" x2="${r1(Math.max(xz, xa + 1))}" y2="${y}" stroke="${T.muted}" stroke-opacity=".6" stroke-width="1.5" stroke-linecap="round"/>`;
      for (const [m, c] of Object.entries(r.monthly).sort()) {
        b += `<circle class="pop" style="animation-delay:${(0.05 * i).toFixed(2)}s" cx="${r1(Xm(m))}" cy="${y}" r="${r1(rr(c))}" fill="${T.dot}" fill-opacity=".85" stroke="${T.bg}" stroke-width=".75"/>`;
      }
      const active = todayMs - Date.parse(r.last) < ACTIVE_DAYS * 864e5;
      if (active)
        b += `<circle cx="${r1(xz + rr(r.monthly[r.last.slice(0, 7)] || 1) + 6)}" cy="${y}" r="2.5" fill="${T.active}"/>`;
      b +=
        `<text x="762" y="${y + 4}" text-anchor="end" font-size="11.5" class="mono b">${r.total}</text>` +
        `<text x="${W - 16}" y="${y + 4}" text-anchor="end" font-size="11" class="mu">${spanMo(r)} mo</text>`;
    });
    const ly = H - 16;
    b += `<text x="20" y="${ly}" font-size="11" class="mu">Line: first → last contribution · largest dot = ${maxC} in one month</text>`;
    b += `<circle cx="${W - 196}" cy="${ly - 4}" r="2.5" fill="${T.active}"/><text x="${W - 188}" y="${ly}" font-size="11" class="mu">active in the last ${ACTIVE_DAYS} days</text>`;
    return doc(
      W,
      H,
      ctx,
      b,
      "When I worked where: top upstream repos on a timeline",
      "@keyframes p{from{opacity:0}to{opacity:1}}.pop{animation:p .5s ease-out both}",
    );
  },
};
