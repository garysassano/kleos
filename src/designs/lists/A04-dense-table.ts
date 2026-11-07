import type { Design } from "../types.ts";
import {
  avatar,
  capitalize,
  compact,
  dataOf,
  delay,
  esc,
  frame,
  header,
  num,
  repoLabel,
  rule,
  span,
  t,
  themeOf,
  topOf,
  truncate,
} from "./_shared.ts";

const title = "Dense table";

export const design: Design = {
  id: "A04",
  slug: "dense-table",
  title,
  idea: "A compact 15-row table with explicit columns (stars, PRs, merged, issues, discussions, total, active years) and a totals row for all external repos. Nothing to decode: every number has a header.",
  render(stats, theme) {
    const T = themeOf(theme);
    const d = dataOf(stats);
    const { ext } = d;
    const W = 840;
    const top = 94;
    const rh = 25;
    const rows = d.repos.slice(0, 15);
    const N = rows.length;
    const C = {
      rank: 38,
      repo: 74,
      lang: 330,
      star: 470,
      prs: 524,
      merged: 586,
      issues: 642,
      disc: 712,
      total: 762,
      active: 816,
    };
    let b = header(
      T,
      "Contributions to other people’s repositories",
      `${capitalize(topOf(N, d.nRepos))} repos by PRs + issues + discussions`,
    );
    const hy = top - 9;
    const th = (x: number, s: string, anchor: "start" | "end" = "end", weight = 400) =>
      t(T, x, hy, s, { size: 11, fill: "muted", anchor, weight });
    b +=
      th(C.rank, "#") +
      th(C.repo - 26, "Repository", "start") +
      th(C.lang, "Language", "start") +
      th(C.star, "★ Stars") +
      th(C.prs, "PRs") +
      th(C.merged, "Merged") +
      th(C.issues, "Issues") +
      th(C.disc, "Discuss.") +
      th(C.total, "Total", "end", 600) +
      th(C.active, "Active");
    b += rule(T, W, top - 1);
    const sz = 12.5;
    rows.forEach((r, i) => {
      const y = top + i * rh;
      const by = y + rh / 2 + 4.3;
      let g = "";
      if (i % 2 === 1)
        g += `<rect x="24" y="${y}" width="${W - 48}" height="${rh}" fill="${T.zebra}"/>`;
      g += t(T, C.rank, by, String(i + 1), {
        size: 11.5,
        fill: "muted",
        anchor: "end",
        mono: true,
      });
      g += avatar(T, d.avatars, r.owner, r.ownerType, C.repo - 26, y + rh / 2 - 8, 16);
      g += repoLabel(T, C.repo - 4, by, r.repo, C.lang - C.repo - 12, sz);
      g +=
        `<circle cx="${C.lang + 4}" cy="${y + rh / 2}" r="4" fill="${r.langColor ?? T.faint}"/>` +
        t(T, C.lang + 14, by, esc(truncate(r.language ?? "—", 84, 12)), {
          size: 12,
          fill: "muted",
        });
      g += t(T, C.star, by, compact(r.stars), {
        size: sz,
        fill: "muted",
        anchor: "end",
        mono: true,
      });
      g +=
        num(T, C.prs, by, r.prs, { size: sz }) +
        num(T, C.merged, by, r.prsMerged, { size: sz }) +
        num(T, C.issues, by, r.issues, { size: sz }) +
        num(T, C.disc, by, r.discussions, { size: sz });
      g += num(T, C.total, by, r.total, { size: sz, weight: 700 });
      g += t(T, C.active, by, span(r), { size: 11.5, fill: "muted", anchor: "end", mono: true });
      b += `<g class="row"${delay(i)}>${g}</g>`;
    });
    const fy = top + N * rh;
    const by = fy + 22;
    b += rule(T, W, fy);
    b += t(T, C.repo - 26, by, `All ${d.nRepos} external repos · ${d.nOwners} owners`, {
      size: sz,
      weight: 600,
    });
    b +=
      num(T, C.prs, by, ext.prs, { size: sz, weight: 600 }) +
      num(T, C.merged, by, ext.merged, { size: sz, weight: 600 }) +
      num(T, C.issues, by, ext.issues, { size: sz, weight: 600 }) +
      num(T, C.disc, by, ext.disc, { size: sz, weight: 600 }) +
      num(T, C.total, by, ext.total, { size: sz, weight: 700 });
    b += t(
      T,
      24,
      by + 26,
      `Total = PRs + issues + discussions. Merged = PRs merged upstream. Active = years with at least one PR, issue or discussion.`,
      { size: 11, fill: "muted" },
    );
    return frame(T, W, by + 44, b, title);
  },
};
