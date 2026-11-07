import {
  PALETTES,
  avatar,
  compact,
  truncate as fitText,
  document as svgDocument,
} from "../../kit/svg.ts";
import type { RepoStats } from "../../stats/types.ts";
import { DEFAULT_OPTIONS, type Design } from "../types.ts";
import { frame, kinds, monthIndex, monthLabel, num, prRows, t } from "./_shared.ts";

const W = 840;
const PAD = 24;
const GAP = 12;
const MIN_STARS = 1000;
const COUNT = 5;
const MIN_COUNT = 3;

/** Top `COUNT` repos with ≥ `MIN_STARS` stars by contributions; topped up to `MIN_COUNT` from the rest. */
function select(repos: RepoStats[]): { picked: RepoStats[]; filled: number } {
  const picked = repos.filter((r) => r.stars >= MIN_STARS && r.total > 0).slice(0, COUNT);
  let filled = 0;
  for (const r of repos) {
    if (picked.length >= MIN_COUNT) break;
    if (r.total > 0 && !picked.includes(r)) {
      picked.push(r);
      filled++;
    }
  }
  return { picked, filled };
}

export const design: Design = {
  id: "H02",
  slug: "selected-repos",
  title: "Selected repositories",
  idea: "A headline tile per notable repository, led by its total contribution count, each with its PR, issue and discussion counts and a monthly activity strip. Rule: the top 5 repositories with at least 1,000 stars by contributions; if fewer than 3 qualify, the biggest remaining repositories fill up to 3.",
  render(stats, theme, options = DEFAULT_OPTIONS) {
    const { outcomes } = options;
    const p = PALETTES[theme];
    const { picked, filled } = select(stats.repos);
    let body = "";

    body += t(PAD, 38, "Selected repositories", 16, p.text, 'font-weight="600"');
    const rule =
      filled > 0
        ? `Repositories with ${num(MIN_STARS)}+ stars by contributions, topped up with the next biggest`
        : `Top ${picked.length} by contributions among repositories with ${num(MIN_STARS)}+ stars`;
    body += t(PAD, 58, rule, 12, p.muted);

    if (!picked.length) {
      const h = 96;
      body += t(PAD, 80, "No contributions to other people's repositories yet.", 12, p.faint);
      return svgDocument({
        width: W,
        height: h,
        title: "Selected repositories",
        body: frame(W, h, p) + body,
      });
    }

    const n = picked.length;
    const tw = (W - 2 * PAD - GAP * (n - 1)) / n;
    const top = 76;
    const th = 312;
    const end = stats.generatedAt.slice(0, 7);

    picked.forEach((r, i) => {
      const x = PAD + i * (tw + GAP);
      const ix = x + 14;
      const iw = tw - 28;
      const name = r.repo.slice(r.owner.length + 1);
      body += `<rect x="${x.toFixed(1)}" y="${top}" width="${tw.toFixed(1)}" height="${th}" rx="6" fill="${p.surface}" stroke="${p.hair}"/>`;

      // Identity
      body += avatar({
        id: `h02-a${i}`,
        login: r.owner,
        uri: stats.avatars[r.owner],
        x: ix,
        y: top + 14,
        size: 28,
        org: r.ownerType === "Organization",
        palette: p,
      });
      body += t(ix + 36, top + 25, fitText(r.owner, iw - 36, 11), 11, p.muted);
      body += t(ix + 36, top + 41, fitText(name, iw - 36, 13), 13, p.text, 'font-weight="600"');

      // Headline number
      body += t(ix, top + 90, num(r.total), 34, p.text, 'font-weight="600"');
      body += t(ix, top + 108, "contributions", 11, p.muted);

      // Breakdown rows
      const rest = [
        { label: "Issues opened", value: r.issues, color: p.issue },
        { label: "Discussions", value: r.discussions, color: p.discussion },
      ];
      const rows = outcomes
        ? [...prRows(r, p, outcomes, { open: "PRs open", closed: "PRs closed" }), ...rest]
        : [
            { label: "PRs merged", value: r.prsMerged, color: p.merged },
            { label: "PRs not merged", value: r.prs - r.prsMerged, color: p.pr },
            ...rest,
          ];
      // Four rows 18 px apart; three sit a little lower to fill the space, five close up.
      const rowStep = rows.length > 4 ? 16 : 18;
      const rowTop = top + 134 + (rows.length < 4 ? 9 : rows.length > 4 ? -6 : 0);
      rows.forEach((row, j) => {
        const ry = rowTop + j * rowStep;
        body += `<rect x="${ix}" y="${ry - 8}" width="8" height="8" rx="2" fill="${row.color}"/>`;
        body += t(ix + 14, ry, row.label, 11, p.muted);
        body += t(
          ix + iw,
          ry,
          row.value ? num(row.value) : "–",
          12,
          row.value ? p.text : p.faint,
          'text-anchor="end" font-weight="600"',
        );
      });

      // Share bar: the same four kinds as a 100 % strip
      let cx = ix;
      const total = Math.max(1, r.total);
      const segs = kinds(r, p, outcomes).filter((k) => k.value > 0);
      segs.forEach((k, j) => {
        const w = Math.max(2, (k.value / total) * (iw - (segs.length - 1)));
        const last = j === segs.length - 1;
        body += `<rect x="${cx.toFixed(1)}" y="${top + 226}" width="${(last ? ix + iw - cx : w).toFixed(1)}" height="6" rx="2" fill="${k.color}"/>`;
        cx += w + 1;
      });

      // Monthly strip from the repo's first month to the snapshot month
      const keys = Object.keys(r.monthly).filter((k) => (r.monthly[k] ?? 0) > 0);
      const start = keys.length ? (keys.sort()[0] ?? end) : end;
      const months = Math.max(1, monthIndex(end) - monthIndex(start) + 1);
      const peak = Math.max(1, ...keys.map((k) => r.monthly[k] ?? 0));
      const bw = iw / months;
      const base = top + 280;
      body += `<line x1="${ix}" y1="${base + 0.5}" x2="${ix + iw}" y2="${base + 0.5}" stroke="${p.border}"/>`;
      for (const k of keys) {
        const v = r.monthly[k] ?? 0;
        const h = Math.max(2, (v / peak) * 22);
        const bx = ix + (monthIndex(k) - monthIndex(start)) * bw;
        body += `<rect x="${(bx + (bw > 3 ? 0.5 : 0)).toFixed(1)}" y="${(base - h).toFixed(1)}" width="${Math.max(1, bw - (bw > 3 ? 1 : 0)).toFixed(1)}" height="${h.toFixed(1)}" fill="${p.accent}" opacity="0.85"/>`;
      }
      body += t(ix, base + 16, monthLabel(start), 10, p.faint);
      body += t(ix + iw, base + 16, monthLabel(end), 10, p.faint, 'text-anchor="end"');

      // Stars and language
      const meta = `${compact(r.stars)}★${r.language ? ` · ${r.language}` : ""}`;
      body += t(ix, top + 214, fitText(meta, iw, 11), 11, p.faint);
    });

    const fy = top + th + 26;
    body += t(
      PAD,
      fy,
      fitText(
        outcomes === "full"
          ? `Items opened by @${stats.user} · PRs closed: without merging · strip: contributions per month, own scale per tile`
          : `Items opened by @${stats.user} · strip: contributions per month since the first, each tile to its own scale`,
        W - 2 * PAD,
        11,
      ),
      11,
      p.faint,
    );
    const h = fy + 16;
    return svgDocument({
      width: W,
      height: h,
      title: "Selected repositories",
      body: frame(W, h, p) + body,
    });
  },
};
