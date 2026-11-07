import { esc, truncate as fitText, percent } from "../../kit/svg.ts";
import type { Stats } from "../../stats/types.ts";
import { DEFAULT_OPTIONS, type Design, type RenderOptions, type ThemeName } from "../types.ts";
import { PAL, SERIES, card, fmt, groups, halo, plural, r1, spread } from "./_shared.ts";

const W = 840;
const TOP = 88;
const PLOT = 400;
const GAP = 8;
const SHOWN = 8;
const X_L = 230;
const X_R = 590;
const BAR = 10;

const band = (x0: number, a0: number, a1: number, x1: number, b0: number, b1: number): string => {
  const m = (x0 + x1) / 2;
  return `M${x0},${r1(a0)}C${m},${r1(a0)} ${m},${r1(b0)} ${x1},${r1(b0)}L${x1},${r1(b1)}C${m},${r1(b1)} ${m},${r1(a1)} ${x0},${r1(a1)}Z`;
};

interface Source {
  name: string;
  prs: number;
  out: number[];
  y: number;
  h: number;
}

function render(stats: Stats, theme: ThemeName, options: RenderOptions = DEFAULT_OPTIONS): string {
  const p = PAL(theme);
  // Unset: the original GitHub-like purple, green and red. "full" (decision 0009): open in a
  // lighter tone of the merged purple, closed unmerged in neutral gray.
  const full = options.outcomes === "full";
  const outcomes = [
    { name: "Merged", color: p.merged },
    { name: "Still open", color: full ? p.open : p.issue },
    { name: "Closed unmerged", color: full ? p.closed : (SERIES[theme][7] ?? p.faint) },
  ];
  const withPrs = groups(stats)
    .filter((g) => g.prs > 0)
    .sort((a, b) => b.prs - a.prs || b.total - a.total || a.name.localeCompare(b.name));
  const keep = withPrs.length <= SHOWN + 1 ? withPrs.length : SHOWN;
  const split = (merged: number, open: number, prs: number) => [
    merged,
    open,
    Math.max(0, prs - merged - open),
  ];
  const sources: Source[] = withPrs.slice(0, keep).map((g) => ({
    name: g.name,
    prs: g.prs,
    out: split(g.merged, g.open, g.prs),
    y: 0,
    h: 0,
  }));
  const rest = withPrs.slice(keep);
  if (rest.length) {
    const sum = (f: (g: (typeof rest)[number]) => number) => rest.reduce((s, g) => s + f(g), 0);
    sources.push({
      name: plural(
        rest.reduce((s, g) => s + g.owners.length, 0),
        "other owner",
      ),
      prs: sum((g) => g.prs),
      out: split(
        sum((g) => g.merged),
        sum((g) => g.open),
        sum((g) => g.prs),
      ),
      y: 0,
      h: 0,
    });
  }
  const totalPrs = sources.reduce((s, x) => s + x.prs, 0);
  const totals = outcomes.map((_, i) => sources.reduce((s, x) => s + (x.out[i] ?? 0), 0));
  const targets = outcomes
    .map((o, i) => ({ ...o, i, value: totals[i] ?? 0, y: 0, h: 0 }))
    .filter((t) => t.value > 0);

  const gaps = Math.max(sources.length, targets.length) - 1;
  const k = totalPrs > 0 ? (PLOT - gaps * GAP * 1.5) / totalPrs : 0;
  const place = (nodes: { y: number; h: number }[], values: number[], gap: number) => {
    const height = values.reduce((s, v) => s + v * k, 0) + (nodes.length - 1) * gap;
    let y = TOP + (PLOT - height) / 2;
    nodes.forEach((n, i) => {
      n.y = y;
      n.h = (values[i] ?? 0) * k;
      y += n.h + gap;
    });
  };
  place(
    sources,
    sources.map((s) => s.prs),
    GAP * 1.5,
  );
  place(
    targets,
    targets.map((t) => t.value),
    GAP * 4,
  );

  const op = theme === "dark" ? 0.5 : 0.42;
  let links = "";
  let labels = "";
  const inOff = targets.map((t) => t.y);
  for (const s of sources) {
    let a = s.y;
    targets.forEach((t, ti) => {
      const v = s.out[t.i] ?? 0;
      if (v <= 0) return;
      const h = v * k;
      const b = inOff[ti] as number;
      links += `<path d="${band(X_L + BAR, a, a + h, X_R, b, b + h)}" fill="${t.color}" fill-opacity="${op}"/>`;
      if (h >= 11) {
        labels += `<text x="${X_L + BAR + 6}" y="${r1(a + h / 2)}" dy="0.35em" font-size="10.5" ${halo(p)}>${fmt(v)}</text>`;
      }
      inOff[ti] = b + h;
      a += h;
    });
  }

  let bars = "";
  for (const s of sources) {
    bars += `<rect x="${X_L}" y="${r1(s.y)}" width="${BAR}" height="${r1(Math.max(1, s.h))}" rx="1.5" fill="${p.muted}"/>`;
  }
  for (const t of targets) {
    bars += `<rect x="${X_R}" y="${r1(t.y)}" width="${BAR}" height="${r1(Math.max(1, t.h))}" rx="1.5" fill="${t.color}"/>`;
  }

  // Left labels: name, PR count and merge rate, right-aligned against the bars.
  const ly = spread(
    sources.map((s) => s.y + s.h / 2),
    16,
    TOP + 6,
    TOP + PLOT - 6,
  );
  sources.forEach((s, i) => {
    const y = r1(ly[i] as number);
    const tail = `${plural(s.prs, "PR")} · ${percent(s.out[0] ?? 0, s.prs)}%`;
    const name = fitText(s.name, X_L - 30 - tail.length * 11 * 0.58 - 8, 12);
    labels += `<text x="${X_L - 8}" y="${y}" dy="0.35em" font-size="12" text-anchor="end"><tspan class="b">${esc(name)}</tspan><tspan class="mu" font-size="11" dx="6">${esc(tail)}</tspan></text>`;
  });

  // Right labels: outcome, count and share, centred on each node.
  for (const t of targets) {
    const cy = t.y + t.h / 2;
    labels += `<text x="${X_R + BAR + 10}" y="${r1(cy - 4)}" font-size="13" class="b">${esc(t.name)}</text>`;
    labels += `<text x="${X_R + BAR + 10}" y="${r1(cy + 13)}" font-size="11.5" class="mu">${esc(`${plural(t.value, "PR")} · ${percent(t.value, totalPrs)}% of ${fmt(totalPrs)}`)}</text>`;
  }

  const head = (x: number, t: string, anchor: string) =>
    `<text x="${x}" y="${TOP - 12}" font-size="11" class="fa" text-anchor="${anchor}">${esc(t)}</text>`;
  const heads =
    head(X_L - 8, "PRs opened · % merged", "end") + head(X_R + BAR + 10, "outcome", "start");

  const missing = outcomes
    .filter((_, i) => (totals[i] ?? 0) === 0)
    .map((o) => o.name.toLowerCase());
  const footY = TOP + PLOT + 30;
  const foot = `<text x="20" y="${footY}" font-size="11" class="mu">${esc(
    `Band height ∝ PRs. Ecosystems group related owners; the biggest ${Math.min(keep, sources.length)} by PRs opened are named.${missing.length ? ` None ${missing.join(" or ")}.` : ""}`,
  )}</text>`;

  return card({
    theme,
    width: W,
    height: footY + 20,
    title: "What happened to my PRs",
    subtitle: `${plural(totalPrs, "PR")} opened on upstream repos, by ecosystem or owner, to where each one stands now`,
    body: heads + links + bars + labels + foot,
  });
}

export const design: Design = {
  id: "F02",
  slug: "pr-outcomes",
  title: "PR outcomes",
  idea: "An alluvial from the ecosystems and owners you opened PRs with to how they ended: merged, still open or closed without merging (GitHub's purple, green and red). The 8 groups with the most PRs are named with their merge rate; the rest share one node.",
  // The card is about how PRs ended: hiding outcomes leaves nothing to flow into.
  outcomes: ["full"],
  render,
};
