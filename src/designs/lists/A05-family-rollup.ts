import type { OwnerStats } from "../../stats/types.ts";
import { DEFAULT_OPTIONS, type Design } from "../types.ts";
import {
  STD_LEGEND,
  avatar,
  dataOf,
  delay,
  esc,
  frame,
  header,
  legend,
  num,
  plural,
  rule,
  segsOf,
  stack,
  t,
  textW,
  themeOf,
  truncate,
} from "./_shared.ts";

const title = "Family roll-up";

export const design: Design = {
  id: "A05",
  slug: "family-rollup",
  title,
  idea: "Groups related GitHub owners into families (one vendor's several organisations) with the family total on top and member owners indented below, so a big vendor spread across many orgs shows up as one line.",
  render(stats, theme, options = DEFAULT_OPTIONS) {
    const level = options.outcomes;
    const T = themeOf(theme);
    const d = dataOf(stats);
    const W = 840;
    const frh = 38;
    const crh = 26;
    const fams = [...stats.families].sort(
      (a, b) => b.total - a.total || a.name.localeCompare(b.name),
    );
    const max = fams[0]?.total ?? 0;
    const bx = 360;
    const bw = 230;
    const cPR = 680;
    const cIss = 740;
    const cTot = 812;
    let b = header(
      T,
      "Contributions by vendor family",
      `Related GitHub owners grouped into one line · ${plural(fams.length, "family", "families")}`,
    );
    let y = 100;
    b +=
      t(T, 24, y - 12, "Family / owner", { size: 11, fill: "muted" }) +
      t(T, bx, y - 12, "Mix (to scale)", { size: 11, fill: "muted" });
    b +=
      t(T, cPR, y - 12, level === "none" ? "PRs" : "PRs merged", {
        size: 11,
        fill: "muted",
        anchor: "end",
      }) +
      t(T, cIss, y - 12, "Issues", { size: 11, fill: "muted", anchor: "end" }) +
      t(T, cTot, y - 12, "Total", { size: 11, fill: "muted", anchor: "end", weight: 600 });
    b += rule(T, W, y - 1);
    let i = 0;
    const famOwners = new Set<string>();
    for (const f of fams) {
      const mem = f.owners
        .map((o) => d.ownerBy.get(o))
        .filter((o): o is OwnerStats => o !== undefined)
        .sort((a, b) => b.total - a.total);
      for (const m of mem) famOwners.add(m.owner);
      const lead = mem[0];
      const cy = y + frh / 2;
      let g = "";
      if (i) g += rule(T, W, y, "hair");
      g += avatar(
        T,
        d.avatars,
        lead?.owner ?? f.name,
        lead?.type ?? "Organization",
        24,
        cy - 12,
        24,
      );
      g += t(T, 58, cy + 5, esc(f.name), { size: 14, weight: 600 });
      const sub =
        mem.length > 1 || !lead
          ? `${mem.length} owners · ${plural(f.repos, "repo")}`
          : `${lead.owner} · ${plural(f.repos, "repo")}`;
      g += t(T, 58 + textW(f.name, 14) + 12, cy + 4.5, esc(sub), { size: 11.5, fill: "muted" });
      g += `<g class="grow"${delay(i)}>${stack(T, bx, cy - 5, 10, segsOf(T, f, level), max, bw)}</g>`;
      g +=
        level === "none"
          ? num(T, cPR, cy + 4.5, f.prs, { size: 12.5 })
          : f.prs
            ? t(T, cPR, cy + 4.5, `${f.prsMerged}/${f.prs}`, {
                size: 12.5,
                anchor: "end",
                mono: true,
              })
            : num(T, cPR, cy + 4.5, 0);
      g +=
        num(T, cIss, cy + 4.5, f.issues, { size: 12.5 }) +
        num(T, cTot, cy + 4.5, f.total, { size: 14, weight: 700 });
      b += `<g class="row"${delay(i)}>${g}</g>`;
      y += frh;
      i++;
      if (mem.length > 1) {
        mem.forEach((m, j) => {
          const ccy = y + crh / 2;
          const last = j === mem.length - 1;
          let c = `<path d="M36 ${y - (j ? 0 : 6)}V${last ? ccy : y + crh}M36 ${ccy}H48" fill="none" stroke="${T.border}"/>`;
          c += avatar(T, d.avatars, m.owner, m.type, 54, ccy - 8, 16);
          c += t(T, 78, ccy + 4.3, esc(truncate(m.owner, 200, 12.5)), {
            size: 12.5,
            fill: "muted",
          });
          c += t(T, bx - 14, ccy + 4.3, plural(m.repos, "repo"), {
            size: 11,
            fill: "faint",
            anchor: "end",
          });
          c += `<g class="grow"${delay(i)}>${stack(T, bx, ccy - 3, 6, segsOf(T, m, level), max, bw, { gap: 1.5 })}</g>`;
          c +=
            level === "none"
              ? num(T, cPR, ccy + 4.3, m.prs, { size: 12, fill: "muted" })
              : m.prs
                ? t(T, cPR, ccy + 4.3, `${m.prsMerged}/${m.prs}`, {
                    size: 12,
                    fill: "muted",
                    anchor: "end",
                    mono: true,
                  })
                : num(T, cPR, ccy + 4.3, 0, { size: 12 });
          c +=
            num(T, cIss, ccy + 4.3, m.issues, { size: 12, fill: "muted" }) +
            num(T, cTot, ccy + 4.3, m.total, { size: 12.5, fill: "muted" });
          b += `<g class="row"${delay(i)}>${c}</g>`;
          y += crh;
        });
        y += 6;
      }
    }
    b += rule(T, W, y);
    const famTotal = fams.reduce((s, f) => s + f.total, 0);
    const solo = d.owners.filter((o) => !famOwners.has(o.owner));
    const top3 = solo
      .slice(0, 3)
      .map((o) => `${o.owner} ${o.total}`)
      .join(", ");
    const rest = solo.length
      ? `The other ${solo.length} owners are independent; biggest: ${top3}.`
      : "Every owner belongs to a family.";
    b += legend(T, 24, y + 26, STD_LEGEND(T, level));
    b += t(
      T,
      24,
      y + 48,
      esc(`Families hold ${famTotal} of ${d.ext.total} external contributions. ${rest}`),
      { size: 11.5, fill: "muted" },
    );
    return frame(T, W, y + 66, b, title);
  },
};
