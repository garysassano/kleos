import { DEFAULT_OPTIONS, type Design } from "../types.ts";
import {
  STD_LEGEND,
  avatar,
  barScale,
  breakCue,
  breakCueW,
  capitalize,
  compact,
  dataOf,
  delay,
  esc,
  frame,
  header,
  legend,
  repoLabel,
  rule,
  segsOf,
  stack,
  t,
  themeOf,
  topOf,
} from "./_shared.ts";

const title = "Star tier vs my share";

/** Star-count thresholds for the tier letters, highest first. */
const TIERS: readonly [string, number][] = [
  ["S+", 50000],
  ["S", 10000],
  ["A", 1000],
  ["B", 100],
  ["C", 0],
];
const tierOf = (stars: number): string => TIERS.find(([, min]) => stars >= min)?.[0] ?? "C";

export const design: Design = {
  id: "A06",
  slug: "tier-vs-share",
  title,
  idea: "Star-tier letters (S+ to C) that say what they mean: the left side is the repo’s popularity (stars, log scale, tier letter), the right side is what I contributed there. Big repos with small bars and small repos with big bars become obvious. When the top repo has more than twice the runner-up's total, its bar is shortened and marked “not to scale”.",
  render(stats, theme, options = DEFAULT_OPTIONS) {
    const level = options.outcomes;
    const T = themeOf(theme);
    const d = dataOf(stats);
    const W = 840;
    const top = 112;
    const rh = 30;
    const rows = d.repos.slice(0, 15);
    const N = rows.length;
    const cx = 262; // left bars end here (grow leftwards)
    const lw = 120;
    const lx0 = cx - 4;
    const nameX = cx + 14;
    const rx0 = 572;
    const LOGMIN = 1;
    const LOGMAX = Math.log10(250000);
    const starLen = (s: number) =>
      Math.max(3, ((Math.log10(Math.max(10, s)) - LOGMIN) / (LOGMAX - LOGMIN)) * lw);
    const { scaleMax, broken } = barScale(rows.map((r) => r.total));
    // Every bar is followed by its total; a shortened one also by "not to scale", ending at W - 24.
    const valSize = 12.5;
    const rw =
      broken && rows[0] ? Math.min(180, W - 24 - 8 - breakCueW(rows[0].total, valSize) - rx0) : 180;
    let b = header(
      T,
      "Repo popularity vs what I contributed",
      `${capitalize(topOf(N, d.nRepos))} external repos by my PRs + issues + discussions`,
    );
    b +=
      t(T, 24, top - 26, "Repo popularity", { size: 12, weight: 600 }) +
      t(T, 24, top - 11, "tier · ★ stars (log scale)", { size: 11, fill: "muted" });
    b += t(T, nameX, top - 11, "Repository", { size: 11, fill: "muted" });
    b +=
      t(T, rx0, top - 26, "My contributions", { size: 12, weight: 600 }) +
      t(T, rx0, top - 11, "PRs + issues + discussions", { size: 11, fill: "muted" });
    b += rule(T, W, top - 1);
    rows.forEach((r, i) => {
      const y = top + i * rh;
      const cy = y + rh / 2;
      let g = "";
      if (i) g += rule(T, W, y, "hair");
      const tier = tierOf(r.stars);
      const strong = tier === "S+" || tier === "S";
      g += `<rect x="24.5" y="${cy - 9.5}" width="27" height="19" rx="4" fill="${strong ? T.zebra : "none"}" stroke="${strong ? T.muted : T.border}"/>`;
      g += t(T, 38, cy + 4.3, tier, {
        size: 12,
        weight: 700,
        anchor: "middle",
        fill: strong ? "text" : "muted",
      });
      const L = starLen(r.stars);
      g += `<rect class="growl"${delay(i)} x="${(lx0 - L).toFixed(1)}" y="${cy - 4}" width="${L.toFixed(1)}" height="8" rx="2" fill="${T.bar}"/>`;
      g += t(T, lx0 - L - 8, cy + 4.3, compact(r.stars), {
        size: 12,
        fill: "muted",
        anchor: "end",
        mono: true,
      });
      g += avatar(T, d.avatars, r.owner, r.ownerType, nameX, cy - 10, 20);
      g += repoLabel(T, nameX + 28, cy + 4.5, r.repo, rx0 - nameX - 28 - 16);
      g += `<g class="grow"${delay(i)}>${stack(T, rx0, cy - 4, 8, segsOf(T, r, level), scaleMax, rw)}</g>`;
      const end = Math.min(rw, Math.max(3, (r.total / scaleMax) * rw));
      g +=
        r.total > scaleMax
          ? breakCue(T, rx0 + end + 8, cy + 4.3, r.total, valSize)
          : t(T, rx0 + end + 8, cy + 4.3, String(r.total), {
              size: valSize,
              weight: 700,
              mono: true,
            });
      b += `<g class="row"${delay(i)}>${g}</g>`;
    });
    const fy = top + N * rh;
    b += rule(T, W, fy);
    b += t(
      T,
      24,
      fy + 26,
      esc("Tier by repo stars: S+ ≥ 50k · S ≥ 10k · A ≥ 1k · B ≥ 100 · C < 100"),
      {
        size: 11.5,
        fill: "muted",
      },
    );
    if (level === undefined) {
      b += legend(T, rx0 - 150, fy + 26, [
        { c: T.pr, label: "PRs" },
        { c: T.iss, label: "Issues" },
        { c: T.disc, label: "Discussions" },
      ]);
      b += t(
        T,
        24,
        fy + 46,
        `Lighter purple = PRs not merged. Stars measure the repo, not me; the bar on the right is my own activity there.`,
        { size: 11.5, fill: "muted" },
      );
      return frame(T, W, fy + 64, b, title);
    }
    // The full legend does not fit beside the tier note, so it gets its own line.
    const own = level === "full";
    const ly = own ? fy + 46 : fy + 26;
    b += legend(T, own ? 24 : rx0 - 150, ly, STD_LEGEND(T, level));
    b += t(
      T,
      24,
      ly + 20,
      "Stars measure the repo, not me; the bar on the right is my own activity there.",
      { size: 11.5, fill: "muted" },
    );
    return frame(T, W, ly + 38, b, title);
  },
};
