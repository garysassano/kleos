import type { OwnerStats } from "../../stats/types.ts";
import type { Design } from "../types.ts";
import { THEMES, derive, longDate, svg, text, trunc } from "./_shared.ts";

/** Owners listed: the most active ones. */
const K = 30;
const COLS = 3;

type Entry = { head: string } | { o: OwnerStats };

export const design: Design = {
  id: "C06",
  slug: "index",
  title: "Index",
  idea: `A typeset back-of-book index of the ${K} most active owners, alphabetical with letter heads and dotted leaders to the contribution count. Calm, dense and easy to scan for a name.`,
  render(stats, theme) {
    const t = THEMES[theme];
    const { T, asOf } = derive(stats);
    const picks = stats.owners
      .slice(0, K)
      .sort((a, b) => a.owner.localeCompare(b.owner, "en", { sensitivity: "base" }));
    // entries with letter headings
    const entries: Entry[] = [];
    let last = "";
    for (const o of picks) {
      const L0 = (o.owner[0] ?? "").toUpperCase();
      if (L0 !== last) {
        entries.push({ head: L0 });
        last = L0;
      }
      entries.push({ o });
    }
    // split into balanced columns, never leaving a heading at the bottom
    const per = Math.ceil(entries.length / COLS);
    const cols: Entry[][] = [];
    let i = 0;
    for (let c = 0; c < COLS; c++) {
      let end = c === COLS - 1 ? entries.length : Math.min(entries.length, i + per);
      const tail = entries[end - 1];
      if (end < entries.length && tail && "head" in tail) end--;
      cols.push(entries.slice(i, end));
      i = end;
    }
    const rowsMax = Math.max(1, ...cols.map((c) => c.length));
    const W = 840;
    const P = 28;
    const LH = 21;
    const top = 100;
    const H = top + LH * rowsMax + 46;
    const gutter = 34;
    const cw = (W - 2 * P - gutter * (COLS - 1)) / COLS;
    let b = `<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="6" fill="${t.bg}" stroke="${t.border}"/>`;
    b += text(P - 2, 56, "Index", "s t", 'font-size="40" font-weight="300" letter-spacing="-0.5"');
    b += text(W - P, 38, "Upstream contributions, by owner", "s t e", 'font-size="13"');
    b += text(
      W - P,
      57,
      `PRs + issues + discussions · top ${picks.length} of ${T.externalOwners} owners`,
      "s mu e",
      'font-size="12"',
    );
    b += `<line x1="${P}" y1="74.5" x2="${W - P}" y2="74.5" stroke="${t.text}"/>`;
    cols.forEach((col, c) => {
      const x0 = P + c * (cw + gutter);
      const x1 = x0 + cw;
      col.forEach((e, r) => {
        const y = top + LH * r + 4;
        if ("head" in e) {
          b += text(x0, y, e.head, "s b ac", 'font-size="13"');
          return;
        }
        const { o } = e;
        b += `<line x1="${x0 + 14}" y1="${y - 3.5}" x2="${x1 - 4}" y2="${y - 3.5}" stroke="${t.faint}" stroke-width="1.3" stroke-linecap="round" stroke-dasharray="0 4.5"/>`;
        b += text(
          x0 + 14,
          y,
          trunc(o.owner, 26),
          `s t halo${o.type === "User" ? " it" : ""}`,
          'font-size="13"',
        );
        b += text(x1, y, String(o.total), "s n t e halo", 'font-size="13"');
      });
      if (c && col.length) {
        b += `<line x1="${x0 - gutter / 2}" y1="${top - 10}" x2="${x0 - gutter / 2}" y2="${top + LH * (rowsMax - 1) + 8}" stroke="${t.hair}"/>`;
      }
    });
    b += text(
      P,
      H - 18,
      "Italic: personal accounts. Roman: organisations.",
      "s f",
      'font-size="11"',
    );
    b += text(W - P, H - 18, `as of ${longDate(asOf)}`, "s f e", 'font-size="11"');
    const css = `.halo{paint-order:stroke;stroke:${t.bg};stroke-width:7px;stroke-linejoin:round}.it{font-style:italic}`;
    return svg(
      W,
      H,
      t,
      css,
      b,
      `Index of upstream contributions: ${picks.map((o) => `${o.owner} ${o.total}`).join(", ")}`,
    );
  },
};
