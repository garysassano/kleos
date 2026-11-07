import type { Design } from "../types.ts";
import {
  avatar,
  dataOf,
  delay,
  esc,
  frame,
  header,
  num,
  percent,
  plural,
  rule,
  t,
  themeOf,
  truncate,
} from "./_shared.ts";

const title = "Owner leaderboard";

export const design: Design = {
  id: "A02",
  slug: "owner-leaderboard",
  title,
  idea: "Top 12 organisations and people whose repos I contribute to, with repo count, a merged-PR gauge (merged of opened) and issue/discussion counts. Shows where PRs actually land versus where I mostly file issues.",
  render(stats, theme) {
    const T = themeOf(theme);
    const d = dataOf(stats);
    const W = 840;
    const top = 104;
    const rh = 40;
    const rows = d.owners.slice(0, 12);
    const N = rows.length;
    const gx = 330;
    const gw = 130;
    let b = header(
      T,
      "Organizations and people I contribute to",
      `${d.nOwners} owners outside my account · ${d.ext.merged} of ${d.ext.prs} PRs merged (${percent(d.ext.merged, d.ext.prs)}%) · ranked by PRs + issues + discussions`,
    );
    const hy = top - 12;
    b +=
      t(T, 40, hy, "#", { size: 11, fill: "muted", anchor: "end" }) +
      t(T, 84, hy, "Owner", { size: 11, fill: "muted" });
    b += t(T, gx, hy, "PRs merged / opened", { size: 11, fill: "muted" });
    b +=
      t(T, 664, hy, "Issues", { size: 11, fill: "muted", anchor: "end" }) +
      t(T, 740, hy, "Discussions", { size: 11, fill: "muted", anchor: "end" }) +
      t(T, 812, hy, "Total", { size: 11, fill: "muted", anchor: "end", weight: 600 });
    b += rule(T, W, top - 1);
    rows.forEach((o, i) => {
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
      g += avatar(T, d.avatars, o.owner, o.type, 52, cy - 13, 26);
      g += t(T, 90, cy - 2, esc(truncate(o.owner, 220, 13.5)), { size: 13.5, weight: 600 });
      g += t(
        T,
        90,
        cy + 13,
        `${o.type === "User" ? "User" : "Organization"} · ${plural(o.repos, "repo")}`,
        { size: 11, fill: "muted" },
      );
      g += `<rect x="${gx}" y="${cy - 3}" width="${gw}" height="6" rx="3" fill="${T.track}"/>`;
      if (o.prs) {
        const w = (o.prsMerged / o.prs) * gw;
        if (o.prsMerged)
          g += `<rect class="grow"${delay(i)} x="${gx}" y="${cy - 3}" width="${Math.max(6, w).toFixed(1)}" height="6" rx="3" fill="${T.pr}"/>`;
        g += t(T, gx + gw + 14, cy + 4.5, `${percent(o.prsMerged, o.prs)}%`, {
          size: 12.5,
          weight: 600,
          mono: true,
        });
        g += t(T, gx + gw + 62, cy + 4.5, `${o.prsMerged} of ${o.prs}`, {
          size: 12,
          fill: "muted",
          mono: true,
        });
      } else {
        g += t(T, gx + gw + 14, cy + 4.5, "no PRs", { size: 12, fill: "faint" });
      }
      g +=
        num(T, 664, cy + 4.5, o.issues, { size: 12.5 }) +
        num(T, 740, cy + 4.5, o.discussions, { size: 12.5 });
      g += num(T, 812, cy + 4.5, o.total, { size: 13, weight: 700 });
      b += `<g class="row"${delay(i)}>${g}</g>`;
    });
    const fy = top + N * rh;
    b += rule(T, W, fy);
    b += t(
      T,
      24,
      fy + 28,
      "Total = PRs opened + issues + discussions. Merged rate counts only PRs I opened; open PRs count as not yet merged.",
      { size: 11.5, fill: "muted" },
    );
    return frame(T, W, fy + 46, b, title);
  },
};
