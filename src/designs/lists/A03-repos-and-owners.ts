import { DEFAULT_OPTIONS, type Design } from "../types.ts";
import {
  STD_LEGEND,
  avatar,
  dataOf,
  delay,
  esc,
  frame,
  header,
  legend,
  num,
  percent,
  plural,
  repoLabel,
  segsOf,
  stack,
  t,
  themeOf,
  truncate,
} from "./_shared.ts";

const title = "Repos and owners";

export const design: Design = {
  id: "A03",
  slug: "repos-and-owners",
  title,
  idea: "Four headline numbers, then the top 10 repos and top 10 owners side by side. Each row has a 100% bar showing what kind of contribution it was (PR-heavy vs issue-heavy), so the number carries size and the bar carries character.",
  render(stats, theme, options = DEFAULT_OPTIONS) {
    const level = options.outcomes;
    const T = themeOf(theme);
    const d = dataOf(stats);
    const { ext } = d;
    const W = 840;
    const repoRows = d.repos.slice(0, 10);
    const ownerRows = d.owners.slice(0, 10);
    const N = Math.max(repoRows.length, ownerRows.length);
    let b = header(
      T,
      "Where my open-source contributions go",
      `PRs, issues and discussions in repos I don't own`,
    );
    const tiles: [string, string][] = [
      [String(d.nRepos), "repos"],
      [String(d.nOwners), "owners (orgs and people)"],
      [
        String(ext.prs),
        level === "none"
          ? "PRs"
          : level === "merged"
            ? `PRs · ${ext.merged} merged`
            : `PRs · ${ext.merged} merged (${percent(ext.merged, ext.prs)}%)`,
      ],
      [String(ext.issues + ext.disc), `issues and discussions`],
    ];
    const tw = (W - 48 - 3 * 12) / 4;
    tiles.forEach(([n, l], i) => {
      const x = 24 + i * (tw + 12);
      b += `<rect x="${x + 0.5}" y="76.5" width="${tw - 1}" height="61" rx="6" fill="${T.zebra}" stroke="${T.hair}"/>`;
      b +=
        t(T, x + 14, 106, n, { size: 22, weight: 600, mono: true }) +
        t(T, x + 14, 126, esc(truncate(l, tw - 24, 11.5)), { size: 11.5, fill: "muted" });
    });
    const top = 186;
    const rh = 30;
    const cw = (W - 48 - 32) / 2;
    const panel = (x: number, label: string, rows: string[]) =>
      t(T, x, top - 16, label, { size: 13, weight: 600 }) +
      t(T, x + cw - 52, top - 16, "Mix", { size: 11, fill: "muted", anchor: "end" }) +
      t(T, x + cw, top - 16, "Total", { size: 11, fill: "muted", anchor: "end" }) +
      `<line x1="${x}" x2="${x + cw}" y1="${top - 6.5}" y2="${top - 6.5}" stroke="${T.border}"/>` +
      rows.map((rr, i) => `<g class="row"${delay(i)}>${rr}</g>`).join("");
    const mix = (
      x: number,
      cy: number,
      i: number,
      r: Parameters<typeof segsOf>[1] & { total: number },
    ) => {
      const mx = x + cw - 120;
      const mw = 68;
      return (
        `<rect x="${mx}" y="${cy - 3}" width="${mw}" height="6" rx="2" fill="${T.track}"/>` +
        `<g class="grow"${delay(i)}>${stack(T, mx, cy - 3, 6, segsOf(T, r, level), r.total, mw)}</g>` +
        num(T, x + cw, cy + 4.5, r.total, { size: 13, weight: 600 })
      );
    };
    const rowY = (i: number) => top + i * rh + rh / 2 - 4;
    const left = 24;
    const right = 24 + cw + 32;
    b += panel(
      left,
      "Top repos",
      repoRows.map((r, i) => {
        const cy = rowY(i);
        return (
          avatar(T, d.avatars, r.owner, r.ownerType, left, cy - 10, 20) +
          repoLabel(T, left + 30, cy + 4.5, r.repo, cw - 162, 12.5) +
          mix(left, cy, i, r)
        );
      }),
    );
    b += panel(
      right,
      "Top owners",
      ownerRows.map((o, i) => {
        const cy = rowY(i);
        return (
          avatar(T, d.avatars, o.owner, o.type, right, cy - 10, 20) +
          t(T, right + 30, cy + 4.5, esc(truncate(o.owner, cw - 180, 13)), { size: 13 }) +
          t(T, right + cw - 128, cy + 4.5, plural(o.repos, "repo"), {
            size: 11,
            fill: "faint",
            anchor: "end",
          }) +
          mix(right, cy, i, o)
        );
      }),
    );
    b += `<line x1="${24 + cw + 16}" x2="${24 + cw + 16}" y1="${top - 30}" y2="${top + N * rh - 8}" stroke="${T.hair}"/>`;
    const fy = top + N * rh + 14;
    b += legend(T, 24, fy + 6, STD_LEGEND(T, level));
    b += t(T, W - 24, fy + 6, "Mix = share of each row’s total", {
      size: 11.5,
      fill: "muted",
      anchor: "end",
    });
    return frame(T, W, fy + 26, b, title);
  },
};
