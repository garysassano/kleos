import { esc, truncate as fitText } from "../../kit/svg.ts";
import type { Stats } from "../../stats/types.ts";
import type { Design, ThemeName } from "../types.ts";
import {
  PAL,
  SERIES,
  abbreviate,
  activeRepos,
  av,
  card,
  fmt,
  groups,
  halo,
  plural,
  r1,
  repoName,
} from "./_shared.ts";

const W = 840;
const GROUPS = 8;
const LEAVES = 4;
const CX = W / 2;
const CY = 478;
const R1 = 140;
const R2 = 272;
const MAX_STROKE = 16;
const LABEL = 116;

const rad = (deg: number) => (deg * Math.PI) / 180;
const pt = (r: number, deg: number): [number, number] => [
  r1(CX + r * Math.cos(rad(deg))),
  r1(CY + r * Math.sin(rad(deg))),
];

/** Text that reads outward along a ray, flipped on the left half so it is never upside down. */
function rayText(r: number, deg: number, body: string, attrs: string, dy = "0.35em"): string {
  const [x, y] = pt(r, deg);
  const left = deg > 90 && deg < 270;
  return `<text transform="translate(${x} ${y}) rotate(${r1(left ? deg + 180 : deg)})" dy="${dy}" text-anchor="${left ? "end" : "start"}" ${attrs}>${body}</text>`;
}

function render(stats: Stats, theme: ThemeName): string {
  const p = PAL(theme);
  const series = SERIES[theme];
  const all = groups(stats);
  const shown = all.slice(0, GROUPS).map((g, i) => ({
    g,
    color: series[i] ?? p.muted,
    leaves: g.repos.slice(0, LEAVES),
  }));
  const leafCount = shown.reduce((s, x) => s + x.leaves.length, 0);
  // Slots across the half circle: one per leaf, half a slot between groups and at each end.
  const slots = leafCount + Math.max(0, shown.length - 1) * 0.6 + 1;
  const step = 180 / Math.max(1, slots);
  const maxTotal = Math.max(1, ...shown.map((x) => x.g.total));
  const width = (v: number) => r1(Math.max(1, (v / maxTotal) * MAX_STROKE));
  const op = theme === "dark" ? 0.7 : 0.6;

  let links = "";
  let nodes = "";
  let labels = "";
  let slot = 0.5;
  const prefixes: string[] = [];
  shown.forEach(({ g, color, leaves }, gi) => {
    const a0 = 180 + (slot + 0.5) * step;
    const angles = leaves.map((_, j) => 180 + (slot + 0.5 + j) * step);
    slot += leaves.length + 0.6;
    const ga = (a0 + (angles[angles.length - 1] ?? a0)) / 2;
    const [gx, gy] = pt(R1, ga);
    const [sx, sy] = pt(28, ga);
    links += `<path d="M${sx},${sy}L${gx},${gy}" stroke="${color}" stroke-opacity="${op}" stroke-width="${width(g.total)}" stroke-linecap="round" fill="none"/>`;
    const rm = (R1 + R2) / 2;
    const short = abbreviate(
      leaves.map((r) => repoName(r.repo)),
      (j) => LABEL - fmt(leaves[j]?.total ?? 0).length * 6.4 - 4,
      11,
    );
    if (short.prefix) prefixes.push(short.prefix);
    leaves.forEach((r, j) => {
      const a = angles[j] as number;
      const [c1x, c1y] = pt(rm, ga);
      const [c2x, c2y] = pt(rm, a);
      const [lx, ly] = pt(R2, a);
      links += `<path d="M${gx},${gy}C${c1x},${c1y} ${c2x},${c2y} ${lx},${ly}" stroke="${color}" stroke-opacity="${op}" stroke-width="${width(r.total)}" fill="none"/>`;
      nodes += `<circle cx="${lx}" cy="${ly}" r="3.5" fill="${color}" stroke="${p.bg}" stroke-width="1.5"/>`;
      const total = fmt(r.total);
      const name = short.labels[j] ?? "";
      labels += rayText(
        R2 + 9,
        a,
        `${esc(name)}<tspan class="mu" dx="4">${total}</tspan>`,
        `font-size="11"`,
      );
    });
    nodes += av({
      id: `f06-g${gi}`,
      login: g.lead,
      stats,
      cx: gx,
      cy: gy,
      size: 24,
      org: g.org,
      p,
    });
    const name = fitText(g.name, 100 - fmt(g.total).length * 6.4, 11.5);
    labels += rayText(
      R1 + 17,
      ga,
      `<tspan class="b">${esc(name)}</tspan><tspan class="mu" dx="4">${fmt(g.total)}</tspan>`,
      `font-size="11.5" ${halo(p)}`,
      // Beside the links that leave the node along this ray, not on top of them.
      String(-r1(Math.max(...leaves.map((r) => width(r.total))) / 2 + 4)),
    );
  });

  const repos = activeRepos(stats);
  const total = repos.reduce((s, r) => s + r.total, 0);
  const shownTotal = shown.reduce((s, x) => s + x.g.total, 0);
  const center =
    av({ id: "f06-you", login: stats.user, stats, cx: CX, cy: CY, size: 48, org: false, p }) +
    `<text x="${CX}" y="${CY + 42}" text-anchor="middle" font-size="12" class="b">${esc(fitText(stats.user, 300, 12))}</text>`;

  const footY = CY + 72;
  const foot = `<text x="20" y="${footY}" font-size="11" class="mu">${esc(prefixes.length ? `… = shared prefix (${[...new Set(prefixes)].join(", ")})` : "")}</text>`;

  return card({
    theme,
    width: W,
    height: footY + 20,
    title: "Contribution tree",
    subtitle: `You → the ${plural(shown.length, "biggest ecosystem or owner", "biggest ecosystems and owners")} → their top repos · ${fmt(shownTotal)} of ${fmt(total)} contributions`,
    body: links + nodes + labels + center + foot,
  });
}

export const design: Design = {
  id: "F06",
  slug: "fan-tree",
  title: "Contribution tree",
  idea: "A half-radial tree: you at the root, the 8 biggest ecosystems and owners on the inner ring, and up to 4 of each one's biggest repos as leaves, with stroke width proportional to PRs + issues + discussions. A compact picture of how the work branches out.",
  render,
};
