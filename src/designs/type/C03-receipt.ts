import { prsClosed, mergeRate as rateOf, totalsCounts } from "../../kit/outcomes.ts";
import type { FamilyStats, Stats } from "../../stats/types.ts";
import { DEFAULT_OPTIONS, type Design, type Level } from "../types.ts";
import { THEMES, derive, fmt, kinds, svg, text, trunc } from "./_shared.ts";

interface Item {
  name: string;
  total: number;
  prs: number;
  prsMerged: number;
  prsOpen: number;
  issues: number;
  discussions: number;
  repos: number;
  /** Owners rolled into this line when it is a family of more than one. */
  famOwners: number;
}

/** Owners as receipt lines, a family's owners collapsed into one line, most contributions first. */
function lineItems(stats: Stats) {
  const famOf = new Map<string, FamilyStats>();
  for (const f of stats.families) for (const o of f.owners) famOf.set(o, f);
  const items = new Map<string, Item>();
  for (const o of stats.owners) {
    const f = famOf.get(o.owner);
    const src = f ?? { ...o, name: o.owner };
    if (items.has(src.name)) continue;
    items.set(src.name, {
      name: src.name,
      total: src.total,
      prs: src.prs,
      prsMerged: src.prsMerged,
      prsOpen: src.prsOpen,
      issues: src.issues,
      discussions: src.discussions,
      repos: src.repos,
      famOwners: f && f.owners.length > 1 ? f.owners.length : 0,
    });
  }
  return { famOf, sorted: [...items.values()].sort((a, b) => b.total - a.total) };
}

/** Lines itemised before the rest are summed into "N other owners". */
const K = 10;

/** What follows an item's PR count: "(9 merged)", "(9 merged, 1 open)" for "full", nothing for "none". */
function prSuffix(it: Item, lv: Level | undefined): string {
  if (lv === "none") return "";
  if (lv === "full" && it.prsOpen) return ` (${it.prsMerged} merged, ${it.prsOpen} open)`;
  return ` (${it.prsMerged} merged)`;
}

export const design: Design = {
  id: "C03",
  slug: "receipt",
  title: "Receipt",
  idea: "A till receipt itemised by owner, with company families (several orgs under one brand) rolled into one line, a breakdown under each item and a grand total of every upstream PR, issue and discussion. The barcode is the last 53 weeks of activity. With outcomes none PRs are one line; merged keeps the merged sub-line without the open line or merge rate; full adds closed-unmerged PRs.",
  render(stats, theme, options = DEFAULT_OPTIONS) {
    const lv = options.outcomes;
    const t = THEMES[theme];
    const { T, asOf, extIssues, extDisc, extTotal, firstAny, mergeRate, prsOpen } = derive(stats);
    const { famOf, sorted } = lineItems(stats);
    const top = sorted.slice(0, K);
    const rest = sorted.slice(K);
    const topNames = new Set(top.map((it) => it.name));
    const restOwners = stats.owners.filter(
      (o) => !topNames.has(famOf.get(o.owner)?.name ?? o.owner),
    ).length;
    const restSum = rest.reduce(
      (a, it) => ({ total: a.total + it.total, repos: a.repos + it.repos }),
      { total: 0, repos: 0 },
    );
    const W = 440;
    const P = 30;
    const FS = 12.5;
    const LH = 18;
    const cw = FS * 0.6;
    const L = P;
    const R = W - P;
    const fs = `font-size="${FS}"`;
    // body first, paper outline afterwards once the height is known
    let b = "";
    let y = 40;
    const nl = (k = 1) => {
      y += LH * k;
    };
    const rule = (dash = "2 3") => {
      b += `<line x1="${L}" y1="${y - 4.5}" x2="${R}" y2="${y - 4.5}" stroke="${t.muted}" stroke-dasharray="${dash}" opacity=".7"/>`;
      nl(0.8);
    };
    b += text(W / 2, y, "UPSTREAM CONTRIBUTIONS", "m b t c cap", 'font-size="14"');
    nl();
    b += text(W / 2, y, `@${stats.user} · github.com`, "m mu c", fs);
    nl();
    b += text(W / 2, y, `${firstAny} → ${asOf}`, "m mu c", fs);
    nl(1.2);
    rule();
    b += text(L, y, "REPOS", "m mu", 'font-size="10.5"');
    b += text(L + 7 * cw, y, "OWNER", "m mu", 'font-size="10.5"');
    b += text(R, y, "COUNT", "m mu e", 'font-size="10.5"');
    nl(0.9);
    rule();
    for (const it of top) {
      const label = it.famOwners ? `${it.name} (${it.famOwners} orgs)` : it.name;
      b += text(L + 4 * cw, y, String(it.repos), "m n mu e", fs);
      b += text(L + 7 * cw, y, trunc(label, 30), "m t b", fs);
      b += text(R, y, String(it.total), "m n t b e", fs);
      nl();
      const bits = kinds(it.prs, it.issues, it.discussions, prSuffix(it, lv));
      b += text(L + 7 * cw, y - 2, bits, "m mu", 'font-size="11"');
      nl(1.05);
    }
    if (rest.length) {
      b += text(L + 4 * cw, y, String(restSum.repos), "m n mu e", fs);
      b += text(
        L + 7 * cw,
        y,
        `${restOwners} other owner${restOwners === 1 ? "" : "s"}`,
        "m t",
        fs,
      );
      b += text(R, y, String(restSum.total), "m n t e", fs);
      nl(1.3);
    } else nl(0.25);
    rule();
    const kv = (k: string, v: string, cls = "t", ind = 0) => {
      b += text(L + 7 * cw + ind, y, k, `m ${ind ? "mu" : "t"}`, fs);
      b += text(R, y, v, `m n e ${cls}`, fs);
      nl();
    };
    kv("Pull requests", fmt(T.externalPRs));
    if (lv !== "none") kv("merged", fmt(T.externalMerged), "pu", 2 * cw);
    if (lv === undefined || lv === "full") kv("still open", fmt(prsOpen), "mu", 2 * cw);
    if (lv === "full") kv("closed unmerged", fmt(prsClosed(totalsCounts(T))), "mu", 2 * cw);
    kv("Issues", fmt(extIssues));
    kv("Discussions", fmt(extDisc));
    nl(0.2);
    b += `<line x1="${L}" y1="${y - 6.5}" x2="${R}" y2="${y - 6.5}" stroke="${t.text}"/><line x1="${L}" y1="${y - 3.5}" x2="${R}" y2="${y - 3.5}" stroke="${t.text}"/>`;
    nl(0.9);
    b += text(L, y, "TOTAL", "m b t cap", 'font-size="15"');
    b += text(R, y, fmt(extTotal), "m b n t e", 'font-size="15"');
    nl();
    b += text(L, y, `${T.externalRepos} repositories · ${T.externalOwners} owners`, "m mu", fs);
    if (lv === undefined) b += text(R, y, `${(mergeRate * 100).toFixed(1)}% merged`, "m pu e", fs);
    else if (lv === "full") b += text(R, y, `${rateOf(totalsCounts(T), lv)}% merged`, "m pu e", fs);
    nl(1.3);
    rule();
    // barcode: one bar per 7 calendar days, width by activity quartile
    const weeks: number[] = [];
    for (let i = 0; i < stats.calendar.length; i += 7) {
      weeks.push(stats.calendar.slice(i, i + 7).reduce((s, [, c]) => s + c, 0));
    }
    const sortedW = [...weeks].sort((a, c) => a - c);
    const q = (p: number) => sortedW[Math.floor(p * (sortedW.length - 1))] ?? 0;
    const q1 = q(0.25);
    const q2 = q(0.5);
    const q3 = q(0.75);
    const ws = weeks.map((c) => (c === 0 ? 0.6 : c <= q1 ? 1 : c <= q2 ? 1.8 : c <= q3 ? 2.8 : 4));
    const gap = 1.6;
    const totalW = ws.reduce((s, w) => s + w + gap, -gap);
    let bx = (W - totalW) / 2;
    const bh = 34;
    b += `<g fill="${t.text}">`;
    for (const w of ws) {
      b += `<rect x="${bx.toFixed(2)}" y="${y - 6}" width="${w}" height="${bh}"/>`;
      bx += w + gap;
    }
    b += "</g>";
    y += bh + 8;
    b += text(
      W / 2,
      y,
      `${weeks.length} weeks of activity · bar width = contributions`,
      "m f c",
      'font-size="10"',
    );
    nl(1.4);
    b += text(W / 2, y, "THANK YOU, MAINTAINERS", "m b t c cap", fs);
    const H = Math.ceil(y + 30);
    const top0 = 8;
    const bot0 = H - 8;
    let d = `M0 ${top0}`;
    for (let x = 0; x < W; x += 10) d += ` L${x + 5} ${top0 - 6} L${x + 10} ${top0}`;
    d += ` L${W} ${bot0}`;
    for (let x = W; x > 0; x -= 10) d += ` L${x - 5} ${bot0 + 6} L${x - 10} ${bot0}`;
    d += " Z";
    b = `<path d="${d}" fill="${t.card}" stroke="${t.border}" stroke-linejoin="round"/>${b}`;
    return svg(
      W,
      H,
      t,
      "",
      b,
      `Upstream receipt: ${extTotal} contributions, ${T.externalPRs} PRs${lv === "none" ? "" : `, ${T.externalMerged} merged`}`,
    );
  },
};
