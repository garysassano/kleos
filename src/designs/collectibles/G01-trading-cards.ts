import { mergeRate, prsClosed } from "../../kit/outcomes.ts";
import {
  PALETTES,
  SANS,
  avatar,
  compact,
  document,
  esc,
  textWidth,
  truncate,
} from "../../kit/svg.ts";
import { DEFAULT_OPTIONS, type Design } from "../types.ts";
import { monthYear, ownerLanguage, ownerSpan, plural, rarities, rarityOf } from "./_shared.ts";

const CW = 264;
const CH = 372;
const GAP = 12;
const PAD = 12;

export const design: Design = {
  id: "G01",
  slug: "trading-cards",
  title: "Trading cards",
  idea: "The top three owners as collectible cards: avatar art, a stat block of PRs merged, PRs, issues and discussions, and a rarity tier from the total stars on the repos contributed to (thresholds printed in the legend). With outcomes none the merged row goes; full adds the merge rate and the open and closed-unmerged PRs beside the counts.",
  render(stats, theme, options = DEFAULT_OPTIONS) {
    const lv = options.outcomes;
    const p = PALETTES[theme];
    const top = stats.owners.slice(0, 3);
    const tiers = rarities(theme);
    const n = Math.max(top.length, 1);
    const width = PAD * 2 + 3 * CW + 2 * GAP;
    const x0 = (width - (n * CW + (n - 1) * GAP)) / 2;
    const height = PAD + CH + 44;
    const ownerCount = stats.owners.length;

    const cards = top.map((o, i) => {
      const r = rarityOf(o, theme);
      const id = `g01c${i}`;
      const lang = ownerLanguage(stats, o.owner);
      const span = ownerSpan(stats, o.owner);
      const typeLine = [o.type === "User" ? "Person" : "Org", lang, plural(o.repos, "repo")]
        .filter(Boolean)
        .join(" · ");
      const total = String(o.total);
      const totalW = total.length * 20 * 0.64 + 6;
      const nameMax = CW - 36 - totalW - 44;
      // Optional fourth element: a small note set left of the value ("full" only).
      const rows: [string, number, string, string?][] = [
        ["PRs merged", o.prsMerged, p.merged],
        ["PRs opened", o.prs, p.pr],
        ["Issues opened", o.issues, p.issue],
        ["Discussions started", o.discussions, p.discussion],
      ];
      if (lv === "none") rows.shift();
      if (lv === "full") {
        const c = { prs: o.prs, prsMerged: o.prsMerged, prsOpen: o.prsOpen };
        const rate = mergeRate(c, lv);
        if (rate !== null) (rows[0] as (typeof rows)[number])[3] = `${rate}%`;
        (rows[1] as (typeof rows)[number])[3] =
          `<tspan fill="${p.open}">${o.prsOpen} open</tspan> · ${prsClosed(c)} closed`;
      }
      // Rows keep the original 25 px pitch for four; fewer rows spread over the same block.
      const pitch = rows.length === 4 ? 25 : 75 / Math.max(rows.length - 1, 1);
      const statRows = rows
        .map(([label, v, c, note], k) => {
          const y = 214 + k * pitch;
          const noteX = CW - 18 - String(v).length * 14 * 0.62 - 8;
          const noteSvg = note
            ? `<text x="${noteX}" y="${y}" text-anchor="end" font-size="10" fill="${p.faint}">${note}</text>`
            : "";
          return `<circle cx="24" cy="${y - 4}" r="4.5" fill="${c}"/><text x="36" y="${y}" font-size="12" fill="${p.text}">${label}</text>${noteSvg}<text x="${CW - 18}" y="${y}" text-anchor="end" font-size="14" font-weight="700" fill="${v ? p.text : p.faint}">${v}</text>${k < rows.length - 1 ? `<line x1="18" x2="${CW - 18}" y1="${y + 9.5}" y2="${y + 9.5}" stroke="${p.hair}"/>` : ""}`;
        })
        .join("");
      const topRepo = o.topRepos[0] ?? "";
      const active =
        span.first && span.last
          ? `${monthYear(span.first)} – ${monthYear(span.last)}`
          : span.first
            ? `since ${monthYear(span.first)}`
            : "dates unknown";
      const pill = r.name.toUpperCase();
      const pillW = pill.length * (9.5 * 0.7 + 0.5) + 26;
      const starsTxt = `${compact(o.stars)} stars`;
      const art = `<clipPath id="${id}a"><rect x="16" y="48" width="${CW - 32}" height="128" rx="7"/></clipPath>
<g clip-path="url(#${id}a)"><rect x="16" y="48" width="${CW - 32}" height="128" fill="url(#${id}g)"/><rect x="16" y="48" width="${CW - 32}" height="128" fill="url(#g01stripes)"/><rect class="shine" style="animation-delay:${0.25 + i * 0.2}s" x="-80" y="40" width="60" height="150" fill="url(#g01shine)" transform="skewX(-20)"/></g>
<rect x="16.5" y="48.5" width="${CW - 33}" height="127" rx="7" fill="none" stroke="${r.color}" stroke-opacity="0.45"/>
${avatar({ id: `${id}v`, login: o.owner, uri: stats.avatars[o.owner], x: CW / 2 - 44, y: 68, size: 88, org: o.type !== "User", palette: p })}
<rect x="24" y="56" width="${textWidth(`#${i + 1}`, 10) + 14}" height="18" rx="9" fill="${p.bg}" fill-opacity="0.85"/><text x="31" y="68.5" font-size="10" font-weight="700" fill="${p.text}">#${i + 1}</text>`;
      return `<g transform="translate(${x0 + i * (CW + GAP)} ${PAD})">
<linearGradient id="${id}f" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${r.color}"/><stop offset="0.5" stop-color="${r.color}" stop-opacity="0.45"/><stop offset="1" stop-color="${r.color}"/></linearGradient>
<linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${r.color}" stop-opacity="0.32"/><stop offset="1" stop-color="${r.color}" stop-opacity="0.06"/></linearGradient>
<rect x="0" y="0" width="${CW}" height="${CH}" rx="14" fill="url(#${id}f)"/>
<rect x="5" y="5" width="${CW - 10}" height="${CH - 10}" rx="10" fill="${p.surface}"/>
<text x="18" y="33" font-size="16" font-weight="700" fill="${p.text}">${esc(truncate(o.owner, nameMax, 16))}</text>
<text x="${CW - 18 - totalW}" y="33" text-anchor="end" font-size="9" font-weight="600" letter-spacing="0.6" fill="${p.muted}">TOTAL</text>
<text x="${CW - 18}" y="34" text-anchor="end" font-size="20" font-weight="800" fill="${r.color}">${total}</text>
${art}
<text x="18" y="194" font-size="11" fill="${p.muted}">${esc(truncate(typeLine, CW - 36, 10))}</text>
${statRows}
<line x1="18" x2="${CW - 18}" y1="301" y2="301" stroke="${p.border}"/>
<text x="18" y="318" font-size="10.5" fill="${p.muted}"><tspan font-weight="600">Top repo</tspan> <tspan fill="${p.text}">${esc(truncate(topRepo, CW - 92, 10.5))}</tspan></text>
<text x="18" y="334" font-size="10.5" fill="${p.muted}"><tspan font-weight="600">Active</tspan> <tspan fill="${p.text}">${esc(active)}</tspan></text>
<rect x="14" y="343" width="${pillW}" height="19" rx="9.5" fill="${r.color}" fill-opacity="0.16" stroke="${r.color}" stroke-opacity="0.6"/>
<path d="M${23} ${348.5}l1.5 3.1 3.4.5-2.45 2.4.58 3.4-3.03-1.6-3.03 1.6.58-3.4-2.45-2.4 3.4-.5z" fill="${r.color}"/>
<text x="31" y="356.5" font-size="9.5" font-weight="700" letter-spacing="0.5" fill="${r.color}">${pill}</text>
<text x="${20 + pillW}" y="356.5" font-size="10.5" fill="${p.muted}">${esc(starsTxt)}</text>
<text x="${CW - 18}" y="356.5" text-anchor="end" font-size="10.5" fill="${p.faint}">No. ${i + 1}/${ownerCount}</text>
</g>`;
    });

    const empty = top.length
      ? ""
      : `<text x="${width / 2}" y="${PAD + CH / 2}" text-anchor="middle" font-size="13" fill="${p.muted}">No upstream contributions yet</text>`;

    // Legend: the rarity thresholds, then what TOTAL means.
    const est = (t: string) => [...t].length * 10.5 * 0.54;
    const ly = PAD + CH + 24;
    const lead = "Rarity by stars on the owner's repos I contributed to";
    let legend = `<text x="${PAD + 2}" y="${ly}" font-size="10.5" fill="${p.muted}">${esc(lead)}</text>`;
    const chips = tiers.map((t) => ({
      t,
      label: `${t.name} ${t.min ? `${compact(t.min)}+` : `< ${compact(tiers[1]?.min ?? 0)}`}`,
    }));
    const chipsW = chips.reduce((s, c) => s + est(c.label) + 26, -10);
    const row = PAD + est(lead) + 24 + chipsW > width - PAD ? 1 : 0;
    let lx = width - PAD - 2 - chipsW;
    for (const { t, label } of chips) {
      const y = ly + row * 16;
      legend += `<circle cx="${lx + 4}" cy="${y - 3.5}" r="3.5" fill="${t.color}"/><text x="${lx + 12}" y="${y}" font-size="10.5" fill="${p.muted}">${esc(label)}</text>`;
      lx += est(label) + 26;
    }
    const legend2 = `<text x="${PAD + 2}" y="${ly + (row + 1) * 16}" font-size="10.5" fill="${p.faint}">TOTAL = PRs + issues + discussions opened in the owner's repos</text>`;
    const h = height + (row + 1) * 16 - 6;

    const style = `.shine{animation:g01s 1.6s ease-in-out 1 both}@keyframes g01s{from{transform:skewX(-20deg) translateX(0)}to{transform:skewX(-20deg) translateX(420px)}}`;
    const defs = `<defs><pattern id="g01stripes" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="4" height="10" fill="${p.text}" fill-opacity="0.04"/></pattern><linearGradient id="g01shine" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="0.5" stop-color="#fff" stop-opacity="${theme === "dark" ? 0.18 : 0.5}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>`;
    return document({
      width,
      height: h,
      title: `Top ${top.length} owners as trading cards`,
      style,
      body: `${defs}<g font-family="${SANS}">${cards.join("")}${empty}${legend}${legend2}</g>`,
    });
  },
};
