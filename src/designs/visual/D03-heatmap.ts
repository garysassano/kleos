import type { Design } from "../types.ts";
import { doc, header, makeCtx, monLabel, monthRange, r1, repoLabel, tw } from "./_shared.ts";

const ROWS = 12;
const BINS: [number, number][] = [
  [1, 2],
  [3, 5],
  [6, 10],
  [11, 20],
  [21, Number.POSITIVE_INFINITY],
];
const lvl = (c: number) => (c <= 0 ? 0 : BINS.findIndex(([a, z]) => c >= a && c <= z) + 1);

export const design: Design = {
  id: "D03",
  slug: "heatmap",
  title: "Repo × month heatmap",
  idea: "The 12 upstream repos with the most contributions as rows and every month from January of the year the earliest of them started as columns, with a bar strip of all upstream contributions per month on top, so bursts and long-running work both show.",
  render(stats, theme) {
    const ctx = makeCtx(stats, theme);
    const T = ctx.T;
    const nRepos = stats.totals.externalRepos;
    const todayYM = stats.generatedAt.slice(0, 7);
    const top = stats.repos.filter((r) => r.total > 0 && r.first).slice(0, ROWS);
    const firstYM = top.map((r) => (r.first ?? "").slice(0, 7)).sort()[0] ?? todayYM;
    const startYM = `${firstYM.slice(0, 4)}-01`;
    const months = monthRange(startYM, todayYM);
    const allMonthly: Record<string, number> = {};
    let before = 0;
    for (const r of stats.repos) {
      for (const [m, c] of Object.entries(r.monthly)) {
        if (m < startYM) before += c;
        else allMonthly[m] = (allMonthly[m] || 0) + c;
      }
    }
    const W = 840;
    const x0 = 222;
    const pitch = Math.floor((786 - x0) / months.length);
    const cw = pitch - 2;
    const barTop = 74;
    const barH = 34;
    const gy0 = barTop + barH + 26;
    const rowP = 20;
    const ch = 15;
    const H = gy0 + top.length * rowP + 56;
    const maxAll = Math.max(0, ...months.map((m) => allMonthly[m] || 0));
    const maxM = months.find((m) => (allMonthly[m] || 0) === maxAll) ?? startYM;

    let b = header(
      "Upstream, month by month",
      `Top ${top.length} of ${nRepos} repos by PRs + issues + discussions · ${monLabel(startYM)} – ${monLabel(todayYM)}`,
    );
    months.forEach((m, i) => {
      if (m.endsWith("-01")) {
        const x = x0 + i * pitch - 1;
        if (i > 0)
          b += `<line x1="${x}" y1="${barTop - 4}" x2="${x}" y2="${gy0 + top.length * rowP}" stroke="${T.faint}"/>`;
        b += `<text x="${x + 3}" y="${gy0 - 8}" font-size="10.5" class="mu">${m.slice(0, 4)}</text>`;
      }
    });
    b += `<text x="${x0 - 12}" y="${barTop + barH - 14}" text-anchor="end" font-size="11" class="mu">All ${nRepos} repos</text>`;
    b += `<text x="${x0 - 12}" y="${barTop + barH - 1}" text-anchor="end" font-size="10" class="mu">per month</text>`;
    months.forEach((m, i) => {
      const v = allMonthly[m] || 0;
      if (!v) return;
      const h = Math.max(1.5, (v / maxAll) * barH);
      b += `<rect x="${x0 + i * pitch}" y="${r1(barTop + barH - h)}" width="${cw}" height="${r1(h)}" rx="1" fill="${T.blue[3]}"/>`;
    });
    if (maxAll > 0) {
      const mi = months.indexOf(maxM);
      const lab = `${maxAll} in ${monLabel(maxM)}`;
      const lx = x0 + mi * pitch + cw + 4;
      // Beside the peak bar, or before it when the peak is too close to the right edge.
      b +=
        lx + tw(lab, 10) <= W - 16
          ? `<text x="${lx}" y="${barTop + 8}" font-size="10" class="mu">${lab}</text>`
          : `<text x="${x0 + mi * pitch - 4}" y="${barTop + 8}" text-anchor="end" font-size="10" class="mu">${lab}</text>`;
    }
    b += `<line x1="${x0}" y1="${barTop + barH + 0.5}" x2="${x0 + months.length * pitch - 2}" y2="${barTop + barH + 0.5}" stroke="${T.border}"/>`;
    b += `<text x="${W - 16}" y="${gy0 - 8}" text-anchor="end" font-size="10.5" class="mu">total</text>`;
    top.forEach((r, ri) => {
      const y = gy0 + ri * rowP;
      const size = 11.5;
      const maxW = x0 - 12 - 22 - 16;
      b += ctx.avatar(r.owner, 16 + 8, y + ch / 2, 16, "circle", false);
      b += `<text x="${16 + 22}" y="${y + 11.5}" font-size="${size}">${repoLabel(r.repo, maxW, size)}</text>`;
      for (const [i, m] of months.entries()) {
        const c = r.monthly[m] || 0;
        b += `<rect x="${x0 + i * pitch}" y="${y}" width="${cw}" height="${ch}" rx="2" fill="${T.blue[lvl(c)]}"/>`;
      }
      b += `<text x="${W - 16}" y="${y + 11.5}" text-anchor="end" font-size="11.5" class="mono b">${r.total}</text>`;
    });
    const ly = gy0 + top.length * rowP + 22;
    let lx = x0;
    b += `<text x="${x0 - 12}" y="${ly + 10}" text-anchor="end" font-size="11" class="mu">per repo per month</text>`;
    const legend: [string, number][] = [
      ["0", 0],
      ...BINS.map(([a, z], i): [string, number] => [
        z === Number.POSITIVE_INFINITY ? `${a}+` : a === z ? `${a}` : `${a}–${z}`,
        i + 1,
      ]),
    ];
    for (const [t, l] of legend) {
      b +=
        `<rect x="${lx}" y="${ly}" width="${cw}" height="${ch - 2}" rx="2" fill="${T.blue[l]}"/>` +
        `<text x="${lx + cw + 5}" y="${ly + 10}" font-size="10.5" class="mu">${t}</text>`;
      lx += cw + 12 + tw(t, 10.5) + 4;
    }
    if (before)
      b += `<text x="${W - 16}" y="${ly + 10}" text-anchor="end" font-size="10.5" class="mu">+${before} before ${startYM.slice(0, 4)} not shown</text>`;
    return doc(W, H, ctx, b, `Upstream month by month, top ${top.length} repos`);
  },
};
