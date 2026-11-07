import { esc, truncate as fitText } from "../../kit/svg.ts";
import type { Stats } from "../../stats/types.ts";
import type { Design, ThemeName } from "../types.ts";
import {
  PAL,
  SERIES,
  activeRepos,
  av,
  card,
  fmt,
  groups,
  halo,
  plural,
  r1,
  spread,
} from "./_shared.ts";

const W = 840;
const TOP = 84;
const PLOT = 440;
const GAP = 8;
const SHOWN_GROUPS = 7;
const SHOWN_REPOS = 10;
const X_YOU = 170;
const X_MID = 400;
const X_REPO = 600;
const BAR = 10;

interface Node {
  label: string;
  value: number;
  color: string;
  y: number;
  h: number;
}

/** A filled band between two vertical segments, curved like a Sankey link. */
const band = (x0: number, a0: number, a1: number, x1: number, b0: number, b1: number): string => {
  const m = (x0 + x1) / 2;
  return `M${x0},${r1(a0)}C${m},${r1(a0)} ${m},${r1(b0)} ${x1},${r1(b0)}L${x1},${r1(b1)}C${m},${r1(b1)} ${m},${r1(a1)} ${x0},${r1(a1)}Z`;
};

function render(stats: Stats, theme: ThemeName): string {
  const p = PAL(theme);
  const series = SERIES[theme];
  const all = groups(stats);
  const repos = activeRepos(stats);
  const total = repos.reduce((s, r) => s + r.total, 0);

  // Middle column: the biggest groups, then everything else as one node (only if it hides 2+).
  const keep = all.length <= SHOWN_GROUPS + 1 ? all.length : SHOWN_GROUPS;
  const shownGroups = all.slice(0, keep);
  const rest = all.slice(keep);
  const restOwners = rest.reduce((s, g) => s + g.owners.length, 0);
  const groupIndex = new Map<string, number>();
  shownGroups.forEach((g, i) => {
    for (const o of g.owners) groupIndex.set(o, i);
  });
  const mid: Node[] = shownGroups.map((g, i) => ({
    label: g.name,
    value: g.total,
    color: series[i] ?? p.faint,
    y: 0,
    h: 0,
  }));
  if (rest.length) {
    mid.push({
      label: `${plural(restOwners, "other owner")}`,
      value: rest.reduce((s, g) => s + g.total, 0),
      color: p.faint,
      y: 0,
      h: 0,
    });
  }
  const midOf = (owner: string): number => groupIndex.get(owner) ?? mid.length - 1;

  // Right column: the top repos, ordered by their middle node, then one node for all the rest.
  const top = repos
    .slice(0, repos.length <= SHOWN_REPOS + 1 ? repos.length : SHOWN_REPOS)
    .map((r) => ({ r, m: midOf(r.owner) }))
    .sort((a, b) => a.m - b.m || b.r.total - a.r.total);
  const others = repos.slice(top.length);
  const right: (Node & { m: number; repo: string })[] = top.map(({ r, m }) => ({
    label: r.repo,
    repo: r.repo,
    value: r.total,
    color: mid[m]?.color ?? p.faint,
    m,
    y: 0,
    h: 0,
  }));
  if (others.length) {
    right.push({
      label: plural(others.length, "other repo"),
      repo: "",
      value: others.reduce((s, r) => s + r.total, 0),
      color: p.faint,
      m: -1,
      y: 0,
      h: 0,
    });
  }

  const gaps = Math.max(mid.length, right.length) - 1;
  const k = total > 0 ? (PLOT - gaps * GAP) / total : 0;
  const place = (nodes: Node[]) => {
    const height = nodes.reduce((s, n) => s + n.value * k, 0) + (nodes.length - 1) * GAP;
    let y = TOP + (PLOT - height) / 2;
    for (const n of nodes) {
      n.y = y;
      n.h = n.value * k;
      y += n.h + GAP;
    }
  };
  place(mid);
  place(right);
  const youH = total * k;
  const youY = TOP + (PLOT - youH) / 2;
  const op = theme === "dark" ? 0.42 : 0.34;

  let links = "";
  let labels = "";
  // You → middle.
  let off = youY;
  for (const n of mid) {
    links += `<path d="${band(X_YOU + BAR, off, off + n.h, X_MID, n.y, n.y + n.h)}" fill="${n.color}" fill-opacity="${op}"/>`;
    off += n.h;
  }
  // Middle → right. Each middle node sends its flows in target order; the bundle receives in source order.
  const outOff = mid.map((n) => n.y);
  const otherNode = right.find((n) => n.m === -1);
  let otherIn = otherNode?.y ?? 0;
  const otherByMid = mid.map(() => 0);
  for (const r of others) otherByMid[midOf(r.owner)] = (otherByMid[midOf(r.owner)] ?? 0) + r.total;
  mid.forEach((n, m) => {
    for (const t of right) {
      if (t.m !== m) continue;
      const a = outOff[m] as number;
      links += `<path d="${band(X_MID + BAR, a, a + t.h, X_REPO, t.y, t.y + t.h)}" fill="${n.color}" fill-opacity="${op}"/>`;
      outOff[m] = a + t.h;
    }
    const v = otherByMid[m] ?? 0;
    if (otherNode && v > 0) {
      const a = outOff[m] as number;
      const h = v * k;
      links += `<path d="${band(X_MID + BAR, a, a + h, X_REPO, otherIn, otherIn + h)}" fill="${n.color}" fill-opacity="${op}"/>`;
      if (h >= 11) {
        labels += `<text x="${X_REPO - 6}" y="${r1(otherIn + h / 2)}" dy="0.35em" text-anchor="end" font-size="10.5" class="mu" ${halo(p)}>${fmt(v)}</text>`;
      }
      outOff[m] = a + h;
      otherIn += h;
    }
  });

  // Bars.
  let bars = `<rect x="${X_YOU}" y="${r1(youY)}" width="${BAR}" height="${r1(youH)}" rx="2" fill="${p.muted}"/>`;
  for (const n of [...mid]) {
    bars += `<rect x="${X_MID}" y="${r1(n.y)}" width="${BAR}" height="${r1(Math.max(1, n.h))}" rx="1.5" fill="${n.color}"/>`;
  }
  for (const n of right) {
    bars += `<rect x="${X_REPO}" y="${r1(n.y)}" width="${BAR}" height="${r1(Math.max(1, n.h))}" rx="1.5" fill="${n.color}"/>`;
  }

  // You.
  const cy = TOP + PLOT / 2;
  labels += av({
    id: "f01-you",
    login: stats.user,
    stats,
    cx: 80,
    cy: cy - 34,
    size: 52,
    org: false,
    p,
  });
  labels += `<text x="80" y="${cy + 12}" text-anchor="middle" font-size="13" class="b">${esc(fitText(stats.user, 140, 13))}</text>`;
  labels += `<text x="80" y="${cy + 30}" text-anchor="middle" font-size="11" class="mu">${esc(fmt(total))} contributions</text>`;
  labels += `<text x="80" y="${cy + 45}" text-anchor="middle" font-size="11" class="mu">to ${esc(plural(repos.length, "repo"))}</text>`;

  // Middle labels sit on the links, with a halo.
  const midY = spread(
    mid.map((n) => n.y + n.h / 2),
    15,
    TOP + 6,
    TOP + PLOT - 6,
  );
  mid.forEach((n, i) => {
    const y = r1(midY[i] as number);
    const name = fitText(n.label, 120, 12);
    labels += `<text x="${X_MID + BAR + 6}" y="${y}" dy="0.35em" font-size="12" ${halo(p)}><tspan class="b">${esc(name)}</tspan><tspan class="mu" dx="5">${fmt(n.value)}</tspan></text>`;
  });

  // Right labels: repo name, value right-aligned.
  const rightY = spread(
    right.map((n) => n.y + n.h / 2),
    14,
    TOP + 6,
    TOP + PLOT - 6,
  );
  right.forEach((n, i) => {
    const y = r1(rightY[i] as number);
    const isOther = n.m === -1;
    const slash = n.repo.indexOf("/");
    const name = isOther
      ? `<tspan class="mu">${esc(n.label)}</tspan>`
      : (() => {
          const owner = n.repo.slice(0, slash + 1);
          const short = n.repo.slice(slash + 1);
          const text = fitText(n.repo, 170, 11.5);
          return text.length < n.repo.length || owner.length === 0
            ? esc(text)
            : `<tspan class="mu">${esc(owner)}</tspan>${esc(short)}`;
        })();
    labels += `<text x="${X_REPO + BAR + 6}" y="${y}" dy="0.35em" font-size="11.5">${name}</text>`;
    labels += `<text x="${W - 20}" y="${y}" dy="0.35em" font-size="11.5" text-anchor="end" class="${isOther ? "mu" : "b"}">${fmt(n.value)}</text>`;
  });

  // Column heads.
  const head = (x: number, t: string, anchor = "start") =>
    `<text x="${x}" y="${TOP - 8}" font-size="11" class="fa" text-anchor="${anchor}">${esc(t)}</text>`;
  const heads =
    head(X_YOU + BAR / 2, "you", "middle") +
    head(X_MID, all.some((g) => g.ecosystem) ? "ecosystem or owner" : "owner") +
    head(X_REPO, "repo") +
    head(W - 20, "total", "end");

  const footY = TOP + PLOT + 30;
  const foot = `<text x="20" y="${footY}" font-size="11" class="mu">${otherNode ? `The other ${fmt(others.length)} repos share one node` : ""}</text>`;

  return card({
    theme,
    width: W,
    height: footY + 20,
    title: "Where my contributions flow",
    subtitle: `${fmt(total)} PRs, issues and discussions → ${plural(all.length, "ecosystem or owner", "ecosystems and owners")} → ${plural(repos.length, "repo")}`,
    body: heads + links + bars + labels + foot,
  });
}

export const design: Design = {
  id: "F01",
  slug: "sankey",
  title: "Contribution Sankey",
  idea: "A Sankey from you through ecosystems and owners to repos, band height proportional to PRs + issues + discussions. The 7 biggest groups and 10 biggest repos are named; the rest are merged into one node per column so every band still adds up.",
  render,
};
