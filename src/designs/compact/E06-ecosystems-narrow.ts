import { prParts } from "../../kit/outcomes.ts";
import type { OwnerStats, Stats } from "../../stats/types.ts";
import { DEFAULT_OPTIONS, type Design, type RenderOptions, type ThemeName } from "../types.ts";
import {
  ONE_OF_EACH,
  avatar,
  card,
  context,
  esc,
  kinds,
  kindsAt,
  legend,
  legendAt,
  plural,
  segBar,
  svg,
} from "./_shared.ts";

function render(stats: Stats, theme: ThemeName, options: RenderOptions = DEFAULT_OPTIONS): string {
  const lvl = options.outcomes;
  const c = context(stats, theme);
  const { t } = c;
  const W = 420;
  const P = 16;
  const RH = 64;
  const fams = [...stats.families].sort((a, b) => b.total - a.total);
  const top = 62;
  const rows = Math.max(1, fams.length);
  const H = top + rows * RH + 34;
  let b = card(W, H, t);
  b += `<text x="${P}" y="30" font-size="15" font-weight="600" fill="${t.text}">Ecosystems</text>`;
  b += `<text x="${P}" y="48" font-size="12" fill="${t.muted}">Upstream work grouped by vendor, across all their orgs</text>`;
  const max = Math.max(1, fams[0]?.total ?? 0);
  const barW = W - 2 * P;
  const byLogin = new Map(stats.owners.map((o) => [o.owner, o]));
  if (!fams.length)
    b += `<line x1="${P}" x2="${W - P}" y1="${top + 0.5}" y2="${top + 0.5}" stroke="${t.borderMuted}"/><text x="${P}" y="${top + 36}" font-size="12" fill="${t.muted}">No vendor family has upstream activity yet</text>`;
  fams.forEach((f, i) => {
    const y = top + i * RH;
    b += `<line x1="${P}" x2="${W - P}" y1="${y + 0.5}" y2="${y + 0.5}" stroke="${t.borderMuted}"/>`;
    // avatar stack of the member owners that have activity
    const mem = f.owners.map((o) => byLogin.get(o)).filter((o): o is OwnerStats => !!o);
    const shown = mem.slice(0, 4);
    const s = 20;
    const st = 12;
    shown.forEach((o, j) => {
      b += avatar(c, o.owner, P + j * st, y + 11, s, { type: o.type, ring: t.card });
    });
    const nx = shown.length ? P + s + st * (shown.length - 1) + 10 : P;
    b += `<text x="${nx}" y="${y + 26}" font-size="13.5" font-weight="600" fill="${t.text}">${esc(f.name)}</text>`;
    const unit = mem.every((o) => o.type === "Organization") ? "orgs" : "owners";
    const orgTxt =
      mem.length > 1
        ? `${mem.length} ${unit} · ${plural(f.repos, "repo")}`
        : `${plural(f.repos, "repo")}`;
    b += `<text x="${W - P - 44}" y="${y + 26}" text-anchor="end" font-size="11.5" fill="${t.muted}">${orgTxt}</text>`;
    b += `<text x="${W - P}" y="${y + 27}" text-anchor="end" font-size="16" font-weight="600" fill="${t.text}">${f.total}</text>`;
    b += segBar(c, P, y + 38, barW, 6, lvl ? kindsAt(t, f, lvl) : kinds(t, f), {
      fullWidth: Math.max(6, (f.total / max) * barW),
    });
    const prCap =
      lvl === "none"
        ? [plural(f.prs, "PR")]
        : lvl === "full" && f.prs
          ? prParts(f, lvl)
              .filter((p) => p.count)
              .map((p) => `${p.count} ${p.key === "closed" ? "closed" : p.label}`)
          : [`${plural(f.prs, "PR")}${f.prs ? ` (${f.prsMerged} merged)` : ""}`];
    const cap = [
      ...(lvl === "full" && f.prs ? [`${plural(f.prs, "PR")}: ${prCap.join(", ")}`] : prCap),
      plural(f.issues, "issue"),
      ...(f.discussions ? [plural(f.discussions, "discussion")] : []),
    ].join(" · ");
    b += `<text x="${P}" y="${y + 57}" font-size="11" fill="${t.muted}">${esc(cap)}</text>`;
  });
  const ly = top + rows * RH;
  b += `<line x1="${P}" x2="${W - P}" y1="${ly + 0.5}" y2="${ly + 0.5}" stroke="${t.borderMuted}"/>`;
  b += legend(
    P,
    ly + 22,
    t,
    lvl === "full"
      ? // Short labels so five entries fit the narrow card; the PR context comes from the captions.
        legendAt(t, lvl).map(({ k, c: col }) => ({ k: k.replace(/^PRs /, ""), c: col }))
      : lvl
        ? legendAt(t, lvl)
        : kinds(t, ONE_OF_EACH).map(({ k, c: col }) => ({
            k: k === "other PRs" ? "not merged" : k,
            c: col,
          })),
    { gap: 12, size: 11 },
  );
  return svg(W, H, "Upstream contributions by ecosystem", b);
}

export const design: Design = {
  id: "E06",
  slug: "ecosystems-narrow",
  title: "Ecosystems (narrow)",
  idea: "A 420px card grouping work by vendor family (one brand spread across several orgs) with member-org avatars, scaled stacked bars and a written breakdown. Built to pair with another narrow card.",
  render,
};
