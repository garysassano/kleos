import { esc } from "../../kit/svg.ts";
import type { Design } from "../types.ts";
import { MONTHS, dayLabel, doc, fmt, header, makeCtx, r1, trunc, tw } from "./_shared.ts";

const dow = (iso: string) => new Date(`${iso}T00:00:00Z`).getUTCDay();
const addDays = (iso: string, n: number) => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const design: Design = {
  id: "D06",
  slug: "calendar",
  title: "Year calendar + top upstream",
  idea: "The familiar 53-week activity calendar beside the five upstream repos with the most contributions in the months that window touches, so the year’s rhythm and where the upstream part went sit together.",
  render(stats, theme) {
    const ctx = makeCtx(stats, theme);
    const T = ctx.T;
    // 53 week columns, Sunday first, ending on the calendar's last day (the snapshot date).
    const today = stats.calendar.at(-1)?.[0] ?? stats.generatedAt.slice(0, 10);
    const startSunday = addDays(today, -dow(today) - 52 * 7);
    const counts = new Map(stats.calendar);
    const grid: { iso: string; c: number; dow: number }[] = [];
    for (let iso = startSunday; iso <= today; iso = addDays(iso, 1)) {
      grid.push({ iso, c: counts.get(iso) ?? 0, dow: dow(iso) });
    }
    const startIso = startSunday;
    const yearTotal = grid.reduce((a, g) => a + g.c, 0);
    const activeDays = grid.filter((g) => g.c > 0).length;
    const best = grid.reduce(
      (a, g) => (g.c > a.c ? g : a),
      grid[0] ?? { iso: startIso, c: 0, dow: 0 },
    );
    const nz = grid
      .filter((g) => g.c > 0)
      .map((g) => g.c)
      .sort((a, b) => a - b);
    const q = (p: number) => nz[Math.min(nz.length - 1, Math.floor(p * nz.length))] ?? 0;
    const th = [q(0.25), q(0.5), q(0.75)] as const;
    const lvl = (c: number) => (c <= 0 ? 0 : c <= th[0] ? 1 : c <= th[1] ? 2 : c <= th[2] ? 3 : 4);

    // Upstream activity in the same window. Stats only has monthly counts per repo, so this sums
    // every month from the window's first month on; it can include a few days before the window.
    const fromYM = startIso.slice(0, 7);
    const toYM = today.slice(0, 7);
    const win = stats.repos
      .map((r) => ({
        repo: r.repo,
        owner: r.owner,
        total: Object.entries(r.monthly).reduce(
          (a, [m, c]) => (m >= fromYM && m <= toYM ? a + c : a),
          0,
        ),
      }))
      .filter((r) => r.total > 0);
    const winTotal = win.reduce((a, r) => a + r.total, 0);
    const top5 = win.sort((a, b) => b.total - a.total || a.repo.localeCompare(b.repo)).slice(0, 5);

    const W = 840;
    const cell = 9;
    const p = 11;
    const gx = 46;
    const gy = 82;
    const weeks = 53;
    const H = gy + 7 * p + 46;

    let b = header(
      "The last 12 months",
      `Activity: ${fmt(yearTotal)} on ${activeDays} days since ${dayLabel(startIso)}, ${startIso.slice(0, 4)} (all repos, incl. private)`,
    );
    // Label a month at the first column whose Sunday falls in it, skipping a partial first month and the last column.
    let lastM = "";
    for (let w = 0; w < weeks; w++) {
      const first = addDays(startSunday, w * 7);
      const m = first.slice(5, 7);
      if (m !== lastM) {
        const dom = +first.slice(8, 10);
        if (w === 0 && dom > 7) {
          lastM = m;
          continue;
        }
        if (w <= weeks - 2)
          b += `<text x="${gx + w * p}" y="${gy - 8}" font-size="10" class="mu">${MONTHS[+m - 1]}</text>`;
        lastM = m;
      }
    }
    for (const [d, n] of [
      [1, "Mon"],
      [3, "Wed"],
      [5, "Fri"],
    ] as const)
      b += `<text x="${gx - 6}" y="${gy + d * p + 8}" text-anchor="end" font-size="9.5" class="mu">${n}</text>`;
    grid.forEach((g, i) => {
      b += `<rect x="${gx + Math.floor(i / 7) * p}" y="${gy + g.dow * p}" width="${cell}" height="${cell}" rx="2" fill="${T.green[lvl(g.c)]}"/>`;
    });
    const gRight = gx + weeks * p - 2;
    const ly = gy + 7 * p + 14;
    b += `<text x="${gx}" y="${ly + 8}" font-size="10.5" class="mu">${best.c > 0 ? `Busiest day: ${best.c} on ${dayLabel(best.iso)}` : "No activity in this window"}</text>`;
    const lx = gRight - 5 * p - tw("More", 10.5) - 4;
    b += `<text x="${lx - 4}" y="${ly + 8}" text-anchor="end" font-size="10.5" class="mu">Less</text>`;
    for (let l = 0; l < 5; l++)
      b += `<rect x="${lx + l * p}" y="${ly}" width="${cell}" height="${cell}" rx="2" fill="${T.green[l]}"/>`;
    b += `<text x="${lx + 5 * p + 2}" y="${ly + 8}" font-size="10.5" class="mu">More</text>`;

    const sx = gRight + 22;
    const sw = W - 18 - sx;
    b += `<line x1="${sx - 11}" y1="${gy - 18}" x2="${sx - 11}" y2="${gy + 7 * p}" stroke="${T.faint}"/>`;
    b += `<text x="${sx}" y="${gy - 8}" font-size="10.5" class="mu">Top upstream in this window</text>`;
    const maxT = top5[0]?.total || 1;
    top5.forEach((r, i) => {
      const y = gy + 2 + i * 15.6;
      const nm = r.repo.split("/")[1] ?? r.repo;
      const cnt = String(r.total);
      b += ctx.avatar(r.owner, sx + 6, y + 5, 12, "circle", false);
      b += `<text x="${sx + 17}" y="${y + 9}" font-size="11">${esc(trunc(nm, sw - 17 - tw(cnt, 11, true) - 10, 11))}</text>`;
      b += `<text x="${sx + sw}" y="${y + 9}" text-anchor="end" font-size="11" class="mono b">${cnt}</text>`;
      b += `<rect x="${sx + 17}" y="${y + 11.5}" width="${r1(Math.max(1, ((sw - 17) * r.total) / maxT))}" height="1.5" rx=".75" fill="${T.green[3]}" fill-opacity=".7"/>`;
    });
    if (!top5.length)
      b += `<text x="${sx}" y="${gy + 11}" font-size="11" class="mu">None in this window</text>`;
    b += `<text x="${sx}" y="${ly + 8}" font-size="10.5" class="mu">${winTotal} upstream on ${win.length} repos</text>`;
    return doc(W, H, ctx, b, `The last 12 months of activity: ${yearTotal}`);
  },
};
