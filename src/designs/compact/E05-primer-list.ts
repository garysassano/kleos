import type { Stats } from "../../stats/types.ts";
import type { Design, ThemeName } from "../types.ts";
import {
  type IconName,
  context,
  dayLabel,
  esc,
  fmt,
  icon,
  kfmt,
  legend,
  plural,
  r1,
  svg,
  trunc,
  tw,
  upstream,
} from "./_shared.ts";

/** Most repository rows. */
const MAX_ROWS = 7;

function render(stats: Stats, theme: ThemeName): string {
  const c = context(stats, theme);
  const { t } = c;
  const X = upstream(stats);
  const repos = stats.repos.slice(0, MAX_ROWS);
  const N = repos.length;
  const W = 840;
  const HH = 50;
  const RH = 60;
  const FH = 40;
  const H = HH + N * RH + FH;
  let b = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="6" fill="${t.inset}" stroke="${t.border}"/>`;

  // header band
  const hid = c.id("hd");
  b += `<clipPath id="${hid}"><rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="6"/></clipPath><rect x="0" y="0" width="${W}" height="${HH}" fill="${t.card}" clip-path="url(#${hid})"/><line x1="0" x2="${W}" y1="${HH - 0.5}" y2="${HH - 0.5}" stroke="${t.border}"/>`;

  // issue-list style header tabs
  const tabs: [IconName, string, number, string, number][] = [
    ["pr", t.text, X.prs, "Pull requests", 600],
    ["merge", t.muted, X.merged, "Merged", 400],
    ["issue", t.muted, X.issues, "Issues", 400],
    ["disc", t.muted, X.discussions, "Discussions", 400],
  ];
  let tx = 16;
  for (const [ic, col, v, label, fw] of tabs) {
    b += icon(ic, tx, 17, 16, col);
    const txt = `${fmt(v)} ${label}`;
    b += `<text x="${tx + 22}" y="30" font-size="14" font-weight="${fw}" fill="${col}">${txt}</text>`;
    tx += 22 + tw(txt, 14, { bold: fw > 400 }) + 22;
  }

  // right: counters
  const counter = (xr: number, label: string, v: number) => {
    const vw = tw(String(v), 12) + 12;
    const lw = tw(label, 14);
    const cx = xr - vw;
    return {
      w: vw + 6 + lw,
      s: `<text x="${cx - 6}" y="30" text-anchor="end" font-size="14" fill="${t.muted}">${label}</text><rect x="${r1(cx)}" y="15" width="${r1(vw)}" height="20" rx="10" fill="${t.name === "dark" ? "#2f3742" : "#818b981f"}"/><text x="${r1(cx + vw / 2)}" y="29" text-anchor="middle" font-size="12" font-weight="600" fill="${t.text}">${v}</text>`,
    };
  };
  const c2 = counter(W - 16, "Owners", X.owners);
  const c1 = counter(W - 16 - c2.w - 18, "Repositories", X.repos);
  b += c1.s + c2.s;

  // rows
  repos.forEach((r, i) => {
    const y = HH + i * RH;
    if (i)
      b += `<line x1="0" x2="${W}" y1="${y + 0.5}" y2="${y + 0.5}" stroke="${t.borderMuted}"/>`;
    b += icon("repo", 16, y + 12, 16, t.muted);
    const shown = trunc(r.repo, 380, 14, { bold: true });
    b += `<text x="40" y="${y + 25}" font-size="14" font-weight="600" fill="${t.accent}">${esc(shown)}</text>`;
    // Primer Label pills
    let lx = 440;
    const pill = (txt: string, dot?: string | null) => {
      const w = (dot ? 16 : 8) + tw(txt, 12) + 8;
      const s = `<rect x="${r1(lx)}" y="${y + 10.5}" width="${r1(w)}" height="20" rx="10" fill="none" stroke="${t.border}"/>${dot ? `<circle cx="${r1(lx + 10)}" cy="${y + 20.5}" r="4" fill="${dot}"/>` : ""}<text x="${r1(lx + (dot ? 18 : 8))}" y="${y + 24.5}" font-size="12" font-weight="500" fill="${t.muted}">${esc(txt)}</text>`;
      lx += w + 6;
      return s;
    };
    if (r.language) b += pill(r.language, r.langColor ?? t.muted);
    b += pill(r.ownerType === "User" ? "user" : "org");
    // meta line
    b += `${icon("star", 40, y + 36, 12, t.muted)}<text x="56" y="${y + 47}" font-size="12" fill="${t.muted}">${kfmt(r.stars)}</text>`;
    const mx = 56 + tw(kfmt(r.stars), 12) + 10;
    if (r.first && r.last)
      b += `<text x="${r1(mx)}" y="${y + 47}" font-size="12" fill="${t.muted}">· first ${dayLabel(r.first)} · latest ${dayLabel(r.last)}</text>`;
    // right counters
    const slots: [IconName, number, string][] = [
      ["merge", r.prsMerged, t.pr],
      ["pr", r.prs - r.prsMerged, t.muted],
      ["issue", r.issues, t.issue],
      ["disc", r.discussions, t.disc],
    ];
    const sw = 64;
    slots.forEach(([ic, v, col], j) => {
      const xr = W - 16 - (slots.length - 1 - j) * sw;
      const op = v ? 1 : 0.4;
      b += `<g opacity="${op}">${icon(ic, xr - 46, y + 22, 16, v ? col : t.muted)}<text x="${xr}" y="${y + 35}" text-anchor="end" font-size="13" font-weight="${v ? 600 : 400}" fill="${v ? t.text : t.muted}">${v}</text></g>`;
    });
  });

  // footer
  const fy = HH + N * RH;
  b += `<line x1="0" x2="${W}" y1="${fy + 0.5}" y2="${fy + 0.5}" stroke="${t.border}"/>`;
  const scope =
    N < X.repos
      ? `Top ${N} of ${X.repos} repositories`
      : `All ${plural(N, "repository", "repositories")}`;
  b += `<text x="16" y="${fy + 25}" font-size="12" fill="${t.muted}">${scope} by PRs + issues + discussions</text>`;
  b += legend(
    W - 16,
    fy + 25,
    t,
    [
      { k: "merged", c: t.pr },
      { k: "not merged", c: t.muted },
      { k: "issues", c: t.issue },
      { k: "discussions", c: t.disc },
    ],
    { anchor: "end", size: 11.5, swatchRx: 4.5 },
  );
  return svg(W, H, `Top ${N} upstream repositories`, b);
}

export const design: Design = {
  id: "E05",
  slug: "primer-list",
  title: "Primer repository list",
  idea: "Looks like a native GitHub list: an issues-style header with octicon tabs and counters, Box rows with blue repo links, language/owner label pills, dates and per-type counts.",
  render,
};
