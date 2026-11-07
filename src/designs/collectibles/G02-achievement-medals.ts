import { PALETTES, SANS, compact, document, esc, truncate } from "../../kit/svg.ts";
import type { Stats } from "../../stats/types.ts";
import { DEFAULT_OPTIONS, type Design, type Level } from "../types.ts";
import { metals, plural, series } from "./_shared.ts";

interface Achievement {
  title: string;
  value: number;
  /** Text inside the medal. */
  display: string;
  /** Small word under the number inside the medal. */
  unit: string;
  desc: string;
  context: string;
  tiers: [number, number, number];
  tierLabel: (n: number) => string;
}

const YEAR_MS = 365.25 * 24 * 3600 * 1000;

/** Every achievement is computed from the data; the thresholds are the tiers printed on the card. */
function achievements(stats: Stats, lv: Level | undefined): Achievement[] {
  const repos = stats.repos;
  /** "none" counts PRs where the others count merged PRs. */
  const none = lv === "none";
  const credited = (r: (typeof repos)[number]) => (none ? r.prs : r.prsMerged);
  const byMerged = [...repos].sort((a, b) => credited(b) - credited(a))[0];

  const groups = [
    ...stats.ecosystems.map((f) => ({ name: f.name, repos: f.repos, owners: f.owners.length })),
    ...stats.owners
      .filter((o) => !stats.ecosystems.some((f) => f.owners.includes(o.owner)))
      .map((o) => ({ name: o.owner, repos: o.repos, owners: 1 })),
  ].sort((a, b) => b.repos - a.repos);
  const group = groups[0];

  const issues = repos.reduce((s, r) => s + r.issues, 0);
  const byIssues = [...repos].sort((a, b) => b.issues - a.issues)[0];

  const langCount = new Map<string, number>();
  for (const r of repos) {
    if (credited(r) > 0 && r.language)
      langCount.set(r.language, (langCount.get(r.language) ?? 0) + 1);
  }
  const langs = [...langCount.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

  const bigStage = repos.filter((r) => credited(r) > 0).sort((a, b) => b.stars - a.stars)[0];

  const spans = repos
    .filter((r) => r.first && r.last)
    .map((r) => ({
      repo: r.repo,
      years: (Date.parse(r.last ?? "") - Date.parse(r.first ?? "")) / YEAR_MS,
    }))
    .sort((a, b) => b.years - a.years);
  const longest = spans[0];

  const { externalPRs, externalMerged } = stats.totals;
  const rate = externalPRs >= 10 ? Math.round((100 * externalMerged) / externalPRs) : 0;

  const n = (x: number) => String(x);
  const noPRs = none ? "no PRs yet" : "no merged PRs yet";
  const top = byMerged ? credited(byMerged) : 0;
  /** The eighth medal: merge rate by default and for "full", which "merged" and "none" may not show. */
  const last: Achievement =
    lv === "none"
      ? {
          title: "Prolific",
          value: externalPRs,
          display: n(externalPRs),
          unit: "PRs",
          desc: "PRs opened upstream",
          context: `in ${plural(repos.filter((r) => r.prs > 0).length, "repo")}`,
          tiers: [25, 100, 250],
          tierLabel: n,
        }
      : lv === "merged"
        ? {
            title: "Shipper",
            value: externalMerged,
            display: n(externalMerged),
            unit: "merged",
            desc: "PRs merged upstream",
            context: `in ${plural(repos.filter((r) => r.prsMerged > 0).length, "repo")}`,
            tiers: [25, 100, 250],
            tierLabel: n,
          }
        : {
            title: "Sharpshooter",
            value: rate,
            display: `${rate}%`,
            unit: "merged",
            desc: `of ${plural(externalPRs, "upstream PR")} merged`,
            context:
              externalPRs >= 10 ? `${externalMerged} of ${externalPRs}` : "needs 10+ upstream PRs",
            tiers: [50, 70, 90],
            tierLabel: (x) => `${x}%`,
          };
  return [
    {
      title: none ? "Workhorse" : "Merge Master",
      value: top,
      display: n(top),
      unit: none ? "PRs" : "merged",
      desc: none ? "PRs in a single repo" : "merged PRs in a single repo",
      context: top && byMerged ? byMerged.repo : noPRs,
      tiers: [10, 50, 100],
      tierLabel: n,
    },
    {
      title: "Regular",
      value: group?.repos ?? 0,
      display: n(group?.repos ?? 0),
      unit: "repos",
      desc: "repos in one owner or ecosystem",
      context: group
        ? `${group.name}${group.owners > 1 ? ` (${plural(group.owners, "owner")})` : ""}`
        : "no owners yet",
      tiers: [5, 10, 20],
      tierLabel: n,
    },
    {
      title: "Globetrotter",
      value: stats.totals.externalOwners,
      display: n(stats.totals.externalOwners),
      unit: "owners",
      desc: "orgs and people contributed to",
      context: `across ${plural(stats.totals.externalRepos, "repo")}`,
      tiers: [10, 50, 100],
      tierLabel: n,
    },
    {
      title: "Bug Hunter",
      value: issues,
      display: n(issues),
      unit: "issues",
      desc: "issues opened upstream",
      context: byIssues?.issues ? `most in ${byIssues.repo} (${byIssues.issues})` : "none yet",
      tiers: [25, 100, 250],
      tierLabel: n,
    },
    {
      title: "Polyglot",
      value: langs.length,
      display: n(langs.length),
      unit: "languages",
      desc: none ? "languages with a PR" : "languages with a merged PR",
      context: langs.length
        ? langs
            .slice(0, 3)
            .map(([l]) => l)
            .join(", ")
        : noPRs,
      tiers: [3, 5, 10],
      tierLabel: n,
    },
    {
      title: "Big Stage",
      value: bigStage?.stars ?? 0,
      display: compact(bigStage?.stars ?? 0),
      unit: "stars",
      desc: none ? "most-starred repo with a PR" : "most-starred repo merged into",
      context: bigStage ? bigStage.repo : noPRs,
      tiers: [1000, 10000, 100000],
      tierLabel: compact,
    },
    {
      title: "Long Haul",
      value: longest?.years ?? 0,
      display: (longest?.years ?? 0).toFixed(1),
      unit: "years",
      desc: "first to last item, one repo",
      context: longest ? longest.repo : "no dated activity",
      tiers: [1, 2, 3],
      tierLabel: (x) => `${x}y`,
    },
    last,
  ];
}

const COLS = 4;
const CELL_W = 204;
const CELL_H = 200;
const PAD = 12;
const HEAD = 52;

export const design: Design = {
  id: "G02",
  slug: "achievement-medals",
  title: "Achievement medals",
  idea: "A sheet of eight medals, each computed from the data (most merged PRs in one repo, repos in one ecosystem, owners, issues, languages, stars, longest run, merge rate) and struck in bronze, silver or gold against thresholds printed under it. With outcomes none the merge medals count PRs instead and the merge rate becomes PRs opened; merged swaps the merge rate for merged PRs.",
  render(stats, theme, options = DEFAULT_OPTIONS) {
    const p = PALETTES[theme];
    const metal = metals(theme);
    const ribbons = series(theme);
    const list = achievements(stats, options.outcomes)
      .map((a, i) => ({ a, i, tier: a.tiers.filter((t) => a.value >= t).length }))
      .sort((x, y) => y.tier - x.tier || x.i - y.i);
    const unlocked = list.filter((x) => x.tier > 0).length;
    const rows = Math.ceil(list.length / COLS);
    const width = PAD * 2 + COLS * CELL_W;
    const height = HEAD + rows * CELL_H + 30;

    const defs = metal
      .map(
        (m, k) =>
          `<linearGradient id="g02m${k}" x1="0.2" y1="0" x2="0.8" y2="1"><stop offset="0" stop-color="${m.light}"/><stop offset="0.55" stop-color="${m.dark}"/><stop offset="1" stop-color="${m.light}"/></linearGradient>`,
      )
      .join("");

    const cells = list.map(({ a, i, tier }, k) => {
      const cx = PAD + (k % COLS) * CELL_W + CELL_W / 2;
      const top = HEAD + Math.floor(k / COLS) * CELL_H;
      const cy = top + 66;
      const m = tier > 0 ? metal[tier - 1] : undefined;
      const rib = ribbons[i % ribbons.length] ?? p.accent;
      const ribbon = `<path d="M${cx - 30} ${top + 6}h22l14 46h-22z" fill="${rib}" fill-opacity="${m ? 0.9 : 0.25}"/><path d="M${cx + 30} ${top + 6}h-22l-14 46h22z" fill="${rib}" fill-opacity="${m ? 0.65 : 0.18}"/>`;
      const numSize = a.display.length > 4 ? 19 : a.display.length > 3 ? 22 : 25;
      const disk = m
        ? `<circle cx="${cx}" cy="${cy}" r="39" fill="url(#g02m${tier - 1})"/><circle cx="${cx}" cy="${cy}" r="39" fill="none" stroke="${m.dark}"/><circle cx="${cx}" cy="${cy}" r="32" fill="none" stroke="${m.ink}" stroke-opacity="0.35" stroke-dasharray="1.5 2.5"/>
<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="${numSize}" font-weight="800" fill="${m.ink}">${esc(a.display)}</text><text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="8.5" font-weight="700" letter-spacing="0.8" fill="${m.ink}" fill-opacity="0.75">${esc(a.unit.toUpperCase())}</text>`
        : `<circle cx="${cx}" cy="${cy}" r="39" fill="${p.surface}" stroke="${p.border}" stroke-dasharray="4 3"/>
<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="${numSize}" font-weight="700" fill="${p.faint}">${esc(a.display)}</text><text x="${cx}" y="${cy + 18}" text-anchor="middle" font-size="8.5" font-weight="700" letter-spacing="0.8" fill="${p.faint}">${esc(a.unit.toUpperCase())}</text>`;
      const tierName = m ? m.name.toUpperCase() : "LOCKED";
      const pipW = 52;
      const pips = a.tiers
        .map((t, j) => {
          const x = cx - pipW + j * pipW;
          const mm = metal[j] as (typeof metal)[number];
          const on = tier > j;
          return `<circle cx="${x - 10}" cy="${top + 186}" r="4.5" fill="${on ? `url(#g02m${j})` : "none"}" stroke="${on ? mm.dark : p.border}"/><text x="${x - 2}" y="${top + 189.5}" font-size="10" fill="${on ? p.text : p.faint}">${esc(a.tierLabel(t))}+</text>`;
        })
        .join("");
      return `${ribbon}${disk}
<text x="${cx}" y="${top + 128}" text-anchor="middle" font-size="13.5" font-weight="700" fill="${m ? p.text : p.muted}">${esc(a.title)}<tspan dx="6" font-size="8.5" letter-spacing="0.6" fill="${m ? p.muted : p.faint}">${tierName}</tspan></text>
<text x="${cx}" y="${top + 146}" text-anchor="middle" font-size="11" fill="${p.muted}">${esc(truncate(a.desc, CELL_W - 16, 11))}</text>
<text x="${cx}" y="${top + 162}" text-anchor="middle" font-size="11" fill="${p.text}">${esc(truncate(a.context, CELL_W - 16, 11))}</text>
${pips}`;
    });

    const asOf = stats.generatedAt.slice(0, 10);
    const head = `<text x="${PAD + 4}" y="30" font-size="17" font-weight="700" fill="${p.text}">Upstream achievements</text><text x="${width - PAD - 4}" y="30" text-anchor="end" font-size="12" fill="${p.muted}">${unlocked} of ${list.length} unlocked · as of ${asOf}</text><line x1="${PAD}" x2="${width - PAD}" y1="${HEAD - 8}" y2="${HEAD - 8}" stroke="${p.hair}"/>`;
    const foot = `<line x1="${PAD}" x2="${width - PAD}" y1="${height - 30}" y2="${height - 30}" stroke="${p.hair}"/><text x="${PAD + 4}" y="${height - 11}" font-size="10.5" fill="${p.faint}">Tiers under each medal are bronze, silver and gold thresholds. Upstream = repos owned by other people and orgs.</text>`;
    return document({
      width,
      height,
      title: `Upstream achievements: ${unlocked} of ${list.length} unlocked`,
      body: `<defs>${defs}</defs><g font-family="${SANS}">${head}${cells.join("")}${foot}</g>`,
    });
  },
};
