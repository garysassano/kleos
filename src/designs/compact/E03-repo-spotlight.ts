import type { RepoStats, Stats } from "../../stats/types.ts";
import type { Design, ThemeName } from "../types.ts";
import {
  MON,
  avatar,
  card,
  context,
  esc,
  fmt,
  icon,
  monthLabel,
  plural,
  r1,
  segBar,
  svg,
  trunc,
  tw,
} from "./_shared.ts";

type Dated = RepoStats & { first: string; last: string };

/**
 * The spotlight: the repository with the most contributions among those not owned by the
 * top owner (whose work already dominates every leaderboard), falling back to the top
 * repository when every dated repository belongs to that owner.
 */
export function spotlight(stats: Stats): Dated | undefined {
  const dated = stats.repos.filter((r): r is Dated => r.total > 0 && !!r.first && !!r.last);
  const topOwner = stats.owners[0]?.owner;
  return dated.find((r) => r.owner !== topOwner) ?? dated[0];
}

function render(stats: Stats, theme: ThemeName): string {
  const c = context(stats, theme);
  const { t } = c;
  const W = 410;
  const H = 268;
  const P = 16;
  const r = spotlight(stats);
  if (!r) {
    const body = `${card(W, H, t)}<text x="${W / 2}" y="${H / 2}" text-anchor="middle" font-size="13" fill="${t.muted}">No upstream pull requests, issues or discussions yet</text>`;
    return svg(W, H, "Repository spotlight", body);
  }
  const slash = r.repo.indexOf("/");
  const own = r.repo.slice(0, slash);
  const name = r.repo.slice(slash + 1);
  let b = card(W, H, t);
  b += avatar(c, own, P, P, 40, { type: r.ownerType });
  const nameFs = 16;
  b += `<text x="68" y="33" font-size="${nameFs}" fill="${t.muted}">${esc(own)}<tspan fill="${t.muted}"> / </tspan><tspan fill="${t.text}" font-weight="600">${esc(trunc(name, W - 68 - P - tw(`${own} / `, nameFs), nameFs, { bold: true }))}</tspan></text>`;
  let sx = 68;
  if (r.language) {
    b += `<circle cx="${sx + 5}" cy="47.5" r="5" fill="${r.langColor ?? t.muted}"/><text x="${sx + 15}" y="52" font-size="12" fill="${t.muted}">${esc(r.language)}</text>`;
    sx += 15 + tw(r.language, 12) + 14;
  }
  b += `${icon("star", sx, 40, 14, t.star)}<text x="${sx + 19}" y="52" font-size="12" fill="${t.muted}">${plural(r.stars, "star")}</text>`;
  b += `<line x1="${P}" x2="${W - P}" y1="72.5" y2="72.5" stroke="${t.borderMuted}"/>`;

  // three stat columns
  const colW = (W - 2 * P) / 3;
  const notMerged = r.prs - r.prsMerged;
  const cols = [
    {
      ic: "pr",
      c: t.pr,
      label: "Pull requests",
      v: r.prs,
      sub: r.prs ? `${r.prsMerged} merged${r.prsOpen ? ` · ${r.prsOpen} open` : ""}` : "none yet",
    },
    { ic: "issue", c: t.issue, label: "Issues", v: r.issues, sub: "opened" },
    { ic: "disc", c: t.disc, label: "Discussions", v: r.discussions, sub: "started" },
  ] as const;
  cols.forEach((col, i) => {
    const x = P + i * colW;
    b += `${icon(col.ic, x, 88, 14, col.c)}<text x="${x + 20}" y="100" font-size="12" fill="${t.muted}">${col.label}</text>`;
    b += `<text x="${x}" y="128" font-size="24" font-weight="600" fill="${t.text}">${fmt(col.v)}</text>`;
    b += `<text x="${x}" y="146" font-size="11" fill="${t.muted}">${esc(trunc(col.sub, colW - 8, 11))}</text>`;
  });
  b += segBar(c, P, 160, W - 2 * P, 8, [
    { v: r.prsMerged, c: t.pr },
    { v: notMerged, c: t.prOther },
    { v: r.issues, c: t.issue },
    { v: r.discussions, c: t.disc },
  ]);

  // monthly columns over the active span
  const months: string[] = [];
  {
    let y = +r.first.slice(0, 4);
    let m = +r.first.slice(5, 7);
    const ly = +r.last.slice(0, 4);
    const lm = +r.last.slice(5, 7);
    while (y < ly || (y === ly && m <= lm)) {
      months.push(`${y}-${String(m).padStart(2, "0")}`);
      m++;
      if (m > 12) {
        m = 1;
        y++;
      }
    }
  }
  const vals = months.map((k) => r.monthly[k] || 0);
  const max = Math.max(0, ...vals);
  const peakI = vals.indexOf(max);
  const peak = months[peakI] ?? "";
  b += `${icon("calendar", P, 186, 13, t.muted)}<text x="${P + 19}" y="197" font-size="12" fill="${t.muted}">Active <tspan fill="${t.text}" font-weight="600">${monthLabel(r.first)} – ${monthLabel(r.last)}</tspan></text>`;
  if (max > 0)
    b += `<text x="${W - P}" y="197" text-anchor="end" font-size="11" fill="${t.muted}">busiest ${MON[+peak.slice(5) - 1]} ${peak.slice(0, 4)}: ${max}</text>`;
  const cx0 = P;
  const cw = W - 2 * P;
  const base = 244;
  const hmax = 34;
  const step = cw / months.length;
  const bw = Math.max(2, Math.min(14, step - 2));
  vals.forEach((v, i) => {
    const x = cx0 + i * step + (step - bw) / 2;
    if (v === 0)
      b += `<rect x="${r1(x)}" y="${base - 2}" width="${r1(bw)}" height="2" rx="1" fill="${t.track}"/>`;
    else {
      const h = Math.max(3, (v / max) * hmax);
      b += `<rect x="${r1(x)}" y="${r1(base - h)}" width="${r1(bw)}" height="${r1(h)}" rx="${Math.min(2, bw / 2)}" fill="${i === peakI ? t.text : t.neutralBar}" fill-opacity="${i === peakI ? 0.85 : 0.75}"/>`;
    }
  });
  // year ticks at January (and the first month, unless a January follows too closely)
  const firstJan = months.findIndex((m) => m.endsWith("-01"));
  months.forEach((k, i) => {
    if (!(k.endsWith("-01") || i === 0)) return;
    const x = cx0 + i * step;
    if (i !== 0 && x > W - P - 24) return;
    if (i === 0 && !k.endsWith("-01") && firstJan >= 0 && firstJan * step < 34) return;
    b += `<text x="${r1(x)}" y="${base + 14}" font-size="10" fill="${t.muted}">${k.endsWith("-01") ? k.slice(0, 4) : `${MON[+k.slice(5) - 1]} ${k.slice(2, 4)}`}</text>`;
  });
  return svg(W, H, `${r.repo}: ${r.prs} PRs, ${r.issues} issues, ${r.discussions} discussions`, b);
}

export const design: Design = {
  id: "E03",
  slug: "repo-spotlight",
  title: "Repo spotlight",
  idea: "One repository in focus: avatar, stars, language, PR/issue/discussion breakdown and a monthly activity histogram over the active span. It picks the repository with the most contributions among those not owned by the top owner. 410px, so two sit side by side.",
  render,
};
