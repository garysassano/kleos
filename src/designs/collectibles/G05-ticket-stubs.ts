import { prsClosed } from "../../kit/outcomes.ts";
import {
  MONO,
  PALETTES,
  SANS,
  compact,
  document,
  esc,
  textWidth,
  truncate,
} from "../../kit/svg.ts";
import { DEFAULT_OPTIONS, type Design } from "../types.ts";
import { monthYear } from "./_shared.ts";

const W = 840;
const TW = 404;
const TH = 112;
const STUB = 96;
const GX = 8;
const GY = 10;
const HEAD = 46;
const MAX = 6;

/** Ticket outline with half-circle notches at the perforation. */
function ticketPath(): string {
  const r = 8;
  const n = 7;
  const px = TW - STUB;
  return `M${r} 0H${px - n}A${n} ${n} 0 0 0 ${px + n} 0H${TW - r}A${r} ${r} 0 0 1 ${TW} ${r}V${TH - r}A${r} ${r} 0 0 1 ${TW - r} ${TH}H${px + n}A${n} ${n} 0 0 0 ${px - n} ${TH}H${r}A${r} ${r} 0 0 1 0 ${TH - r}V${r}A${r} ${r} 0 0 1 ${r} 0Z`;
}

export const design: Design = {
  id: "G05",
  slug: "ticket-stubs",
  title: "Ticket stubs",
  idea: "The top six repos by contributions as admission tickets: the repo is the show, its stars and language the billing, PRs, merged, issues and discussions the printed fields, and the stub keeps the rank and total. The colored edge is the repo's language color. With outcomes none the merged field goes; full adds open and closed-unmerged fields.",
  render(stats, theme, options = DEFAULT_OPTIONS) {
    const lv = options.outcomes;
    const p = PALETTES[theme];
    const repos = stats.repos.slice(0, MAX);
    const rows = Math.max(1, Math.ceil(repos.length / 2));
    const x0 = (W - (2 * TW + GX)) / 2;
    const height = HEAD + rows * TH + (rows - 1) * GY + 34;
    const shape = ticketPath();
    const px = TW - STUB;

    const tickets = repos.map((r, i) => {
      const x = x0 + (i % 2) * (TW + GX);
      const y = HEAD + Math.floor(i / 2) * (TH + GY);
      const [owner, name] = r.repo.includes("/") ? r.repo.split("/") : ["", r.repo];
      const ownerTxt = truncate(`${owner}/`, 140, 13);
      const ownerW = textWidth(ownerTxt, 13);
      const span =
        r.first && r.last
          ? monthYear(r.first) === monthYear(r.last)
            ? monthYear(r.first)
            : `${monthYear(r.first)} – ${monthYear(r.last)}`
          : "dates unknown";
      const edge = r.langColor ?? p.faint;
      const fields: [string, number][] =
        lv === "none"
          ? [
              ["PRS", r.prs],
              ["ISSUES", r.issues],
              ["DISC.", r.discussions],
            ]
          : lv === "full"
            ? [
                ["PRS", r.prs],
                ["MERGED", r.prsMerged],
                ["OPEN", r.prsOpen],
                ["CLOSED", prsClosed(r)],
                ["ISSUES", r.issues],
                ["DISC.", r.discussions],
              ]
            : [
                ["PRS", r.prs],
                ["MERGED", r.prsMerged],
                ["ISSUES", r.issues],
                ["DISC.", r.discussions],
              ];
      const fw = (px - 34) / fields.length;
      const fieldSvg = fields
        .map(
          ([label, v], k) =>
            `<text x="${18 + k * fw}" y="82" font-family="${MONO}" font-size="8" font-weight="600" letter-spacing="1" fill="${p.faint}">${label}</text><text x="${18 + k * fw}" y="100" font-family="${MONO}" font-size="16" font-weight="700" fill="${v ? p.text : p.faint}">${v}</text>`,
        )
        .join("");
      const rank = String(i + 1).padStart(2, "0");
      return `<g transform="translate(${x} ${y})">
<path d="${shape}" fill="${p.surface}"/>
<g clip-path="url(#g05clip)"><rect x="0" y="0" width="5" height="${TH}" fill="${edge}"/><rect x="${px}" y="0" width="${STUB}" height="${TH}" fill="${p.text}" fill-opacity="${theme === "dark" ? 0.035 : 0.025}"/></g>
<path d="${shape}" fill="none" stroke="${p.border}"/>
<line x1="${px}" x2="${px}" y1="10" y2="${TH - 10}" stroke="${p.border}" stroke-dasharray="3 4"/>
<text x="18" y="22" font-family="${MONO}" font-size="8.5" font-weight="700" letter-spacing="2.2" fill="${p.muted}">ADMIT ONE</text>
<text x="${px - 14}" y="22" text-anchor="end" font-size="10.5" fill="${p.muted}">${compact(r.stars)}★</text>
<text x="18" y="45" font-size="13" fill="${p.muted}">${esc(ownerTxt)}<tspan font-size="16.5" font-weight="700" fill="${p.text}">${esc(truncate(name ?? "", px - 34 - ownerW, 16.5))}</tspan></text>
<circle cx="22" cy="58.5" r="4" fill="${edge}"/><text x="31" y="62" font-size="10.5" fill="${p.muted}">${esc(truncate(`${r.language ?? "No language"} · ${span}`, px - 50, 10.5))}</text>
<line x1="18" x2="${px - 14}" y1="70" y2="70" stroke="${p.hair}"/>
${fieldSvg}
<text x="${px + STUB / 2}" y="24" text-anchor="middle" font-family="${MONO}" font-size="8" font-weight="600" letter-spacing="1.6" fill="${p.faint}">RANK</text>
<text x="${px + STUB / 2}" y="52" text-anchor="middle" font-family="${MONO}" font-size="26" font-weight="700" fill="${p.text}">${rank}</text>
<line x1="${px + 16}" x2="${TW - 16}" y1="66" y2="66" stroke="${p.hair}"/>
<text x="${px + STUB / 2}" y="82" text-anchor="middle" font-family="${MONO}" font-size="8" font-weight="600" letter-spacing="1.6" fill="${p.faint}">TOTAL</text>
<text x="${px + STUB / 2}" y="100" text-anchor="middle" font-family="${MONO}" font-size="16" font-weight="700" fill="${p.accent}">${r.total}</text>
</g>`;
    });

    const head = `<text x="${x0 + 2}" y="26" font-size="16" font-weight="700" fill="${p.text}">Upstream season pass</text><text x="${W - x0 - 2}" y="26" text-anchor="end" font-size="11.5" fill="${p.muted}">top ${repos.length} of ${stats.repos.length} repos · as of ${stats.generatedAt.slice(0, 10)}</text>`;
    const empty = repos.length
      ? ""
      : `<text x="${W / 2}" y="${HEAD + TH / 2}" text-anchor="middle" font-size="13" fill="${p.muted}">No upstream contributions yet</text>`;
    const foot = `<text x="${x0 + 2}" y="${height - 12}" font-size="10.5" fill="${p.faint}">Dates: my first to my latest contribution</text>`;
    return document({
      width: W,
      height,
      title: `Top ${repos.length} upstream repos as ticket stubs`,
      body: `<defs><clipPath id="g05clip"><path d="${shape}"/></clipPath></defs><g font-family="${SANS}">${head}${tickets.join("")}${empty}${foot}</g>`,
    });
  },
};
