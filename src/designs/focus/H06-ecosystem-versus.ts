import { mergeRate } from "../../kit/outcomes.ts";
import {
  PALETTES,
  avatar,
  truncate as fitText,
  percent,
  document as svgDocument,
} from "../../kit/svg.ts";
import { DEFAULT_OPTIONS, type Design } from "../types.ts";
import { frame, monthLabel, num, plural, prRows, sum, t, topGroups } from "./_shared.ts";

const W = 840;
const PAD = 24;
const GAP = 16;
const MAX_MEMBERS = 7;

export const design: Design = {
  id: "H06",
  slug: "ecosystem-versus",
  title: "Ecosystem versus ecosystem",
  idea: "The three biggest ecosystems side by side: total and share, each contribution kind on one shared scale with the leader in bold, merge rate, active span, top repo and member owners. Rule: the top 3 ecosystems by contributions; when there are fewer than 3, the biggest independent owners fill the remaining columns as groups of one.",
  render(stats, theme, options = DEFAULT_OPTIONS) {
    const { outcomes } = options;
    const p = PALETTES[theme];
    const groups = topGroups(stats, 3);
    const upstream = sum(stats.repos, (r) => r.total);
    let body = "";

    body += t(
      PAD,
      38,
      groups.length > 1 ? "Ecosystem versus ecosystem" : "Biggest ecosystem",
      16,
      p.text,
      'font-weight="600"',
    );
    body += t(
      PAD,
      58,
      `The ${groups.length === 1 ? "biggest group" : `${groups.length} biggest groups`} of owners by contributions · ${num(upstream)} upstream contributions in all`,
      12,
      p.muted,
    );
    if (!groups.length) {
      const h = 96;
      body += t(PAD, 80, "No contributions to upstream repos yet.", 12, p.faint);
      return svgDocument({
        width: W,
        height: h,
        title: "Ecosystem versus ecosystem",
        body: frame(W, h, p) + body,
      });
    }

    const n = groups.length;
    const cw = (W - 2 * PAD - GAP * (n - 1)) / n;
    const top = 78;
    const kindRows = groups.map((g) => [
      ...prRows(g, p, outcomes),
      { label: "Issues", value: g.issues, color: p.issue },
      { label: "Discussions", value: g.discussions, color: p.discussion },
    ]);
    const kindCount = kindRows[0]?.length ?? 4;
    const kindMax = Math.max(1, ...kindRows.flat().map((k) => k.value));
    const best = (f: (i: number) => number) => {
      const vals = groups.map((_, i) => f(i));
      const m = Math.max(...vals);
      return (i: number) =>
        n > 1 && m > 0 && vals[i] === m && vals.filter((v) => v === m).length === 1;
    };
    const leadsTotal = best((i) => groups[i]?.total ?? 0);
    const leadsKind = Array.from({ length: kindCount }, (_, k) =>
      best((i) => kindRows[i]?.[k]?.value ?? 0),
    );
    const rate = (i: number) => {
      const g = groups[i];
      return g?.prs ? g.prsMerged / g.prs : 0;
    };
    const leadsRate = best(rate);
    let bottom = top;

    groups.forEach((g, i) => {
      const x = PAD + i * (cw + GAP);
      const ix = x + 16;
      const iw = cw - 32;
      let y = top;

      // Identity
      body += avatar({
        id: `h06-g${i}`,
        login: g.lead,
        uri: stats.avatars[g.lead],
        x: ix,
        y: y + 16,
        size: 36,
        org: g.leadIsOrg,
        palette: p,
      });
      body += t(ix + 46, y + 32, fitText(g.name, iw - 46, 16), 16, p.text, 'font-weight="600"');
      const sub = g.ecosystem
        ? `${plural(g.owners.length, "owner")} · ${plural(g.repos.length, "repo")}`
        : `independent owner · ${plural(g.repos.length, "repo")}`;
      body += t(ix + 46, y + 49, fitText(sub, iw - 46, 11), 11, p.muted);
      y += 70;

      // Total and share
      body += t(ix, y + 28, num(g.total), 30, p.text, 'font-weight="600"');
      body += t(
        ix + iw,
        y + 14,
        `${percent(g.total, upstream)}%`,
        15,
        leadsTotal(i) ? p.text : p.muted,
        'text-anchor="end" font-weight="600"',
      );
      body += t(ix + iw, y + 29, "of upstream", 11, p.faint, 'text-anchor="end"');
      body += t(ix, y + 46, "contributions", 11, p.muted);
      y += 74;

      // Kinds on one scale across columns
      kindRows[i]?.forEach((k, j) => {
        const ry = y + j * 30;
        const lead = leadsKind[j]?.(i) ?? false;
        body += t(ix, ry, k.label, 11, p.muted);
        body += t(
          ix + iw,
          ry,
          k.value ? num(k.value) : "–",
          12,
          k.value ? p.text : p.faint,
          `text-anchor="end"${lead ? ' font-weight="700"' : ""}`,
        );
        body += `<rect x="${ix}" y="${ry + 6}" width="${iw}" height="6" rx="2" fill="${p.hair}"/>`;
        if (k.value > 0) {
          body += `<rect x="${ix}" y="${ry + 6}" width="${Math.max(2, (k.value / kindMax) * iw).toFixed(1)}" height="6" rx="2" fill="${k.color}"/>`;
        }
      });
      y += kindCount * 30 + 6;

      // Facts
      body += `<line x1="${ix}" y1="${y - 8.5}" x2="${ix + iw}" y2="${y - 8.5}" stroke="${p.hair}"/>`;
      const firsts = g.repos
        .map((r) => r.first)
        .filter((d): d is string => d !== null)
        .sort();
      const lasts = g.repos
        .map((r) => r.last)
        .filter((d): d is string => d !== null)
        .sort();
      const topRepo = g.repos[0];
      const rateFact = {
        label: "Merge rate",
        value: g.prs ? `${mergeRate(g, outcomes)}% of ${plural(g.prs, "PR")}` : "no PRs",
        bold: leadsRate(i),
      };
      const facts = [
        ...(outcomes === "full" ? [rateFact] : []),
        {
          label: "Active",
          value:
            firsts[0] && lasts.at(-1)
              ? `${monthLabel(firsts[0].slice(0, 7))} – ${monthLabel((lasts.at(-1) ?? "").slice(0, 7))}`
              : "–",
          bold: false,
        },
        {
          label: "Top repo",
          value: topRepo
            ? `${topRepo.repo.slice(topRepo.owner.length + 1)} · ${num(topRepo.total)}`
            : "–",
          bold: false,
        },
      ];
      facts.forEach((f, j) => {
        const fy = y + 10 + j * 22;
        body += t(ix, fy, f.label, 11, p.muted);
        body += t(
          ix + iw,
          fy,
          fitText(f.value, iw - 64, 12),
          12,
          p.text,
          `text-anchor="end"${f.bold ? ' font-weight="700"' : ""}`,
        );
      });
      y += facts.length * 22 + 8;

      // Member owners
      if (g.ecosystem) {
        const shown = g.owners.slice(0, MAX_MEMBERS);
        const size = 22;
        const step = Math.min(size + 6, (iw - 30) / Math.max(1, shown.length));
        shown.forEach((o, j) => {
          const type = stats.owners.find((x) => x.owner === o)?.type;
          body += avatar({
            id: `h06-m${i}-${j}`,
            login: o,
            uri: stats.avatars[o],
            x: ix + j * step,
            y,
            size,
            org: type !== "User",
            palette: p,
          });
        });
        if (g.owners.length > shown.length) {
          body += t(
            ix + shown.length * step + 4,
            y + 15,
            `+${g.owners.length - shown.length}`,
            11,
            p.muted,
          );
        }
      }
      y += 22 + 16;
      bottom = Math.max(bottom, y);
    });

    // Column cards behind the content
    let cards = "";
    groups.forEach((_, i) => {
      const x = PAD + i * (cw + GAP);
      cards += `<rect x="${x.toFixed(1)}" y="${top}" width="${cw.toFixed(1)}" height="${bottom - top}" rx="6" fill="${p.surface}" stroke="${p.hair}"/>`;
    });

    const fy = bottom + 24;
    body += t(
      PAD,
      fy,
      "Bars share one scale across columns · bold marks the highest value in a row",
      11,
      p.faint,
    );
    const h = fy + 16;
    return svgDocument({
      width: W,
      height: h,
      title: "Ecosystem versus ecosystem",
      body: frame(W, h, p) + cards + body,
    });
  },
};
