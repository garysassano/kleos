import type { Stats } from "../../stats/types.ts";
import { DEFAULT_OPTIONS, type Design, type RenderOptions, type ThemeName } from "../types.ts";
import {
  MON,
  ONE_OF_EACH,
  avatar,
  card,
  context,
  esc,
  fmt,
  icon,
  kfmt,
  kinds,
  kindsAt,
  legend,
  legendAt,
  plural,
  r1,
  segBar,
  svg,
  trunc,
  tw,
  upstream,
} from "./_shared.ts";

/** Most rows in the owner and repository columns. */
const MAX_ROWS = 8;

function render(stats: Stats, theme: ThemeName, options: RenderOptions = DEFAULT_OPTIONS): string {
  const lvl = options.outcomes;
  const c = context(stats, theme);
  const { t } = c;
  const X = upstream(stats);
  const ME = stats.user;
  const W = 840;
  const P = 20;
  let b = "";

  // header
  b += avatar(c, ME, P, 18, 40, { type: "User" });
  b += `<text x="${P + 52}" y="34" font-size="16" font-weight="600" fill="${t.text}">Upstream contributions</text>`;
  b += `<text x="${P + 52}" y="53" font-size="12" fill="${t.muted}">@${esc(ME)} · public repos owned by other people and orgs</text>`;
  b += legend(
    W - P,
    34,
    t,
    lvl
      ? legendAt(t, lvl).map(({ k, c: col }) => ({ k: k[0]?.toUpperCase() + k.slice(1), c: col }))
      : kinds(t, ONE_OF_EACH).map(({ k, c: col }) => ({
          k: k === "other PRs" ? "PRs not merged" : k[0]?.toUpperCase() + k.slice(1),
          c: col,
        })),
    { anchor: "end" },
  );

  // KPI strip
  const merged: [label: string, value: string, color: string | null, extra?: string][] =
    lvl === "none"
      ? []
      : lvl === "merged"
        ? [["PRs merged", fmt(X.merged), t.pr]]
        : [["PRs merged", fmt(X.merged), t.pr, `${X.rate}%`]];
  const kpi: [label: string, value: string, color: string | null, extra?: string][] = [
    lvl === "full"
      ? ["PRs opened", fmt(X.prs), t.pr, `${fmt(X.open)} open`]
      : ["PRs opened", fmt(X.prs), t.pr],
    ...merged,
    ["Issues opened", fmt(X.issues), t.issue],
    ["Discussions", fmt(X.discussions), t.disc],
    ["Repos", fmt(X.repos), null],
    ["Owners", fmt(X.owners), null, plural(X.orgs, "org")],
  ];
  const ky = 74;
  const kh = 64;
  const kw = (W - 2 * P) / kpi.length;
  b += `<rect x="${P}" y="${ky}" width="${W - 2 * P}" height="${kh}" rx="6" fill="${t.inset}" stroke="${t.borderMuted}"/>`;
  kpi.forEach(([label, v, col, extra], i) => {
    const x = P + i * kw + 16;
    if (i)
      b += `<line x1="${r1(P + i * kw)}" x2="${r1(P + i * kw)}" y1="${ky + 14}" y2="${ky + kh - 14}" stroke="${t.borderMuted}"/>`;
    b += `<g class="fade" style="animation-delay:${i * 60}ms"><text x="${r1(x)}" y="${ky + 32}" font-size="22" font-weight="600" fill="${t.text}">${v}</text>`;
    if (extra)
      b += `<text x="${r1(x + tw(v, 22, { bold: true }) + 6)}" y="${ky + 32}" font-size="12" fill="${t.muted}">${extra}</text>`;
    b += `${col ? `<rect x="${r1(x)}" y="${ky + 42}" width="8" height="8" rx="2" fill="${col}"/>` : ""}<text x="${r1(x + (col ? 13 : 0))}" y="${ky + 50}" font-size="11.5" fill="${t.muted}">${label}</text></g>`;
  });

  // owner and repository columns
  const top = 166;
  const rowH = 30;
  const owners = stats.owners.slice(0, MAX_ROWS);
  const repos = stats.repos.slice(0, MAX_ROWS);
  const N = Math.max(owners.length, repos.length);
  const colL = P;
  const colR = 440;
  const colW = 380;
  b += `<text x="${colL}" y="${top}" font-size="13" font-weight="600" fill="${t.text}">Top owners</text><text x="${colL + colW}" y="${top}" text-anchor="end" font-size="11" fill="${t.muted}">contributions</text>`;
  b += `<text x="${colR}" y="${top}" font-size="13" font-weight="600" fill="${t.text}">Top repos</text>`;
  const rc = { stars: colR + 222, prs: colR + 290, iss: colR + 336, disc: colR + colW };
  b +=
    icon("star", rc.stars - 12, top - 11, 12, t.muted) +
    icon("pr", rc.prs - 12, top - 11, 12, t.pr) +
    icon("issue", rc.iss - 12, top - 11, 12, t.issue) +
    icon("disc", rc.disc - 12, top - 11, 12, t.disc);
  b += `<line x1="${P}" x2="${W - P}" y1="${top + 10.5}" y2="${top + 10.5}" stroke="${t.borderMuted}"/>`;
  const maxO = Math.max(1, owners[0]?.total ?? 0);
  owners.forEach((o, i) => {
    const y = top + 18 + i * rowH;
    b += avatar(c, o.owner, colL, y + 3, 20, { type: o.type });
    b += `<text x="${colL + 28}" y="${y + 17}" font-size="13" fill="${t.text}">${esc(trunc(o.owner, 118, 13))}</text>`;
    const bx = colL + 150;
    const bwMax = colW - 150 - 40;
    const bw = Math.max(4, (o.total / maxO) * bwMax);
    b += segBar(c, bx, y + 9, bwMax, 8, lvl ? kindsAt(t, o, lvl) : kinds(t, o), {
      fullWidth: bw,
      track: false,
      cls: "grow",
      style: `animation-delay:${150 + i * 50}ms`,
    });
    b += `<text x="${colL + colW}" y="${y + 17}" text-anchor="end" font-size="12.5" font-weight="600" fill="${t.text}" class="mono">${o.total}</text>`;
  });
  repos.forEach((r, i) => {
    const y = top + 18 + i * rowH;
    const slash = r.repo.indexOf("/");
    const own = r.repo.slice(0, slash);
    const name = r.repo.slice(slash + 1);
    b += avatar(c, own, colR, y + 5, 16, { type: r.ownerType });
    b += `<text x="${colR + 24}" y="${y + 17}" font-size="13" fill="${t.text}">${esc(trunc(name, 150, 13))}</text>`;
    b += `<text x="${rc.stars}" y="${y + 17}" text-anchor="end" font-size="12" fill="${t.muted}">${kfmt(r.stars)}</text>`;
    const dim = (v: number) => (v ? t.text : t.muted);
    b += `<text x="${rc.prs}" y="${y + 17}" text-anchor="end" font-size="12" class="mono" fill="${dim(r.prs)}">${r.prs ? (lvl === "none" ? r.prs : `${r.prsMerged}<tspan fill="${t.muted}">/${r.prs}</tspan>`) : "–"}</text>`;
    b += `<text x="${rc.iss}" y="${y + 17}" text-anchor="end" font-size="12" class="mono" fill="${dim(r.issues)}">${r.issues || "–"}</text>`;
    b += `<text x="${rc.disc}" y="${y + 17}" text-anchor="end" font-size="12" class="mono" fill="${dim(r.discussions)}">${r.discussions || "–"}</text>`;
  });
  const tableEnd = top + 18 + N * rowH;
  b += `<text x="${colR}" y="${tableEnd + 6}" font-size="10.5" fill="${t.muted}">stars · ${lvl === "none" ? "PRs" : "PRs merged/opened"} · issues · discussions</text>`;

  // weekly activity strip (the calendar counts every kind of contribution, private ones included)
  const cal = stats.calendar;
  const weeks: { d: string; v: number }[] = [];
  for (let i = 0; i < cal.length; i += 7)
    weeks.push({ d: cal[i]?.[0] ?? "", v: cal.slice(i, i + 7).reduce((s, x) => s + x[1], 0) });
  const calTot = cal.reduce((s, x) => s + x[1], 0);
  const sy = tableEnd + 34;
  b += `<line x1="${P}" x2="${W - P}" y1="${sy - 14.5}" y2="${sy - 14.5}" stroke="${t.borderMuted}"/>`;
  b += `<text x="${P}" y="${sy + 4}" font-size="13" font-weight="600" fill="${t.text}">Last 12 months</text><text x="${P + 108}" y="${sy + 4}" font-size="11.5" fill="${t.muted}">${fmt(calTot)} contributions of every kind, private repos included, per week</text>`;
  const maxW = Math.max(0, ...weeks.map((w) => w.v));
  const peak = maxW > 0 ? weeks.find((w) => w.v === maxW) : undefined;
  b += `<text x="${W - P}" y="${sy + 4}" text-anchor="end" font-size="11" fill="${t.muted}">peak week ${fmt(maxW)}</text>`;
  const gx = P;
  const gw = W - 2 * P;
  const gbase = sy + 58;
  const gh = 38;
  const st = gw / Math.max(1, weeks.length);
  const gbw = st - 3;
  weeks.forEach((w, i) => {
    const h = w.v ? Math.max(3, (w.v / maxW) * gh) : 2;
    b += `<rect class="up" style="animation-delay:${300 + i * 8}ms" x="${r1(gx + i * st + 1.5)}" y="${r1(gbase - h)}" width="${r1(gbw)}" height="${r1(h)}" rx="2" fill="${w.v ? (w === peak ? t.text : t.neutralBar) : t.track}" fill-opacity="${w.v ? (w === peak ? 0.85 : 0.75) : 1}"/>`;
    const m = +w.d.slice(5, 7);
    const prevM = i ? +(weeks[i - 1]?.d ?? "").slice(5, 7) : -1;
    if (m !== prevM && i > 0 && i < weeks.length - 2)
      b += `<text x="${r1(gx + i * st + 1.5)}" y="${gbase + 14}" font-size="10" fill="${t.muted}">${MON[m - 1]}</text>`;
  });
  const H = gbase + 26;
  const css =
    "@keyframes fade{from{opacity:0}to{opacity:1}}@keyframes grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}@keyframes up{from{transform:scaleY(0)}to{transform:scaleY(1)}}.fade{animation:fade .5s ease-out both}.grow{transform-box:fill-box;transform-origin:left;animation:grow .7s cubic-bezier(.2,.7,.2,1) both}.up{transform-box:fill-box;transform-origin:bottom;animation:up .5s ease-out both}";
  return svg(W, H, "Upstream contributions dashboard", card(W, H, t) + b, css);
}

export const design: Design = {
  id: "E04",
  slug: "dashboard",
  title: "Combined dashboard",
  idea: "Everything in one card: KPI strip, top owners with stacked contribution bars, top repos as a compact table, and a weekly activity strip for the last 12 months. Bars grow in on load.",
  render,
};
