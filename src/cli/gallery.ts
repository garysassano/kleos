/**
 * Renders every design in both themes from a fixture into gallery/, and writes the catalog
 * gallery/README.md (GitHub picks the dark or light file with <picture>) plus gallery/gallery.json.
 *
 * Usage: node src/cli/gallery.ts [fixture-name] [--only A01,B02]
 */
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { allDesigns, categories } from "../designs/index.ts";
import { THEME_NAMES } from "../designs/types.ts";
import { loadFixture } from "../stats/fixture.ts";

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: { only: { type: "string" } },
});
const fixture = positionals[0] ?? "garysassano";
const only = values.only ? new Set(values.only.split(",")) : null;
const stats = loadFixture(fixture);
const root = new URL("../../gallery/", import.meta.url).pathname;

if (!only) {
  for (const c of categories) rmSync(join(root, c.dir), { recursive: true, force: true });
}

const sizeOf = (svg: string) => {
  const m = svg.match(/<svg[^>]*?\swidth="([\d.]+)"[^>]*?\sheight="([\d.]+)"/);
  return { width: Number(m?.[1]), height: Number(m?.[2]) };
};

const manifest = [];
for (const d of allDesigns()) {
  if (only && !only.has(d.id)) continue;
  mkdirSync(join(root, d.category.dir), { recursive: true });
  const files = { dark: "", light: "" };
  let size = { width: 0, height: 0 };
  let bytes = 0;
  for (const theme of THEME_NAMES) {
    const svg = d.render(stats, theme);
    const file = `${d.category.dir}/${d.id}-${d.slug}-${theme}.svg`;
    writeFileSync(join(root, file), svg);
    files[theme] = file;
    size = sizeOf(svg);
    bytes = Math.max(bytes, Buffer.byteLength(svg));
  }
  manifest.push({
    id: d.id,
    slug: d.slug,
    title: d.title,
    idea: d.idea,
    category: d.category.dir,
    ...size,
    kb: Math.round(bytes / 1024),
    ...files,
  });
  console.log(`${d.id} ${size.width}x${size.height} ${Math.round(bytes / 1024)} KB ${d.title}`);
}

if (!only) {
  const total = manifest.length;
  const asOf = stats.generatedAt.slice(0, 10);
  const lines = [
    "# Design catalog",
    "",
    `${total} card designs, each rendered in GitHub dark and light from the \`${fixture}\` snapshot taken ${asOf}. GitHub shows the variant that matches your theme.`,
    "",
    "Regenerate with `pnpm gallery`. Do not edit the files here by hand.",
    "",
    ...categories
      .filter((c) => c.designs.length)
      .map(
        (c) =>
          `- [${c.letter} · ${c.name}](#${`${c.letter}--${c.name}`
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, "")
            .replace(/ /g, "-")}) (${c.designs.length})`,
      ),
  ];
  for (const c of categories) {
    if (!c.designs.length) continue;
    lines.push("", `## ${c.letter} · ${c.name}`, "", c.blurb);
    for (const m of manifest.filter((x) => x.category === c.dir)) {
      lines.push(
        "",
        `### ${m.id} · ${m.title}`,
        "",
        m.idea,
        "",
        `<picture><source media="(prefers-color-scheme: dark)" srcset="${m.dark}"><img alt="${m.title.replace(/"/g, "&quot;")}" src="${m.light}" width="${m.width}"></picture>`,
      );
    }
  }
  writeFileSync(join(root, "README.md"), `${lines.join("\n")}\n`);
  writeFileSync(join(root, "gallery.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`${total} designs → gallery/`);
}
