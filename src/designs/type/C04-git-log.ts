import { prParts, totalsCounts } from "../../kit/outcomes.ts";
import { DEFAULT_OPTIONS, type Design } from "../types.ts";
import { THEMES, derive, esc, shortDateIn, svg, text, trunc } from "./_shared.ts";

/** Lines shown. */
const N = 14;

export const design: Design = {
  id: "C04",
  slug: "git-log",
  title: "Git log",
  idea: "The latest upstream PRs (merged and open; closed-unmerged ones are hidden) as a `git log --graph` timeline: date, repo#number, title and diffstat, so visitors see what you are working on right now. With outcomes none every node looks the same; merged fills merged nodes and leaves the rest plain; full lists closed-unmerged PRs too, each state with its own node.",
  render(stats, theme, options = DEFAULT_OPTIONS) {
    const lv = options.outcomes;
    const t = THEMES[theme];
    const { T, asOf, prsOpen } = derive(stats);
    // recentPRs is newest first; sort anyway so the order never depends on the fetch.
    const list = stats.recentPRs
      .filter((p) => lv === "full" || p.state !== "CLOSED")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, N);
    const n = list.length;
    const W = 840;
    const P = 24;
    const FS = 12;
    const LH = 26;
    const top = 74;
    const H = top + LH * n + 34;
    const cw = FS * 0.6;
    const gx = P + 6;
    const xDate = P + 24;
    const xRef = xDate + 8 * cw;
    const refC = 28;
    const xTitle = xRef + (refC + 2) * cw;
    const xEnd = W - P;
    const diffC = 11;
    const titleC = Math.floor((xEnd - diffC * cw - xTitle) / cw) - 2;
    const fs = `font-size="${FS}"`;
    /** A graph node for a PR state at a set level ("pr" = no outcome shown). */
    const node = (cx: number, cy: number, key: "pr" | "merged" | "open" | "closed"): string =>
      key === "merged"
        ? `<circle cx="${cx}" cy="${cy}" r="5" fill="${t.merged}" stroke="${t.bg}" stroke-width="2"/>`
        : key === "open"
          ? `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${t.bg}" stroke="${t.prOpen}" stroke-width="1.8"/>`
          : key === "closed"
            ? `<circle cx="${cx}" cy="${cy}" r="4" fill="${t.closed}" stroke="${t.bg}" stroke-width="2"/>`
            : lv === "none"
              ? `<circle cx="${cx}" cy="${cy}" r="5" fill="${t.muted}" stroke="${t.bg}" stroke-width="2"/>`
              : `<circle cx="${cx}" cy="${cy}" r="4.5" fill="${t.bg}" stroke="${t.muted}" stroke-width="1.8"/>`;
    let b = "";
    b += text(P, 30, "git log", "m b t", 'font-size="15"');
    b += text(P + 8 * 0.6 * 15, 30, `--upstream --author=${stats.user}`, "m mu", 'font-size="15"');
    if (lv === undefined) {
      b += `<circle cx="${xEnd - 172}" cy="26" r="4.5" fill="${t.merged}"/>${text(xEnd - 162, 30, `${T.externalMerged} merged`, "s mu", 'font-size="12"')}`;
      b += `<circle cx="${xEnd - 76}" cy="26" r="4" fill="${t.bg}" stroke="${t.open}" stroke-width="1.6"/>${text(xEnd - 66, 30, `${prsOpen} open`, "s mu", 'font-size="12"')}`;
    } else if (lv === "none") {
      b += text(xEnd, 30, `${T.externalPRs} PRs`, "s mu e", 'font-size="12"');
    } else {
      // Right-aligned legend: "○ 312 PRs ● 278 merged", or one entry per outcome for "full".
      const c = totalsCounts(T);
      const entries: [node: (cx: number) => string, label: string][] =
        lv === "merged"
          ? [
              [(cx) => node(cx, 26, "pr"), `${c.prs} PRs`],
              [(cx) => node(cx, 26, "merged"), `${c.prsMerged} merged`],
            ]
          : prParts(c, lv).map((part) => [
              (cx) => node(cx, 26, part.key),
              `${part.count} ${part.label}`,
            ]);
      let lx = xEnd;
      for (const [dot, label] of [...entries].reverse()) {
        lx -= label.length * 6.4;
        b += dot(lx - 10) + text(lx, 30, label, "s mu", 'font-size="12"');
        lx -= 28;
      }
    }
    b += `<line x1="${P}" y1="48.5" x2="${W - P}" y2="48.5" stroke="${t.border}"/>`;
    if (n) {
      b += `<line x1="${gx}" y1="${top - 8}" x2="${gx}" y2="${top + LH * (n - 1) + 14}" stroke="${t.border}" stroke-width="2"/>`;
    }
    list.forEach((p, i) => {
      const y = top + LH * i + 4;
      const merged = p.state === "MERGED";
      b += `<g class="r" style="animation-delay:${(i * 0.04).toFixed(2)}s">`;
      const key =
        lv === "none"
          ? "pr"
          : merged
            ? "merged"
            : lv === "full"
              ? p.state === "OPEN"
                ? "open"
                : "closed"
              : "pr";
      if (lv === undefined) {
        b += merged
          ? `<circle cx="${gx}" cy="${y - 4}" r="5" fill="${t.merged}" stroke="${t.bg}" stroke-width="2"/>`
          : `<circle cx="${gx}" cy="${y - 4}" r="4.5" fill="${t.bg}" stroke="${t.open}" stroke-width="1.8"/>`;
      } else b += node(gx, y - 4, key);
      const repoCls =
        lv === undefined
          ? merged
            ? "pu"
            : "gr"
          : { pr: lv === "none" ? "ac" : "t", merged: "pu", open: "po", closed: "cl" }[key];
      b += text(xDate, y, shortDateIn(p.createdAt, asOf.slice(0, 4)), "m n f", fs);
      const num = `#${p.number}`;
      const repo = trunc(p.repo, refC - num.length);
      b += `<text x="${xRef}" y="${y}" class="m" ${fs}><tspan class="${repoCls}">${esc(repo)}</tspan><tspan class="mu">${esc(num)}</tspan></text>`;
      b += text(xTitle, y, trunc(p.title, titleC), "m t", fs);
      b += `<text x="${xEnd}" y="${y}" class="m n e" ${fs}><tspan class="ad">+${p.additions}</tspan><tspan class="de"> −${p.deletions}</tspan></text>`;
      b += "</g>";
    });
    const footer =
      lv === undefined
        ? n
          ? `${n} most recent of ${T.externalPRs} upstream PRs · closed-unmerged hidden · ${asOf}`
          : `No merged or open PRs among the latest ${stats.recentPRs.length} upstream · ${asOf}`
        : n
          ? `${n} ${lv === "full" ? "most recent" : "recent"} of ${T.externalPRs} upstream PRs · ${asOf}`
          : `No recent upstream PRs · ${asOf}`;
    b += text(xDate, H - 14, footer, "s f", 'font-size="11"');
    const css =
      (lv ? `.po{fill:${t.prOpen}}.cl{fill:${t.closed}}` : "") +
      ".r{animation:r .35s ease-out both}@keyframes r{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:none}}";
    return svg(
      W,
      H,
      t,
      css,
      b,
      `Latest upstream PRs: ${list.map((p) => `${p.repo}#${p.number}`).join(", ")}`,
    );
  },
};
