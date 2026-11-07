import { esc, truncate as fitText } from "../../kit/svg.ts";
import type { Stats } from "../../stats/types.ts";
import type { Design, ThemeName } from "../types.ts";
import {
  PAL,
  SERIES,
  abbreviate,
  av,
  card,
  fmt,
  groups,
  ink,
  plural,
  r1,
  repoName,
} from "./_shared.ts";

const W = 840;
const MAX_LINES = 6;
const MAX_STATIONS = 8;
const LANE = 82;
const FIRST_LANE = 164;
const TRUNK = 46;
const TRACK = 6;
const BEND = 14;
const X_STATION = 250;
const STEP = 66;

function render(stats: Stats, theme: ThemeName): string {
  const p = PAL(theme);
  const series = SERIES[theme];
  const all = groups(stats);
  const lines = [...all]
    .sort(
      (a, b) =>
        b.repos.length - a.repos.length || b.total - a.total || a.name.localeCompare(b.name),
    )
    .slice(0, MAX_LINES);
  const n = lines.length;
  const shown = lines.map((g) =>
    g.repos
      .slice(0, MAX_STATIONS)
      .sort((a, b) => (a.first ?? "").localeCompare(b.first ?? "") || a.repo.localeCompare(b.repo)),
  );
  const maxTotal = Math.max(1, ...shown.flat().map((r) => r.total));
  const radius = (t: number) => r1(3.5 + 7 * Math.sqrt(t / maxTotal));

  const top = 82;
  const prefixes: string[] = [];
  let tracks = "";
  let stations = "";
  let labels = "";
  lines.forEach((g, i) => {
    const color = series[i] ?? p.muted;
    const y = FIRST_LANE + i * LANE;
    // Top lane peels off first, so it runs on the outside of the trunk.
    const tx = TRUNK + (n - 1 - i) * TRACK;
    const stops = shown[i] ?? [];
    const lastX = X_STATION + (stops.length - 1) * STEP;
    const more = g.repos.length - stops.length;
    tracks += `<path d="M${tx},${top + 18}V${y - BEND}Q${tx},${y} ${tx + BEND},${y}H${lastX}" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
    if (more > 0) {
      const rest = g.repos.slice(stops.length).reduce((s, r) => s + r.total, 0);
      tracks += `<path d="M${lastX},${y}H${lastX + 22}" stroke="${color}" stroke-width="5" stroke-dasharray="2 4" fill="none"/>`;
      labels += `<text x="${lastX + 30}" y="${y}" dy="0.35em" font-size="11" class="mu">${esc(`+${more} more · ${fmt(rest)}`)}</text>`;
    } else {
      tracks += `<path d="M${lastX},${y - 9}V${y + 9}" stroke="${color}" stroke-width="5" stroke-linecap="round"/>`;
    }

    // Line bullet with its name, and the line's totals underneath.
    const name = fitText(g.name, 96, 11);
    const bw = r1(name.length * 11 * 0.6 + 16);
    stations += `<rect x="${TRUNK + n * TRACK + 22}" y="${y - 10}" width="${bw}" height="20" rx="10" fill="${color}"/>`;
    stations += `<text x="${r1(TRUNK + n * TRACK + 22 + bw / 2)}" y="${y}" dy="0.35em" text-anchor="middle" font-size="11" font-weight="600" style="fill:${ink(color)}">${esc(name)}</text>`;
    labels += `<text x="${TRUNK + n * TRACK + 22}" y="${y + 26}" font-size="11" class="mu">${esc(`${plural(g.repos.length, "repo")} · ${fmt(g.total)}`)}</text>`;

    const short = abbreviate(
      stops.map((r) => repoName(r.repo)),
      (j) => 100 - fmt(stops[j]?.total ?? 0).length * 6.4,
      11,
    );
    if (short.prefix) prefixes.push(short.prefix);
    stops.forEach((r, j) => {
      const x = X_STATION + j * STEP;
      const rr = radius(r.total);
      stations += `<circle cx="${x}" cy="${y}" r="${rr}" fill="${p.bg}" stroke="${color}" stroke-width="3"/>`;
      const lx = r1(x + 3);
      const ly = r1(y - rr - 5);
      const label = short.labels[j] ?? "";
      labels += `<text transform="translate(${lx} ${ly}) rotate(-35)" font-size="11">${esc(label)}<tspan class="mu" dx="4">${fmt(r.total)}</tspan></text>`;
    });
  });

  // The interchange: you, at the head of the trunk.
  const hubX = TRUNK + ((n - 1) * TRACK) / 2;
  const hub =
    av({ id: "f03-you", login: stats.user, stats, cx: hubX, cy: top, size: 36, org: false, p }) +
    `<text x="${hubX + 26}" y="${top}" dy="0.35em" font-size="12" class="b">${esc(fitText(stats.user, 160, 12))}</text>`;

  const footY = FIRST_LANE + (n - 1) * LANE + 62;
  const notes = [
    `Lines: the ${n === 1 ? "family or owner" : `${n} families and owners`} with the most repos. Stations: up to ${MAX_STATIONS} biggest repos, in order of first contribution; size ∝ PRs + issues + discussions.`,
  ];
  if (prefixes.length) {
    notes.push(
      `… stands for a prefix the line's repos share: ${[...new Set(prefixes)].join(", ")}`,
    );
  }
  const foot = notes
    .map((t, i) => `<text x="20" y="${footY + i * 16}" font-size="11" class="mu">${esc(t)}</text>`)
    .join("");

  const totalRepos = all.reduce((s, g) => s + g.repos.length, 0);
  return card({
    theme,
    width: W,
    height: footY + (notes.length - 1) * 16 + 20,
    title: "Upstream network map",
    subtitle: `${plural(totalRepos, "repository", "repositories")} across ${plural(all.length, "family or owner", "families and owners")} · the widest-reaching ${n === 1 ? "line" : `${n} lines`}`,
    body: tracks + hub + stations + labels + foot,
  });
}

export const design: Design = {
  id: "F03",
  slug: "metro",
  title: "Metro map",
  idea: "A subway map where each line is one of the 6 families or owners with the most repositories (ties by contributions), and its stations are up to 8 of its biggest repos in order of first contribution, sized by PRs + issues + discussions. Shows breadth: where you branched out, not just where you contributed most.",
  render,
};
