import { MONO, PALETTES, SANS, document, esc, truncate } from "../../kit/svg.ts";
import type { Design } from "../types.ts";
import { hash, monthYear, ownerSpan, series, stampDate } from "./_shared.ts";

const W = 840;
const COLS = 4;
const CELL_W = 200;
const CELL_H = 134;
const HEAD = 64;
const MAX = 12;

export const design: Design = {
  id: "G04",
  slug: "passport-stamps",
  title: "Passport stamps",
  idea: "A passport page with one ink stamp for each of the top 12 owners by contributions, dated with my first PR, issue or discussion there and placed in order of that date; shape, ink and tilt come from a hash of the login so they never change between renders.",
  render(stats, theme) {
    const p = PALETTES[theme];
    const inks = series(theme).slice(0, 4);
    const visas = stats.owners
      .slice(0, MAX)
      .map((o) => ({ o, first: ownerSpan(stats, o.owner).first, h: hash(o.owner) }))
      .sort((a, b) =>
        a.first && b.first
          ? a.first.localeCompare(b.first)
          : a.first
            ? -1
            : b.first
              ? 1
              : b.o.total - a.o.total,
      );
    const rows = Math.max(1, Math.ceil(visas.length / COLS));
    const pageH = 22 + rows * CELL_H;
    const height = HEAD + pageH + 40;
    const gx = (W - COLS * CELL_W) / 2;

    // Guilloche background lines on the page.
    let waves = "";
    for (let k = 0; k < 14; k++) {
      const y = HEAD + 14 + (k * pageH) / 13;
      let d = `M12 ${y.toFixed(1)}`;
      for (let x = 12; x <= W - 12; x += 8) {
        const yy =
          y + Math.sin((x / 90) * Math.PI + k * 0.9) * 5 + Math.sin((x / 37) * Math.PI) * 1.5;
        d += ` L${x} ${yy.toFixed(1)}`;
      }
      waves += `<path d="${d}" fill="none" stroke="${p.border}" stroke-opacity="0.3" stroke-width="0.6"/>`;
    }

    const stamps = visas.map(({ o, first, h }, i) => {
      const row = Math.floor(i / COLS);
      const inRow = Math.min(COLS, visas.length - row * COLS);
      const col = i % COLS;
      const ox = gx + ((COLS - inRow) * CELL_W) / 2;
      const cx = ox + col * CELL_W + CELL_W / 2 + ((h >>> 4) % 13) - 6;
      const cy = HEAD + 22 + row * CELL_H + CELL_H / 2 + ((h >>> 9) % 9) - 4;
      const rot = (h % 15) - 7;
      const ink = inks[(h >>> 13) % inks.length] as string;
      const shape = (h >>> 17) % 4;
      const name = o.owner.toUpperCase();
      const date = first ? stampDate(first) : "DATE UNKNOWN";
      const total = `${o.total} CONTRIBUTION${o.total === 1 ? "" : "S"}`;
      const t = (y: number, s: string, size: number, weight = 700, ls = 0.6) =>
        `<text x="0" y="${y}" text-anchor="middle" font-size="${size}" font-weight="${weight}" letter-spacing="${ls}">${esc(s)}</text>`;
      let art: string;
      if (shape === 0) {
        const arc = `g04a${i}`;
        art = `<circle r="54" fill="none" stroke-width="2.6"/><circle r="47" fill="none" stroke-width="1"/>
<path id="${arc}" d="M-35 0A35 35 0 0 1 35 0" fill="none" stroke="none"/>
<text font-size="10" font-weight="700" letter-spacing="1"><textPath href="#${arc}" startOffset="50%" text-anchor="middle">${esc(truncate(name, 92, 11.7, true))}</textPath></text>
<line x1="-34" x2="34" y1="-6" y2="-6" stroke-width="0.8"/>${t(7, date, 11)}<line x1="-34" x2="34" y1="13" y2="13" stroke-width="0.8"/>${t(26, `${o.total}`, 11)}${t(36, "CONTRIB.", 6.5, 700, 1)}`;
      } else if (shape === 1) {
        art = `<rect x="-78" y="-46" width="156" height="92" rx="8" fill="none" stroke-width="2.6"/><rect x="-72" y="-40" width="144" height="80" rx="5" fill="none" stroke-width="1"/>
${t(-20, truncate(name, 128, 12, true), 12)}${t(-3, "ADMITTED", 7, 700, 2.5)}${t(13, date, 13)}${t(31, total, 8, 600, 0.8)}`;
      } else if (shape === 2) {
        art = `<ellipse rx="82" ry="52" fill="none" stroke-width="2.6"/><ellipse rx="75" ry="45" fill="none" stroke-width="1"/>
${t(-20, "ENTRY", 7, 700, 2.5)}${t(-4, truncate(name, 120, 12, true), 12)}${t(14, date, 12)}${t(31, total, 7.5, 600, 0.6)}`;
      } else {
        const oct = (w: number, hh: number, c: number) =>
          `M${-w + c} ${-hh}H${w - c}L${w} ${-hh + c}V${hh - c}L${w - c} ${hh}H${-w + c}L${-w} ${hh - c}V${-hh + c}Z`;
        art = `<path d="${oct(80, 46, 16)}" fill="none" stroke-width="2.6"/><path d="${oct(73, 39, 13)}" fill="none" stroke-width="1"/>
${t(-19, truncate(name, 120, 11.5, true), 11.5)}${t(-2, "VISA · ARRIVAL", 7, 700, 1.6)}${t(14, date, 12.5)}${t(30, total, 7.5, 600, 0.6)}`;
      }
      return `<g transform="translate(${cx} ${cy}) rotate(${rot})" fill="${ink}" stroke="${ink}" stroke-width="0" opacity="0.9" filter="url(#g04ink)"><g>${art.replace(/fill="none" stroke-width/g, `fill="none" stroke="${ink}" stroke-width`).replace(/<line /g, `<line stroke="${ink}" `)}</g></g>`;
    });

    const earliest = visas
      .map((v) => v.first)
      .filter((f): f is string => !!f)
      .sort()[0];
    const head = `<text x="24" y="30" font-family="${MONO}" font-size="11" font-weight="700" letter-spacing="3" fill="${p.muted}">UPSTREAM PASSPORT · VISAS</text>
<text x="24" y="50" font-size="16" font-weight="700" fill="${p.text}">@${esc(stats.user)}</text>
<text x="${W - 24}" y="30" text-anchor="end" font-size="11.5" fill="${p.muted}">${stats.owners.length} owners visited · ${stats.totals.externalRepos} repos</text>
<text x="${W - 24}" y="50" text-anchor="end" font-size="11.5" fill="${p.muted}">${earliest ? `earliest stamp ${monthYear(earliest)}` : ""}</text>`;
    const empty = visas.length
      ? ""
      : `<text x="${W / 2}" y="${HEAD + 22 + CELL_H / 2}" text-anchor="middle" font-size="13" fill="${p.muted}">No stamps yet</text>`;
    const foot = `<text x="24" y="${height - 14}" font-size="10.5" fill="${p.faint}">Top ${visas.length} owners, stamped in order of my first contribution</text>`;

    const grain = theme === "dark" ? "0 0 0 -2.4 2.25" : "0 0 0 -2.2 2.2";
    const defs = `<defs><filter id="g04ink" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 ${grain}" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter></defs>`;
    return document({
      width: W,
      height,
      title: `Upstream passport: ${visas.length} owner stamps`,
      body: `${defs}<g font-family="${SANS}"><rect x="0.5" y="0.5" width="${W - 1}" height="${height - 1}" rx="12" fill="${p.surface}" stroke="${p.border}"/>${head}<line x1="12" x2="${W - 12}" y1="${HEAD}" y2="${HEAD}" stroke="${p.border}" stroke-dasharray="4 4"/>${waves}<g font-family="${MONO}">${stamps.join("")}</g>${empty}${foot}</g>`,
    });
  },
};
