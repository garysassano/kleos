import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { allDesigns, categories, outcomesOf } from "../src/designs/index.ts";
import { type Level, THEME_NAMES } from "../src/designs/types.ts";
import { MAX_WIDTH } from "../src/kit/svg.ts";
import { DEFAULT_FIXTURE, loadFixture } from "../src/stats/fixture.ts";

/** The fictional demo account, a real snapshot, and a small synthetic account (6 repos, no avatars, no discussions), so designs never depend on one user's data. */
const fixtures = {
  demo: loadFixture("demo"),
  garysassano: loadFixture("garysassano"),
  "sample-small": loadFixture("sample-small"),
};
const designs = allDesigns();

describe("catalog", () => {
  it("has unique ids and slugs that match their category", () => {
    const ids = designs.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
    const slugs = designs.map((d) => d.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const d of designs) {
      expect(d.id).toMatch(new RegExp(`^${d.category.letter}\\d{2}$`));
      expect(d.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(d.title.length).toBeGreaterThan(0);
      expect(d.idea.length).toBeGreaterThan(0);
    }
  });

  it("supports the default level, full, in every design", () => {
    for (const d of designs) expect(outcomesOf(d), d.id).toContain("full");
  });

  it("uses each category letter once", () => {
    const letters = categories.map((c) => c.letter);
    expect(new Set(letters).size).toBe(letters.length);
  });
});

const cases = designs.flatMap((d) =>
  Object.entries(fixtures).flatMap(([name, stats]) =>
    THEME_NAMES.flatMap((theme) =>
      outcomesOf(d).map(
        (outcomes) =>
          [
            `${d.id} ${d.title} · ${name} · ${theme} · ${outcomes}`,
            d,
            stats,
            theme,
            outcomes,
          ] as const,
      ),
    ),
  ),
);

/** Visible text of an SVG: the contents of <text>, <tspan> and <textPath>, joined. */
const visibleText = (svg: string): string =>
  svg
    .replace(/<style[\s\S]*?<\/style>|<title>[\s\S]*?<\/title>|<defs>[\s\S]*?<\/defs>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");

/** Words a level must never show. "none" hides every outcome; "merged" never labels the rest. */
const FORBIDDEN: Record<Level, RegExp | null> = {
  none: /merg|unmerged|closed|still open|open PRs?\b|\bopen\b(?!-)/i,
  merged: /not merged|unmerged|closed|still open|open PRs?\b|merge rate|% merged/i,
  full: null,
};

/** Other names for the concepts in docs/decisions/0010-vocabulary.md. */
const REPLACED_WORDS =
  /\b(organi[sz]ations?|organis\w*|users?|famil(y|ies)|vendors?|brands?|compan(y|ies)|external)\b/i;

/** Data (repo names, logins, ecosystem names, PR titles) removed so only our own wording is checked. */
const withoutData = (text: string, stats: (typeof fixtures)[keyof typeof fixtures]): string => {
  const names = [
    ...stats.repos.map((r) => r.repo),
    ...stats.repos.map((r) => r.repo.split("/")[1] ?? ""),
    ...stats.owners.map((o) => o.owner),
    ...stats.ecosystems.map((e) => e.name),
    ...stats.recentPRs.map((p) => p.title),
    stats.user,
  ]
    .filter((n) => n.length > 2)
    .sort((a, b) => b.length - a.length);
  let out = text;
  for (const n of names) out = out.split(n).join(" ");
  return out;
};

describe("vocabulary", () => {
  it.each(designs.map((d) => [d.id, d] as const))("%s title and description", (_, d) => {
    expect(`${d.title} ${d.idea}`.match(REPLACED_WORDS)?.[0], "replaced word").toBeUndefined();
  });
});

describe("every design", () => {
  it.each(cases)("%s renders a GitHub-safe SVG", (_, design, stats, theme, outcomes) => {
    const svg = design.render(stats, theme, { outcomes });
    const root = svg.match(/^<svg\b[^>]*>/)?.[0] ?? "";
    expect(root, "starts with the root <svg>").not.toBe("");
    expect(root).toContain('xmlns="http://www.w3.org/2000/svg"');
    const width = Number(root.match(/\swidth="([\d.]+)"/)?.[1]);
    const height = Number(root.match(/\sheight="([\d.]+)"/)?.[1]);
    expect(width).toBeGreaterThan(0);
    expect(width).toBeLessThanOrEqual(MAX_WIDTH);
    expect(height).toBeGreaterThan(0);
    expect(root).toMatch(/\sviewBox="/);
    expect(svg.trimEnd().endsWith("</svg>")).toBe(true);

    // GitHub serves README images through camo inside <img>: nothing active, nothing external.
    expect(svg).not.toMatch(/<script|<foreignObject|\son[a-z]+=|javascript:/i);
    const urls = [...svg.matchAll(/(?:href|src)="([^"]*)"|url\((['"]?)(?!#)([^)'"]*)\2\)/g)]
      .map((m) => m[1] ?? m[3] ?? "")
      .filter((u) => !u.startsWith("data:") && !u.startsWith("#"));
    expect(urls, "external references").toEqual([]);
    expect(svg).not.toMatch(/@import|@font-face/);
    expect(Buffer.byteLength(svg)).toBeLessThan(400 * 1024);

    expect(design.render(stats, theme, { outcomes }), "deterministic").toBe(svg);
    if (outcomes === "full") expect(design.render(stats, theme), "unset = full").toBe(svg);

    expect(
      withoutData(visibleText(svg), stats).match(REPLACED_WORDS)?.[0],
      "replaced word on the card",
    ).toBeUndefined();

    const forbidden = FORBIDDEN[outcomes];
    if (forbidden) {
      // Repository names and PR titles are data, not wording; ignore them.
      const names = [
        ...stats.repos.map((r) => r.repo),
        ...stats.repos.map((r) => r.repo.split("/")[1] ?? ""),
        ...stats.owners.map((o) => o.owner),
        ...stats.recentPRs.map((p) => p.title),
      ];
      let text = visibleText(svg);
      for (const n of names.filter((n) => n.length > 2).sort((a, b) => b.length - a.length))
        text = text.split(n).join(" ");
      expect(
        text.match(forbidden)?.[0],
        `wording not allowed at outcomes "${outcomes}"`,
      ).toBeUndefined();
    }
  });
});

describe("gallery", () => {
  // The committed catalog is the reference look: a design's default render must match it.
  // After an intended visual change, run `pnpm gallery` and commit the result.
  const manifest = JSON.parse(
    readFileSync(new URL("../gallery/gallery.json", import.meta.url), "utf8"),
  ) as {
    id: string;
    dark: string;
    light: string;
  }[];
  const stats = loadFixture(DEFAULT_FIXTURE);
  it.each(designs.map((d) => [d.id, d] as const))(
    "%s matches the committed catalog",
    (id, design) => {
      const entry = manifest.find((m) => m.id === id);
      expect(entry, "listed in gallery/gallery.json").toBeDefined();
      for (const theme of THEME_NAMES) {
        const file = new URL(`../gallery/${entry?.[theme]}`, import.meta.url);
        expect(
          design.render(stats, theme) === readFileSync(file, "utf8"),
          `${theme} differs from ${entry?.[theme]}`,
        ).toBe(true);
      }
    },
  );
});
