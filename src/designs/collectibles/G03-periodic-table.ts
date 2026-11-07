import { PALETTES, SANS, document, esc, truncate } from "../../kit/svg.ts";
import type { OwnerStats } from "../../stats/types.ts";
import type { Design } from "../types.ts";
import { ecosystemOf, series } from "./_shared.ts";

const CW = 43;
const CH = 54;
const G = 2;
const X0 = 16;
const Y0 = 12;
const MAX_ECOSYSTEMS = 6;

/** Grid columns (1–18) of each period in the first five rows of the periodic table. */
const PERIODS: number[][] = [
  [1, 18],
  [1, 2, 13, 14, 15, 16, 17, 18],
  [1, 2, 13, 14, 15, 16, 17, 18],
  Array.from({ length: 18 }, (_, i) => i + 1),
  Array.from({ length: 18 }, (_, i) => i + 1),
];
const SLOTS = PERIODS.flatMap((cols, row) => cols.map((col) => ({ row, col })));

/** Element-style symbols: first letter plus the first later letter that keeps the symbol unique. */
function symbols(owners: OwnerStats[]): string[] {
  const used = new Set<string>();
  return owners.map((o) => {
    const letters = [...o.owner].filter((c) => /[a-z0-9]/i.test(c));
    const head = (letters[0] ?? "?").toUpperCase();
    const candidates = [
      ...letters.slice(1).map((c) => head + c.toLowerCase()),
      ...Array.from({ length: 26 }, (_, i) => head + String.fromCharCode(97 + i)),
      head,
    ];
    const sym = candidates.find((c) => !used.has(c)) ?? head;
    used.add(sym);
    return sym;
  });
}

const cx = (col: number) => X0 + (col - 1) * (CW + G);
const cy = (row: number) => Y0 + row * (CH + G);

export const design: Design = {
  id: "G03",
  slug: "periodic-table",
  title: "Periodic table of owners",
  idea: "The top 54 owners laid out in the first five periods of the periodic table: atomic number = rank, a unique two-letter symbol from the login, mass = PRs + issues + discussions. Ecosystems color their owners like element series; other owners are shown as orgs or people.",
  render(stats, theme) {
    const p = PALETTES[theme];
    const pal = series(theme);
    const shown = stats.owners.slice(0, SLOTS.length);
    const syms = symbols(shown);
    const lastRow = SLOTS[Math.max(shown.length - 1, 0)]?.row ?? 0;
    const periods = Math.max(3, lastRow + 1);

    // Series: the first few ecosystems with a shown owner, then other orgs and people.
    const fams = stats.ecosystems
      .filter((f) => shown.some((o) => f.owners.includes(o.owner)))
      .slice(0, MAX_ECOSYSTEMS);
    const famColor = new Map(fams.map((f, i) => [f.name, pal[i] as string]));
    const userColor = pal[6] as string;
    const orgColor = pal[7] as string;
    const colorOf = (o: OwnerStats) => {
      const f = ecosystemOf(stats, o.owner);
      if (f && famColor.has(f)) return famColor.get(f) as string;
      return o.type === "User" ? userColor : orgColor;
    };
    const tint = theme === "dark" ? 0.16 : 0.1;

    const cell = (o: OwnerStats, i: number, x: number, y: number, k: number) => {
      const c = colorOf(o);
      const w = CW * k;
      const h = CH * k;
      return `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="${3 * k}" fill="${c}" fill-opacity="${tint}" stroke="${c}" stroke-opacity="0.6"/>
<text x="${x + 4 * k}" y="${y + 10.5 * k}" font-size="${8.5 * k}" font-weight="600" fill="${c}">${i + 1}</text>
<text x="${x + w / 2}" y="${y + 30 * k}" text-anchor="middle" font-size="${17 * k}" font-weight="700" fill="${p.text}">${esc(syms[i] ?? "")}</text>
<text x="${x + w / 2}" y="${y + 41 * k}" text-anchor="middle" font-size="${7 * k}" fill="${p.muted}">${esc(truncate(o.owner, w - 4 * k, 6.4 * k))}</text>
<text x="${x + w / 2}" y="${y + 50.5 * k}" text-anchor="middle" font-size="${8 * k}" font-weight="600" fill="${p.text}" fill-opacity="0.85">${o.total}</text>`;
    };

    let body = "";
    SLOTS.forEach((s, i) => {
      if (s.row >= periods) return;
      const x = cx(s.col);
      const y = cy(s.row);
      const o = shown[i];
      body += o
        ? cell(o, i, x, y, 1)
        : `<rect x="${x + 0.5}" y="${y + 0.5}" width="${CW - 1}" height="${CH - 1}" rx="3" fill="none" stroke="${p.hair}" stroke-dasharray="3 3"/>`;
    });

    // Title in the gap of period 1, key in the gap of periods 2–3.
    const tx = cx(3);
    const more = stats.owners.length - shown.length;
    body += `<text x="${tx}" y="${cy(0) + 24}" font-size="18" font-weight="700" fill="${p.text}">Periodic table of upstream owners</text>
<text x="${tx}" y="${cy(0) + 43}" font-size="11.5" fill="${p.muted}">${shown.length ? `Top ${shown.length} of ${stats.owners.length} owners I contributed to, ranked by PRs + issues + discussions` : "No upstream contributions yet"}</text>`;
    const first = shown[0];
    if (first) {
      const kx = cx(3);
      const ky = cy(1) + 1;
      const k = 2;
      const keyW = CW * k;
      body += cell(first, 0, kx, ky, k);
      const lx = kx + keyW + 14;
      const notes: [number, string, string][] = [
        [ky + 18, "Atomic number", "rank by contributions"],
        [ky + 52, "Symbol", "two letters of the login"],
        [ky + 79, "Name", "owner login"],
        [
          ky + 98,
          "Mass",
          `PRs + issues + discussions (${first.prs} + ${first.issues} + ${first.discussions})`,
        ],
      ];
      for (const [y, label, text] of notes) {
        const full = `${label}: ${text}`;
        const maxW = cx(13) - lx - 26;
        body += `<line x1="${kx + keyW - 2}" x2="${lx - 4}" y1="${y - 4}" y2="${y - 4}" stroke="${p.border}" stroke-dasharray="2 2"/><text x="${lx}" y="${y}" font-size="11" fill="${p.muted}"><tspan font-weight="600" fill="${p.text}">${esc(label)}</tspan>${esc(truncate(full, maxW, 11).slice(label.length))}</text>`;
      }
    }

    // Legend of series.
    const ly = cy(periods) + 18;
    const items = [
      ...fams.map((f) => ({ c: famColor.get(f.name) as string, label: `${f.name} ecosystem` })),
      { c: orgColor, label: "Other orgs" },
      { c: userColor, label: "People" },
    ].filter((it) =>
      it.c === orgColor
        ? shown.some((o) => colorOf(o) === orgColor)
        : it.c === userColor
          ? shown.some((o) => colorOf(o) === userColor)
          : true,
    );
    let lx = X0;
    let ry = ly;
    for (const it of items) {
      const w = 16 + it.label.length * 11 * 0.55 + 14;
      if (lx + w > 840 - X0) {
        lx = X0;
        ry += 18;
      }
      body += `<rect x="${lx}" y="${ry - 9}" width="11" height="11" rx="2" fill="${it.c}" fill-opacity="${tint * 2}" stroke="${it.c}"/><text x="${lx + 16}" y="${ry}" font-size="11" fill="${p.muted}">${esc(it.label)}</text>`;
      lx += w;
    }
    const foot = `${more > 0 ? `+${more} more owners not shown · ` : ""}as of ${stats.generatedAt.slice(0, 10)}`;
    body += `<text x="${X0}" y="${ry + 20}" font-size="10.5" fill="${p.faint}">${esc(foot)}</text>`;
    const height = ry + 30;

    return document({
      width: 840,
      height,
      title: "Periodic table of upstream owners",
      body: `<g font-family="${SANS}">${body}</g>`,
    });
  },
};
