import { prParts } from "../../kit/outcomes.ts";
import type { Stats } from "../../stats/types.ts";
import { DEFAULT_OPTIONS, type Design, type RenderOptions, type ThemeName } from "../types.ts";
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

function render(stats: Stats, theme: ThemeName, options: RenderOptions = DEFAULT_OPTIONS): string {
  const lvl = options.outcomes;
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
  type Tab = [IconName, string, number, string, number];
  const mergedTab: Tab[] = lvl === "none" ? [] : [["merge", t.muted, X.merged, "Merged", 400]];
  const tabs: Tab[] = [
    ["pr", t.text, X.prs, "PRs", 600],
    ...mergedTab,
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
  const c1 = counter(W - 16 - c2.w - 18, "Repos", X.repos);
  b += c1.s + c2.s;

  /** PR counters for a row: PRs, PRs then merged, or each outcome, depending on the level. */
  const prSlots = (r: (typeof repos)[number]): [IconName, number, string][] =>
    lvl === "none"
      ? [["pr", r.prs, t.muted]]
      : lvl === "merged"
        ? [
            ["pr", r.prs, t.muted],
            ["merge", r.prsMerged, t.pr],
          ]
        : prParts(r, lvl).map((p): [IconName, number, string] => [
            p.key === "merged" ? "merge" : "pr",
            p.count,
            p.key === "merged" ? t.pr : p.key === "open" ? t.open : t.closed,
          ]);

  // rows
  repos.forEach((r, i) => {
    const y = HH + i * RH;
    if (i)
      b += `<line x1="0" x2="${W}" y1="${y + 0.5}" y2="${y + 0.5}" stroke="${t.borderMuted}"/>`;
    b += icon("repo", 16, y + 12, 16, t.muted);
    // Under "full" five counters need more room: the name and pills move left.
    const wide = lvl === "full";
    // Primer Label pills, moved left when they would reach the first counter icon
    const pills: [string, string | null][] = [];
    if (r.language) pills.push([r.language, r.langColor ?? t.muted]);
    pills.push([r.ownerType === "User" ? "person" : "org", null]);
    const pillW = (txt: string, dot: string | null) => (dot ? 16 : 8) + tw(txt, 12) + 8;
    const pillsW = pills.reduce((a, [txt, dot]) => a + pillW(txt, dot) + 6, -6);
    const firstIcon = W - 16 - (prSlots(r).length + 1) * (wide ? 54 : 64) - (wide ? 40 : 46);
    let lx = Math.min(wide ? 400 : 440, firstIcon - 10 - pillsW);
    const shown = trunc(r.repo, Math.min(wide ? 340 : 380, lx - 50), 14, { bold: true });
    b += `<text x="40" y="${y + 25}" font-size="14" font-weight="600" fill="${t.accent}">${esc(shown)}</text>`;
    const pill = (txt: string, dot: string | null) => {
      const w = pillW(txt, dot);
      const s = `<rect x="${r1(lx)}" y="${y + 10.5}" width="${r1(w)}" height="20" rx="10" fill="none" stroke="${t.border}"/>${dot ? `<circle cx="${r1(lx + 10)}" cy="${y + 20.5}" r="4" fill="${dot}"/>` : ""}<text x="${r1(lx + (dot ? 18 : 8))}" y="${y + 24.5}" font-size="12" font-weight="500" fill="${t.muted}">${esc(txt)}</text>`;
      lx += w + 6;
      return s;
    };
    for (const [txt, dot] of pills) b += pill(txt, dot);
    // meta line
    b += `${icon("star", 40, y + 36, 12, t.muted)}<text x="56" y="${y + 47}" font-size="12" fill="${t.muted}">${kfmt(r.stars)}</text>`;
    const mx = 56 + tw(kfmt(r.stars), 12) + 10;
    if (r.first && r.last)
      b += `<text x="${r1(mx)}" y="${y + 47}" font-size="12" fill="${t.muted}">· first ${dayLabel(r.first)} · latest ${dayLabel(r.last)}</text>`;
    // right counters
    const slots: [IconName, number, string][] = [
      ...prSlots(r),
      ["issue", r.issues, t.issue],
      ["disc", r.discussions, t.disc],
    ];
    const sw = wide ? 54 : 64;
    slots.forEach(([ic, v, col], j) => {
      const xr = W - 16 - (slots.length - 1 - j) * sw;
      const op = v ? 1 : 0.4;
      b += `<g opacity="${op}">${icon(ic, xr - (wide ? 40 : 46), y + 22, 16, v ? col : t.muted)}<text x="${xr}" y="${y + 35}" text-anchor="end" font-size="13" font-weight="${v ? 600 : 400}" fill="${v ? t.text : t.muted}">${v}</text></g>`;
    });
  });

  // footer
  const fy = HH + N * RH;
  b += `<line x1="0" x2="${W}" y1="${fy + 0.5}" y2="${fy + 0.5}" stroke="${t.border}"/>`;
  const scope = N < X.repos ? `Top ${N} of ${X.repos} repos` : `All ${plural(N, "repo")}`;
  b += `<text x="16" y="${fy + 25}" font-size="12" fill="${t.muted}">${scope}</text>`;
  b += legend(
    W - 16,
    fy + 25,
    t,
    [
      ...(lvl === "none"
        ? [{ k: "PRs", c: t.muted }]
        : lvl === "merged"
          ? [
              { k: "PRs", c: t.muted },
              { k: "of which merged", c: t.pr },
            ]
          : lvl === "full"
            ? [
                { k: "merged", c: t.pr },
                { k: "open", c: t.open },
                { k: "closed unmerged", c: t.closed },
              ]
            : [
                { k: "merged", c: t.pr },
                { k: "not merged", c: t.muted },
              ]),
      { k: "issues", c: t.issue },
      { k: "discussions", c: t.disc },
    ],
    { anchor: "end", size: 11.5, swatchRx: 4.5 },
  );
  return svg(W, H, `Top ${N} upstream repos`, b);
}

export const design: Design = {
  id: "E05",
  slug: "github-style-list",
  title: "GitHub-style list",
  idea: "Looks like a native GitHub list: an issues-style header with octicon tabs and counters, Box rows with blue repo links, language/owner label pills, dates and per-type counts.",
  render,
};
