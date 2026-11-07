import { DEFAULT_OPTIONS, type Design } from "../types.ts";
import {
  STD_LEGEND,
  avatar,
  barScale,
  breakCue,
  breakCueW,
  dataOf,
  delay,
  frame,
  header,
  legend,
  num,
  repoLabel,
  rule,
  segsOf,
  stack,
  t,
  themeOf,
  topOf,
} from "./_shared.ts";

const title = "Repo leaderboard";

export const design: Design = {
  id: "A01",
  slug: "repo-leaderboard",
  title,
  idea: 'Top 12 external repos ranked by PRs + issues + discussions, each with a stacked bar showing the mix (merged PRs, other PRs, issues, discussions) and the counts beside it. When the top repo has more than twice the runner-up\'s total, its bar is shortened and labelled with its true total and “not to scale”, so the other bars stay readable. With outcomes "none" PRs are one segment; "merged" highlights merged PRs within them; "full" splits them into merged, open and closed unmerged.',
  render(stats, theme, options = DEFAULT_OPTIONS) {
    const level = options.outcomes;
    const T = themeOf(theme);
    const d = dataOf(stats);
    const W = 840;
    const top = 100;
    const rh = 34;
    const rows = d.repos.slice(0, 12);
    const N = rows.length;
    const { scaleMax, broken } = barScale(rows.map((r) => r.total));
    const bx = 348;
    // A shortened top bar is followed by its true total and a cue, which may run up to 30px
    // past the bar column (the PRs numbers are right-aligned at 664).
    const cueSize = 12.5;
    const bw =
      broken && rows[0] ? Math.min(254, 254 + 30 - 8 - breakCueW(rows[0].total, cueSize)) : 254;
    let b = header(
      T,
      "Top repositories I contribute to",
      `Other people's repos, ranked by PRs + issues + discussions · ${topOf(N, d.nRepos)}`,
    );
    b +=
      t(T, 40, top - 10, "#", { size: 11, fill: "muted", anchor: "end" }) +
      t(T, 84, top - 10, "Repository", { size: 11, fill: "muted" }) +
      t(T, bx, top - 10, "Mix", { size: 11, fill: "muted" });
    b +=
      t(T, 664, top - 10, "PRs", { size: 11, fill: "muted", anchor: "end" }) +
      t(T, 716, top - 10, "Issues", { size: 11, fill: "muted", anchor: "end" }) +
      t(T, 760, top - 10, "Disc.", { size: 11, fill: "muted", anchor: "end" }) +
      t(T, 812, top - 10, "Total", { size: 11, fill: "muted", anchor: "end", weight: 600 });
    b += rule(T, W, top - 1);
    rows.forEach((r, i) => {
      const y = top + i * rh;
      const cy = y + rh / 2;
      let g = "";
      if (i) g += rule(T, W, y, "hair");
      g += t(T, 40, cy + 4.5, String(i + 1), {
        size: 12,
        fill: "muted",
        anchor: "end",
        mono: true,
      });
      g += avatar(T, d.avatars, r.owner, r.ownerType, 52, cy - 11, 22);
      g += repoLabel(T, 84, cy + 4.5, r.repo, 250);
      g += `<g class="grow"${delay(i)}>${stack(T, bx, cy - 5, 10, segsOf(T, r, level), scaleMax, bw)}</g>`;
      if (r.total > scaleMax) g += breakCue(T, bx + bw + 8, cy + 4.5, r.total, cueSize);
      g +=
        num(T, 664, cy + 4.5, r.prs, { size: 12.5 }) +
        num(T, 716, cy + 4.5, r.issues, { size: 12.5 }) +
        num(T, 760, cy + 4.5, r.discussions, { size: 12.5 });
      g += num(T, 812, cy + 4.5, r.total, { size: 13, weight: 700 });
      b += `<g class="row"${delay(i)}>${g}</g>`;
    });
    const fy = top + N * rh;
    b += rule(T, W, fy);
    b += legend(T, 24, fy + 28, STD_LEGEND(T, level));
    return frame(T, W, fy + 46, b, title);
  },
};
