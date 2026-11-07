import type { RepoStats } from "../../stats/types.ts";
import type { Design } from "../types.ts";
import {
  THEMES,
  derive,
  esc,
  fmt,
  longDate,
  monthYear,
  plural,
  svg,
  text,
  words,
} from "./_shared.ts";

/** A run of text; `bold` runs carry the figures. */
type Run = [text: string, cls: "" | "b"];

/** "12 PRs, 9 merged", led by the issue count when issues outnumber PRs. */
function desc(r: RepoStats): string {
  const parts: string[] = [];
  if (r.prs) parts.push(`${plural(r.prs, "PR")}${r.prsMerged ? `, ${r.prsMerged} merged` : ""}`);
  if (r.issues && r.issues >= r.prs) parts.unshift(plural(r.issues, "issue"));
  if (!parts.length) parts.push(plural(r.discussions, "discussion"));
  return parts.slice(0, 2).join(", ");
}

function paragraph(stats: Parameters<Design["render"]>[0]): Run[] {
  const { T, asOf, extTotal, firstPR } = derive(stats);
  const { repos, owners } = stats;
  const runs: Run[] = [
    [`Since ${monthYear(firstPR)} I have opened `, ""],
    [`${T.externalPRs} pull requests`, "b"],
    [" in repositories I don't own, and ", ""],
    [`${T.externalMerged} of them were merged`, "b"],
    [". Counting issues and discussions, that is ", ""],
    [`${fmt(extTotal)} contributions`, "b"],
    [" to ", ""],
    [`${T.externalRepos} repositories`, "b"],
    [` under ${T.externalOwners} owners. `, ""],
  ];
  const lead = repos.slice(0, 3);
  lead.forEach((r, i) => {
    const before = i === 0 ? "Most went to " : i === 1 ? ", then " : " and ";
    runs.push([before, ""], [r.repo, "b"], [` (${desc(r)})`, ""]);
  });
  if (lead.length) runs.push([". ", ""]);
  const fam = stats.families
    .filter((f) => f.owners.length > 1)
    .sort((a, b) => b.total - a.total)[0];
  if (fam) {
    const active = fam.owners.filter((o) => owners.some((x) => x.owner === o)).length;
    runs.push(
      [`Across its ${words(active)} GitHub orgs, `, ""],
      [fam.name, "b"],
      [` adds up to ${fam.total} contributions in ${fam.repos} repositories. `, ""],
    );
  }
  const yr = asOf.slice(0, 4);
  const yearly = repos
    .map((r) => ({
      r,
      n: Object.entries(r.monthly)
        .filter(([k]) => k.startsWith(yr))
        .reduce((s, [, v]) => s + v, 0),
    }))
    .sort((a, b) => b.n - a.n);
  const yTotal = yearly.reduce((s, x) => s + x.n, 0);
  const best = yearly[0];
  if (best && yTotal) {
    const yRepos = yearly.filter((x) => x.n > 0).length;
    runs.push(
      [`In ${yr} so far: `, ""],
      [`${yTotal} contributions to ${yRepos} ${yRepos === 1 ? "repository" : "repositories"}`, "b"],
      [", led by ", ""],
      [best.r.repo, "b"],
      [` (${best.n}).`, ""],
    );
  }
  // join neighbours of one class so word splitting sees the same text however it was assembled
  const merged: Run[] = [];
  for (const [s, c] of runs) {
    const last = merged.at(-1);
    if (last && last[1] === c) last[0] += s;
    else merged.push([s, c]);
  }
  const last = merged.at(-1);
  if (last) last[0] = last[0].trimEnd();
  return merged;
}

export const design: Design = {
  id: "C05",
  slug: "in-brief",
  title: "In brief",
  idea: "A short paragraph written from the data: totals, merge count, the top three repositories, the biggest company family (the one with several owners and the most contributions) and this year's leading repository, with every figure set in bold.",
  render(stats, theme) {
    const t = THEMES[theme];
    const { asOf } = derive(stats);
    const runs = paragraph(stats);
    const FS = 20;
    const LH = 33;
    const W = 840;
    const P = 28;
    const MAXW = W - 2 * P - 34;
    const wid = (s: string, cls: string) => s.length * FS * (cls.includes("b") ? 0.55 : 0.505);
    // break into words, keeping the class; a number stays glued to the word after it
    const toks: Run[] = [];
    for (const [s, cls] of runs) {
      for (const part of s.replace(/(\(?\d[\d,]*) /g, "$1 ").split(/(?<= )/)) {
        if (part) toks.push([part, cls]);
      }
    }
    const lines: Run[][] = [[]];
    let lw = 0;
    for (const tk of toks) {
      const w = wid(tk[0].trimEnd(), tk[1]);
      if (lw + w > MAXW && lines.at(-1)?.length) {
        lines.push([]);
        lw = 0;
      }
      lines.at(-1)?.push(tk);
      lw += wid(tk[0], tk[1]);
    }
    const top = 62;
    const H = top + LH * (lines.length - 1) + 64;
    const x = P + 22;
    let b = `<rect x="${P}" y="20" width="3" height="${H - 40}" fill="${t.accent}"/>`;
    b += text(x, 36, "UPSTREAM, IN BRIEF", "s b cap mu", 'font-size="11"');
    lines.forEach((ln, i) => {
      const spans: Run[] = [];
      for (const [s, c] of ln) {
        const prev = spans.at(-1);
        if (prev && prev[1] === c) prev[0] += s;
        else spans.push([s, c]);
      }
      const end = spans.at(-1);
      if (end) end[0] = end[0].trimEnd();
      const body = spans
        .map(([s, c]) => `<tspan class="${c ? "t b" : "tx"}">${esc(s)}</tspan>`)
        .join("");
      b += `<text x="${x}" y="${top + 6 + LH * i}" class="s" font-size="${FS}" xml:space="preserve">${body}</text>`;
    });
    b += text(
      x,
      H - 20,
      `Public repositories owned by someone else · PRs, issues and discussions · as of ${longDate(asOf)}`,
      "s f",
      'font-size="11.5"',
    );
    return svg(W, H, t, `.tx{fill:${t.muted}}`, b, runs.map((r) => r[0]).join(""));
  },
};
