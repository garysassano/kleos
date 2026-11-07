import {
  MONO,
  PALETTES,
  SANS,
  compact,
  esc,
  truncate as fitText,
  document as svgDocument,
} from "../../kit/svg.ts";
import type { RepoStats } from "../../stats/types.ts";
import type { Design } from "../types.ts";
import {
  addMonths,
  allEcosystems,
  dayLabel,
  frame,
  longMonth,
  monthIndex,
  monthLabel,
  monthlyTotals,
  num,
  plural,
  t,
} from "./_shared.ts";

const W = 840;
const PAD = 24;
const COUNT_STEPS = [100, 500, 1000, 2500, 5000, 10000];
const REPO_STEPS = [10, 50, 100, 200, 500, 1000];
const STAR_STEPS = [10000, 1000];
const MAX_EVENTS = 12;
/** Relative width of a month without contributions on the time axis. */
const EMPTY_WEIGHT = 0.2;

interface Milestone {
  /** "YYYY-MM-DD", or "YYYY-MM" when only the month is known. */
  date: string;
  title: string;
  detail: string;
  /** Other milestones that fell on the same repo and day. */
  also: string[];
  repo?: string;
  /** Lower is kept first when there are too many. */
  rank: number;
}

const sortKey = (d: string) => (d.length === 7 ? `${d}-32` : d);
const dateText = (d: string) =>
  d.length === 7 ? monthLabel(d) : `${Number(d.slice(8, 10))} ${monthLabel(d.slice(0, 7))}`;

function milestones(stats: Parameters<Design["render"]>[0]): Milestone[] {
  const out: Omit<Milestone, "also">[] = [];
  const dated = stats.repos
    .filter((r): r is RepoStats & { first: string } => r.first !== null && r.total > 0)
    .sort((a, b) => a.first.localeCompare(b.first) || a.repo.localeCompare(b.repo));
  const first = dated[0];
  if (first) {
    out.push({
      date: first.first.slice(0, 10),
      title: "First upstream contribution",
      detail: first.repo,
      repo: first.repo,
      rank: 0,
    });
  }

  // Contribution counts, by month
  const monthly = [...monthlyTotals(stats)].filter(([, v]) => v > 0).sort();
  let cum = 0;
  let step = 0;
  for (const [m, v] of monthly) {
    cum += v;
    while (step < COUNT_STEPS.length && cum >= (COUNT_STEPS[step] ?? Infinity)) {
      out.push({
        date: m,
        title: `${num(COUNT_STEPS[step] ?? 0)}th contribution`,
        detail: `${num(cum)} by the end of ${longMonth(m)}`,
        rank: 2,
      });
      step++;
    }
  }

  // Number of repos, by first contribution
  for (const n of REPO_STEPS) {
    const r = dated[n - 1];
    if (!r) break;
    out.push({
      date: r.first.slice(0, 10),
      title: `${num(n)}th repo`,
      detail: r.repo,
      repo: r.repo,
      rank: 4,
    });
  }

  // First repo above each star tier (current star counts)
  const seen = new Set<string>();
  for (const s of STAR_STEPS) {
    const r = dated.find((x) => x.stars >= s);
    if (!r || seen.has(r.repo)) continue;
    seen.add(r.repo);
    out.push({
      date: r.first.slice(0, 10),
      title: `First ${compact(s)}+★ repo`,
      detail: `${r.repo} · ${compact(r.stars)}★`,
      repo: r.repo,
      rank: 1,
    });
  }

  // First contribution to the biggest ecosystem
  const fam = allEcosystems(stats)[0];
  if (fam) {
    const r = dated.find((x) => fam.owners.includes(x.owner));
    if (r) {
      out.push({
        date: r.first.slice(0, 10),
        title: `First ${fam.name} contribution`,
        detail: `${r.repo} · ${fam.name} now ${num(fam.total)}`,
        repo: r.repo,
        rank: 1,
      });
    }
  }

  // Where the top repo began
  const top = stats.repos[0];
  if (top?.first && top.total > 0) {
    out.push({
      date: top.first.slice(0, 10),
      title: "Started on the top repo",
      detail: `${top.repo} · ${num(top.total)} since`,
      repo: top.repo,
      rank: 1,
    });
  }

  // Busiest month
  const busiest = [...monthly].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
  if (busiest) {
    out.push({
      date: busiest[0],
      title: "Busiest month",
      detail: plural(busiest[1], "contribution"),
      rank: 2,
    });
  }

  // Same repo on the same day: one milestone with both titles.
  const merged: Milestone[] = [];
  for (const m of out) {
    const twin = m.repo && merged.find((x) => x.repo === m.repo && x.date === m.date);
    if (twin) {
      twin.also.push(`${m.title.charAt(0).toLowerCase()}${m.title.slice(1)}`);
      twin.rank = Math.min(twin.rank, m.rank);
    } else merged.push({ ...m, also: [] });
  }
  return merged
    .map((m, i) => ({ m, i }))
    .sort((a, b) => a.m.rank - b.m.rank || a.i - b.i)
    .slice(0, MAX_EVENTS)
    .map((x) => x.m)
    .sort((a, b) => sortKey(a.date).localeCompare(sortKey(b.date)));
}

export const design: Design = {
  id: "H05",
  slug: "milestones",
  title: "Milestones",
  idea: "A timeline of firsts and round numbers derived from the data: the first upstream contribution, the 100th and 500th, the 10th and 100th repo, the first repo with 1k+ and with 10k+ stars, the first contribution to the biggest ecosystem, the busiest month, on a cumulative curve. Rule: at most 12 milestones, firsts kept before round numbers; month-only dates come from monthly counts; months without contributions are drawn at a fifth of the width on the axis.",
  render(stats, theme) {
    const p = PALETTES[theme];
    const events = milestones(stats);
    const monthly = monthlyTotals(stats);
    const months = [...monthly]
      .filter(([, v]) => v > 0)
      .map(([k]) => k)
      .sort();
    const end = stats.generatedAt.slice(0, 7);
    let body = "";

    body += t(PAD, 38, "Milestones", 16, p.text, 'font-weight="600"');
    const total = [...monthly.values()].reduce((a, b) => a + b, 0);
    body += t(
      PAD,
      58,
      `${plural(total, "contribution")} to upstream repos, as of ${dayLabel(stats.generatedAt)}`,
      12,
      p.muted,
    );

    const start = months[0];
    if (!start || !events.length) {
      const h = 96;
      body += t(PAD, 80, "No milestones yet.", 12, p.faint);
      return svgDocument({ width: W, height: h, title: "Milestones", body: frame(W, h, p) + body });
    }

    // Time axis: months without contributions are drawn at a fifth of the width of active ones.
    const cx0 = PAD + 4;
    const cw = W - 2 * PAD - 8;
    const count = monthIndex(end) - monthIndex(start) + 1;
    const all = Array.from({ length: count }, (_, i) => addMonths(start, i));
    const weight = all.map((m) => ((monthly.get(m) ?? 0) > 0 ? 1 : EMPTY_WEIGHT));
    const unit = cw / weight.reduce((a, b) => a + b, 0);
    const xs: number[] = [];
    const lefts: number[] = [];
    let x = cx0;
    all.forEach((_, i) => {
      const w = (weight[i] ?? 1) * unit;
      lefts.push(x);
      xs.push(x + w / 2);
      x += w;
    });
    const ctop = 96;
    const ch = 112;
    const base = ctop + ch;
    let cum = 0;
    const cums = all.map((m) => {
      cum += monthly.get(m) ?? 0;
      return cum;
    });
    const yOf = (v: number) => base - (v / Math.max(1, cum)) * ch;
    // Area and line
    const pts = all.map((_, i) => `${(xs[i] ?? 0).toFixed(1)},${yOf(cums[i] ?? 0).toFixed(1)}`);
    const line = [`${cx0},${base}`, ...pts, `${cx0 + cw},${yOf(cum).toFixed(1)}`].join(" ");
    body += `<polygon points="${line} ${cx0 + cw},${base}" fill="${p.accent}" opacity="0.12"/>`;
    body += `<polyline points="${line}" fill="none" stroke="${p.accent}" stroke-width="2" stroke-linejoin="round"/>`;
    body += `<line x1="${cx0}" y1="${base + 0.5}" x2="${cx0 + cw}" y2="${base + 0.5}" stroke="${p.border}"/>`;
    body += t(cx0 + cw, ctop - 8, `${num(cum)} total`, 11, p.muted, 'text-anchor="end"');
    // Year ticks at the start of each January
    let lastLabel = -Infinity;
    all.forEach((m, i) => {
      if (!m.endsWith("-01") && i !== 0) return;
      const tx = lefts[i] ?? cx0;
      if (tx - lastLabel < 30) return;
      lastLabel = tx;
      body += `<line x1="${tx.toFixed(1)}" y1="${base}" x2="${tx.toFixed(1)}" y2="${base + 4}" stroke="${p.border}"/>`;
      body += t(tx + 3, base + 16, m.slice(0, 4), 10, p.faint);
    });

    // Markers, stacked upwards when they would overlap
    const placed: { x: number; y: number }[] = [];
    events.forEach((e, n) => {
      const i = monthIndex(e.date.slice(0, 7)) - monthIndex(start);
      const mx = xs[Math.max(0, Math.min(count - 1, i))] ?? cx0;
      let my = yOf(cums[Math.max(0, Math.min(count - 1, i))] ?? 0) - 12;
      while (placed.some((q) => Math.abs(q.x - mx) < 18 && Math.abs(q.y - my) < 18)) my -= 18;
      placed.push({ x: mx, y: my });
      body += `<circle cx="${mx.toFixed(1)}" cy="${my.toFixed(1)}" r="8.5" fill="${p.bg}" stroke="${p.accent}" stroke-width="1.5"/>`;
      body += `<text x="${mx.toFixed(1)}" y="${(my + 3.5).toFixed(1)}" text-anchor="middle" font-family="${SANS}" font-size="10" font-weight="600" fill="${p.text}">${n + 1}</text>`;
    });

    // List in two columns; a milestone shared with others gets a third line
    const ly = base + 44;
    const colW = (W - 2 * PAD - 24) / 2;
    const rows = Math.ceil(events.length / 2);
    const heightOf = (e: Milestone) => (e.also.length ? 54 : 40);
    const colBottom = [ly, ly];
    events.forEach((e, n) => {
      const col = n < rows ? 0 : 1;
      const x0 = PAD + col * (colW + 24);
      const y0 = colBottom[col] ?? ly;
      colBottom[col] = y0 + heightOf(e);
      body += `<circle cx="${x0 + 9}" cy="${y0 + 5}" r="8.5" fill="none" stroke="${p.accent}" stroke-width="1.5"/>`;
      body += `<text x="${x0 + 9}" y="${y0 + 8.5}" text-anchor="middle" font-family="${SANS}" font-size="10" font-weight="600" fill="${p.text}">${n + 1}</text>`;
      const date = dateText(e.date);
      body += `<text x="${x0 + 28}" y="${y0 + 9}" font-family="${MONO}" font-size="11" fill="${p.faint}">${esc(date)}</text>`;
      const tx = x0 + 28 + 92;
      body += t(tx, y0 + 9, fitText(e.title, x0 + colW - tx, 13), 13, p.text, 'font-weight="600"');
      body += t(tx, y0 + 26, fitText(e.detail, x0 + colW - tx, 11), 11, p.muted);
      if (e.also.length) {
        body += t(
          tx,
          y0 + 41,
          fitText(`also ${e.also.join(", ")}`, x0 + colW - tx, 11),
          11,
          p.muted,
        );
      }
    });

    const fy = Math.max(...colBottom) + 18;
    body += `<line x1="${PAD}" y1="${fy - 18.5}" x2="${W - PAD}" y2="${fy - 18.5}" stroke="${p.hair}"/>`;
    body += t(PAD, fy, "Months without contributions are drawn narrower", 11, p.faint);
    const h = fy + 16;
    return svgDocument({ width: W, height: h, title: "Milestones", body: frame(W, h, p) + body });
  },
};
