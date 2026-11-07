import { prsClosed, totalsCounts } from "../../kit/outcomes.ts";
import { DEFAULT_OPTIONS, type Design, type Level } from "../types.ts";
import { THEMES, derive, esc, kfmt, svg, text, trunc } from "./_shared.ts";

/** Rows the command asks for; fewer are printed when there are fewer repos. */
const TOP = 12;
const BASE = {
  rank: 40,
  repo: 56,
  lang: 352,
  stars: 500,
  prs: 556,
  merged: 628,
  open: 0,
  closed: 0,
  issues: 700,
  disc: 756,
  total: 816,
};
type Cols = typeof BASE;

/** Right edges of the number columns per level; a column at 0 is not printed. Repo and language widths shrink for "full". */
const LAYOUT: Record<Level, Cols & { repoC: number; langC: number }> = {
  none: { ...BASE, prs: 579, merged: 0, issues: 658, disc: 737, repoC: 36, langC: 10 },
  merged: { ...BASE, repoC: 36, langC: 10 },
  full: {
    ...BASE,
    lang: 318,
    stars: 452,
    prs: 492,
    merged: 552,
    open: 598,
    closed: 658,
    issues: 718,
    disc: 764,
    repoC: 32,
    langC: 10,
  },
};

export const design: Design = {
  id: "C02",
  slug: "terminal",
  title: "Terminal table",
  idea: "A fake `upstream --top 12` command that types itself out and prints an aligned monospace table of the top repos (language, stars, PRs, merged, issues, discussions), with a totals line. With outcomes none the merged column goes; full adds open and closed-unmerged columns.",
  render(stats, theme, options = DEFAULT_OPTIONS) {
    const lv = options.outcomes;
    const C = LAYOUT[lv];
    const t = THEMES[theme];
    const { T, asOf, extIssues, extDisc, extTotal } = derive(stats);
    const rows = stats.repos.slice(0, TOP);
    const N = rows.length;
    const W = 840;
    const LH = 22;
    const P = 24;
    const FS = 13;
    const head = 34; // title bar
    const y0 = head + 32; // command baseline
    const H = y0 + LH * (N + 5) + 18;
    const cmd = `upstream --top ${TOP} --sort total`;
    const cw = FS * 0.6;
    const fs = `font-size="${FS}"`;
    let b = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="8" fill="${t.card}" stroke="${t.border}"/>`;
    b += `<line x1="1" y1="${head + 0.5}" x2="${W - 1}" y2="${head + 0.5}" stroke="${t.border}"/>`;
    for (const i of [0, 1, 2]) {
      b += `<circle cx="${20 + i * 16}" cy="${head / 2}" r="5" fill="none" stroke="${t.border}" stroke-width="1.5"/>`;
    }
    b += text(W / 2, head / 2 + 4, `${stats.user} — upstream`, "s mu c", 'font-size="12"');
    // command line, revealed by a sliding mask
    b += text(P, y0, "~", "m ac", fs);
    b += text(P + 2 * cw, y0, "$", "m mu", fs);
    const cx = P + 4 * cw;
    const cmdW = Math.ceil(cmd.length * cw) + 4;
    b += text(cx, y0, cmd, "m t", fs);
    b += `<rect class="type" x="${cx - 1}" y="${y0 - FS}" width="${cmdW + 2}" height="${FS + 6}" fill="${t.card}"/>`;
    b += `<rect class="cur1" x="${cx + cmdW - 3}" y="${y0 - FS + 1}" width="${cw}" height="${FS + 3}" fill="${t.muted}"/>`;
    // table
    const hy = y0 + LH * 1.5;
    const th = (k: keyof Cols, s: string, end = false) =>
      C[k] ? text(C[k], hy, s, `m b mu cap${end ? " e" : ""}`, 'font-size="11"') : "";
    b += '<g class="row" style="animation-delay:.95s">';
    b +=
      th("rank", "#", true) +
      th("repo", "REPO") +
      th("lang", "LANGUAGE") +
      th("stars", "STARS", true) +
      th("prs", "PRS", true) +
      th("merged", "MERGED", true) +
      th("open", "OPEN", true) +
      th("closed", "CLOSED", true) +
      th("issues", "ISSUES", true) +
      th("disc", "DISC.", true) +
      th("total", "TOTAL", true);
    b += "</g>";
    const num = (k: keyof Cols, y: number, v: number, cls = "t") =>
      C[k] ? text(C[k], y, String(v), `m n e ${v === 0 ? "f" : cls}`, fs) : "";
    rows.forEach((r, i) => {
      const y = hy + LH * (i + 1);
      b += `<g class="row" style="animation-delay:${(1.0 + i * 0.045).toFixed(3)}s">`;
      b += text(C.rank, y, String(i + 1), "m n e f", fs);
      const repoStr = trunc(r.repo, C.repoC);
      const oPart = repoStr.slice(0, Math.min(r.owner.length + 1, repoStr.length));
      b += `<text x="${C.repo}" y="${y}" class="m" ${fs}><tspan class="mu">${esc(oPart)}</tspan><tspan class="t">${esc(repoStr.slice(oPart.length))}</tspan></text>`;
      if (r.language) {
        b += `<circle cx="${C.lang + 4}" cy="${y - 4.5}" r="4" fill="${r.langColor || t.faint}"/>`;
        b += text(C.lang + 14, y, trunc(r.language, C.langC), "m mu", fs);
      }
      b += text(C.stars, y, kfmt(r.stars), "m n e mu", fs);
      b += num("prs", y, r.prs);
      b += num("merged", y, r.prsMerged, "pu");
      b += num("open", y, r.prsOpen, "po");
      b += num("closed", y, prsClosed(r), "cl");
      b += num("issues", y, r.issues);
      b += num("disc", y, r.discussions);
      b += text(C.total, y, String(r.total), "m n e t b", fs);
      b += "</g>";
    });
    const ry = hy + LH * N + 12;
    b += `<g class="row" style="animation-delay:${(1.0 + N * 0.045).toFixed(3)}s">`;
    b += `<line x1="${P}" y1="${ry + 0.5}" x2="${W - P}" y2="${ry + 0.5}" stroke="${t.border}" stroke-dasharray="3 3"/>`;
    const sy = ry + LH;
    b += text(C.repo, sy, `all ${T.externalRepos} repos · ${T.externalOwners} owners`, "m mu", fs);
    b += num("prs", sy, T.externalPRs);
    b += num("merged", sy, T.externalMerged, "pu");
    b += num("open", sy, T.externalOpen, "po");
    b += num("closed", sy, prsClosed(totalsCounts(T)), "cl");
    b += num("issues", sy, extIssues);
    b += num("disc", sy, extDisc);
    b += text(C.total, sy, String(extTotal), "m n e t b", fs);
    b += "</g>";
    // final prompt
    const py = sy + LH * 1.5;
    b += `<g class="row" style="animation-delay:${(1.1 + N * 0.045).toFixed(3)}s">`;
    b += text(P, py, "~", "m ac", fs) + text(P + 2 * cw, py, "$", "m mu", fs);
    b += `<rect class="cur2" x="${cx}" y="${py - FS + 1}" width="${cw}" height="${FS + 3}" fill="${t.muted}"/>`;
    b += text(W - P, py, `as of ${asOf}`, "m f e", 'font-size="11"');
    b += "</g>";
    const css = `${lv === "full" ? `.po{fill:${t.prOpen}}.cl{fill:${t.closed}}` : ""}
.type{transform:translateX(${cmdW + 2}px);animation:type .75s steps(${cmd.length}) .15s both}
@keyframes type{from{transform:none}to{transform:translateX(${cmdW + 2}px)}}
.cur1{opacity:0;animation:cur1 .9s step-end both}
@keyframes cur1{0%,99%{opacity:1}100%{opacity:0}}
.row{animation:row .2s ease-out both}@keyframes row{from{opacity:0}to{opacity:1}}
.cur2{animation:blink 1s step-end 1.8s 4 both}@keyframes blink{50%{opacity:0}}`;
    return svg(
      W,
      H,
      t,
      css,
      b,
      `upstream --top ${TOP}: ${rows.map((r) => `${r.repo} ${r.total}`).join(", ")}`,
    );
  },
};
