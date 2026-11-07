import { describe, expect, it } from "vitest";
import { allDesigns, categories } from "../src/designs/index.ts";
import { THEME_NAMES } from "../src/designs/types.ts";
import { MAX_WIDTH } from "../src/kit/svg.ts";
import { loadFixture } from "../src/stats/fixture.ts";

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

  it("uses each category letter once", () => {
    const letters = categories.map((c) => c.letter);
    expect(new Set(letters).size).toBe(letters.length);
  });
});

const cases = designs.flatMap((d) =>
  Object.entries(fixtures).flatMap(([name, stats]) =>
    THEME_NAMES.map(
      (theme) => [`${d.id} ${d.title} · ${name} · ${theme}`, d, stats, theme] as const,
    ),
  ),
);

describe("every design", () => {
  it.each(cases)("%s renders a GitHub-safe SVG", (_, design, stats, theme) => {
    const svg = design.render(stats, theme);
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

    expect(design.render(stats, theme), "deterministic").toBe(svg);
  });
});
