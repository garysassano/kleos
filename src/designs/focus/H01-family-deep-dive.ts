import {
  PALETTES,
  avatar,
  compact,
  truncate as fitText,
  percent,
  document as svgDocument,
} from "../../kit/svg.ts";
import type { Design } from "../types.ts";
import { frame, kinds, legend, mixBar, num, plural, t, topGroups } from "./_shared.ts";

const W = 840;
const PAD = 24;
const ROW = 28;
const MAX_OWNERS = 8;
const MAX_REPOS = 10;

export const design: Design = {
  id: "H01",
  slug: "family-deep-dive",
  title: "Family deep-dive",
  idea: "One family in depth: its member orgs, its repositories and the PR, issue and discussion split, so a cluster like AWS reads as one relationship. Rule: the family with the most contributions (a lone top owner if no families are defined); up to 8 owners and 10 repositories, the rest summed.",
  render(stats, theme) {
    const p = PALETTES[theme];
    const g = topGroups(stats, 1)[0];
    const external = stats.repos.reduce((a, r) => a + r.total, 0);
    let body = "";
    let y = PAD;

    if (!g) {
      const h = 96;
      body += frame(W, h, p);
      body += t(PAD, 44, "Family deep-dive", 18, p.text, 'font-weight="600"');
      body += t(PAD, 70, "No contributions to other people's repositories yet.", 13, p.muted);
      return svgDocument({ width: W, height: h, title: "Family deep-dive", body });
    }

    // Header
    body += avatar({
      id: "h01-lead",
      login: g.lead,
      uri: stats.avatars[g.lead],
      x: PAD,
      y,
      size: 44,
      org: g.leadIsOrg,
      palette: p,
    });
    body += t(PAD + 58, y + 19, fitText(g.name, 420, 20), 20, p.text, 'font-weight="600"');
    const sub = g.family
      ? `${plural(g.owners.length, "member owner")} · ${plural(g.repos.length, "repository", "repositories")} · biggest family by contributions`
      : `${plural(g.repos.length, "repository", "repositories")} · biggest owner (no families defined)`;
    body += t(PAD + 58, y + 39, fitText(sub, 520, 12), 12, p.muted);
    body += t(
      W - PAD,
      y + 22,
      `${percent(g.total, external)}%`,
      22,
      p.text,
      'text-anchor="end" font-weight="600"',
    );
    body += t(W - PAD, y + 39, "of all external contributions", 12, p.muted, 'text-anchor="end"');
    y += 64;

    // Tiles
    const tiles = [
      {
        label: "Contributions",
        value: g.total,
        note: `in ${plural(g.repos.length, "repository", "repositories")}`,
        color: p.accent,
      },
      {
        label: "PRs opened",
        value: g.prs,
        note: g.prsOpen ? `${num(g.prsOpen)} still open` : "none still open",
        color: p.pr,
      },
      {
        label: "PRs merged",
        value: g.prsMerged,
        note: g.prs ? `${percent(g.prsMerged, g.prs)}% of opened` : "no PRs opened",
        color: p.merged,
      },
      {
        label: "Issues opened",
        value: g.issues,
        note: `${percent(g.issues, g.total)}% of the total`,
        color: p.issue,
      },
      {
        label: "Discussions",
        value: g.discussions,
        note: `${percent(g.discussions, g.total)}% of the total`,
        color: p.discussion,
      },
    ];
    const gap = 10;
    const tw = (W - 2 * PAD - gap * (tiles.length - 1)) / tiles.length;
    tiles.forEach((tile, i) => {
      const x = PAD + i * (tw + gap);
      body += `<rect x="${x.toFixed(1)}" y="${y}" width="${tw.toFixed(1)}" height="66" rx="6" fill="${p.surface}" stroke="${p.hair}"/>`;
      body += `<rect x="${(x + 12).toFixed(1)}" y="${y + 13}" width="8" height="8" rx="2" fill="${tile.color}"/>`;
      body += t(x + 26, y + 21, tile.label, 12, p.muted);
      body += t(x + 12, y + 45, num(tile.value), 22, p.text, 'font-weight="600"');
      body += t(x + 12, y + 59, fitText(tile.note, tw - 24, 11), 11, p.faint);
    });
    y += 66 + 26;

    // Column headers
    const colW = (W - 2 * PAD - 24) / 2;
    const lx = PAD;
    const rx = PAD + colW + 24;
    body += t(lx, y, g.family ? "Member owners" : "Owner", 13, p.text, 'font-weight="600"');
    body += t(lx + colW, y, "contributions", 11, p.faint, 'text-anchor="end"');
    body += t(rx, y, "Repositories", 13, p.text, 'font-weight="600"');
    body += t(rx + colW, y, "stars · contributions", 11, p.faint, 'text-anchor="end"');
    y += 10;
    body += `<line x1="${lx}" y1="${y + 0.5}" x2="${lx + colW}" y2="${y + 0.5}" stroke="${p.border}"/>`;
    body += `<line x1="${rx}" y1="${y + 0.5}" x2="${rx + colW}" y2="${y + 0.5}" stroke="${p.border}"/>`;
    const top = y + 4;

    // Owners column
    const owners = g.owners
      .map((o) => stats.owners.find((x) => x.owner === o))
      .filter((o) => o !== undefined);
    const shownOwners = owners.slice(0, MAX_OWNERS);
    const ownerMax = Math.max(1, ...shownOwners.map((o) => o.total));
    const barX = lx + 236;
    const barW = colW - 236 - 44;
    shownOwners.forEach((o, i) => {
      const cy = top + i * ROW + ROW / 2;
      body += avatar({
        id: `h01-o${i}`,
        login: o.owner,
        uri: stats.avatars[o.owner],
        x: lx,
        y: cy - 9,
        size: 18,
        org: o.type === "Organization",
        palette: p,
      });
      body += t(lx + 26, cy + 4, fitText(o.owner, 144, 13), 13, p.text);
      body += t(barX - 10, cy + 4, plural(o.repos, "repo"), 11, p.faint, 'text-anchor="end"');
      body += mixBar({ x: barX, y: cy - 4, h: 8, scale: barW / ownerMax, counts: o, p });
      body += t(lx + colW, cy + 4, num(o.total), 13, p.text, 'text-anchor="end" font-weight="600"');
    });
    let ownerRows = shownOwners.length;
    const restOwners = owners.slice(MAX_OWNERS);
    if (restOwners.length) {
      const cy = top + ownerRows * ROW + ROW / 2;
      body += t(
        lx,
        cy + 4,
        `+ ${plural(restOwners.length, "more owner")} · ${num(restOwners.reduce((a, o) => a + o.total, 0))} contributions`,
        12,
        p.muted,
      );
      ownerRows++;
    }

    // Repositories column
    const shownRepos = g.repos.slice(0, MAX_REPOS);
    const repoMax = Math.max(1, ...shownRepos.map((r) => r.total));
    const rBarX = rx + 250;
    const rBarW = colW - 250 - 44;
    shownRepos.forEach((r, i) => {
      const cy = top + i * ROW + ROW / 2;
      // Each repository carries its owner's avatar, matching the owners column.
      const owner = stats.owners.find((o) => o.owner === r.owner);
      body += avatar({
        id: `h01-r${i}`,
        login: r.owner,
        uri: stats.avatars[r.owner],
        x: rx,
        y: cy - 8,
        size: 16,
        org: (owner?.type ?? r.ownerType) === "Organization",
        palette: p,
      });
      body += t(rx + 24, cy + 4, fitText(r.repo.slice(r.owner.length + 1), 186, 13), 13, p.text);
      body += t(rBarX - 10, cy + 4, `${compact(r.stars)}★`, 11, p.faint, 'text-anchor="end"');
      body += mixBar({ x: rBarX, y: cy - 4, h: 8, scale: rBarW / repoMax, counts: r, p });
      body += t(rx + colW, cy + 4, num(r.total), 13, p.text, 'text-anchor="end" font-weight="600"');
    });
    let repoRows = shownRepos.length;
    const restRepos = g.repos.slice(MAX_REPOS);
    if (restRepos.length) {
      const cy = top + repoRows * ROW + ROW / 2;
      body += t(
        rx,
        cy + 4,
        `+ ${plural(restRepos.length, "more repository", "more repositories")} · ${num(restRepos.reduce((a, r) => a + r.total, 0))} contributions`,
        12,
        p.muted,
      );
      repoRows++;
    }

    y = top + Math.max(ownerRows, repoRows) * ROW + 14;
    body += `<line x1="${PAD}" y1="${y + 0.5}" x2="${W - PAD}" y2="${y + 0.5}" stroke="${p.hair}"/>`;
    y += 24;
    body += legend({
      x: PAD,
      y,
      p,
      items: kinds(g, p).map((k) => ({ label: k.label, color: k.color })),
    });
    body += t(W - PAD, y, "bars to scale within each column", 11, p.faint, 'text-anchor="end"');
    const h = y + 18;

    return svgDocument({
      width: W,
      height: h,
      title: `${g.name}: family deep-dive`,
      body: frame(W, h, p) + body,
    });
  },
};
