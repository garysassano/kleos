import {
  PALETTES,
  avatar,
  truncate as fitText,
  percent,
  document as svgDocument,
} from "../../kit/svg.ts";
import type { Design } from "../types.ts";
import {
  allFamilies,
  dayLabel,
  frame,
  independentOwners,
  legend,
  num,
  plural,
  sum,
  t,
} from "./_shared.ts";

const W = 840;
const PAD = 24;
const MAX_FAMILIES = 7;

interface Outcome {
  opened: number;
  merged: number;
  open: number;
  closed: number;
}

const outcome = (x: { prs: number; prsMerged: number; prsOpen: number }): Outcome => ({
  opened: x.prs,
  merged: x.prsMerged,
  open: x.prsOpen,
  closed: Math.max(0, x.prs - x.prsMerged - x.prsOpen),
});

export const design: Design = {
  id: "H03",
  slug: "merge-funnel",
  title: "Merge funnel",
  idea: "What happens to the PRs I open upstream: opened, decided (merged or closed), merged, with the drop at each step, then the same split for each family next to everyone else. Rule: families ranked by PRs opened, up to 7, the remaining owners summed in one row.",
  render(stats, theme) {
    const p = PALETTES[theme];
    const all = outcome({
      prs: sum(stats.repos, (r) => r.prs),
      prsMerged: sum(stats.repos, (r) => r.prsMerged),
      prsOpen: sum(stats.repos, (r) => r.prsOpen),
    });
    const decided = all.merged + all.closed;
    let body = "";

    body += t(PAD, 38, "Pull request outcomes", 16, p.text, 'font-weight="600"');
    body += t(
      PAD,
      58,
      `${plural(all.opened, "PR")} opened in other people's repositories, as of ${dayLabel(stats.generatedAt)}`,
      12,
      p.muted,
    );

    // Funnel (left panel)
    const fx = PAD;
    const fw = 340;
    const labelW = 96;
    const barsW = fw - labelW;
    const cx = fx + labelW + barsW / 2;
    const bh = 28;
    const step = 62;
    const top = 90;
    const stages = [
      { label: "PRs opened", value: all.opened },
      { label: "merged or closed", value: decided },
      { label: "merged", value: all.merged },
    ];
    const drops = [
      all.open ? `${num(all.open)} still open` : "none still open",
      all.closed ? `${num(all.closed)} closed without merging` : "none closed unmerged",
    ];
    const scale = barsW / Math.max(1, all.opened);
    const widthOf = (v: number) => (v > 0 ? Math.max(4, v * scale) : 0);
    stages.forEach((s, i) => {
      const w = widthOf(s.value);
      const y = top + i * step;
      const next = stages[i + 1];
      if (next) {
        const nw = widthOf(next.value);
        body += `<path d="M${(cx - w / 2).toFixed(1)} ${y + bh}L${(cx + w / 2).toFixed(1)} ${y + bh}L${(cx + nw / 2).toFixed(1)} ${y + step}L${(cx - nw / 2).toFixed(1)} ${y + step}Z" fill="${p.muted}" opacity="0.1"/>`;
        body += t(cx, y + bh + 21, drops[i] ?? "", 11, p.muted, 'text-anchor="middle"');
      }
      if (w > 0) {
        const x0 = cx - w / 2;
        if (i === 0) {
          // Opened: every outcome in one bar.
          const segs = [
            { v: all.merged, c: p.merged, o: 1 },
            { v: all.open, c: p.accent, o: 1 },
            { v: all.closed, c: p.pr, o: 0.7 },
          ];
          let x = x0;
          for (const seg of segs) {
            if (!seg.v) continue;
            const sw = (seg.v / all.opened) * w;
            body += `<rect x="${x.toFixed(1)}" y="${y}" width="${sw.toFixed(1)}" height="${bh}" fill="${seg.c}" opacity="${seg.o}"/>`;
            x += sw;
          }
        } else if (i === 1) {
          const mw = (all.merged / Math.max(1, decided)) * w;
          body += `<rect x="${x0.toFixed(1)}" y="${y}" width="${mw.toFixed(1)}" height="${bh}" fill="${p.merged}"/>`;
          body += `<rect x="${(x0 + mw).toFixed(1)}" y="${y}" width="${(w - mw).toFixed(1)}" height="${bh}" fill="${p.pr}" opacity="0.7"/>`;
        } else {
          body += `<rect x="${x0.toFixed(1)}" y="${y}" width="${w.toFixed(1)}" height="${bh}" fill="${p.merged}"/>`;
        }
      }
      body += t(fx, y + 16, num(s.value), 20, p.text, 'font-weight="600"');
      body += t(fx, y + 31, s.label, 11, p.muted);
    });
    const ry = top + 2 * step + bh + 40;
    const rates = [
      { value: `${percent(all.merged, all.opened)}%`, label: "merged, of all opened" },
      { value: `${percent(all.merged, decided)}%`, label: "merged, of those no longer open" },
    ];
    rates.forEach((r, i) => {
      const x = fx + i * (fw / 2);
      body += t(x, ry, all.opened ? r.value : "–", 20, p.text, 'font-weight="600"');
      body += t(x, ry + 17, r.label, 11, p.muted);
    });
    let leftBottom = ry + 17;

    // Families (right panel)
    const tx = fx + fw + 40;
    const tw = W - PAD - tx;
    const nameW = 150;
    const barX = tx + nameW + 50;
    const barW = tw - nameW - 50 - 46;
    body += t(tx, top - 8, "By family", 13, p.text, 'font-weight="600"');
    body += t(barX - 8, top - 8, "opened", 11, p.faint, 'text-anchor="end"');
    body += t(tx + tw, top - 8, "merged", 11, p.faint, 'text-anchor="end"');
    body += `<line x1="${tx}" y1="${top + 0.5}" x2="${tx + tw}" y2="${top + 0.5}" stroke="${p.border}"/>`;

    const fams = allFamilies(stats)
      .sort((a, b) => b.prs - a.prs || b.total - a.total)
      .slice(0, MAX_FAMILIES);
    const inFamily = new Set(fams.flatMap((g) => g.owners));
    const rest = stats.repos.filter((r) => !inFamily.has(r.owner));
    const others = outcome({
      prs: sum(rest, (r) => r.prs),
      prsMerged: sum(rest, (r) => r.prsMerged),
      prsOpen: sum(rest, (r) => r.prsOpen),
    });
    const otherOwners = new Set(rest.map((r) => r.owner)).size;
    const allIndependent = fams.length === 0 && independentOwners(stats).length > 0;
    const rows = [
      ...fams.map((g) => ({
        name: g.name,
        note: plural(g.owners.length, "owner"),
        lead: g.lead,
        org: g.leadIsOrg,
        o: outcome(g),
      })),
      ...(otherOwners
        ? [
            {
              name: allIndependent ? "All owners" : "Everyone else",
              note: plural(otherOwners, "owner"),
              lead: "",
              org: true,
              o: others,
            },
          ]
        : []),
    ];
    const ROW = 30;
    rows.forEach((row, i) => {
      const cy = top + 4 + i * ROW + ROW / 2;
      if (row.lead) {
        body += avatar({
          id: `h03-f${i}`,
          login: row.lead,
          uri: stats.avatars[row.lead],
          x: tx,
          y: cy - 9,
          size: 18,
          org: row.org,
          palette: p,
        });
      } else {
        body += `<circle cx="${tx + 9}" cy="${cy}" r="8.5" fill="none" stroke="${p.border}" stroke-dasharray="2 2"/>`;
      }
      body += t(tx + 26, cy + 4, fitText(row.name, nameW - 26, 13), 13, p.text);
      body += t(
        barX - 8,
        cy + 4,
        num(row.o.opened),
        13,
        p.text,
        'text-anchor="end" font-weight="600"',
      );
      if (row.o.opened === 0) {
        body += t(barX, cy + 4, "no PRs opened", 11, p.faint);
      } else {
        const parts = [
          { v: row.o.merged, c: p.merged, o: 1 },
          { v: row.o.open, c: p.accent, o: 1 },
          { v: row.o.closed, c: p.pr, o: 0.7 },
        ].filter((x) => x.v > 0);
        let x = barX;
        const avail = barW - (parts.length - 1);
        parts.forEach((part, j) => {
          const w =
            j === parts.length - 1 ? barX + barW - x : Math.max(2, (part.v / row.o.opened) * avail);
          body += `<rect x="${x.toFixed(1)}" y="${cy - 5}" width="${w.toFixed(1)}" height="10" rx="2" fill="${part.c}" opacity="${part.o}"/>`;
          x += w + 1;
        });
      }
      body += t(
        tx + tw,
        cy + 4,
        row.o.opened ? `${percent(row.o.merged, row.o.opened)}%` : "–",
        13,
        row.o.opened ? p.text : p.faint,
        'text-anchor="end"',
      );
      if (i < rows.length - 1) {
        body += `<line x1="${tx}" y1="${cy + ROW / 2 + 0.5}" x2="${tx + tw}" y2="${cy + ROW / 2 + 0.5}" stroke="${p.hair}"/>`;
      }
    });
    const rightBottom = top + 4 + rows.length * ROW;
    leftBottom = Math.max(leftBottom, rightBottom);

    const ly = leftBottom + 34;
    body += `<line x1="${PAD}" y1="${ly - 22.5}" x2="${W - PAD}" y2="${ly - 22.5}" stroke="${p.hair}"/>`;
    body += legend({
      x: PAD,
      y: ly,
      p,
      items: [
        { label: "Merged", color: p.merged },
        { label: "Still open", color: p.accent },
        { label: "Closed without merging", color: p.pr },
      ],
    });
    body += t(
      W - PAD,
      ly,
      "family bars: share of that row's opened PRs",
      11,
      p.faint,
      'text-anchor="end"',
    );
    const h = ly + 18;
    return svgDocument({
      width: W,
      height: h,
      title: "Pull request outcomes",
      body: frame(W, h, p) + body,
    });
  },
};
