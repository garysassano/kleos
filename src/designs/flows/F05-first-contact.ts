import { esc, truncate as fitText } from "../../kit/svg.ts";
import type { Stats } from "../../stats/types.ts";
import type { Design, ThemeName } from "../types.ts";
import { PAL, activeRepos, av, card, fmt, plural, r1 } from "./_shared.ts";

const W = 840;
const PAD = 20;
const MAX_COLUMNS = 6;
const LIST = 7;
const BAR_MAX = 64;
const SHARE = 0.05;

interface Owner {
  login: string;
  org: boolean;
  first: string;
  total: number;
}

interface Column {
  label: string;
  owners: Owner[];
}

function render(stats: Stats, theme: ThemeName): string {
  const p = PAL(theme);
  const byOwner = new Map<string, Owner>();
  for (const r of activeRepos(stats)) {
    const o = byOwner.get(r.owner) ?? {
      login: r.owner,
      org: r.ownerType === "Organization",
      first: "",
      total: 0,
    };
    o.total += r.total;
    if (r.first && (!o.first || r.first < o.first)) o.first = r.first;
    byOwner.set(r.owner, o);
  }
  const owners = [...byOwner.values()].filter((o) => o.first);
  const n = owners.length;

  // One column per year from the first contact to the snapshot year; leading years that each
  // brought fewer than SHARE of all owners are merged, and so are the oldest beyond MAX_COLUMNS.
  const yearOf = (o: Owner) => Number(o.first.slice(0, 4));
  const firstYear = Math.min(...owners.map(yearOf));
  const lastYear = Math.max(Number(stats.generatedAt.slice(0, 4)), ...owners.map(yearOf));
  const count = (y: number) => owners.filter((o) => yearOf(o) === y).length;
  let start = firstYear;
  while (start < lastYear && count(start) < SHARE * n) start++;
  start = Math.max(start, lastYear - MAX_COLUMNS + 2);
  const columns: Column[] = [];
  if (n > 0) {
    if (start > firstYear) {
      const merged = owners.filter((o) => yearOf(o) < start);
      columns.push({
        label: start - 1 === firstYear ? String(firstYear) : `${firstYear}–${start - 1}`,
        owners: merged,
      });
    }
    for (let y = start; y <= lastYear; y++) {
      columns.push({ label: String(y), owners: owners.filter((o) => yearOf(o) === y) });
    }
  }
  const cols = Math.max(1, columns.length);
  const cw = (W - 2 * PAD) / cols;
  const maxNew = Math.max(1, ...columns.map((c) => c.owners.length));

  const barBase = 150;
  const listTop = barBase + 62;
  const ROW = 24;
  let body = "";
  const rows = Math.min(LIST, Math.max(1, ...columns.map((c) => c.owners.length)));
  let cumulative = 0;
  columns.forEach((c, i) => {
    const x0 = PAD + i * cw;
    const cx = x0 + cw / 2;
    if (i > 0) {
      body += `<line x1="${r1(x0)}" y1="${barBase - BAR_MAX - 20}" x2="${r1(x0)}" y2="${listTop + (rows - 1) * ROW + 12}" stroke="${p.hair}"/>`;
    }
    cumulative += c.owners.length;
    const h = (c.owners.length / maxNew) * BAR_MAX;
    const bw = Math.min(96, cw - 40);
    if (c.owners.length > 0) {
      body += `<rect x="${r1(cx - bw / 2)}" y="${r1(barBase - h)}" width="${r1(bw)}" height="${r1(Math.max(2, h))}" rx="3" fill="${p.accent}" fill-opacity="${theme === "dark" ? 0.85 : 0.9}"/>`;
    }
    body += `<text x="${r1(cx)}" y="${r1(barBase - Math.max(2, h) - 6)}" text-anchor="middle" font-size="12"><tspan class="b">${fmt(c.owners.length)}</tspan><tspan class="mu" font-size="11"> new</tspan></text>`;
    body += `<line x1="${r1(x0 + 12)}" y1="${barBase + 0.5}" x2="${r1(x0 + cw - 12)}" y2="${barBase + 0.5}" stroke="${p.border}"/>`;
    body += `<text x="${r1(cx)}" y="${barBase + 20}" text-anchor="middle" font-size="13" class="b">${esc(c.label)}</text>`;
    body += `<text x="${r1(cx)}" y="${barBase + 36}" text-anchor="middle" font-size="11" class="mu">${esc(`${fmt(cumulative)} of ${fmt(n)} so far`)}</text>`;

    const list = [...c.owners].sort((a, b) => b.total - a.total || a.login.localeCompare(b.login));
    const shown = list.length <= LIST ? list : list.slice(0, LIST - 1);
    shown.forEach((o, j) => {
      const y = listTop + j * ROW;
      const total = fmt(o.total);
      body += av({
        id: `f05-${i}-${j}`,
        login: o.login,
        stats,
        cx: x0 + 21,
        cy: y,
        size: 18,
        org: o.org,
        p,
      });
      body += `<text x="${r1(x0 + 36)}" y="${y}" dy="0.35em" font-size="11.5">${esc(fitText(o.login, cw - 36 - 12 - total.length * 7 - 8, 11.5))}</text>`;
      body += `<text x="${r1(x0 + cw - 12)}" y="${y}" dy="0.35em" text-anchor="end" font-size="11.5" class="mu">${total}</text>`;
    });
    if (list.length > shown.length) {
      const rest = list.slice(shown.length);
      const y = listTop + shown.length * ROW;
      body += `<text x="${r1(x0 + 12)}" y="${y}" dy="0.35em" font-size="11" class="mu">${esc(`+${rest.length} more`)}</text>`;
      body += `<text x="${r1(x0 + cw - 12)}" y="${y}" dy="0.35em" text-anchor="end" font-size="11" class="mu">${fmt(rest.reduce((s, o) => s + o.total, 0))}</text>`;
    }
  });

  const footY = listTop + rows * ROW + 16;
  const foot = `<text x="${PAD}" y="${footY}" font-size="11" class="mu">${esc(
    `By year of your first PR, issue or discussion with each owner; biggest first, by contributions to date. Years under ${Math.round(SHARE * 100)}% of owners fold into the first column.`,
  )}</text>`;

  return card({
    theme,
    width: W,
    height: footY + 20,
    title: "First contact",
    subtitle: `When each of ${plural(n, "other owner")} first heard from you, year by year`,
    body: body + foot,
  });
}

export const design: Design = {
  id: "F05",
  slug: "first-contact",
  title: "First contact",
  idea: "How the network grew: owners grouped by the year of your first PR, issue or discussion with them (earliest repos[].first), with a bar for how many were new that year, the running total, and the biggest of each year's cohort. Leading years that each brought under 5% of owners fold into one column; at most 6 columns.",
  render,
};
