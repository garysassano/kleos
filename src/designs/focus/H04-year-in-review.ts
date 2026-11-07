import {
  PALETTES,
  SANS,
  avatar,
  truncate as fitText,
  percent,
  document as svgDocument,
} from "../../kit/svg.ts";
import type { Design } from "../types.ts";
import { MONTHS, frame, longMonth, num, plural, t } from "./_shared.ts";

const W = 840;
const PAD = 24;
const MAX_NEW_AVATARS = 9;

export const design: Design = {
  id: "H04",
  slug: "year-in-review",
  title: "Year in review",
  idea: "A wrapped-style story of one year upstream: contributions per month, the busiest month, the top repo and ecosystem, owners and repos contributed to for the first time, and the same months a year earlier. Rule: the year of the snapshot, or the latest year with contributions if it has none; a partial year is compared with the same months of the year before.",
  render(stats, theme) {
    const p = PALETTES[theme];
    const snapYear = stats.generatedAt.slice(0, 4);
    const yearOf = (k: string) => k.slice(0, 4);
    const years = new Set<string>();
    for (const r of stats.repos)
      for (const [k, v] of Object.entries(r.monthly)) if (v > 0) years.add(yearOf(k));
    const year = years.has(snapYear) ? snapYear : ([...years].sort().at(-1) ?? snapYear);
    const partial = year === snapYear;
    const lastMonth = partial ? Number(stats.generatedAt.slice(5, 7)) : 12;
    const prev = String(Number(year) - 1);

    const months = Array.from({ length: 12 }, () => 0);
    let prevSame = 0;
    const repoYear = new Map<string, number>();
    const ownerYear = new Map<string, number>();
    const ownerFirst = new Map<string, string>();
    const repoFirst = new Map<string, string>();
    for (const r of stats.repos) {
      for (const [k, v] of Object.entries(r.monthly)) {
        if (v <= 0) continue;
        const of = ownerFirst.get(r.owner);
        if (!of || k < of) ownerFirst.set(r.owner, k);
        const rf = repoFirst.get(r.repo);
        if (!rf || k < rf) repoFirst.set(r.repo, k);
        const m = Number(k.slice(5, 7));
        if (yearOf(k) === year) {
          months[m - 1] = (months[m - 1] ?? 0) + v;
          repoYear.set(r.repo, (repoYear.get(r.repo) ?? 0) + v);
          ownerYear.set(r.owner, (ownerYear.get(r.owner) ?? 0) + v);
        } else if (yearOf(k) === prev && m <= lastMonth) {
          prevSame += v;
        }
      }
    }
    const total = months.reduce((a, b) => a + b, 0);
    const busiest = months.reduce((best, v, i) => (v > (months[best] ?? 0) ? i : best), 0);
    const topRepo = [...repoYear].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    const newOwners = [...ownerYear.keys()]
      .filter((o) => ownerFirst.get(o)?.startsWith(year))
      .sort((a, b) => (ownerYear.get(b) ?? 0) - (ownerYear.get(a) ?? 0) || a.localeCompare(b));
    const newRepos = [...repoYear.keys()].filter((r) => repoFirst.get(r)?.startsWith(year)).length;
    const ecosystemYear = stats.ecosystems
      .map((f) => ({
        name: f.name,
        lead:
          [...f.owners].sort((a, b) => (ownerYear.get(b) ?? 0) - (ownerYear.get(a) ?? 0))[0] ?? "",
        n: f.owners.reduce((a, o) => a + (ownerYear.get(o) ?? 0), 0),
      }))
      .sort((a, b) => b.n - a.n)[0];

    let body = "";
    // Left: title, headline, monthly columns
    body += t(PAD, 50, year, 40, p.text, 'font-weight="700"');
    body += t(PAD + 104, 36, "in review", 14, p.muted);
    body += t(
      PAD + 104,
      52,
      partial ? `January – ${longMonth(stats.generatedAt.slice(0, 7))}, so far` : "the full year",
      12,
      p.faint,
    );
    body += `<text x="${PAD}" y="88" font-family="${SANS}" font-size="14" fill="${p.muted}"><tspan font-weight="600" fill="${p.text}">${num(total)}</tspan> ${total === 1 ? "contribution" : "contributions"} to <tspan font-weight="600" fill="${p.text}">${num(repoYear.size)}</tspan> ${repoYear.size === 1 ? "repo" : "repos"} of <tspan font-weight="600" fill="${p.text}">${num(ownerYear.size)}</tspan> ${ownerYear.size === 1 ? "owner" : "owners"}</text>`;

    const cx0 = PAD;
    const cw = 430;
    const base = 236;
    const ch = 112;
    const slot = cw / 12;
    const peak = Math.max(1, ...months);
    body += `<line x1="${cx0}" y1="${base + 0.5}" x2="${cx0 + cw}" y2="${base + 0.5}" stroke="${p.border}"/>`;
    months.forEach((v, i) => {
      const x = cx0 + i * slot + 3;
      const w = slot - 6;
      const future = i + 1 > lastMonth;
      if (future) {
        body += `<rect x="${x.toFixed(1)}" y="${base - 10}" width="${w.toFixed(1)}" height="10" rx="2" fill="none" stroke="${p.hair}" stroke-dasharray="2 2"/>`;
      } else if (v > 0) {
        const h = Math.max(2, (v / peak) * ch);
        const hot = i === busiest;
        body += `<rect x="${x.toFixed(1)}" y="${(base - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" rx="2" fill="${hot ? p.accent : p.muted}" opacity="${hot ? 1 : 0.45}"/>`;
        body += t(
          x + w / 2,
          base - h - 5,
          num(v),
          10,
          hot ? p.text : p.muted,
          `text-anchor="middle"${hot ? ' font-weight="600"' : ""}`,
        );
      }
      body += t(
        x + w / 2,
        base + 15,
        MONTHS[i] ?? "",
        10,
        future ? p.faint : p.muted,
        'text-anchor="middle"',
      );
    });

    // Right: a grid of facts, two per row
    const fx = 494;
    const fw = W - PAD - fx;
    const cellW = (fw - 16) / 2;
    body += `<line x1="${fx - 20.5}" y1="28" x2="${fx - 20.5}" y2="${base + 16}" stroke="${p.hair}"/>`;
    const facts: { label: string; value: string; note: string; lead?: string; org?: boolean }[] =
      [];
    facts.push({
      label: "Busiest month",
      value: total ? longMonth(`${year}-${String(busiest + 1).padStart(2, "0")}`) : "–",
      note: total ? plural(months[busiest] ?? 0, "contribution") : "no contributions",
    });
    facts.push(
      topRepo
        ? {
            label: "Top repo",
            value: topRepo[0].split("/")[1] ?? topRepo[0],
            note: `${plural(topRepo[1], "contribution")} · ${percent(topRepo[1], total)}%`,
            lead: topRepo[0].split("/")[0] ?? "",
            org: stats.repos.find((r) => r.repo === topRepo[0])?.ownerType === "Organization",
          }
        : { label: "Top repo", value: "–", note: "no contributions" },
    );
    if (ecosystemYear && ecosystemYear.n > 0) {
      facts.push({
        label: "Top ecosystem",
        value: ecosystemYear.name,
        note: `${plural(ecosystemYear.n, "contribution")} · ${percent(ecosystemYear.n, total)}%`,
        lead: ecosystemYear.lead,
        org: true,
      });
    }
    facts.push({
      label: "New repos",
      value: num(newRepos),
      note: `of ${num(repoYear.size)} this year`,
    });
    facts.push({
      label: partial ? `Same months of ${prev}` : prev,
      value: num(prevSame),
      note: prevSame
        ? `${year} is ${total >= prevSame ? "up" : "down"} ${Math.abs(percent(total - prevSame, prevSame))}%`
        : `no contributions in ${prev}`,
    });
    facts.push({
      label: "New owners",
      value: num(newOwners.length),
      note: `of ${num(ownerYear.size)} this year`,
    });

    const rowH = 58;
    facts.forEach((f, i) => {
      const x = fx + (i % 2) * (cellW + 16);
      const y = 34 + Math.floor(i / 2) * rowH;
      body += t(x, y, f.label, 11, p.muted);
      let vx = x;
      if (f.lead !== undefined) {
        body += avatar({
          id: `h04-f${i}`,
          login: f.lead,
          uri: stats.avatars[f.lead],
          x: vx,
          y: y + 6,
          size: 16,
          org: f.org ?? true,
          palette: p,
        });
        vx += 22;
      }
      body += t(vx, y + 19, fitText(f.value, x + cellW - vx, 14), 14, p.text, 'font-weight="600"');
      body += t(x, y + 34, fitText(f.note, cellW, 11), 11, p.faint);
    });

    // The new owners' avatars
    const ny = 34 + Math.ceil(facts.length / 2) * rowH - 12;
    const shown = newOwners.slice(0, MAX_NEW_AVATARS);
    shown.forEach((o, i) => {
      const owner = stats.owners.find((x) => x.owner === o);
      body += avatar({
        id: `h04-n${i}`,
        login: o,
        uri: stats.avatars[o],
        x: fx + i * 30,
        y: ny,
        size: 24,
        org: owner?.type !== "User",
        palette: p,
      });
    });
    if (newOwners.length > shown.length) {
      body += t(
        fx + shown.length * 30 + 2,
        ny + 17,
        `+${num(newOwners.length - shown.length)} new`,
        12,
        p.muted,
      );
    }

    const fy = Math.max(base + 16, ny + (shown.length ? 24 : 0)) + 34;
    body += `<line x1="${PAD}" y1="${fy - 20.5}" x2="${W - PAD}" y2="${fy - 20.5}" stroke="${p.hair}"/>`;
    body += t(PAD, fy, "New = first contribution to that owner or repo", 11, p.faint);
    const h = fy + 18;
    return svgDocument({
      width: W,
      height: h,
      title: `${year} in review`,
      body: frame(W, h, p) + body,
    });
  },
};
