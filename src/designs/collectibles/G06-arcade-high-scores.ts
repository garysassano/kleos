import { prsClosed } from "../../kit/outcomes.ts";
import { PALETTES, SANS, document, esc } from "../../kit/svg.ts";
import { DEFAULT_OPTIONS, type Design, type Level } from "../types.ts";
import { series } from "./_shared.ts";

/** 5×7 bitmap font: each glyph is seven rows of five bits. */
const FONT: Record<string, string> = {
  A: "01110 10001 10001 11111 10001 10001 10001",
  B: "11110 10001 10001 11110 10001 10001 11110",
  C: "01110 10001 10000 10000 10000 10001 01110",
  D: "11110 10001 10001 10001 10001 10001 11110",
  E: "11111 10000 10000 11110 10000 10000 11111",
  F: "11111 10000 10000 11110 10000 10000 10000",
  G: "01110 10001 10000 10111 10001 10001 01111",
  H: "10001 10001 10001 11111 10001 10001 10001",
  I: "01110 00100 00100 00100 00100 00100 01110",
  J: "00111 00010 00010 00010 00010 10010 01100",
  K: "10001 10010 10100 11000 10100 10010 10001",
  L: "10000 10000 10000 10000 10000 10000 11111",
  M: "10001 11011 10101 10101 10001 10001 10001",
  N: "10001 10001 11001 10101 10011 10001 10001",
  O: "01110 10001 10001 10001 10001 10001 01110",
  P: "11110 10001 10001 11110 10000 10000 10000",
  Q: "01110 10001 10001 10001 10101 10010 01101",
  R: "11110 10001 10001 11110 10100 10010 10001",
  S: "01111 10000 10000 01110 00001 00001 11110",
  T: "11111 00100 00100 00100 00100 00100 00100",
  U: "10001 10001 10001 10001 10001 10001 01110",
  V: "10001 10001 10001 10001 10001 01010 00100",
  W: "10001 10001 10001 10101 10101 10101 01010",
  X: "10001 10001 01010 00100 01010 10001 10001",
  Y: "10001 10001 01010 00100 00100 00100 00100",
  Z: "11111 00001 00010 00100 01000 10000 11111",
  "0": "01110 10001 10011 10101 11001 10001 01110",
  "1": "00100 01100 00100 00100 00100 00100 01110",
  "2": "01110 10001 00001 00010 00100 01000 11111",
  "3": "11111 00010 00100 00010 00001 10001 01110",
  "4": "00010 00110 01010 10010 11111 00010 00010",
  "5": "11111 10000 11110 00001 00001 10001 01110",
  "6": "00110 01000 10000 11110 10001 10001 01110",
  "7": "11111 00001 00010 00100 01000 01000 01000",
  "8": "01110 10001 10001 01110 10001 10001 01110",
  "9": "01110 10001 10001 01111 00001 00010 01100",
  "-": "00000 00000 00000 11111 00000 00000 00000",
  ".": "00000 00000 00000 00000 00000 01100 01100",
  _: "00000 00000 00000 00000 00000 00000 11111",
  "…": "00000 00000 00000 00000 00000 00000 10101",
};

/** One <path> per glyph, horizontal runs merged, in 1-unit pixels. */
function glyphPath(rows: string): string {
  let d = "";
  rows.split(" ").forEach((bits, y) => {
    let x = 0;
    while (x < bits.length) {
      if (bits[x] !== "1") {
        x++;
        continue;
      }
      let len = 0;
      while (bits[x + len] === "1") len++;
      d += `M${x} ${y}h${len}v1h-${len}z`;
      x += len;
    }
  });
  return d;
}

const ADV = 6;

const ordinal = (n: number): string => {
  const t = n % 100;
  const suffix =
    t >= 11 && t <= 13
      ? "TH"
      : n % 10 === 1
        ? "ST"
        : n % 10 === 2
          ? "ND"
          : n % 10 === 3
            ? "RD"
            : "TH";
  return `${n}${suffix}`;
};

const clip = (s: string, max: number): string =>
  [...s].length > max ? `${[...s].slice(0, max - 1).join("")}…` : s;

const W = 840;
const MAX = 10;

/** Column x positions (number columns are right edges); 0 leaves a column out. */
const MERGED = {
  rank: 60,
  score: 136,
  name: 236,
  nameC: 20,
  prs: 530,
  merged: 632,
  open: 0,
  closed: 0,
  issues: 722,
  disc: 790,
};
const LAYOUT: Record<Level, typeof MERGED> = {
  none: { ...MERGED, prs: 590, merged: 0, issues: 690 },
  merged: MERGED,
  full: {
    ...MERGED,
    rank: 48,
    score: 116,
    name: 206,
    nameC: 13,
    prs: 412,
    merged: 496,
    open: 556,
    closed: 640,
    issues: 724,
  },
};

export const design: Design = {
  id: "G06",
  slug: "arcade-high-scores",
  title: "Arcade high scores",
  idea: "A retro arcade high-score table in a bitmap font drawn from SVG pixels: the top ten owners ranked by score (PRs + issues + discussions in their repos) with PRs, merged PRs, issues and discussions as extra columns; the header shows the player, the top score and how many owners are on the board. With outcomes none the merged column goes; full adds open and closed-unmerged columns.",
  render(stats, theme, options = DEFAULT_OPTIONS) {
    const lv = options.outcomes;
    const p = PALETTES[theme];
    const s = series(theme);
    const used = new Set<string>();
    /** Pixel text: scale = size of one font pixel; anchor end measures from the right. */
    const px = (text: string, x: number, y: number, scale: number, fill: string, end = false) => {
      const chars = [...text.toUpperCase()];
      const w = (chars.length * ADV - 1) * scale;
      const left = end ? x - w : x;
      const uses = chars
        .map((c, i) => {
          if (!FONT[c]) return "";
          used.add(c);
          return `<use href="#g06-${c.codePointAt(0)}" x="${i * ADV}"/>`;
        })
        .join("");
      return `<g transform="translate(${left} ${y}) scale(${scale})" fill="${fill}">${uses}</g>`;
    };
    const center = (text: string, cx: number, y: number, scale: number, fill: string) =>
      px(text, cx - (([...text].length * ADV - 1) * scale) / 2, y, scale, fill);

    const board = stats.owners.slice(0, MAX);
    const rowColors = [s[2], s[5], s[1], s[4], s[3], s[0]] as string[];
    const screen = theme === "dark" ? "#010409" : p.surface;
    const label = s[6] as string;

    let body = "";
    // Top bar: player, top score, owners on the board.
    const topY = 30;
    body += px("PLAYER", 40, topY, 2, label);
    body += px(clip(stats.user, 18), 40, topY + 20, 2, p.text);
    body += center("HI-SCORE", W / 2, topY, 2, label);
    body += center(String(board[0]?.total ?? 0).padStart(6, "0"), W / 2, topY + 20, 2, p.text);
    body += px("OWNERS", W - 40, topY, 2, label, true);
    body += px(String(stats.owners.length), W - 40, topY + 20, 2, p.text, true);

    // Title with a drop shadow.
    const title = "HIGH SCORES";
    body += center(title, W / 2 + 3, 92 + 3, 4, p.merged);
    body += center(title, W / 2, 92, 4, s[2] as string);

    // Columns.
    const cols = LAYOUT[lv];
    /** A right-aligned number column, skipped when the level leaves it out. */
    const col = (text: string, x: number, y: number, fill: string) =>
      x ? px(text, x, y, 2, fill, true) : "";
    const hy = 150;
    body += px("RANK", cols.rank, hy, 2, p.muted);
    body += px("SCORE", cols.score, hy, 2, p.muted);
    body += px("NAME", cols.name, hy, 2, p.muted);
    body += px("PRS", cols.prs, hy, 2, p.muted, true);
    body += col("MERGED", cols.merged, hy, p.muted);
    body += col("OPEN", cols.open, hy, p.muted);
    body += col("CLOSED", cols.closed, hy, p.muted);
    body += px("ISSUES", cols.issues, hy, 2, p.muted, true);
    body += px("DISC.", cols.disc, hy, 2, p.muted, true);
    body += `<line x1="40" x2="${W - 40}" y1="${hy + 22}" y2="${hy + 22}" stroke="${p.border}" stroke-dasharray="2 4"/>`;

    board.forEach((o, i) => {
      const y = hy + 38 + i * 28;
      const c = rowColors[i % rowColors.length] as string;
      body += px(ordinal(i + 1), cols.rank, y, 2, c);
      body += px(String(o.total).padStart(6, "0"), cols.score, y, 2, c);
      body += px(clip(o.owner, cols.nameC), cols.name, y, 2, c);
      body += px(String(o.prs), cols.prs, y, 2, o.prs ? p.text : p.faint, true);
      body += col(String(o.prsMerged), cols.merged, y, o.prsMerged ? p.text : p.faint);
      const closed = prsClosed(o);
      body += col(String(o.prsOpen), cols.open, y, o.prsOpen ? p.text : p.faint);
      body += col(String(closed), cols.closed, y, closed ? p.text : p.faint);
      body += px(String(o.issues), cols.issues, y, 2, o.issues ? p.text : p.faint, true);
      body += px(String(o.discussions), cols.disc, y, 2, o.discussions ? p.text : p.faint, true);
    });
    if (!board.length) body += center("NO SCORES YET", W / 2, hy + 40, 2, p.muted);

    const rowsH = Math.max(board.length, 1) * 28;
    const screenH = hy + 38 + rowsH + 8;
    const height = screenH + 36;
    const note = `Score = PRs + issues + discussions I opened in that owner's repos.${lv === "full" ? " Closed = closed without merging." : ""} Top ${board.length} of ${stats.owners.length} owners · as of ${stats.generatedAt.slice(0, 10)}`;

    const glyphs = [...used]
      .sort()
      .map((c) => `<path id="g06-${c.codePointAt(0)}" d="${glyphPath(FONT[c] as string)}"/>`)
      .join("");
    const defs = `<defs>${glyphs}<pattern id="g06scan" width="4" height="3" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="${p.text}" fill-opacity="${theme === "dark" ? 0.035 : 0.04}"/></pattern></defs>`;
    return document({
      width: W,
      height,
      title: `High scores: top ${board.length} owners by contributions`,
      body: `${defs}<rect x="0.5" y="0.5" width="${W - 1}" height="${screenH - 1}" rx="12" fill="${screen}" stroke="${p.border}"/><g shape-rendering="crispEdges">${body}</g><rect x="1" y="1" width="${W - 2}" height="${screenH - 2}" rx="12" fill="url(#g06scan)"/><text x="8" y="${height - 12}" font-family="${SANS}" font-size="11" fill="${p.muted}">${esc(note)}</text>`,
    });
  },
};
