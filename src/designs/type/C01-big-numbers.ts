import { prsClosed, mergeRate as rateOf, totalsCounts } from "../../kit/outcomes.ts";
import { DEFAULT_OPTIONS, type Design } from "../types.ts";
import { THEMES, derive, fmt, kinds, svg, text, trunc } from "./_shared.ts";

export const design: Design = {
  id: "C01",
  slug: "big-numbers",
  title: "Big numbers",
  idea: "Four large, labeled headline figures for upstream work (PRs opened, merged, issues, owners), with the five most active owners underneath. Reads in one glance. With outcomes none the merged figure gives way to repos; merged drops the merge rate; full adds open and closed-unmerged PRs.",
  render(stats, theme, options = DEFAULT_OPTIONS) {
    const lv = options.outcomes;
    const t = THEMES[theme];
    const { T, asOf, extIssues, firstAny, mergeRate } = derive(stats);
    const W = 840;
    const H = 282;
    const P = 24;
    const c = totalsCounts(T);
    const prsCol: [number, string, string] =
      lv === "full"
        ? [T.externalPRs, "PRs", `${c.prsOpen} open · ${prsClosed(c)} closed unmerged`]
        : [T.externalPRs, "PRs", "opened upstream"];
    const mergedCol: [number, string, string] = [
      T.externalMerged,
      "merged",
      lv === "merged"
        ? "of those opened"
        : `${lv === "full" ? rateOf(c, lv) : Math.round(mergeRate * 100)}% of those opened`,
    ];
    const cols: [number, string, string][] =
      lv === "none"
        ? [
            prsCol,
            [extIssues, "issues", "reported upstream"],
            [T.externalRepos, "repos", "contributed to"],
            [T.externalOwners, "owners", "orgs and people"],
          ]
        : [
            prsCol,
            mergedCol,
            [extIssues, "issues", "reported upstream"],
            [T.externalOwners, "owners", `${T.externalRepos} repos`],
          ];
    const top = stats.owners.slice(0, 5);
    const cw = (W - 2 * P) / 4;
    const years =
      firstAny.slice(0, 4) === asOf.slice(0, 4)
        ? asOf.slice(0, 4)
        : `${firstAny.slice(0, 4)}–${asOf.slice(0, 4)}`;
    let b = "";
    b += text(P, 34, "UPSTREAM", "s b cap ac", 'font-size="11"');
    b += text(
      P + 82,
      34,
      `Contributions to repos owned by others · ${years}`,
      "s mu",
      'font-size="12"',
    );
    cols.forEach(([n, l1, l2], i) => {
      const x = P + i * cw;
      b += `<g class="fi" style="animation-delay:${0.08 * i}s">`;
      b += text(
        x - 3,
        120,
        fmt(n),
        "s n t",
        'font-size="72" font-weight="300" letter-spacing="-1.5"',
      );
      b += text(x, 148, l1, "s b t", 'font-size="14"');
      b += text(x, 167, l2, "s mu", 'font-size="12"');
      b += "</g>";
      if (i) b += `<line x1="${x - 16.5}" y1="62" x2="${x - 16.5}" y2="170" stroke="${t.hair}"/>`;
    });
    b += `<line x1="${P}" y1="196.5" x2="${W - P}" y2="196.5" stroke="${t.border}"/>`;
    b += text(P, 222, "MOST ACTIVE IN", "s b cap mu", 'font-size="10"');
    b += text(W - P, 222, "contributions = PRs + issues + discussions", "s f e", 'font-size="11"');
    const lw = (W - 2 * P) / 5;
    top.forEach((o, i) => {
      const x = P + i * lw;
      b += text(x, 246, trunc(o.owner, 18), "s b t", 'font-size="13"');
      b += text(x + lw - 18, 246, String(o.total), "s n t e", 'font-size="13"');
      b += text(x, 265, kinds(o.prs, o.issues, o.discussions), "s mu", 'font-size="11.5"');
    });
    const css =
      "@keyframes fi{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}";
    return svg(
      W,
      H,
      t,
      `.fi{animation:fi .6s ease-out both}${css}`,
      b,
      lv === "none"
        ? `Upstream: ${T.externalPRs} PRs opened, ${extIssues} issues, ${T.externalRepos} repos, ${T.externalOwners} owners`
        : `Upstream: ${T.externalPRs} PRs opened, ${T.externalMerged} merged, ${extIssues} issues, ${T.externalOwners} owners`,
    );
  },
};
